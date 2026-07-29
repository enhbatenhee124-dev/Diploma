import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, requireRole } from '../../core/auth.js'
import { rateLimit } from '../../core/rateLimit.js'
import * as service from './service.js'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await service.list(req) })
}))

// Спамаас хамгаална — нэг хүн минутад 20-оос олон хүсэлт илгээх шалтгаангүй
router.post(
  '/',
  requireRole('employee'),
  rateLimit({ name: 'apply', windowMs: 60_000, max: 20 }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await service.apply(req, req.body?.shiftId) })
  })
)

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status, cancelReason } = req.body || {}
  res.json({ data: await service.setStatus(req, req.params.id, status, cancelReason) })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.withdraw(req, req.params.id)
  res.json({ data: null })
}))

router.post('/invite', requireRole('employer'), asyncHandler(async (req, res) => {
  const { shiftId, workerId } = req.body || {}
  res.status(201).json({ data: await service.invite(req, shiftId, workerId) })
}))

export default { basePath: '/applications', router }
