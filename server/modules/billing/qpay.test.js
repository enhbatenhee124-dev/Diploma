import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ============================================================
// QPay интеграцийн тест
// ============================================================
// Мерчант гэрээгүй тул бодит QPay руу хандаж чадахгүй. Гэхдээ энэ бол
// МӨНГӨНИЙ зам — алдаа гарвал хэрэглэгч төлсөн мөртлөө захиалга сунгагдахгүй,
// эсвэл эсрэгээрээ төлөөгүй байж сунгагдана. Тиймээс HTTP давхаргыг орлуулж
// (mock), логикийг нь бүрэн шалгана.
//
// `qpay.js` нь тохиргоог импортлох мөчдөө уншдаг тул тест бүрд орчны
// хувьсагчийг тавиад `resetModules()` хийж дахин импортлоно.
// ============================================================

const CONFIGURED = {
  QPAY_BASE_URL: 'https://merchant-sandbox.qpay.mn/v2',
  QPAY_USERNAME: 'test_user',
  QPAY_PASSWORD: 'test_pass',
  QPAY_INVOICE_CODE: 'TEST_INVOICE',
  QPAY_CALLBACK_URL: 'https://example.mn/api/billing/qpay/callback',
}

const saved = {}

function setEnv(values) {
  for (const [k, v] of Object.entries(values)) {
    saved[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

function restoreEnv() {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

/** Тохируулсан орчинтойгоор модулийг шинээр ачаална. */
async function loadQpay(env = CONFIGURED) {
  setEnv(env)
  vi.resetModules()
  return import('./qpay.js')
}

/** Дараалсан хариултуудыг буцаах хуурамч fetch. */
function mockFetch(responses) {
  const calls = []
  const fn = vi.fn(async (url, options) => {
    calls.push({ url, options, body: options?.body && JSON.parse(options.body) })
    const next = responses.shift()
    if (!next) throw new Error(`Хүлээгээгүй дуудлага: ${url}`)
    return {
      ok: next.ok ?? true,
      status: next.status ?? 200,
      json: async () => next.body,
      text: async () => JSON.stringify(next.body),
    }
  })
  vi.stubGlobal('fetch', fn)
  return calls
}

const tokenResponse = { body: { access_token: 'tok-123', expires_in: 3600 } }

afterEach(() => {
  vi.unstubAllGlobals()
  restoreEnv()
})

describe('isQpayConfigured', () => {
  it('тохируулаагүй үед false', async () => {
    const { isQpayConfigured } = await loadQpay({ ...CONFIGURED, QPAY_USERNAME: undefined })
    expect(isQpayConfigured()).toBe(false)
  })

  it('callback хаяггүй бол false — webhook хүлээж авах газаргүй', async () => {
    const { isQpayConfigured } = await loadQpay({ ...CONFIGURED, QPAY_CALLBACK_URL: undefined })
    expect(isQpayConfigured()).toBe(false)
  })

  it('бүрэн тохируулсан үед true', async () => {
    const { isQpayConfigured } = await loadQpay()
    expect(isQpayConfigured()).toBe(true)
  })
})

describe('createInvoice', () => {
  it('тохируулаагүй үед 503 шиднэ', async () => {
    const { createInvoice } = await loadQpay({ ...CONFIGURED, QPAY_USERNAME: undefined })
    await expect(
      createInvoice({ invoiceId: 'inv-1', customerCode: 'u-1', amount: 50000, description: 'x' })
    ).rejects.toMatchObject({ name: 'QpayError', status: 503 })
  })

  it('нэхэмжлэлийн ID-г sender_invoice_no болон callback-д дамжуулна', async () => {
    const { createInvoice } = await loadQpay()
    const calls = mockFetch([
      tokenResponse,
      { body: { invoice_id: 'qpay-777', qr_text: 'QR-TEXT', qr_image: 'base64==', urls: [] } },
    ])

    const result = await createInvoice({
      invoiceId: '11111111-2222-3333-4444-555555555555',
      customerCode: 'employer-1',
      amount: 50000,
      description: 'сарын багц',
    })

    const invoiceCall = calls[1]
    // Бидний талын ID нь QPay-ийн хариу болон webhook-ийг эргүүлж холбох
    // ЦОРЫН ГАНЦ түлхүүр — буруу дамжуулбал төлбөр эзэнгүй үлдэнэ.
    expect(invoiceCall.body.sender_invoice_no).toBe('11111111-2222-3333-4444-555555555555')
    expect(invoiceCall.body.callback_url).toContain('invoice_id=11111111-2222-3333-4444-555555555555')
    expect(invoiceCall.body.amount).toBe(50000)
    expect(invoiceCall.body.invoice_code).toBe('TEST_INVOICE')

    expect(result).toEqual({
      qpayInvoiceId: 'qpay-777',
      qrText: 'QR-TEXT',
      qrImage: 'base64==',
      urls: [],
    })
  })

  it('QPay алдаа буцаавал QpayError шиднэ', async () => {
    const { createInvoice } = await loadQpay()
    mockFetch([tokenResponse, { ok: false, status: 422, body: { message: 'AMOUNT_INVALID' } }])

    await expect(
      createInvoice({ invoiceId: 'inv-1', customerCode: 'u-1', amount: -5, description: 'x' })
    ).rejects.toMatchObject({ name: 'QpayError', status: 422 })
  })

  it('токен авахад алдаа гарвал тодорхой мессеж өгнө', async () => {
    const { createInvoice } = await loadQpay()
    mockFetch([{ ok: false, status: 401, body: {} }])

    await expect(
      createInvoice({ invoiceId: 'inv-1', customerCode: 'u-1', amount: 50000, description: 'x' })
    ).rejects.toThrowError(/токен/)
  })
})

describe('checkPayment', () => {
  it('ЗӨВХӨН PAID мөрийн дүнг нэмнэ', async () => {
    const { checkPayment } = await loadQpay()
    mockFetch([
      tokenResponse,
      {
        body: {
          rows: [
            { payment_status: 'PAID', payment_amount: 30000 },
            { payment_status: 'FAILED', payment_amount: 50000 },
            { payment_status: 'PAID', payment_amount: 20000 },
            { payment_status: 'REFUNDED', payment_amount: 10000 },
          ],
        },
      },
    ])

    const result = await checkPayment('qpay-777')

    // 30000 + 20000. FAILED, REFUNDED-г тооцвол төлөөгүй хүн үйлчилгээ авна.
    expect(result.paidAmount).toBe(50000)
    expect(result.paid).toBe(true)
  })

  it('төлөгдөөгүй үед paid=false', async () => {
    const { checkPayment } = await loadQpay()
    mockFetch([tokenResponse, { body: { rows: [{ payment_status: 'NEW', payment_amount: 50000 }] } }])

    const result = await checkPayment('qpay-777')
    expect(result.paid).toBe(false)
    expect(result.paidAmount).toBe(0)
  })

  it('хоосон хариуг зохицуулна', async () => {
    const { checkPayment } = await loadQpay()
    mockFetch([tokenResponse, { body: {} }])

    const result = await checkPayment('qpay-777')
    expect(result).toEqual({ paid: false, paidAmount: 0, rows: [] })
  })

  it('төлөвийн жижиг/том үсгээс хамаарахгүй', async () => {
    const { checkPayment } = await loadQpay()
    mockFetch([tokenResponse, { body: { rows: [{ payment_status: 'paid', payment_amount: 50000 }] } }])

    expect((await checkPayment('qpay-777')).paid).toBe(true)
  })
})

describe('токен кэш', () => {
  it('хоёр дуудлагад НЭГ л удаа токен авна', async () => {
    const { checkPayment } = await loadQpay()
    const calls = mockFetch([
      tokenResponse,
      { body: { rows: [] } },
      { body: { rows: [] } },
    ])

    await checkPayment('a')
    await checkPayment('b')

    const tokenCalls = calls.filter(c => String(c.url).endsWith('/auth/token'))
    // Дуудлага бүрд токен авбал QPay-ийн rate limit-д хүрч, хариу удаашрана
    expect(tokenCalls).toHaveLength(1)
  })
})
