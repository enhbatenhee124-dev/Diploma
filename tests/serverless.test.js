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

  // ============================================================
  // CORS
  // ============================================================
  // Продакшнд илэрсэн алдаа: браузер нь GET-ээс бусад хүсэлтэд ижил
  // домэйн байсан ч `Origin` илгээдэг. Тэр үед CORS шалгалт унаж, апп
  // уншиж чаддаг ч БИЧИЖ ЧАДАХГҮЙ байсан.
  //
  // curl-ээр хийсэн тест үүнийг олоогүй — curl `Origin` илгээдэггүй.
  describe('CORS', () => {
    it('Origin-гүй хүсэлтийг нэвтрүүлнэ (curl, server-to-server)', async () => {
      const res = await request(handler).get('/api/health')
      expect(res.status).toBe(200)
    })

    it('ИЖИЛ домэйнөөс ирсэн бичих хүсэлтийг нэвтрүүлнэ', async () => {
      const host = 'ajil-iota.vercel.app'
      const res = await request(handler)
        .post('/api/notifications/read-all')
        .set('Host', host)
        .set('Origin', `https://${host}`)

      // CORS-д баригдвал 403. Нэвтрэлтийн 401 хүрсэн нь CORS өнгөрсний баталгаа.
      expect(res.status).toBe(401)
    })

    it('ИЖИЛ домэйнөөс ирсэн GET-ийг нэвтрүүлнэ', async () => {
      const host = 'ajil-iota.vercel.app'
      const res = await request(handler)
        .get('/api/health')
        .set('Host', host)
        .set('Origin', `https://${host}`)

      expect(res.status).toBe(200)
    })

    it('ӨӨР домэйнөөс ирсэн хүсэлтийг ТАТГАЛЗАНА', async () => {
      const res = await request(handler)
        .post('/api/notifications/read-all')
        .set('Host', 'ajil-iota.vercel.app')
        .set('Origin', 'https://hakerin-site.example')

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/домэйноос хандах эрхгүй/)
    })

    it('гажуудсан Origin-ыг татгалзана', async () => {
      const res = await request(handler)
        .post('/api/notifications/read-all')
        .set('Host', 'ajil-iota.vercel.app')
        // HTTP толгойд зөвхөн ASCII орно
        .set('Origin', 'not-a-valid-origin')

      expect(res.status).toBe(403)
    })
  })

  it('аюулгүй байдлын толгойнууд байна', async () => {
    const res = await request(handler).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('DENY')
    // Express-ийн хувилбарыг задруулахгүй
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
