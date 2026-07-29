import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, optionalAuth } from '../../core/auth.js'
import * as service from './service.js'

const router = Router()

// ⚠ Route-ийн дараалал чухал: тогтмол зам (`/me`, `/workers`) нь `/:id`-ээс
//   ӨМНӨ байх ёстой, эс тэгвээс "workers" гэдгийг ID гэж уншина.

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.listPublic(req) })
}))

router.get('/admin', requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.listWithContact(req) })
}))

router.get('/employers', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.listEmployers(req) })
}))

router.get('/workers', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.listWorkers(req) })
}))

router.put('/me/worker', requireAuth, asyncHandler(async (req, res) => {
  await service.saveWorker(req, req.body)
  res.json({ data: null })
}))

router.put('/me/cosmetics', requireAuth, asyncHandler(async (req, res) => {
  await service.saveCosmetics(req, req.body)
  res.json({ data: null })
}))

router.get('/:id/contact', requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.contactInfo(req, req.params.id) })
}))

router.get('/:id/worker', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.getWorker(req, req.params.id) })
}))

router.get('/:id/cosmetics', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.getCosmetics(req, req.params.id) })
}))

export default { basePath: '/profiles', router }
