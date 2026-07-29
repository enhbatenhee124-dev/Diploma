import { clientFor, asUser } from '../../core/supabase.js'
import { unwrap, notFound, forbidden, badRequest } from '../../core/http.js'
import { requireText, requireInt, requireDate, requireUuid, optional } from '../../core/validate.js'
import { toShift } from './mapper.js'

// ============================================================
// Зар / ээлжийн бизнес логик (FR-4)
// ============================================================
// Бүх хандалт хэрэглэгчийн эрхээр явна тул RLS нь хоёр дахь хамгаалалтын
// давхарга болно. Сервер дээрх шалгалт нь алдааны мессежийг ойлгомжтой
// болгож, RLS-ийн "юу ч буцаахгүй" зан үйлээс сайн туршлага өгнө.
// ============================================================

const STATUSES = ['Active', 'Filled', 'Closed']

export async function list(req) {
  const sb = clientFor(req)
  const rows = unwrap(
    await sb.from('shifts').select('*').order('start_at', { ascending: true })
  )
  return rows.map(toShift)
}

export async function getOne(req, id) {
  requireUuid(id, 'Зарын ID')
  const sb = clientFor(req)
  const row = unwrap(await sb.from('shifts').select('*').eq('id', id).maybeSingle())
  if (!row) throw notFound('Ийм зар олдсонгүй.')
  return toShift(row)
}

export async function create(req, body) {
  // employer_id-г ХЭЗЭЭ Ч body-оос авахгүй — эс тэгвээс ажил олгогч
  // өөр хүний нэрээр зар нийтэлж чадна.
  const payload = {
    employer_id: req.user.id,
    title: requireText(body.title, 'Гарчиг', { max: 120 }),
    category: requireText(body.category, 'Ажлын төрөл', { max: 60 }),
    description: requireText(body.description, 'Тайлбар', { max: 4000 }),
    district: requireText(body.district, 'Дүүрэг', { max: 60 }),
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    start_at: requireDate(body.startAt, 'Эхлэх хугацаа'),
    end_at: requireDate(body.endAt, 'Дуусах хугацаа'),
    hourly_wage: requireInt(body.hourlyWage, 'Цагийн цалин', { min: 0, max: 10_000_000 }),
    slots: requireInt(body.slots ?? 1, 'Авах хүний тоо', { min: 1, max: 500 }),
    status: 'Active',
  }

  if (new Date(payload.end_at) <= new Date(payload.start_at)) {
    throw badRequest('Дуусах хугацаа нь эхлэх хугацаанаас хойш байх ёстой.')
  }

  // Захиалга/баталгаажуулалтын шалгалтыг өгөгдлийн сангийн `enforce_shift_quota`
  // триггер хийнэ — тэр нь монголоор ойлгомжтой мессеж шиднэ.
  const sb = asUser(req.accessToken)
  const row = unwrap(
    await sb.from('shifts').insert(payload).select().single(),
    'Зар үүсгэж чадсангүй.'
  )
  return toShift(row)
}

export async function update(req, id, body) {
  requireUuid(id, 'Зарын ID')
  await assertOwner(req, id)

  const payload = {}
  const set = (key, value) => { if (value !== undefined) payload[key] = value }

  set('title', optional(body.title, v => requireText(v, 'Гарчиг', { max: 120 })))
  set('description', optional(body.description, v => requireText(v, 'Тайлбар', { max: 4000 })))
  set('hourly_wage', optional(body.hourlyWage, v => requireInt(v, 'Цагийн цалин', { min: 0, max: 10_000_000 })))
  set('slots', optional(body.slots, v => requireInt(v, 'Авах хүний тоо', { min: 1, max: 500 })))
  set('status', optional(body.status, v => {
    if (!STATUSES.includes(v)) throw badRequest('Зарын төлөв буруу байна.')
    return v
  }))

  if (!Object.keys(payload).length) throw badRequest('Өөрчлөх зүйл алга.')

  const sb = asUser(req.accessToken)
  const row = unwrap(
    await sb.from('shifts').update(payload).eq('id', id).select().single(),
    'Зар шинэчилж чадсангүй.'
  )
  return toShift(row)
}

export async function remove(req, id) {
  requireUuid(id, 'Зарын ID')
  await assertOwner(req, id)

  const sb = asUser(req.accessToken)
  unwrap(await sb.from('shifts').delete().eq('id', id), 'Зар устгаж чадсангүй.')
}

// ------------------------------
// Хадгалсан ажил
// ------------------------------
export async function listSaved(req) {
  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb.from('saved_jobs').select('shift_id').eq('user_id', req.user.id)
  )
  return rows.map(r => r.shift_id)
}

export async function save(req, shiftId) {
  requireUuid(shiftId, 'Зарын ID')
  const sb = asUser(req.accessToken)
  const { error } = await sb.from('saved_jobs').insert({ user_id: req.user.id, shift_id: shiftId })
  // Давхар хадгалахыг алдаа гэж үзэхгүй — үр дүн нь ижил
  if (error && error.code !== '23505') {
    unwrap({ data: null, error }, 'Хадгалж чадсангүй.')
  }
}

export async function unsave(req, shiftId) {
  requireUuid(shiftId, 'Зарын ID')
  const sb = asUser(req.accessToken)
  unwrap(
    await sb.from('saved_jobs').delete().eq('user_id', req.user.id).eq('shift_id', shiftId),
    'Хадгалснаас хасаж чадсангүй.'
  )
}

// ------------------------------
// Туслах
// ------------------------------
/** Зар нь дуудагчийнх мөн эсэх (админ бүгдэд хандана). */
async function assertOwner(req, shiftId) {
  const sb = asUser(req.accessToken)
  const row = unwrap(await sb.from('shifts').select('employer_id').eq('id', shiftId).maybeSingle())
  if (!row) throw notFound('Ийм зар олдсонгүй.')
  if (req.user.role !== 'admin' && row.employer_id !== req.user.id) {
    throw forbidden('Энэ зар танийх биш байна.')
  }
}
