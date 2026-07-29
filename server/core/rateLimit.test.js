import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, resetRateLimits } from './rateLimit.js'

// Хуурамч Express req/res
const makeCtx = (userId = 'u-1') => {
  const headers = {}
  return {
    req: { user: { id: userId }, ip: '127.0.0.1' },
    res: { setHeader: (k, v) => { headers[k] = v }, headers },
  }
}

const run = (limiter, ctx) =>
  new Promise(resolve => limiter(ctx.req, ctx.res, err => resolve(err)))

describe('rateLimit', () => {
  beforeEach(() => resetRateLimits())

  it('хязгаар дотор хүсэлтийг нэвтрүүлнэ', async () => {
    const limiter = rateLimit({ name: 'test', max: 3, windowMs: 60_000 })
    const ctx = makeCtx()

    for (let i = 0; i < 3; i++) {
      expect(await run(limiter, ctx)).toBeUndefined()
    }
  })

  it('хязгаар хэтрэхэд 429 буцаана', async () => {
    const limiter = rateLimit({ name: 'test', max: 2, windowMs: 60_000 })
    const ctx = makeCtx()

    await run(limiter, ctx)
    await run(limiter, ctx)
    const err = await run(limiter, ctx)

    expect(err?.status).toBe(429)
    expect(err.message).toMatch(/Хэт олон хүсэлт/)
  })

  it('хэрэглэгч бүрийг тусад нь тоолно', async () => {
    const limiter = rateLimit({ name: 'test', max: 1, windowMs: 60_000 })

    expect(await run(limiter, makeCtx('a'))).toBeUndefined()
    // Өөр хэрэглэгч эхнийхээс болж хаагдах ёсгүй
    expect(await run(limiter, makeCtx('b'))).toBeUndefined()
  })

  it('цонх дуусахад дахин нээгдэнэ', async () => {
    const limiter = rateLimit({ name: 'test', max: 1, windowMs: 10 })
    const ctx = makeCtx()

    await run(limiter, ctx)
    expect((await run(limiter, ctx))?.status).toBe(429)

    await new Promise(r => setTimeout(r, 20))
    expect(await run(limiter, ctx)).toBeUndefined()
  })

  it('үлдэгдлийн толгойг тавина', async () => {
    const limiter = rateLimit({ name: 'test', max: 5, windowMs: 60_000 })
    const ctx = makeCtx()

    await run(limiter, ctx)
    expect(ctx.res.headers['RateLimit-Limit']).toBe(5)
    expect(ctx.res.headers['RateLimit-Remaining']).toBe(4)
  })
})
