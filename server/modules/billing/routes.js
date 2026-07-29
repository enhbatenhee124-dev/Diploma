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

router.post('/invoices/:id/confirm', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  res.json({ data: await service.confirmInvoice(req, req.params.id, req.body?.note) })
}))

export default { basePath: '/billing', router }
