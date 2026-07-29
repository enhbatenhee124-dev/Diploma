import { ApiError } from './http.js'

// ============================================================
// Энгийн санах ойн rate limit (NFR-4)
// ============================================================
// Нэг instance-д зориулсан. Хэд хэдэн instance ажиллуулах болбол Redis рүү
// зөөнө — интерфэйс нь хэвээрээ үлдэнэ.
// ============================================================

const buckets = new Map()

// Хуучирсан бичлэгийг цэвэрлэнэ — санах ой хязгааргүй өсөхөөс сэргийлнэ
const CLEANUP_MS = 5 * 60_000
const timer = setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}, CLEANUP_MS)
timer.unref?.()

/**
 * @param {object} opts
 * @param {number} opts.windowMs хугацааны цонх
 * @param {number} opts.max цонх дотор зөвшөөрөх хүсэлтийн тоо
 * @param {string} opts.name бусад limiter-ээс ялгах нэр
 */
export function rateLimit({ windowMs = 60_000, max = 60, name = 'default' } = {}) {
  return (req, res, next) => {
    // Нэвтэрсэн бол хэрэглэгчээр, үгүй бол IP-гээр тоолно. Ингэснээр нэг
    // сүлжээнээс орсон хэрэглэгчид бие биедээ саад болохгүй.
    const id = req.user?.id || req.ip
    const key = `${name}:${id}`
    const now = Date.now()

    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }

    bucket.count += 1

    const remaining = Math.max(0, max - bucket.count)
    res.setHeader('RateLimit-Limit', max)
    res.setHeader('RateLimit-Remaining', remaining)
    res.setHeader('RateLimit-Reset', Math.ceil((bucket.resetAt - now) / 1000))

    if (bucket.count > max) {
      const seconds = Math.ceil((bucket.resetAt - now) / 1000)
      res.setHeader('Retry-After', seconds)
      return next(new ApiError(429, `Хэт олон хүсэлт илгээлээ. ${seconds} секундын дараа дахин оролдоно уу.`))
    }

    next()
  }
}

/** Тест хооронд төлөвийг цэвэрлэхэд. */
export const resetRateLimits = () => buckets.clear()
