import { describe, it, expect } from 'vitest'
import request from 'supertest'
import './setup.js'
import handler from '../api/index.js'

// ============================================================
// Vercel-ийн serverless орц
// ============================================================
// `api/index.js` бол продакшнд БОДИТООР ажиллах орц. Локал дээр
// `server/index.js` ажилладаг тул энэ файл эвдэрсэн ч хөгжүүлэлтийн үед
// анзаарагдахгүй — зөвхөн deploy хийсний дараа мэдэгдэнэ.
//
// Тиймээс энд орцыг ШУУД дуудаж шалгана.
// ============================================================

describe('Vercel serverless орц', () => {
  it('Express handler экспортолно', () => {
    expect(typeof handler).toBe('function')
    // Vercel нь `(req, res)` дуудна — Express апп яг тийм гарын үсэгтэй
    expect(typeof handler.use).toBe('function')
  })

  it('/api/health хүсэлтэд хариулна', async () => {
    const res = await request(handler).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('бүх модуль суусан байна', async () => {
    const res = await request(handler).get('/api')
    expect(res.status).toBe(200)
    expect(res.body.modules).toContain('/api/shifts')
    expect(res.body.modules).toContain('/api/notifications')
  })

  it('нэвтрэлтийн шалгалт хүчинтэй хэвээр', async () => {
    const res = await request(handler).get('/api/applications')
    expect(res.status).toBe(401)
  })

  it('аюулгүй байдлын толгойнууд байна', async () => {
    const res = await request(handler).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('DENY')
    // Express-ийн хувилбарыг задруулахгүй
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
