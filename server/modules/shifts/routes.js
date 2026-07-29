import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, optionalAuth, requireRole } from '../../core/auth.js'
import * as service from './service.js'

const router = Router()

// Зар үзэхэд нэвтрэх шаардлагагүй — нүүр хуудсан дээрх зочин ч харна.
// RLS нь зочинд зөвхөн 'Active' зарыг харуулна.
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.list(req) })
}))

// ⚠ '/saved' нь '/:id'-ээс ӨМНӨ бүртгэгдэх ёстой, эс тэгвээс "saved" гэдгийг
//   зарын ID гэж уншина.
router.get('/saved', requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.listSaved(req) })
}))

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.getOne(req, req.params.id) })
}))

router.post('/', requireAuth, requireRole('employer'), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.create(req, req.body) })
}))

router.patch('/:id', requireAuth, requireRole('employer', 'admin'), asyncHandler(async (req, res) => {
  res.json({ data: await service.update(req, req.params.id, req.body) })
}))

router.delete('/:id', requireAuth, requireRole('employer', 'admin'), asyncHandler(async (req, res) => {
  await service.remove(req, req.params.id)
  res.json({ data: null })
}))

router.post('/:id/save', requireAuth, asyncHandler(async (req, res) => {
  await service.save(req, req.params.id)
  res.json({ data: null })
}))

router.delete('/:id/save', requireAuth, asyncHandler(async (req, res) => {
  await service.unsave(req, req.params.id)
  res.json({ data: null })
}))

export default { basePath: '/shifts', router }
