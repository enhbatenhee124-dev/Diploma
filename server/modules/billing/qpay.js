// ============================================================
// QPay v2 интеграц
// ============================================================
// QPay нь Монголын банкуудыг (Хаан, Голомт, ХХБ, Төрийн банк) болон
// Monpay/SocialPay-г нэг холболтоор хамардаг.
//
// Урсгал:
//   1. auth/token       → access_token авна (амьдрах хугацаатай)
//   2. invoice          → нэхэмжлэл үүсгэж QR буцаана
//   3. (хэрэглэгч төлнө)
//   4. callback         → QPay бидний webhook руу дуудна
//   5. payment/check    → бид QPay-ээс БАТАЛГААЖУУЛНА (webhook-д дан ганц найдахгүй)
//
// ⚠ Чухал: webhook-ийн агуулгад шууд итгэж болохгүй. Хэн ч бидний webhook руу
// "төлөгдсөн" гэж хүсэлт илгээж чадна. Тиймээс webhook ирэхэд ЗААВАЛ QPay-ээс
// payment/check хийж баталгаажуулна.
// ============================================================

import { QPAY } from '../../config.js'

const BASE_URL = QPAY.baseUrl || 'https://merchant.qpay.mn/v2'
const USERNAME = QPAY.username
const PASSWORD = QPAY.password
const INVOICE_CODE = QPAY.invoiceCode
const CALLBACK_URL = QPAY.callbackUrl

export const isQpayConfigured = () =>
  Boolean(USERNAME && PASSWORD && INVOICE_CODE && CALLBACK_URL)

// ------------------------------
// Токен кэш
// ------------------------------
let cachedToken = null
let tokenExpiresAt = 0

async function getToken() {
  // 60 секундын нөөцтэйгөөр дахин авна
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const basic = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')
  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new QpayError(`QPay токен авахад алдаа гарлаа (HTTP ${res.status})`, res.status, body)
  }

  const data = await res.json()
  cachedToken = data.access_token
  // expires_in нь секундээр ирдэг; заримдаа expires_at (unix) ирнэ
  tokenExpiresAt = data.expires_in
    ? Date.now() + Number(data.expires_in) * 1000
    : Number(data.expires_at || 0) * 1000 || Date.now() + 3600_000

  return cachedToken
}

export class QpayError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'QpayError'
    this.status = status
    this.body = body
  }
}

async function call(path, { method = 'POST', body } = {}) {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    throw new QpayError(`QPay ${path} алдаа (HTTP ${res.status})`, res.status, data)
  }
  return data
}

// ------------------------------
// Нэхэмжлэл үүсгэх
// ------------------------------
/**
 * @param {object} params
 * @param {string} params.invoiceId   Бидний талын нэхэмжлэлийн ID (senderInvoiceNo)
 * @param {string} params.customerCode Ажил олгогчийг таних код
 * @param {number} params.amount      Дүн (₮)
 * @param {string} params.description Тайлбар
 * @returns {Promise<{qpayInvoiceId: string, qrText: string, qrImage: string, urls: any}>}
 */
export async function createInvoice({ invoiceId, customerCode, amount, description }) {
  if (!isQpayConfigured()) {
    throw new QpayError('QPay тохируулаагүй байна. .env-д QPAY_* утгуудыг оруулна уу.', 503)
  }

  const data = await call('/invoice', {
    body: {
      invoice_code: INVOICE_CODE,
      sender_invoice_no: invoiceId,
      invoice_receiver_code: customerCode,
      invoice_description: description,
      amount,
      callback_url: `${CALLBACK_URL}?invoice_id=${encodeURIComponent(invoiceId)}`,
    },
  })

  return {
    qpayInvoiceId: data.invoice_id,
    qrText: data.qr_text,
    qrImage: data.qr_image,
    urls: data.urls ?? null,
  }
}

// ------------------------------
// Төлбөр шалгах (баталгаажуулалт)
// ------------------------------
/**
 * QPay-ээс тухайн нэхэмжлэлийн төлбөрийг шалгана.
 * Webhook ирсний ДАРАА ЗААВАЛ дуудна — webhook хуурамч байж болно.
 * @returns {Promise<{paid: boolean, paidAmount: number, rows: any[]}>}
 */
export async function checkPayment(qpayInvoiceId) {
  const data = await call('/payment/check', {
    body: {
      object_type: 'INVOICE',
      object_id: qpayInvoiceId,
      offset: { page_number: 1, page_limit: 100 },
    },
  })

  const rows = data.rows || []
  const paidAmount = rows
    .filter(r => String(r.payment_status).toUpperCase() === 'PAID')
    .reduce((sum, r) => sum + Number(r.payment_amount || 0), 0)

  return { paid: paidAmount > 0, paidAmount, rows }
}

/** Нэхэмжлэлийг цуцлах. */
export async function cancelInvoice(qpayInvoiceId) {
  return call(`/invoice/${qpayInvoiceId}`, { method: 'DELETE' })
}
