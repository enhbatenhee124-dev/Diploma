import { asUser, admin } from '../../core/supabase.js'
import { unwrap, notFound, forbidden } from '../../core/http.js'
import { requireUuid, isUuid } from '../../core/validate.js'
import { createInvoice, checkPayment, isQpayConfigured } from './qpay.js'

// ============================================================
// Захиалга ба төлбөр (Бизнес загвар — А хувилбар)
// ============================================================
// Хариуцлагын хуваарилалт:
//
//   Өгөгдлийн сан  — нэхэмжлэлийн амьдралын мөчлөг (`request_invoice`,
//                    `confirm_invoice`). `invoices`-д INSERT/UPDATE хийх RLS
//                    policy ЗОРИУДААР байхгүй тул ажил олгогч өөрийгөө
//                    "төлсөн" болгож чадахгүй.
//
//   Энэ модуль     — гадаад төлбөрийн үйлчилгээ (QPay). Өгөгдлийн сан
//                    гадагш HTTP дуудаж чадахгүй тул QR үүсгэх, төлбөр
//                    баталгаажуулах нь серверийн ажил.
//
// ⚠ QPay-ийн webhook нь нэвтрэлтгүй ирдэг тул агуулгад нь ИТГЭХГҮЙ —
//   зөвхөн "шалга" гэсэн дохио гэж үзээд QPay-ээс өөрөөс нь батална.
// ============================================================

const PLAN_ID = 'employer_monthly'

const toInvoice = r => r && ({
  id: r.id,
  employerId: r.employer_id,
  employerName: r.employer_name,
  employerEmail: r.employer_email,
  employerPhone: r.employer_phone,
  amountMnt: r.amount_mnt,
  status: r.status,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  dueAt: r.due_at,
  paidAt: r.paid_at,
  createdAt: r.created_at,
  qrText: r.qpay_qr_text ?? null,
  qrImage: r.qpay_qr_image ?? null,
})

/** Захиалгын одоогийн бодит төлөв (хугацаа шалгасан). */
export async function subscription(req) {
  const sb = asUser(req.accessToken)
  const data = unwrap(
    await sb.rpc('subscription_state', { p_employer: req.user.id }).maybeSingle()
  )
  if (!data) return null

  return {
    status: data.status,
    periodEnd: data.period_end,
    graceUntil: data.grace_until,
    daysLeft: data.days_left,
    canPost: data.can_post,
    needsPayment: data.needs_payment,
  }
}

export async function plan(req) {
  const sb = asUser(req.accessToken)
  const row = unwrap(await sb.from('plans').select('*').eq('id', PLAN_ID).single())
  return { id: row.id, name: row.name, priceMnt: row.price_mnt, intervalDays: row.interval_days }
}

/** Нэхэмжлэлүүд. RLS нь ажил олгогчид өөрийнх, админд бүгдийг харуулна. */
export async function listInvoices(req) {
  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb.from('invoice_overview').select('*').order('created_at', { ascending: false })
  )
  return rows.map(toInvoice)
}

/**
 * Төлөх нэхэмжлэл хүсэх.
 * Хүлээгдэж буй нэхэмжлэл байвал өгөгдлийн сан түүнийг буцаана — товч
 * дахин дарахад давхар төлөх эрсдэлгүй.
 */
export async function requestInvoice(req) {
  const sb = asUser(req.accessToken)
  const data = unwrap(await sb.rpc('request_invoice'), 'Нэхэмжлэл үүсгэж чадсангүй.')
  const row = Array.isArray(data) ? data[0] : data

  // QPay тохируулаагүй бол нэхэмжлэл дансаар төлөгдөж, админ гараар
  // баталгаажуулна. Энэ нь эхний үеийн бүрэн ажиллагаатай зам.
  if (!isQpayConfigured()) {
    return { invoice: toInvoice(row), qpayConfigured: false }
  }

  // QR аль хэдийн үүссэн бол дахин үүсгэхгүй
  if (row.qpay_qr_text) {
    return { invoice: toInvoice(row), qpayConfigured: true, reused: true }
  }

  try {
    const qpay = await createInvoice({
      invoiceId: row.id,
      customerCode: req.user.id,
      amount: row.amount_mnt,
      description: 'МонголАжил — сарын багц',
    })

    // QR-ийн мэдээллийг бичихэд service_role хэрэгтэй: `invoices`-д UPDATE
    // хийх policy байхгүй нь ЗОРИУД (дээрх тайлбарыг үз).
    const updated = unwrap(
      await admin
        .from('invoices')
        .update({
          qpay_invoice_id: qpay.qpayInvoiceId,
          qpay_qr_text: qpay.qrText,
          qpay_qr_image: qpay.qrImage,
          qpay_urls: qpay.urls,
        })
        .eq('id', row.id)
        .select()
        .single()
    )

    return { invoice: toInvoice(updated), qpayConfigured: true }
  } catch (err) {
    // QPay унасан ч нэхэмжлэл үүссэн хэвээр — хэрэглэгч дансаар төлж болно
    console.error('[qpay] QR үүсгэж чадсангүй:', err.message)
    return {
      invoice: toInvoice(row),
      qpayConfigured: true,
      qpayError: 'QR код үүсгэж чадсангүй. Дансаар шилжүүлээд админд мэдэгдэнэ үү.',
    }
  }
}

/** Хэрэглэгч "Төлсөн, шалгана уу" гэж дарахад. Webhook саатсан ч хүлээхгүй. */
export async function checkInvoice(req, invoiceId) {
  requireUuid(invoiceId, 'Нэхэмжлэлийн ID')

  const invoice = unwrap(
    await admin.from('invoices').select('*').eq('id', invoiceId).maybeSingle()
  )
  if (!invoice) throw notFound('Нэхэмжлэл олдсонгүй.')
  if (invoice.employer_id !== req.user.id && req.user.role !== 'admin') {
    throw forbidden('Энэ нэхэмжлэл танийх биш байна.')
  }

  if (invoice.status === 'paid') return { paid: true, invoice: toInvoice(invoice) }
  if (!invoice.qpay_invoice_id) return { paid: false, invoice: toInvoice(invoice) }

  const result = await checkPayment(invoice.qpay_invoice_id)
  if (result.paid && result.paidAmount >= invoice.amount_mnt) {
    const updated = await markPaid(invoice, { source: 'manual_check', ...result })
    return { paid: true, invoice: toInvoice(updated) }
  }

  return { paid: false, invoice: toInvoice(invoice) }
}

/** Админ дансаар ирсэн төлбөрийг гараар баталгаажуулна. */
export async function confirmInvoice(req, invoiceId, note) {
  requireUuid(invoiceId, 'Нэхэмжлэлийн ID')

  // `confirm_invoice` нь дуудагч админ мөн эсэхийг өөрөө шалгаж, аудитын
  // мөр болон мэдэгдлийг нэг транзакцад бичнэ.
  const sb = asUser(req.accessToken)
  const data = unwrap(
    await sb.rpc('confirm_invoice', { p_invoice: invoiceId, p_note: note || null }),
    'Баталгаажуулж чадсангүй.'
  )
  return toInvoice(Array.isArray(data) ? data[0] : data)
}

/**
 * QPay-ийн webhook. Нэвтрэлтгүй ирнэ.
 * Агуулгад итгэхгүй — зөвхөн дохио гэж үзээд QPay-ээс баталгаажуулна.
 */
export async function handleCallback(query, body) {
  const invoiceId = query?.invoice_id || body?.sender_invoice_no

  // Юу ирснийг ҮРГЭЛЖ бүртгэнэ — маргаан гарвал энэ бол баримт
  await admin.from('payment_events').insert({
    invoice_id: isUuid(invoiceId) ? invoiceId : null,
    provider: 'qpay',
    event_type: 'callback',
    raw_payload: { query, body },
  })

  if (!isUuid(invoiceId)) return

  const { data: invoice } = await admin
    .from('invoices').select('*').eq('id', invoiceId).maybeSingle()

  if (!invoice || invoice.status === 'paid' || !invoice.qpay_invoice_id) return

  const result = await checkPayment(invoice.qpay_invoice_id)
  if (result.paid && result.paidAmount >= invoice.amount_mnt) {
    await markPaid(invoice, { source: 'callback', ...result })
  }
}

// ------------------------------
// Туслах
// ------------------------------
/**
 * Нэхэмжлэлийг төлөгдсөн болгож, захиалгыг сунгана.
 * `confirm_invoice`-той ижил алхмуудыг хийнэ, гэхдээ админгүйгээр —
 * төлбөрийн үйлчилгээнээс баталгаа авсан үед л дуудагдана.
 */
async function markPaid(invoice, evidence) {
  const now = new Date().toISOString()

  await admin.from('payment_events').insert({
    invoice_id: invoice.id,
    provider: 'qpay',
    event_type: 'paid',
    raw_payload: evidence,
  })

  // `.eq('status', 'pending')` нь давхар боловсруулахаас сэргийлнэ:
  // webhook болон "шалгах" товч зэрэг ажилласан ч нэг л удаа хэрэгжинэ.
  const { data: updated } = await admin
    .from('invoices')
    .update({ status: 'paid', paid_at: now })
    .eq('id', invoice.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle()

  // Өөр процесс аль хэдийн боловсруулсан бол дахин хийхгүй
  if (!updated) {
    const { data: current } = await admin
      .from('invoices').select('*').eq('id', invoice.id).single()
    return current
  }

  const graceUntil = new Date(new Date(invoice.period_end).getTime() + 14 * 86400_000)

  await admin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: invoice.period_start,
      current_period_end: invoice.period_end,
      grace_until: graceUntil.toISOString(),
    })
    .eq('employer_id', invoice.employer_id)

  await admin.from('notifications').insert({
    user_id: invoice.employer_id,
    type: 'success',
    message: 'Төлбөр амжилттай хийгдлээ',
    description: `Захиалга ${new Date(invoice.period_end).toLocaleDateString('mn-MN')} хүртэл сунгагдлаа.`,
  })

  return updated
}
