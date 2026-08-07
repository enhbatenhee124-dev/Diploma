import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ============================================================
// Stripe дүн хөрвүүлэлтийн тест
// ============================================================
// Энэ бол МӨНГӨНИЙ зам: хэмжих нэгжийг андуурвал 100 дахин их эсвэл бага
// дүн нэхнэ. Stripe нь дүнг ҮРГЭЛЖ жижиг нэгжээр (цент) хүлээж авдаг ч
// зарим валют тэг-аравтын (JPY гэх мэт) тул үржүүлэх ёсгүй.
//
// `config.js` нь орчны хувьсагчийг импортлох мөчдөө уншдаг тул тест бүрд
// `resetModules()` хийж дахин импортлоно.
// ============================================================

const BASE = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
}

const saved = {}

function setEnv(values) {
  for (const [k, v] of Object.entries({ ...BASE, ...values })) {
    saved[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

beforeEach(() => vi.resetModules())

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

describe('toStripeAmount', () => {
  it('хоёр аравтын валютыг центээр илэрхийлнэ', async () => {
    setEnv({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_CURRENCY: 'usd', STRIPE_MNT_PER_UNIT: '3600' })
    const { toStripeAmount } = await import('./stripe.js')

    // 99,000₮ ÷ 3600 = 27.5 USD → 2750 цент
    expect(toStripeAmount(99_000)).toEqual({ amount: 2750, currency: 'usd' })
  })

  it('тэг-аравтын валютыг үржүүлэхгүй', async () => {
    setEnv({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_CURRENCY: 'jpy', STRIPE_MNT_PER_UNIT: '3600' })
    const { toStripeAmount } = await import('./stripe.js')

    // 99,000₮ ÷ 3600 = 27.5 → 28 иен (жижиг нэгж = иен өөрөө)
    expect(toStripeAmount(99_000)).toEqual({ amount: 28, currency: 'jpy' })
  })

  it('МНТ сонгосон үед ханшаар хөрвүүлэхгүй', async () => {
    setEnv({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_CURRENCY: 'mnt', STRIPE_MNT_PER_UNIT: '3600' })
    const { toStripeAmount } = await import('./stripe.js')

    expect(toStripeAmount(99_000)).toEqual({ amount: 9_900_000, currency: 'mnt' })
  })

  it('хэт бага дүнг тодорхой алдаагаар няцаана', async () => {
    setEnv({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_CURRENCY: 'usd', STRIPE_MNT_PER_UNIT: '3600' })
    const { toStripeAmount } = await import('./stripe.js')

    // 1₮ ÷ 3600 = 0.0003 USD → 0 цент. Stripe ойлгомжгүй алдаа өгөхөөс өмнө
    // бид өөрсдөө барина.
    expect(() => toStripeAmount(1)).toThrow(/хэтэрхий бага/)
  })
})

describe('амьд түлхүүрийн хамгаалалт', () => {
  it('sk_live_ түлхүүрийг ачаалахгүй', async () => {
    // Анхааруулга тестийн гаралтыг бохирдуулахгүйн тулд дуугүй болгоно
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    setEnv({ STRIPE_SECRET_KEY: 'sk_live_should_be_blocked' })

    const { STRIPE, isStripeConfigured } = await import('../../config.js')

    expect(STRIPE.secretKey).toBe('')
    expect(isStripeConfigured()).toBe(false)
    quiet.mockRestore()
  })

  it('sk_test_ түлхүүрийг зөвшөөрнө', async () => {
    setEnv({ STRIPE_SECRET_KEY: 'sk_test_ok' })
    const { isStripeConfigured } = await import('../../config.js')

    expect(isStripeConfigured()).toBe(true)
  })
})
