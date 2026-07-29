import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, requireRole } from '../../core/auth.js'
import * as service from './service.js'

const router = Router()

// Хадгалсан хайлт нь ажил ХАЙГЧид зориулагдсан
router.use(requireAuth, requireRole('employee'))

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await service.list(req) })
}))

router.post('/', asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.create(req, req.body) })
}))

router.patch('/:id', asyncHandler(async (req, res) => {
  res.json({ data: await service.setNotify(req, req.params.id, req.body?.notify) })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.remove(req, req.params.id)
  res.json({ data: null })
}))

export default { basePath: '/searches', router }
