import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, requireRole } from '../../core/auth.js'
import { rateLimit } from '../../core/rateLimit.js'
import * as service from './service.js'

const router = Router()

router.use(requireAuth)

// Мэдээлэх нь хэн ч хийж болно — гэхдээ спам мэдээллээс хамгаална
router.post(
  '/reports',
  rateLimit({ name: 'report', windowMs: 3600_000, max: 20 }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await service.createReport(req, req.body) })
  })
)

router.get('/reports', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json({ data: await service.listReports(req) })
}))

router.patch('/reports/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { status, note } = req.body || {}
  await service.resolveReport(req, req.params.id, status, note)
  res.json({ data: null })
}))

router.post('/users/:id/deactivate', requireRole('admin'), asyncHandler(async (req, res) => {
  await service.deactivateUser(req, req.params.id, req.body?.reason)
  res.json({ data: null })
}))

export default { basePath: '/moderation', router }
