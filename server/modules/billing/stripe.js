// ============================================================
// Stripe интеграц (ЗӨВХӨН туршилтын горим)
// ============================================================
// QPay нь Монголын банкуудыг хамардаг. Stripe нь гадаадын карт хүлээн авах
// боломж, мөн дипломын үзүүлэнд бүтэн төлбөрийн урсгалыг (карт → баталгаа →
// нэхэмжлэл хаагдах) харуулахад хэрэглэгдэнэ.
//
// Урсгал:
//   1. Checkout Session үүсгэнэ  → Stripe-ийн байршуулсан төлбөрийн хуудас
//   2. (хэрэглэгч туршилтын картаар төлнө: 4242 4242 4242 4242)
//   3. webhook `checkout.session.completed` ирнэ
//   4. Гарын үсгийг ШАЛГААД нэхэмжлэлийг төлөгдсөн болгоно
//
// ⚠ QPay-ийн адил зарчим: webhook-ийн агуулгад дан ганц итгэхгүй. Ялгаа нь
//   Stripe нь хүсэлт бүрийг нууц түлхүүрээр гарын үсэг зурдаг тул тэрхүү
//   гарын үсгийг шалгах нь хангалттай баталгаа болно (QPay дээр дахин
//   payment/check хийх шаардлагатай байсан).
// ============================================================

import Stripe from 'stripe'
import { STRIPE, STRIPE_ZERO_DECIMAL, isStripeConfigured } from '../../config.js'

export { isStripeConfigured }

let client = null

/** Stripe клиентийг нэг л удаа үүсгэнэ. */
function stripe() {
  if (!isStripeConfigured()) {
    throw new Error('Stripe тохируулаагүй байна (STRIPE_SECRET_KEY).')
  }
  if (!client) client = new Stripe(STRIPE.secretKey)
  return client
}

/**
 * Төгрөгийн дүнг Stripe-ийн хамгийн бага нэгж рүү хөрвүүлнэ.
 *
 * Stripe нь дүнг ҮРГЭЛЖ жижиг нэгжээр (цент, мөнгө) хүлээж авдаг:
 *   10.99 USD → 1099        500 JPY → 500 (тэг-аравтын валют)
 *
 * @param {number} amountMnt Нэхэмжлэлийн дүн (₮)
 * @returns {{amount: number, currency: string}}
 */
export function toStripeAmount(amountMnt) {
  const currency = STRIPE.currency

  // Данс нь МНТ дэмждэг бол хөрвүүлэхгүй
  const inCurrency = currency === 'mnt'
    ? Number(amountMnt)
    : Number(amountMnt) / STRIPE.mntPerUnit

  const minor = STRIPE_ZERO_DECIMAL.has(currency)
    ? Math.round(inCurrency)
    : Math.round(inCurrency * 100)

  // Stripe нь хэт бага дүнг няцаадаг (ихэвчлэн ~0.50 USD). Үзүүлэнгийн
  // нэхэмжлэл бага байвал хүсэлт нь ойлгомжгүй алдаагаар унахаас сэргийлж
  // энд тодорхой хэлнэ.
  if (minor < 1) {
    throw new Error('Төлбөрийн дүн хэтэрхий бага байна.')
  }

  return { amount: minor, currency }
}

/**
 * Төлбөрийн хуудас үүсгэнэ.
 *
 * @param {object} p
 * @param {string} p.invoiceId  Манай нэхэмжлэлийн ID — webhook дээр буцаж таних түлхүүр
 * @param {number} p.amountMnt
 * @param {string} p.email      Урьдчилан бөглөх
 * @param {string} p.successUrl
 * @param {string} p.cancelUrl
 */
export async function createCheckoutSession({ invoiceId, amountMnt, email, successUrl, cancelUrl }) {
  const { amount, currency } = toStripeAmount(amountMnt)

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    // Зөвхөн карт — бусад арга нь тухайн улс/валютаас хамаарч байхгүй байж
    // болох тул үзүүлэнд урьдчилан таамаглах боломжтой байх нь чухал.
    payment_method_types: ['card'],
    customer_email: email || undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amount,
        product_data: {
          name: 'МонголАжил — сарын багц',
          description: `Нэхэмжлэл ${String(invoiceId).slice(0, 8).toUpperCase()} · ${Number(amountMnt).toLocaleString('mn-MN')}₮`,
        },
      },
    }],
    // ⚠ Нэхэмжлэлийн ID-г ЗААВАЛ энд хадгална. Webhook нь зөвхөн Stripe-ийн
    //   объектыг илгээдэг тул манай аль нэхэмжлэл болохыг өөр аргаар мэдэхгүй.
    client_reference_id: invoiceId,
    metadata: { invoice_id: invoiceId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return { id: session.id, url: session.url, amount, currency }
}

/**
 * Webhook-ийн гарын үсгийг шалгаж, эвентийг задална.
 *
 * ⚠ `rawBody` нь ЗААВАЛ анхны байт байх ёстой. JSON болгон задалж дахин
 *   мөр болговол гарын үсэг таарахаа болино (талбарын дараалал, зай өөрчлөгдөнө).
 *
 * @param {Buffer} rawBody
 * @param {string} signature `stripe-signature` толгой
 */
export function verifyWebhook(rawBody, signature) {
  if (!STRIPE.webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET тохируулаагүй байна.')
  }
  return stripe().webhooks.constructEvent(rawBody, signature, STRIPE.webhookSecret)
}

/** Сешнийг Stripe-ээс дахин уншина (webhook-гүйгээр шалгах зам). */
export async function retrieveSession(sessionId) {
  return stripe().checkout.sessions.retrieve(sessionId)
}
