import express from 'express'
import cors from 'cors'
import { CORS_ORIGINS, IS_PROD } from './config.js'
import { errorHandler, ApiError } from './core/http.js'
import { rateLimit } from './core/rateLimit.js'
import { mountModules } from './modules/index.js'

// ============================================================
// Express апп угсрах
// ============================================================
// `listen`-ээс ТУСДАА байгаа нь санаатай: тест нь портгүйгээр апп-ыг
// шууд импортлож дуудна.
// ============================================================

export function createApp() {
  const app = express()

  // Render/Vercel зэрэг proxy-ийн ард ажиллахад req.ip зөв болгоно —
  // rate limit IP-гээр тоолдог тул чухал.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  // ------------------------------
  // Аюулгүй байдлын толгойнууд (NFR-4)
  // ------------------------------
  // API нь зөвхөн JSON буцаадаг тул CSP шаардлагагүй. Хэрэгтэй нь: браузер
  // хариуг өөр төрөл гэж таамаглахгүй байх, iframe дотор ачаалахгүй байх.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    if (IS_PROD) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    next()
  })

  // ------------------------------
  // CORS
  // ------------------------------
  // Frontend болон API нь ижил домэйн дээр байрладаг (Vercel). Браузер нь
  // GET-ээс бусад бүх хүсэлтэд, ижил домэйн байсан ч `Origin` толгой
  // илгээдэг. Тиймээс "ижил домэйн" тохиолдлыг ЗААВАЛ зөвшөөрөх ёстой —
  // үгүй бол апп уншиж чадах ч БИЧИЖ ЧАДАХГҮЙ болно.
  //
  // Ижил домэйныг хүсэлтийн `Host`-той тулгаж таньдаг тул шинэ домэйн
  // (preview deploy, өөрийн домэйн) нэмэхэд тохиргоо өөрчлөх шаардлагагүй.
  // `CORS_ORIGINS` нь ӨӨР домэйнөөс хандахыг зөвшөөрөхөд л хэрэгтэй.
  app.use(
    cors((req, callback) => {
      const origin = req.headers.origin

      // Origin алга = curl, mobile app, server-to-server
      if (!origin) return callback(null, { origin: true, credentials: true })

      let sameOrigin = false
      try {
        sameOrigin = new URL(origin).host === req.headers.host
      } catch {
        sameOrigin = false
      }

      if (sameOrigin || CORS_ORIGINS.includes(origin)) {
        return callback(null, { origin: true, credentials: true })
      }

      callback(new ApiError(403, 'Энэ домэйноос хандах эрхгүй.'))
    })
  )

  // ⚠ Stripe webhook нь ТҮҮХИЙ биетэй байх ЁСТОЙ — JSON болгон задлаад
  //   дахин мөр болговол гарын үсэг таарахаа болино (талбарын дараалал,
  //   зай өөрчлөгддөг). Тиймээс `express.json`-оос ӨМНӨ, зөвхөн энэ замд
  //   түүхий парсер тавина.
  app.use('/api/billing/stripe/webhook', express.raw({ type: '*/*', limit: '1mb' }))

  // 100kb-аас том JSON хүлээж авахгүй — санамсаргүй/зориудын том хүсэлтээс хамгаална
  app.use(express.json({ limit: '100kb' }))

  // Ерөнхий хамгаалалт. Модуль доторх нарийн хязгаарууд үүнээс дээр нэмэгдэнэ.
  app.use('/api', rateLimit({ name: 'global', windowMs: 60_000, max: 300 }))

  // ------------------------------
  // Хүсэлтийн бүртгэл
  // ------------------------------
  app.use((req, res, next) => {
    const started = Date.now()
    res.on('finish', () => {
      const ms = Date.now() - started
      // Удаан хүсэлтийг тодруулна — NFR-2 нь p95 < 500ms шаарддаг
      const slow = ms > 500 ? ' ⚠ удаан' : ''
      console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)${slow}`)
    })
    next()
  })

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() })
  })

  // ------------------------------
  // Модулиуд
  // ------------------------------
  const mounted = mountModules(app)

  app.get('/api', (req, res) => {
    res.json({ name: 'МонголАжил API', modules: mounted })
  })

  // Олдоогүй API зам
  app.use('/api', (req, res, next) => {
    next(new ApiError(404, `Ийм зам байхгүй: ${req.method} ${req.originalUrl}`))
  })

  app.use(errorHandler)

  return app
}
