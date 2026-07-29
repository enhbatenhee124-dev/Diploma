import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth } from '../../core/auth.js'
import { rateLimit } from '../../core/rateLimit.js'
import * as service from './service.js'

const router = Router()

router.use(requireAuth)

router.get('/threads', asyncHandler(async (req, res) => {
  res.json({ data: await service.listThreads(req) })
}))

router.post('/threads', asyncHandler(async (req, res) => {
  res.json({ data: await service.openThread(req, req.body?.applicationId) })
}))

router.get('/threads/:id/messages', asyncHandler(async (req, res) => {
  res.json({ data: await service.listMessages(req, req.params.id) })
}))

router.post(
  '/threads/:id/messages',
  rateLimit({ name: 'chat', windowMs: 60_000, max: 60 }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await service.send(req, req.params.id, req.body?.content) })
  })
)

router.post('/threads/:id/read', asyncHandler(async (req, res) => {
  await service.markRead(req, req.params.id)
  res.json({ data: null })
}))

export default { basePath: '/chat', router }
