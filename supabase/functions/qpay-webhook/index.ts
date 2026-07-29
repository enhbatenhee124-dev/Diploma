// ============================================================
// QPay төлбөрийн мэдэгдэл (webhook)
// ============================================================
// ⚠ Энэ зам нэвтрэлтгүй — QPay токен явуулдаггүй. Тиймээс ирсэн агуулгад
//   ИТГЭХГҮЙ. Хэн ч энэ рүү "төлөгдсөн" гэж хүсэлт илгээж чадна.
//   Мэдэгдлийг зөвхөн "шалгах цаг боллоо" гэсэн дохио гэж үзээд,
//   QPay-ээс ӨӨРӨӨС нь payment/check хийж баталгаажуулна.
//
// Тохируулах:
//   supabase secrets set QPAY_USERNAME=... QPAY_PASSWORD=... QPAY_BASE_URL=...
//   supabase functions deploy qpay-webhook --no-verify-jwt
//
// QPay-д өгөх callback хаяг:
//   https://<project>.supabase.co/functions/v1/qpay-webhook?invoice_id=<uuid>
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const QPAY_BASE = Deno.env.get('QPAY_BASE_URL') ?? 'https://merchant.qpay.mn/v2'
const QPAY_USER = Deno.env.get('QPAY_USERNAME')
const QPAY_PASS = Deno.env.get('QPAY_PASSWORD')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** QPay-ээс access token авна. */
async function getToken(): Promise<string> {
  const basic = btoa(`${QPAY_USER}:${QPAY_PASS}`)
  const res = await fetch(`${QPAY_BASE}/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`QPay токен алдаа: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

/** Нэхэмжлэл үнэхээр төлөгдсөн эсэхийг QPay-ээс шалгана. */
async function checkPayment(qpayInvoiceId: string) {
  const token = await getToken()
  const res = await fetch(`${QPAY_BASE}/payment/check`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: qpayInvoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  })
  if (!res.ok) throw new Error(`QPay шалгалт алдаа: ${res.status}`)

  const data = await res.json()
  const rows = data.rows ?? []
  const paid = rows
    .filter((r: Record<string, unknown>) => String(r.payment_status).toUpperCase() === 'PAID')
    .reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.payment_amount ?? 0), 0)

  return { paidAmount: paid, rows }
}

Deno.serve(async req => {
  const url = new URL(req.url)
  let payload: Record<string, unknown> = {}
  try {
    payload = await req.json()
  } catch {
    // QPay заримдаа хоосон бие явуулдаг
  }

  const invoiceId = url.searchParams.get('invoice_id') ?? String(payload.sender_invoice_no ?? '')

  // Юу ирснийг ҮРГЭЛЖ бүртгэнэ — маргаан гарвал энэ бол баримт
  await admin.from('payment_events').insert({
    invoice_id: UUID.test(invoiceId) ? invoiceId : null,
    provider: 'qpay',
    event_type: 'callback',
    raw_payload: { query: Object.fromEntries(url.searchParams), body: payload },
  })

  // QPay-д ҮРГЭЛЖ 200 буцаана — эс тэгвээс дахин дахин дуудна
  const ok = () => new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!UUID.test(invoiceId) || !QPAY_USER) return ok()

  try {
    const { data: invoice } = await admin
      .from('invoices').select('*').eq('id', invoiceId).single()

    if (!invoice || invoice.status === 'paid' || !invoice.qpay_invoice_id) return ok()

    const result = await checkPayment(invoice.qpay_invoice_id)

    if (result.paidAmount >= invoice.amount_mnt) {
      // Баталгаажуулалтыг өгөгдлийн сангийн функцээр хийнэ —
      // гараар баталгаажуулахтай ижил логик, давхардахгүй
      await admin.rpc('confirm_invoice_system', {
        p_invoice: invoiceId,
        p_note: `QPay: ${result.paidAmount}₮`,
      })
    }
  } catch (err) {
    console.error('[qpay-webhook]', err instanceof Error ? err.message : err)
  }

  return ok()
})
