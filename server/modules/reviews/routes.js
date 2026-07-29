import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, optionalAuth } from '../../core/auth.js'
import * as service from './service.js'

const router = Router()

// Профайл дээр үнэлгээ харагдах ёстой тул зочин ч уншина
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.list(req) })
}))

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.create(req, req.body) })
}))

export default { basePath: '/reviews', router }
