import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth } from '../../core/auth.js'
import * as service from './service.js'

const router = Router()

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

export default { basePath: '/notifications', router }
