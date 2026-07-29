import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, requireRole } from '../../core/auth.js'
import * as service from './service.js'

const router = Router()

router.use(requireAuth, requireRole('admin'))

router.get('/queue', asyncHandler(async (req, res) => {
  res.json({ data: await service.queue(req) })
}))

router.post('/:id/verify', asyncHandler(async (req, res) => {
  await service.verify(req, req.params.id)
  res.json({ data: null })
}))

router.post('/:id/reject', asyncHandler(async (req, res) => {
  await service.reject(req, req.params.id, req.body?.reason)
  res.json({ data: null })
}))

export default { basePath: '/employers', router }
