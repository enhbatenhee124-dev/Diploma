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
  const detail =
    '\n❌ Дараах орчны хувьсагч дутуу байна:\n' +
    missing.map(k => `   • ${k}`).join('\n') +
    '\n\n   Локалд: `.env.example`-г `.env` болгон хуулаад Supabase-ийн\n' +
    '   Settings → API хэсгээс утгуудыг нь бөглөнө үү.\n' +
    '   Vercel дээр: Project → Settings → Environment Variables.\n'

  console.error(detail)

  // ⚠ `process.exit()` БИШ, `throw`. Serverless (Vercel) орчинд процессыг
  //   таслах нь "Runtime exited" гэсэн ойлгомжгүй алдаа өгдөг бөгөөд яг
  //   ямар хувьсагч дутуугийн бүртгэлд харагдахгүй.
  throw new Error(`Орчны хувьсагч дутуу: ${missing.join(', ')}`)
}

export const PORT = Number(process.env.PORT) || 3001

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const IS_PROD = NODE_ENV === 'production'

export const SUPABASE_URL = process.env.SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Android/iOS апп нь вэб контентоо файлын системээс ачаалдаг тул хүсэлтийн
// `Origin` нь ҮРГЭЛЖ доорх тогтмол утгуудын нэг байна (Capacitor-ийн
// androidScheme='https' → `https://localhost`; iOS → `capacitor://localhost`).
// Эдгээрийг үргэлж зөвшөөрнө — шинэ домэйн биш, зөвхөн манай аппын бүрхүүл.
// Халдагч энэ origin-ыг хуурамчаар үүсгэхийн тулд хохирогчийн утсан дээр
// аль хэдийн код ажиллуулж байх шаардлагатай тул нэмэлт эрсдэл үүсгэхгүй.
const NATIVE_APP_ORIGINS = ['https://localhost', 'capacitor://localhost']

// Хөгжүүлэлтийн үед Vite (5173) хандана. Продакшнд домэйнээ заавал зааж өгнө —
// эс тэгвээс дурын сайт хэрэглэгчийн нэрийн өмнөөс API дуудах эрсдэлтэй.
export const CORS_ORIGINS = [
  ...(process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  ...NATIVE_APP_ORIGINS,
]

if (IS_PROD && !process.env.CORS_ORIGINS) {
  console.warn(
    '[тохиргоо] Продакшн орчинд CORS_ORIGINS заагаагүй байна — localhost-оор л ажиллана.'
  )
}

// ------------------------------
// Push мэдэгдэл (FCM)
// ------------------------------
// `FCM_SERVICE_ACCOUNT` нь Firebase-ийн service account JSON-ыг БҮТНЭЭР нь
// агуулсан мөр. Энэ нь хувийн түлхүүр агуулдаг тул SUPABASE_SERVICE_ROLE_KEY
// шиг НУУЦ — зөвхөн серверийн орчинд.
//
// Тохируулаагүй үед push нь чимээгүй унтарна: in-app мэдэгдэл (`notifications`
// хүснэгт) хэвээр ажиллах тул апп эвдрэхгүй (NFR-6).
export const FCM = (() => {
  const raw = process.env.FCM_SERVICE_ACCOUNT
  if (!raw) return null

  try {
    const key = JSON.parse(raw)
    if (!key.project_id || !key.client_email || !key.private_key) {
      console.warn('[тохиргоо] FCM_SERVICE_ACCOUNT дутуу талбартай — push унтраалаа.')
      return null
    }
    return key
  } catch {
    console.warn('[тохиргоо] FCM_SERVICE_ACCOUNT нь зөв JSON биш — push унтраалаа.')
    return null
  }
})()

// Supabase-ийн Database Webhook нь нэвтрэлтгүй ирдэг тул хуваалцсан нууцаар
// таньна. Хоосон бол webhook цэг БҮРЭН хаагдана — задгай орхивол хэн ч
// дурын хэрэглэгч рүү мэдэгдэл илгээж чадна.
export const PUSH_HOOK_SECRET = process.env.PUSH_HOOK_SECRET || ''

export const isPushConfigured = () => Boolean(FCM && PUSH_HOOK_SECRET)

export const QPAY = {
  baseUrl: process.env.QPAY_BASE_URL || '',
  username: process.env.QPAY_USERNAME || '',
  password: process.env.QPAY_PASSWORD || '',
  invoiceCode: process.env.QPAY_INVOICE_CODE || '',
  callbackUrl: process.env.QPAY_CALLBACK_URL || '',
}

export const isQpayConfigured = () =>
  Boolean(QPAY.baseUrl && QPAY.username && QPAY.password && QPAY.invoiceCode)

// ------------------------------
// Stripe (олон улсын картын төлбөр)
// ------------------------------
// QPay нь Монголын банкуудыг хамардаг; Stripe нь гадаадын карт хүлээн авах,
// мөн ТУРШИЛТЫН орчинд бүтэн төлбөрийн урсгалыг үзүүлэхэд хэрэглэгдэнэ.
//
// ⚠ ЗӨВХӨН туршилтын түлхүүр. `sk_live_` түлхүүрийг ЗОРИУДААР няцаана —
//   энэ код нь бодит мөнгө хүлээн авахад шаардлагатай зүйлсийг (татвар,
//   буцаалт, маргаан, PCI-ийн бүрэн шаардлага) хангаагүй. Дипломын
//   үзүүлэнд туршилтын горим хангалттай.
const stripeKey = process.env.STRIPE_SECRET_KEY || ''
const stripeIsLive = stripeKey.startsWith('sk_live_')

if (stripeIsLive) {
  console.error(
    '\n❌ STRIPE_SECRET_KEY нь БОДИТ (sk_live_) түлхүүр байна.\n' +
    '   Энэ төсөл зөвхөн туршилтын горимд ажиллана. Stripe Dashboard-ийн\n' +
    '   "Test mode"-г асааж `sk_test_...` түлхүүрээ авна уу.\n'
  )
}

export const STRIPE = {
  // Live түлхүүрийг огт ачаалахгүй — санамсаргүй ч бодит гүйлгээ гарахгүй
  secretKey: stripeIsLive ? '' : stripeKey,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  // Stripe данс бүр өөр валют дэмждэг. МНТ дэмжигдээгүй бол `usd` зэрэг
  // валют сонгоод доорх ханшаар хөрвүүлнэ.
  currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
  // 1 нэгж валют хэдэн төгрөг вэ. ⚠ Энэ бол ҮЗҮҮЛЭНГИЙН тогтмол ханш —
  // бодит үйлчилгээнд ханшийн API-аас авах ёстой.
  mntPerUnit: Number(process.env.STRIPE_MNT_PER_UNIT) || 3600,
}

// Stripe-ийн тэг-аравтын валютууд: дүнг зуугаар үржүүлэхгүй.
// (docs.stripe.com/currencies → «Zero-decimal currencies»)
export const STRIPE_ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
])

export const isStripeConfigured = () => Boolean(STRIPE.secretKey)
