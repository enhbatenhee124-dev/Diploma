import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { asyncHandler, forbidden } from '../../core/http.js'
import { requireAuth } from '../../core/auth.js'
import { rateLimit } from '../../core/rateLimit.js'
import { PUSH_HOOK_SECRET } from '../../config.js'
import * as service from './service.js'

const router = Router()

// ============================================================
// Supabase Database Webhook — нэвтрэлтгүй
// ============================================================
// `notifications` хүснэгтэд мөр ормогц Supabase энэ цэг рүү POST хийнэ.
// `requireAuth`-ээс ӨМНӨ бүртгэнэ — webhook-д хэрэглэгчийн токен байхгүй.
//
// Таних цорын ганц арга нь хуваалцсан нууц. Нууц тохируулаагүй бол цэгийг
// БҮРЭН хаана: задгай орхивол хэн ч дурын хэрэглэгчийн утас руу хуурамч
// мэдэгдэл илгээж чадна.
// ============================================================
function verifyHookSecret(req) {
  if (!PUSH_HOOK_SECRET) throw forbidden('Push webhook тохируулаагүй байна.')

  const given = String(req.get('x-webhook-secret') || '')
  const expected = PUSH_HOOK_SECRET

  // Урт нь өөр бол `timingSafeEqual` шидэх тул эхлээд тэнцүүлнэ. Уртыг
  // нуух шаардлагагүй — нууц утга нь өөрөө л хамгаалалт.
  if (given.length !== expected.length) throw forbidden('Нууц тохирохгүй байна.')
  if (!timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    throw forbidden('Нууц тохирохгүй байна.')
  }
}

router.post(
  '/hook',
  rateLimit({ name: 'push-hook', windowMs: 60_000, max: 300 }),
  asyncHandler(async (req, res) => {
    verifyHookSecret(req)

    // Supabase-ийг хүлээлгэхгүй — push илгээхэд гадаад сүлжээ ашиглана
    res.json({ ok: true })

    try {
      await service.handleNotificationEvent(req.body)
    } catch (err) {
      console.error('[push] webhook боловсруулахад алдаа:', err.message)
    }
  })
)

// ------------------------------
// Эндээс доош — зөвхөн нэвтэрсэн хэрэглэгч
// ------------------------------
router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await service.list(req, { limit: req.query.limit ?? 50 }) })
}))

router.post('/read-all', asyncHandler(async (req, res) => {
  await service.markAllRead(req)
  res.json({ data: null })
}))

// ⚠ '/read-all'-ийн ДАРАА бүртгэнэ — эс тэгвээс "read-all"-ийг ID гэж уншина
router.post('/:id/read', asyncHandler(async (req, res) => {
  await service.markRead(req, req.params.id)
  res.json({ data: null })
}))

// ------------------------------
// Төхөөрөмжийн push токен
// ------------------------------
// Апп нээгдэх бүрд дуудагддаг тул хязгаар өгөөмөр, гэхдээ хязгааргүй биш.
router.post(
  '/devices',
  rateLimit({ name: 'device-register', windowMs: 60_000, max: 20 }),
  asyncHandler(async (req, res) => {
    await service.registerDevice(req, req.body)
    res.status(201).json({ data: null })
  })
)

// Токен нь URL-д багтахгүй урт бөгөөд `/` тэмдэгт агуулж болзошгүй тул
// замын параметр биш, биетээр дамжуулна.
router.post('/devices/remove', asyncHandler(async (req, res) => {
  await service.unregisterDevice(req, req.body?.token)
  res.json({ data: null })
}))

export default { basePath: '/notifications', router }
