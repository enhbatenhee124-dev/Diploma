// ============================================================
// Орчны тохиргоо
// ============================================================
// Сервер асахдаа ЗААВАЛ шаардлагатай хувьсагчийг шалгаж, дутуу бол шууд
// зогсоно. Дутуу тохиргоотой сервер асаад дараа нь хүсэлт болгон дээр
// нууцлаг байдлаар унахаас, эхлэхдээ тодорхой алдаа өгөх нь дээр.
// ============================================================

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

const missing = required.filter(key => !process.env[key])

if (missing.length) {
  console.error(
    '\n❌ Дараах орчны хувьсагч дутуу байна:\n' +
    missing.map(k => `   • ${k}`).join('\n') +
    '\n\n   `.env.example`-г `.env` болгон хуулаад Supabase-ийн Settings → API\n' +
    '   хэсгээс утгуудыг нь бөглөнө үү.\n'
  )
  process.exit(1)
}

export const PORT = Number(process.env.PORT) || 3001

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const IS_PROD = NODE_ENV === 'production'

export const SUPABASE_URL = process.env.SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Хөгжүүлэлтийн үед Vite (5173) хандана. Продакшнд домэйнээ заавал зааж өгнө —
// эс тэгвээс дурын сайт хэрэглэгчийн нэрийн өмнөөс API дуудах эрсдэлтэй.
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

if (IS_PROD && !process.env.CORS_ORIGINS) {
  console.warn(
    '[тохиргоо] Продакшн орчинд CORS_ORIGINS заагаагүй байна — localhost-оор л ажиллана.'
  )
}

export const QPAY = {
  baseUrl: process.env.QPAY_BASE_URL || '',
  username: process.env.QPAY_USERNAME || '',
  password: process.env.QPAY_PASSWORD || '',
  invoiceCode: process.env.QPAY_INVOICE_CODE || '',
  callbackUrl: process.env.QPAY_CALLBACK_URL || '',
}

export const isQpayConfigured = () =>
  Boolean(QPAY.baseUrl && QPAY.username && QPAY.password && QPAY.invoiceCode)
