import { Router } from 'express'
import { asyncHandler } from '../../core/http.js'
import { requireAuth, optionalAuth } from '../../core/auth.js'
import * as service from './service.js'

const router = Router()

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.myProgress(req) })
}))

// Тэргүүлэгчид нь нийтийн — зочин ч харна
router.get('/ranking', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ data: await service.ranking(req, req.query.role) })
}))

export default { basePath: '/gamification', router }
