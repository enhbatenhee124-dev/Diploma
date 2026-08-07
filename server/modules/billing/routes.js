import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, requireRole } from '../../core/auth.js'
import { rateLimit } from '../../core/rateLimit.js'
import * as service from './service.js'

const router = Router()

// ⚠ Webhook нь нэвтрэлтгүй — requireAuth-ээс ӨМНӨ бүртгэнэ.
//   QPay-д ҮРГЭЛЖ 200 буцаана, эс тэгвээс дахин дахин дуудна.
//
// ⚠ Энэ бол аппын ЦОРЫН ГАНЦ нээлттэй бичих цэг. Хэн ч дуудаж чадах тул
//   хязгаарлана: эс тэгвээс `payment_events` хүснэгтийг хогоор дүүргэх,
//   эсвэл QPay руу чиглэсэн дуудлагыг үржүүлэх боломжтой.
//   Бодит QPay нэг нэхэмжлэлд цөөн удаа л дууддаг тул энэ хязгаар өгөөмөр.
router.post('/qpay/callback', rateLimit({ name: 'qpay-callback', windowMs: 60_000, max: 60 }), asyncHandler(async (req, res) => {
  res.json({ ok: true })

  // Хариу илгээсний дараа боловсруулна — QPay хүлээхгүй
  try {
    await service.handleCallback(req.query, req.body)
  } catch (err) {
    console.error('[qpay] callback боловсруулахад алдаа:', err.message)
  }
}))

// ⚠ Stripe webhook — нэвтрэлтгүй, ТҮҮХИЙ биетэй (app.js дээр `express.raw`).
//   Гарын үсгийг шалгаж чадаагүй хүсэлтийг 400-аар няцаана: Stripe тэгвэл
//   дахин оролдох ба бид хуурамч мэдэгдлээр нэхэмжлэл хаахгүй.
router.post(
  '/stripe/webhook',
  rateLimit({ name: 'stripe-webhook', windowMs: 60_000, max: 120 }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature']
    if (!signature) return res.status(400).json({ error: 'Гарын үсэг алга.' })

    try {
      const result = await service.handleStripeWebhook(req.body, signature)
      res.json({ received: true, ...result })
    } catch (err) {
      console.error('[stripe] webhook няцаагдлаа:', err.message)
      res.status(400).json({ error: 'Гарын үсэг тохирохгүй байна.' })
    }
  })
)

router.get('/subscription', requireAuth, requireRole('employer', 'admin'), asyncHandler(async (req, res) => {
  res.json({ data: await service.subscription(req) })
}))

router.get('/plan', requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.plan(req) })
}))

router.get('/invoices', requireAuth, requireRole('employer', 'admin'), asyncHandler(async (req, res) => {
  res.json({ data: await service.listInvoices(req) })
}))

// Гадаад үйлчилгээ рүү хүсэлт явуулдаг тул хатуу хязгаартай
router.post(
  '/invoices',
  requireAuth,
  requireRole('employer'),
  rateLimit({ name: 'invoice', windowMs: 60_000, max: 5 }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await service.requestInvoice(req) })
  })
)

router.post(
  '/invoices/:id/check',
  requireAuth,
  rateLimit({ name: 'invoice-check', windowMs: 60_000, max: 15 }),
  asyncHandler(async (req, res) => {
    res.json({ data: await service.checkInvoice(req, req.params.id) })
  })
)

// Картаар төлөх — Stripe-ийн байршуулсан хуудасны хаяг үүсгэнэ
router.post(
  '/invoices/:id/stripe',
  requireAuth,
  requireRole('employer', 'admin'),
  rateLimit({ name: 'stripe-session', windowMs: 60_000, max: 10 }),
  asyncHandler(async (req, res) => {
    // Буцах хаягийг хүсэлтийн `Origin`-оос авна — вэб, апп, preview deploy
    // бүр өөр домэйнтэй тул сервер дээр хатуу бичих боломжгүй.
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`
    res.json({ data: await service.createStripePayment(req, req.params.id, origin) })
  })
)

// Төлбөрийн хуудаснаас буцаж ирээд шалгах (webhook саатсан ч ажиллана)
router.post(
  '/invoices/:id/stripe/check',
  requireAuth,
  rateLimit({ name: 'stripe-check', windowMs: 60_000, max: 20 }),
  asyncHandler(async (req, res) => {
    res.json({ data: await service.checkStripeSession(req, req.params.id, req.body?.sessionId) })
  })
)

router.post('/invoices/:id/confirm', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  res.json({ data: await service.confirmInvoice(req, req.params.id, req.body?.note) })
}))

export default { basePath: '/billing', router }
