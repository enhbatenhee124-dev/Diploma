import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'
import { hasSupabase } from './setup.js'
import { createApp } from '../server/app.js'

// ============================================================
// Integration тест — гол урсгал (Хүлээн авах шалгуур §8)
// ============================================================
// Бодит Supabase рүү ханддаг: RLS, триггер, security definer функцууд
// бүгд ажиллана. Зөвхөн сервер дээрх логикийг шалгах mock тест нь
// "клиент дээр зөв, өгөгдлийн санд буруу" алдааг олж чадахгүй.
//
// Тест ӨӨРИЙН үүсгэсэн өгөгдлөө цэвэрлэнэ (afterAll).
//
// Ажиллуулах:  npm test
// Урьдчилсан нөхцөл: `npm run db:seed` — демо бүртгэлүүд, нууц үг demo1234
// ============================================================

const PASSWORD = 'demo1234'
const ACCOUNTS = {
  worker: '99112233',    // Болор Эрдэнэ — ажил хайгч
  employer: '70112233',  // Акмэ Корп — баталгаажсан ажил олгогч
  admin: '99001122',     // Админ
}

const app = createApp()
const api = () => request(app)

let sb
let token = {}
let available = false
const created = { shiftIds: [], reportIds: [] }

/** Утас/и-мэйлээр нэвтэрч access token авна. */
async function login(identifier) {
  const { data: email } = await sb.rpc('auth_email_for', { p_identifier: identifier })
  const { data, error } = await sb.auth.signInWithPassword({
    email: email || identifier,
    password: PASSWORD,
  })
  if (error) throw new Error(`${identifier}: ${error.message}`)
  return data.session.access_token
}

const auth = t => ['Authorization', `Bearer ${t}`]

beforeAll(async () => {
  if (!hasSupabase) return

  sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  try {
    for (const [role, id] of Object.entries(ACCOUNTS)) {
      token[role] = await login(id)
    }
    available = true
  } catch (err) {
    console.warn(
      `\n⚠ Демо бүртгэлээр нэвтэрч чадсангүй (${err.message}).` +
      '\n  `npm run db:seed` ажиллуулна уу. Integration тестүүд алгасагдана.\n'
    )
  }
})

afterAll(async () => {
  // Тестийн үүсгэсэн өгөгдлийг устгана — өгөгдлийн санд хог үлдээхгүй
  if (!available) return

  for (const id of created.shiftIds) {
    await api().delete(`/api/shifts/${id}`).set(...auth(token.employer))
  }

  // `reports.target_id` нь гадаад түлхүүр биш тул зар устгахад cascade
  // хийгдэхгүй. API-д мэдээлэл УСТГАХ зам ЗОРИУД байхгүй (аудитын мөр
  // үлдэх ёстой) учир цэвэрлэгээг service_role-оор хийнэ.
  if (created.reportIds.length) {
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
    await admin.from('reports').delete().in('id', created.reportIds)
  }
})

// ------------------------------
// Нэвтрэлт шаардахгүй
// ------------------------------
describe('Сервер амьд эсэх', () => {
  it('GET /api/health', async () => {
    const res = await api().get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('GET /api — бүх модуль бүртгэгдсэн', async () => {
    const res = await api().get('/api')
    expect(res.status).toBe(200)
    expect(res.body.modules).toContain('/api/shifts')
    expect(res.body.modules).toContain('/api/applications')
    expect(res.body.modules).toContain('/api/billing')
    expect(res.body.modules).toContain('/api/notifications')
    expect(res.body.modules).toContain('/api/searches')
    expect(res.body.modules).toHaveLength(11)
  })

  it('байхгүй зам 404 буцаана', async () => {
    const res = await api().get('/api/байхгүй')
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/Ийм зам байхгүй/)
  })
})

// ------------------------------
// Нийтийн зарын самбар — нэвтрээгүй зочин
// ------------------------------
// Зочин ажил хараагүй бол бүртгүүлэх шалтгаангүй. Гэхдээ түүнд ЗӨВХӨН
// зар харагдах ёстой — ажилтнуудын профайл, хүсэлт, чат хаалттай хэвээр.
describe.runIf(hasSupabase)('Зочин — нийтийн зарын самбар', () => {
  it('идэвхтэй зарыг харна', async () => {
    const res = await api().get('/api/shifts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('ЗӨВХӨН идэвхтэй зар харагдана', async () => {
    const res = await api().get('/api/shifts')
    // Хаагдсан/дүүрсэн зар зочинд харагдвал хуучирсан мэдээлэл тарна
    expect(res.body.data.every(s => s.status === 'Active')).toBe(true)
  })

  it('байгууллагын нэрийг харна (зарын карт дээр хэрэгтэй)', async () => {
    const res = await api().get('/api/profiles/employers')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0].orgName).toBeTruthy()
  })

  it('ажил олгогчийн РЕГИСТР, ХАЯГ зочинд ГАРАХГҮЙ', async () => {
    const res = await api().get('/api/profiles/employers')
    for (const e of res.body.data) {
      expect(e.regNumber).toBeNull()
      expect(e.address).toBeNull()
    }
  })

  it('ажилтнуудын профайл зочинд хаалттай', async () => {
    const res = await api().get('/api/profiles')
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('ажилтнуудын ур чадвар зочинд харагдахгүй', async () => {
    const res = await api().get('/api/profiles/workers')
    expect(res.body.data).toEqual([])
  })

  it('зочин зар нийтэлж чадахгүй', async () => {
    const res = await api().post('/api/shifts').send({ title: 'x' })
    expect(res.status).toBe(401)
  })
})

describe('Нэвтрэлтийн хамгаалалт', () => {
  it('токенгүйгээр хүсэлт харах боломжгүй', async () => {
    const res = await api().get('/api/applications')
    expect(res.status).toBe(401)
  })

  it('хуурамч токеныг татгалзана', async () => {
    // HTTP толгойд зөвхөн ASCII орно — тиймээс латинаар бичив
    const res = await api().get('/api/applications').set('Authorization', 'Bearer huuramch.token.utga')
    expect(res.status).toBe(401)
  })
})

// ------------------------------
// Push webhook
// ------------------------------
// Энэ бол `qpay/callback`-аас гадна аппын ЦОРЫН ГАНЦ нэвтрэлтгүй цэг.
// Задгай үлдвэл хэн ч дурын хэрэглэгчийн утас руу хуурамч мэдэгдэл
// илгээж чадна — тиймээс хамгаалалтыг тестээр бэхлэв.
//
// `PUSH_HOOK_SECRET` тохируулаагүй тестийн орчинд ч, тохируулсан үед ч
// ЗӨВШӨӨРӨГДӨХГҮЙ байх ёстой — хоёуланд нь 403.
describe('Push webhook', () => {
  const payload = {
    type: 'INSERT',
    table: 'notifications',
    record: { id: '00000000-0000-0000-0000-000000000001', user_id: 'dur-baidlaar', message: 'hog' },
  }

  it('нууц толгойгүйгээр татгалзана', async () => {
    const res = await api().post('/api/notifications/hook').send(payload)
    expect(res.status).toBe(403)
  })

  it('буруу нууцтай татгалзана', async () => {
    const res = await api()
      .post('/api/notifications/hook')
      .set('x-webhook-secret', 'buruu-nuuts-utga')
      .send(payload)

    expect(res.status).toBe(403)
  })

  it('нэвтэрсэн хэрэглэгчийн токен ч нууцыг орлохгүй', async () => {
    if (!available) return

    // Жирийн хэрэглэгч webhook-ийг дуудаж чадах ёсгүй — өөр хүн рүү
    // мэдэгдэл илгээх зам болно
    const res = await api()
      .post('/api/notifications/hook')
      .set(...auth(token.worker))
      .send(payload)

    expect(res.status).toBe(403)
  })
})

// ------------------------------
// Дүрийн эрх
// ------------------------------
describe.runIf(hasSupabase)('Дүрийн эрх', () => {
  it('ажилтан зар нийтэлж чадахгүй', async () => {
    if (!available) return
    const res = await api()
      .post('/api/shifts')
      .set(...auth(token.worker))
      .send({
        title: 'Зөвшөөрөгдөх ёсгүй',
        category: 'food',
        description: 'Ажилтан зар нийтлэх ёсгүй.',
        district: 'Баянзүрх',
        startAt: new Date(Date.now() + 86400_000).toISOString(),
        endAt: new Date(Date.now() + 90000_000).toISOString(),
        hourlyWage: 12000,
        slots: 1,
      })

    expect(res.status).toBe(403)
  })

  it('ажилтан баталгаажуулах дараалалд хандаж чадахгүй', async () => {
    if (!available) return
    const res = await api().get('/api/employers/queue').set(...auth(token.worker))
    expect(res.status).toBe(403)
  })

  it('админ баталгаажуулах дараалалыг харна', async () => {
    if (!available) return
    const res = await api().get('/api/employers/queue').set(...auth(token.admin))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('ажилтан өөрийгөө идэвхгүй болгож чадахгүй', async () => {
    if (!available) return
    const me = await api().get('/api/gamification/me').set(...auth(token.worker))
    const res = await api()
      .post(`/api/moderation/users/${me.body.data.userId}/deactivate`)
      .set(...auth(token.worker))
      .send({ reason: 'тест' })

    expect(res.status).toBe(403)
  })
})

// ------------------------------
// Оролтын шалгалт
// ------------------------------
describe.runIf(hasSupabase)('Оролтын шалгалт', () => {
  it('дуусах хугацаа эхлэхээс өмнө байвал татгалзана', async () => {
    if (!available) return
    const res = await api()
      .post('/api/shifts')
      .set(...auth(token.employer))
      .send({
        title: 'Буруу огноо',
        category: 'food',
        description: 'Дуусах нь эхлэхээс өмнө.',
        district: 'Баянзүрх',
        startAt: new Date(Date.now() + 90000_000).toISOString(),
        endAt: new Date(Date.now() + 86400_000).toISOString(),
        hourlyWage: 12000,
        slots: 1,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/эхлэх хугацаанаас хойш/)
  })

  it('буруу UUID-г татгалзана', async () => {
    if (!available) return
    const res = await api().get('/api/profiles/u1/contact').set(...auth(token.worker))
    expect(res.status).toBe(400)
  })

  it('хоосон мессеж илгээхгүй', async () => {
    if (!available) return
    const threads = await api().get('/api/chat/threads').set(...auth(token.worker))
    const thread = threads.body.data[0]
    if (!thread) return

    const res = await api()
      .post(`/api/chat/threads/${thread.id}/messages`)
      .set(...auth(token.worker))
      .send({ content: '   ' })

    expect(res.status).toBe(400)
  })
})

// ------------------------------
// Гол урсгал: зар → хүсэлт → зөвшөөрөл → чат → дуусгах → үнэлгээ
// ------------------------------
describe.runIf(hasSupabase)('Гол урсгал', () => {
  let shiftId
  let applicationId

  it('1. Ажил олгогч зар нийтэлнэ (FR-4.1)', async () => {
    if (!available) return

    const res = await api()
      .post('/api/shifts')
      .set(...auth(token.employer))
      .send({
        title: `[ТЕСТ] Бариста ${Date.now()}`,
        category: 'food',
        description: 'Автомат тестээр үүсгэсэн зар. Тест дуусахад устгагдана.',
        district: 'Сүхбаатар',
        startAt: new Date(Date.now() + 86400_000).toISOString(),
        endAt: new Date(Date.now() + 86400_000 + 4 * 3600_000).toISOString(),
        // Түвшний шаардлага гарахаас сэргийлж бага цалин сонгов
        hourlyWage: 10000,
        slots: 1,
      })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('Active')
    // employer_id-г сервер токеноос авсан эсэх
    expect(res.body.data.employerId).toBeTruthy()

    shiftId = res.body.data.id
    created.shiftIds.push(shiftId)
  })

  it('2. Ажилтан зарыг хайлтаас олно (FR-5.1)', async () => {
    if (!available || !shiftId) return

    const res = await api().get('/api/shifts').set(...auth(token.worker))
    expect(res.status).toBe(200)
    expect(res.body.data.some(s => s.id === shiftId)).toBe(true)
  })

  it('3. Ажилтан нэг товчоор хүсэлт илгээнэ (FR-6.1)', async () => {
    if (!available || !shiftId) return

    const res = await api()
      .post('/api/applications')
      .set(...auth(token.worker))
      .send({ shiftId })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('applied')
    applicationId = res.body.data.id
  })

  it('4. Давхар хүсэлт илгээж чадахгүй', async () => {
    if (!available || !shiftId) return

    const res = await api()
      .post('/api/applications')
      .set(...auth(token.worker))
      .send({ shiftId })

    expect(res.status).toBe(409)
  })

  it('5. Ажил олгогч зөвшөөрнө (FR-6.2)', async () => {
    if (!available || !applicationId) return

    const res = await api()
      .patch(`/api/applications/${applicationId}/status`)
      .set(...auth(token.employer))
      .send({ status: 'approved' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('approved')
    expect(res.body.data.decidedAt).toBeTruthy()
  })

  it('6. Зөвшөөрсний дараа чат нээгдэнэ (FR-6.4)', async () => {
    if (!available || !applicationId) return

    const res = await api()
      .post('/api/chat/threads')
      .set(...auth(token.worker))
      .send({ applicationId })

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBeTruthy()

    const msg = await api()
      .post(`/api/chat/threads/${res.body.data.id}/messages`)
      .set(...auth(token.worker))
      .send({ content: 'Сайн байна уу, ажилд орох боломжтой.' })

    expect(msg.status).toBe(201)
    expect(msg.body.data.content).toMatch(/Сайн байна уу/)
  })

  it('7. Урсгалыг алгасах боломжгүй', async () => {
    if (!available || !applicationId) return

    // 'approved' → 'completed' нь 'in-progress'-ыг алгасаж байна
    const res = await api()
      .patch(`/api/applications/${applicationId}/status`)
      .set(...auth(token.employer))
      .send({ status: 'completed' })

    expect(res.status).toBe(400)
  })

  it('8. Ажил эхэлж, дуусна (FR-6.3)', async () => {
    if (!available || !applicationId) return

    const started = await api()
      .patch(`/api/applications/${applicationId}/status`)
      .set(...auth(token.employer))
      .send({ status: 'in-progress' })
    expect(started.status).toBe(200)

    const done = await api()
      .patch(`/api/applications/${applicationId}/status`)
      .set(...auth(token.employer))
      .send({ status: 'completed' })
    expect(done.status).toBe(200)
    expect(done.body.data.status).toBe('completed')
  })

  it('8b. Дууссан ажлыг буцаан татаж ЧАДАХГҮЙ (FR-6.5)', async () => {
    if (!available || !applicationId) return

    // Түүх устгах боломжтой бол no-show хамгаалалт утгагүй болно:
    // ажилтан муу үнэлгээ авахаас өмнө мөрөө арчиж чадна.
    const res = await api()
      .delete(`/api/applications/${applicationId}`)
      .set(...auth(token.worker))

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/буцаан татах боломжгүй/)
  })

  it('9. Хоёр тал бие биеэ үнэлнэ (FR-7.1)', async () => {
    if (!available || !applicationId) return

    const byWorker = await api()
      .post('/api/reviews')
      .set(...auth(token.worker))
      .send({ applicationId, stars: 5, comment: 'Сайн ажил олгогч.' })

    expect([201, 409]).toContain(byWorker.status)

    if (byWorker.status === 201) {
      // Хэнийг үнэлж буйг СЕРВЕР тодорхойлсон эсэх
      expect(byWorker.body.data.revieweeId).toBeTruthy()
      expect(byWorker.body.data.stars).toBe(5)
    }
  })

  it('10. Нэг ажлыг хоёр удаа үнэлж чадахгүй (FR-7.3)', async () => {
    if (!available || !applicationId) return

    const again = await api()
      .post('/api/reviews')
      .set(...auth(token.worker))
      .send({ applicationId, stars: 1, comment: 'Санаа өөрчлөгдлөө.' })

    expect(again.status).toBe(409)
  })

  it('11. Оролцоогүй хүн үнэлгээ өгч чадахгүй', async () => {
    if (!available || !applicationId) return

    const res = await api()
      .post('/api/reviews')
      .set(...auth(token.admin))
      .send({ applicationId, stars: 1, comment: 'Хамааралгүй хүн.' })

    expect([403, 409]).toContain(res.status)
  })
})

// ------------------------------
// Хадгалсан ажил
// ------------------------------
describe.runIf(hasSupabase)('Хадгалсан ажил', () => {
  it('хадгалж, хасна', async () => {
    if (!available) return

    const shifts = await api().get('/api/shifts').set(...auth(token.worker))
    const shift = shifts.body.data[0]
    if (!shift) return

    await api().post(`/api/shifts/${shift.id}/save`).set(...auth(token.worker))
    const saved = await api().get('/api/shifts/saved').set(...auth(token.worker))
    expect(saved.body.data).toContain(shift.id)

    await api().delete(`/api/shifts/${shift.id}/save`).set(...auth(token.worker))
    const after = await api().get('/api/shifts/saved').set(...auth(token.worker))
    expect(after.body.data).not.toContain(shift.id)
  })

  it('давхар хадгалахад алдаа өгөхгүй', async () => {
    if (!available) return

    const shifts = await api().get('/api/shifts').set(...auth(token.worker))
    const shift = shifts.body.data[0]
    if (!shift) return

    const first = await api().post(`/api/shifts/${shift.id}/save`).set(...auth(token.worker))
    const second = await api().post(`/api/shifts/${shift.id}/save`).set(...auth(token.worker))

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)

    await api().delete(`/api/shifts/${shift.id}/save`).set(...auth(token.worker))
  })
})

// ------------------------------
// Хадгалсан хайлт ба мэдэгдэл (FR-5.4)
// ------------------------------
describe.runIf(hasSupabase)('Хадгалсан хайлт', () => {
  const searchIds = []

  afterAll(async () => {
    if (!available) return
    for (const id of searchIds) {
      await api().delete(`/api/searches/${id}`).set(...auth(token.worker))
    }
  })

  it('шүүлтгүй хайлт хадгалахыг татгалзана', async () => {
    if (!available) return

    // Шүүлтгүй бол БҮХ шинэ зар мэдэгдэл болно — хэрэглэгчийг живүүлнэ
    const res = await api()
      .post('/api/searches')
      .set(...auth(token.worker))
      .send({ name: 'Бүгд', filters: {} })

    expect(res.status).toBe(400)
  })

  it('ажил олгогч хандаж чадахгүй', async () => {
    if (!available) return
    const res = await api().get('/api/searches').set(...auth(token.employer))
    expect(res.status).toBe(403)
  })

  it('хайлт хадгалж, танихгүй шүүлтийг хаяна', async () => {
    if (!available) return

    const res = await api()
      .post('/api/searches')
      .set(...auth(token.worker))
      .send({
        name: '[ТЕСТ] Сүхбаатар',
        filters: { district: 'Сүхбаатар', minWage: 9000, хуурамч: 'утга' },
      })

    expect(res.status).toBe(201)
    expect(res.body.data.filters).toEqual({ district: 'Сүхбаатар', minWage: 9000 })
    searchIds.push(res.body.data.id)
  })

  it('ТОХИРОХ зар нийтлэгдэхэд мэдэгдэл ирнэ', async () => {
    if (!available || !searchIds.length) return

    const before = await api().get('/api/notifications').set(...auth(token.worker))

    const shift = await api()
      .post('/api/shifts')
      .set(...auth(token.employer))
      .send({
        title: '[ТЕСТ] Хайлтад тохирох ажил',
        category: 'food',
        description: 'Хадгалсан хайлтын автомат тест.',
        district: 'Сүхбаатар',
        startAt: new Date(Date.now() + 86400_000).toISOString(),
        endAt: new Date(Date.now() + 90000_000).toISOString(),
        hourlyWage: 12000,
        slots: 1,
      })
    expect(shift.status).toBe(201)
    created.shiftIds.push(shift.body.data.id)

    const after = await api().get('/api/notifications').set(...auth(token.worker))
    expect(after.body.data.unread).toBe(before.body.data.unread + 1)
    expect(after.body.data.items[0].message).toMatch(/Шинэ тохирох ажил/)
  })

  it('ҮЛ ТОХИРОХ зар мэдэгдэл үүсгэхгүй', async () => {
    if (!available || !searchIds.length) return

    const before = await api().get('/api/notifications').set(...auth(token.worker))

    const shift = await api()
      .post('/api/shifts')
      .set(...auth(token.employer))
      .send({
        title: '[ТЕСТ] Өөр дүүргийн ажил',
        category: 'food',
        description: 'Хадгалсан хайлтад тохирох ЁСГҮЙ.',
        district: 'Налайх',
        startAt: new Date(Date.now() + 86400_000).toISOString(),
        endAt: new Date(Date.now() + 90000_000).toISOString(),
        hourlyWage: 12000,
        slots: 1,
      })
    expect(shift.status).toBe(201)
    created.shiftIds.push(shift.body.data.id)

    const after = await api().get('/api/notifications').set(...auth(token.worker))
    expect(after.body.data.unread).toBe(before.body.data.unread)
  })

  it('мэдэгдлийг унтраана', async () => {
    if (!available || !searchIds.length) return

    const res = await api()
      .patch(`/api/searches/${searchIds[0]}`)
      .set(...auth(token.worker))
      .send({ notify: false })

    expect(res.status).toBe(200)
    expect(res.body.data.notify).toBe(false)
  })

  it('унтраасан хайлт мэдэгдэл үүсгэхгүй', async () => {
    if (!available || !searchIds.length) return

    const before = await api().get('/api/notifications').set(...auth(token.worker))

    const shift = await api()
      .post('/api/shifts')
      .set(...auth(token.employer))
      .send({
        title: '[ТЕСТ] Унтраасны дараах ажил',
        category: 'food',
        description: 'Мэдэгдэл унтраасан тул ирэх ЁСГҮЙ.',
        district: 'Сүхбаатар',
        startAt: new Date(Date.now() + 86400_000).toISOString(),
        endAt: new Date(Date.now() + 90000_000).toISOString(),
        hourlyWage: 12000,
        slots: 1,
      })
    created.shiftIds.push(shift.body.data.id)

    const after = await api().get('/api/notifications').set(...auth(token.worker))
    expect(after.body.data.unread).toBe(before.body.data.unread)
  })
})

// ------------------------------
// Мэдээлэх ба хянах (FR-9.2)
// ------------------------------
describe.runIf(hasSupabase)('Мэдээлэх', () => {
  let reportId

  it('ажилтан зарыг мэдээлнэ', async () => {
    if (!available) return

    const shifts = await api().get('/api/shifts').set(...auth(token.worker))
    const shift = shifts.body.data[0]
    if (!shift) return

    const res = await api()
      .post('/api/moderation/reports')
      .set(...auth(token.worker))
      .send({ targetType: 'shift', targetId: shift.id, reason: '[ТЕСТ] Автомат тестийн мэдээлэл' })

    // Өмнөх тестээс үлдсэн бол 409 — хоёулаа хүлээн зөвшөөрөгдөнө
    expect([201, 409]).toContain(res.status)
    if (res.status === 201) {
      reportId = res.body.data.id
      created.reportIds.push(reportId)
    }
  })

  it('нэг зүйлийг хоёр удаа мэдээлж чадахгүй', async () => {
    if (!available || !reportId) return

    const shifts = await api().get('/api/shifts').set(...auth(token.worker))
    const res = await api()
      .post('/api/moderation/reports')
      .set(...auth(token.worker))
      .send({ targetType: 'shift', targetId: shifts.body.data[0].id, reason: 'дахин мэдээлэх' })

    expect(res.status).toBe(409)
  })

  it('хэт богино шалтгааныг татгалзана', async () => {
    if (!available) return

    const shifts = await api().get('/api/shifts').set(...auth(token.worker))
    const res = await api()
      .post('/api/moderation/reports')
      .set(...auth(token.worker))
      .send({ targetType: 'shift', targetId: shifts.body.data[0].id, reason: 'ab' })

    expect(res.status).toBe(400)
  })

  it('өөрийгөө мэдээлж чадахгүй', async () => {
    if (!available) return

    const me = await api().get('/api/gamification/me').set(...auth(token.worker))
    const res = await api()
      .post('/api/moderation/reports')
      .set(...auth(token.worker))
      .send({ targetType: 'user', targetId: me.body.data.userId, reason: 'өөрийгөө мэдээлэх' })

    expect(res.status).toBe(400)
  })

  it('энгийн хэрэглэгч мэдээллийн жагсаалт харж чадахгүй', async () => {
    if (!available) return

    const res = await api().get('/api/moderation/reports').set(...auth(token.worker))
    expect(res.status).toBe(403)
  })

  it('админ жагсаалтыг харж, шийдвэрлэнэ', async () => {
    if (!available || !reportId) return

    const list = await api().get('/api/moderation/reports').set(...auth(token.admin))
    expect(list.status).toBe(200)
    expect(list.body.data.some(r => r.id === reportId)).toBe(true)

    const resolved = await api()
      .patch(`/api/moderation/reports/${reportId}`)
      .set(...auth(token.admin))
      .send({ status: 'resolved', note: 'автомат тест' })
    expect(resolved.status).toBe(200)
  })

  it('мэдэгдэхгүй шийдвэрийн төлвийг татгалзана', async () => {
    if (!available || !reportId) return

    const res = await api()
      .patch(`/api/moderation/reports/${reportId}`)
      .set(...auth(token.admin))
      .send({ status: 'ямар_нэг' })

    expect(res.status).toBe(400)
  })
})

// ------------------------------
// Мэдэгдэл (FR-8, NFR-6)
// ------------------------------
describe.runIf(hasSupabase)('Мэдэгдэл', () => {
  it('өөрийн мэдэгдлийг уншина', async () => {
    if (!available) return

    const res = await api().get('/api/notifications').set(...auth(token.worker))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.items)).toBe(true)
    expect(typeof res.body.data.unread).toBe('number')
  })

  it('нэвтрэлтгүйгээр хандаж чадахгүй', async () => {
    const res = await api().get('/api/notifications')
    expect(res.status).toBe(401)
  })

  it('өөр хүний мэдэгдэл ХОЛИЛДОХГҮЙ', async () => {
    if (!available) return

    const mine = await api().get('/api/notifications').set(...auth(token.worker))
    const theirs = await api().get('/api/notifications').set(...auth(token.employer))

    const myIds = new Set(mine.body.data.items.map(n => n.id))
    const overlap = theirs.body.data.items.filter(n => myIds.has(n.id))
    expect(overlap).toHaveLength(0)
  })

  it('уншсан гэж тэмдэглэнэ', async () => {
    if (!available) return

    const before = await api().get('/api/notifications').set(...auth(token.worker))
    const unread = before.body.data.items.find(n => !n.isRead)
    if (!unread) return

    const marked = await api()
      .post(`/api/notifications/${unread.id}/read`)
      .set(...auth(token.worker))
    expect(marked.status).toBe(200)

    const after = await api().get('/api/notifications').set(...auth(token.worker))
    expect(after.body.data.unread).toBe(before.body.data.unread - 1)
    expect(after.body.data.items.find(n => n.id === unread.id).isRead).toBe(true)
  })

  it('бүгдийг уншсан болгоно', async () => {
    if (!available) return

    const res = await api().post('/api/notifications/read-all').set(...auth(token.worker))
    expect(res.status).toBe(200)

    const after = await api().get('/api/notifications').set(...auth(token.worker))
    expect(after.body.data.unread).toBe(0)
  })

  it('буруу ID-г татгалзана', async () => {
    if (!available) return

    const res = await api().post('/api/notifications/u1/read').set(...auth(token.worker))
    expect(res.status).toBe(400)
  })

  it('мэдэгдэл ҮҮСГЭХ зам БАЙХГҮЙ — зөвхөн систем үүсгэнэ', async () => {
    if (!available) return

    // Хэрэглэгч бусдад дурын мэдэгдэл илгээж чадах ёсгүй
    const res = await api()
      .post('/api/notifications')
      .set(...auth(token.worker))
      .send({ message: 'спам', userId: 'хэн нэгэн' })

    expect(res.status).toBe(404)
  })
})

// ------------------------------
// Хувийн мэдээллийн хил (NFR-3)
// ------------------------------
describe.runIf(hasSupabase)('Хувийн мэдээлэл', () => {
  it('нийтийн профайлд утас, и-мэйл ОРОХГҮЙ', async () => {
    if (!available) return

    const res = await api().get('/api/profiles').set(...auth(token.worker))
    expect(res.status).toBe(200)

    for (const p of res.body.data) {
      expect(p.phone == null || p.phone === '').toBe(true)
      expect(p.email == null || p.email === '').toBe(true)
    }
  })

  it('админ бүрэн жагсаалтыг харна', async () => {
    if (!available) return

    const res = await api().get('/api/profiles/admin').set(...auth(token.admin))
    expect(res.status).toBe(200)
    expect(res.body.data.some(p => p.phone)).toBe(true)
  })
})

// ------------------------------
// SECURITY DEFINER view-үүд
// ------------------------------
// `invoice_overview` болон `employer_queue` нь ЗОРИУД `security_invoker = off`
// (эзэмшигчийн эрхээр ажиллана). Шалтгаан: тэдгээр нь `profiles`-оос уншдаг
// бөгөөд тэнд RLS хатуу тул invoker горимд АДМИНД Ч хоосон харагдана.
//
// Оронд нь мөрийн шүүлтийг view-ийн `WHERE`-т `auth.uid()` / `is_admin()`-ээр
// хийсэн. Энэ нь ажилладаг ч ЭМЗЭГ: хэн нэгэн view-г засахдаа тэр нөхцөлийг
// орхивол бүх нэхэмжлэл, регистрийн дугаар задарна.
//
// Supabase-ийн шалгагч энэ загварыг анхааруулдаг. Доорх тестүүд нь тухайн
// анхааруулгыг "шалгасан, аюулгүй" болгож бэхжүүлнэ.
describe.runIf(hasSupabase)('Definer view-үүдийн мөрийн шүүлт', () => {
  it('ажилтан НЭГ Ч нэхэмжлэл харахгүй', async () => {
    if (!available) return

    const res = await api().get('/api/billing/invoices').set(...auth(token.worker))
    // Дүрийн шалгалтад баригдана; баригдаагүй ч хоосон байх ёстой
    if (res.status === 200) expect(res.body.data).toHaveLength(0)
    else expect(res.status).toBe(403)
  })

  it('ажил олгогч ЗӨВХӨН өөрийн нэхэмжлэлийг харна', async () => {
    if (!available) return

    const me = await api().get('/api/gamification/me').set(...auth(token.employer))
    const res = await api().get('/api/billing/invoices').set(...auth(token.employer))

    expect(res.status).toBe(200)
    const foreign = res.body.data.filter(i => i.employerId !== me.body.data.userId)
    expect(foreign).toHaveLength(0)
  })

  it('админ бүх нэхэмжлэлийг харна', async () => {
    if (!available) return

    const res = await api().get('/api/billing/invoices').set(...auth(token.admin))
    expect(res.status).toBe(200)
    // Админд харагдахгүй бол баталгаажуулах ажлаа хийж чадахгүй
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('админ биш хүн баталгаажуулах дараалал харахгүй', async () => {
    if (!available) return

    for (const who of ['worker', 'employer']) {
      const res = await api().get('/api/employers/queue').set(...auth(token[who]))
      if (res.status === 200) expect(res.body.data).toHaveLength(0)
      else expect(res.status).toBe(403)
    }
  })

  it('нийтийн view-үүд эмзэг багана АГУУЛАХГҮЙ', async () => {
    if (!available) return

    // Эдгээр нь зочинд нээлттэй тул багана нэмэхэд болгоомжтой байх ёстой
    const employers = await api().get('/api/profiles/employers')
    for (const e of employers.body.data) {
      expect(e.regNumber).toBeNull()
      expect(e.address).toBeNull()
    }

    const profiles = await api().get('/api/profiles').set(...auth(token.worker))
    for (const p of profiles.body.data) {
      expect(p.phone == null || p.phone === '').toBe(true)
      expect(p.email == null || p.email === '').toBe(true)
    }
  })
})

// ------------------------------
// Утасны дугаарын хил (NFR-3)
// ------------------------------
// Платформын хамгийн мэдрэмтгий дүрэм: утасны дугаар зөвхөн зөвшөөрөгдсөн
// ажлын хоёр талд нээгдэнэ. Энэ эвдэрвэл хэн ч бүх хэрэглэгчийн дугаарыг
// цуглуулж чадна.
describe.runIf(hasSupabase)('Холбоо барих мэдээллийн хил', () => {
  it('өөрийн дугаараа харна', async () => {
    if (!available) return

    const me = await api().get('/api/gamification/me').set(...auth(token.worker))
    const res = await api()
      .get(`/api/profiles/${me.body.data.userId}/contact`)
      .set(...auth(token.worker))

    expect(res.status).toBe(200)
    expect(res.body.data?.phone).toBeTruthy()
  })

  it('ХАМААРАЛГҮЙ хүний дугаарыг харахгүй', async () => {
    if (!available) return

    // Хоёр ажилтан хоорондоо ямар ч ажлаар холбогдоогүй
    const profiles = await api().get('/api/profiles').set(...auth(token.worker))
    const me = await api().get('/api/gamification/me').set(...auth(token.worker))
    const stranger = profiles.body.data.find(p => p.role === 'employee' && p.id !== me.body.data.userId)
    if (!stranger) return

    const res = await api()
      .get(`/api/profiles/${stranger.id}/contact`)
      .set(...auth(token.worker))

    // Хүсэлт амжилттай ч утга нь ХООСОН байх ёстой
    expect(res.status).toBe(200)
    expect(res.body.data?.phone).toBeFalsy()
  })

  it('админ хэнийхийг ч харна', async () => {
    if (!available) return

    const profiles = await api().get('/api/profiles').set(...auth(token.admin))
    const someone = profiles.body.data.find(p => p.role === 'employee')
    if (!someone) return

    const res = await api().get(`/api/profiles/${someone.id}/contact`).set(...auth(token.admin))
    expect(res.status).toBe(200)
    expect(res.body.data?.phone).toBeTruthy()
  })

  it('нэвтрэлтгүйгээр хандахгүй', async () => {
    if (!available) return
    const me = await api().get('/api/gamification/me').set(...auth(token.worker))
    const res = await api().get(`/api/profiles/${me.body.data.userId}/contact`)
    expect(res.status).toBe(401)
  })
})

// ------------------------------
// Ажил олгогч баталгаажуулах (FR-3.2, FR-9.1)
// ------------------------------
describe.runIf(hasSupabase)('Ажил олгогч баталгаажуулах', () => {
  it('ажилтан баталгаажуулж чадахгүй', async () => {
    if (!available) return

    const queue = await api().get('/api/employers/queue').set(...auth(token.admin))
    const target = queue.body.data[0]
    if (!target) return

    const res = await api()
      .post(`/api/employers/${target.userId}/verify`)
      .set(...auth(token.worker))

    expect(res.status).toBe(403)
  })

  it('ажил олгогч өөрийгөө баталгаажуулж чадахгүй', async () => {
    if (!available) return

    const me = await api().get('/api/gamification/me').set(...auth(token.employer))
    const res = await api()
      .post(`/api/employers/${me.body.data.userId}/verify`)
      .set(...auth(token.employer))

    expect(res.status).toBe(403)
  })

  it('татгалзахад шалтгаан ЗААВАЛ шаардана', async () => {
    if (!available) return

    const queue = await api().get('/api/employers/queue').set(...auth(token.admin))
    const target = queue.body.data[0]
    if (!target) return

    // Шалтгаангүй татгалзвал ажил олгогч юуг засахаа мэдэхгүй
    const res = await api()
      .post(`/api/employers/${target.userId}/reject`)
      .set(...auth(token.admin))
      .send({})

    expect(res.status).toBe(400)
  })
})

// ------------------------------
// Ажилтныг ажилд урих (FR-13)
// ------------------------------
describe.runIf(hasSupabase)('Урилга', () => {
  it('ажилтан урилга илгээж чадахгүй', async () => {
    if (!available) return

    const shifts = await api().get('/api/shifts').set(...auth(token.worker))
    const me = await api().get('/api/gamification/me').set(...auth(token.worker))

    const res = await api()
      .post('/api/applications/invite')
      .set(...auth(token.worker))
      .send({ shiftId: shifts.body.data[0]?.id, workerId: me.body.data.userId })

    expect(res.status).toBe(403)
  })

  it('ӨӨРИЙН биш зар дээр урьж чадахгүй', async () => {
    if (!available) return

    // Ажил олгогч №1 нь ажил олгогч №2-ын зар дээр урилга илгээх гэж оролдоно.
    // Шалгалтыг `invite_worker` функц auth.uid()-ээр хийнэ.
    const shifts = await api().get('/api/shifts').set(...auth(token.employer))
    const me = await api().get('/api/gamification/me').set(...auth(token.employer))
    const notMine = shifts.body.data.find(s => s.employerId !== me.body.data.userId)
    if (!notMine) return

    const workers = await api().get('/api/profiles').set(...auth(token.employer))
    const worker = workers.body.data.find(p => p.role === 'employee')

    const res = await api()
      .post('/api/applications/invite')
      .set(...auth(token.employer))
      .send({ shiftId: notMine.id, workerId: worker.id })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

// ------------------------------
// Ажилтны ур чадвар (FR-2.2, FR-2.3)
// ------------------------------
describe.runIf(hasSupabase)('Ур чадвар ба боломжит цаг', () => {
  it('хадгалж, буцааж уншина', async () => {
    if (!available) return

    const before = await api().get('/api/gamification/me').set(...auth(token.worker))
    const userId = before.body.data.userId

    const original = await api().get(`/api/profiles/${userId}/worker`).set(...auth(token.worker))

    const saved = await api()
      .put('/api/profiles/me/worker')
      .set(...auth(token.worker))
      .send({ skills: ['barista', 'cashier'], availability: { 0: [0, 1] } })
    expect(saved.status).toBe(200)

    const after = await api().get(`/api/profiles/${userId}/worker`).set(...auth(token.worker))
    expect(after.body.data.skills).toEqual(['barista', 'cashier'])
    expect(after.body.data.availability).toEqual({ 0: [0, 1] })

    // Анхны утгыг сэргээнэ — тест өгөгдлийг өөрчилж үлдээхгүй
    await api()
      .put('/api/profiles/me/worker')
      .set(...auth(token.worker))
      .send({ skills: original.body.data.skills, availability: original.body.data.availability })
  })

  it('ур чадвар хэт олон бол татгалзана', async () => {
    if (!available) return

    const res = await api()
      .put('/api/profiles/me/worker')
      .set(...auth(token.worker))
      .send({ skills: Array.from({ length: 40 }, (_, i) => `s${i}`) })

    expect(res.status).toBe(400)
  })

  it('хоосон хүсэлтийг татгалзана', async () => {
    if (!available) return
    const res = await api().put('/api/profiles/me/worker').set(...auth(token.worker)).send({})
    expect(res.status).toBe(400)
  })
})

// ------------------------------
// Тэргүүлэгчид
// ------------------------------
describe.runIf(hasSupabase)('Тэргүүлэгчид', () => {
  it('дүрээр эрэмбэлж буцаана', async () => {
    if (!available) return

    const res = await api().get('/api/gamification/ranking?role=employee').set(...auth(token.worker))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.every(r => r.role === 'employee')).toBe(true)
  })

  it('мэдэгдэхгүй дүрийг татгалзана', async () => {
    if (!available) return
    const res = await api().get('/api/gamification/ranking?role=хакер').set(...auth(token.worker))
    expect(res.status).toBe(400)
  })
})

// ------------------------------
// QPay webhook (нээлттэй зам)
// ------------------------------
describe.runIf(hasSupabase)('QPay webhook', () => {
  it('нэвтрэлтгүйгээр хүлээж авна', async () => {
    // QPay токен явуулдаггүй — 401 буцаавал төлбөрийн мэдэгдэл алдагдана
    const res = await api().post('/api/billing/qpay/callback').send({})
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('танихгүй invoice_id-д ч 200 буцаана', async () => {
    // QPay 200-аас өөр хариу авбал дахин дахин дуудна
    const res = await api()
      .post('/api/billing/qpay/callback?invoice_id=not-a-uuid')
      .send({ sender_invoice_no: 'хог' })

    expect(res.status).toBe(200)
  })
})

// ------------------------------
// Төлбөр
// ------------------------------
describe.runIf(hasSupabase)('Захиалга ба төлбөр', () => {
  it('ажил олгогч багцын мэдээллийг харна', async () => {
    if (!available) return

    const res = await api().get('/api/billing/plan').set(...auth(token.employer))
    expect(res.status).toBe(200)
    expect(res.body.data.priceMnt).toBeGreaterThan(0)
  })

  it('ажилтан захиалгын төлөвт хандаж чадахгүй', async () => {
    if (!available) return

    const res = await api().get('/api/billing/subscription').set(...auth(token.worker))
    expect(res.status).toBe(403)
  })

  it('ажилтан нэхэмжлэл баталгаажуулж чадахгүй', async () => {
    if (!available) return

    const invoices = await api().get('/api/billing/invoices').set(...auth(token.admin))
    const invoice = invoices.body.data?.[0]
    if (!invoice) return

    const res = await api()
      .post(`/api/billing/invoices/${invoice.id}/confirm`)
      .set(...auth(token.worker))
      .send({ note: 'зөвшөөрөгдөх ёсгүй' })

    expect(res.status).toBe(403)
  })
})
