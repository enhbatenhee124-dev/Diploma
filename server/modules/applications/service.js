import { asUser, clientFor } from '../../core/supabase.js'
import { unwrap, notFound, forbidden, conflict, badRequest } from '../../core/http.js'
import { requireUuid, requireOneOf } from '../../core/validate.js'
import { toApplication } from './mapper.js'

// ============================================================
// Хүсэлтийн урсгал (FR-6)
// ============================================================
//   applied → approved → in-progress → completed
//                     ↘ cancelled
//
// Хэн ямар шилжилт хийж болохыг ЭНД шийднэ. RLS нь "мөрийг харж/засаж
// чадах уу" гэдгийг л шалгадаг бөгөөд урсгалын дарааллыг мэдэхгүй.
// ============================================================

export const STATUSES = ['applied', 'approved', 'in-progress', 'completed', 'cancelled']

/** Тухайн дүр аль төлвөөс аль төлөв рүү шилжүүлж болох вэ. */
export const TRANSITIONS = {
  employer: {
    applied: ['approved', 'cancelled'],
    approved: ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
  },
  employee: {
    applied: ['cancelled'],
    approved: ['cancelled'],
    'in-progress': ['completed'],
  },
  admin: {
    applied: STATUSES,
    approved: STATUSES,
    'in-progress': STATUSES,
    completed: STATUSES,
    cancelled: STATUSES,
  },
}

/**
 * Тухайн дүр энэ шилжилтийг хийж болох уу.
 * Өгөгдлийн сангаас хамааралгүй цэвэр функц тул тусад нь тестлэгдэнэ.
 */
export const canTransition = (role, from, to) =>
  (TRANSITIONS[role]?.[from] || []).includes(to)

export async function list(req) {
  // RLS нь ажилтанд ӨӨРИЙН, ажил олгогчид ӨӨРИЙН зарын хүсэлтийг л харуулна
  const sb = clientFor(req)
  const rows = unwrap(
    await sb.from('applications').select('*').order('applied_at', { ascending: false })
  )
  return rows.map(toApplication)
}

/** Ажилтан ажилд хүсэлт илгээнэ (FR-6.1). */
export async function apply(req, shiftId) {
  requireUuid(shiftId, 'Зарын ID')

  const sb = asUser(req.accessToken)

  // worker_id-г токеноос авна — өөр хүний нэрээр хүсэлт илгээх боломжгүй
  const { data, error } = await sb
    .from('applications')
    .insert({ shift_id: shiftId, worker_id: req.user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw conflict('Та энэ ажилд аль хэдийн хүсэлт илгээсэн байна.')
    // Түвшний триггерийн мессежийг (жишээ нь "Lv.3 шаардлагатай") шууд дамжуулна
    if (/Lv\./.test(error.message)) throw badRequest(error.message)
    unwrap({ data: null, error }, 'Хүсэлт илгээж чадсангүй.')
  }

  return toApplication(data)
}

/** Ажилтан өөрийн хүсэлтээ буцаан татах. */
export async function withdraw(req, id) {
  requireUuid(id, 'Хүсэлтийн ID')

  const app = await load(req, id)
  if (app.worker_id !== req.user.id && req.user.role !== 'admin') {
    throw forbidden('Энэ хүсэлт танийх биш байна.')
  }
  // Ажил эхэлсэн бол устгахгүй — түүх үлдэх ёстой (FR-6.5 no-show хамгаалалт)
  if (!['applied', 'approved'].includes(app.status)) {
    throw badRequest('Эхэлсэн эсвэл дууссан ажлыг буцаан татах боломжгүй. Цуцлах товчийг ашиглана уу.')
  }

  const sb = asUser(req.accessToken)
  unwrap(await sb.from('applications').delete().eq('id', id), 'Хүсэлт цуцалж чадсангүй.')
}

/** Төлөв өөрчлөх (Accept / Reject / Дуусгах / Цуцлах). */
export async function setStatus(req, id, status, cancelReason) {
  requireUuid(id, 'Хүсэлтийн ID')
  requireOneOf(status, STATUSES, 'Төлөв')

  const app = await load(req, id)
  const role = await roleInApplication(req, app)

  if (!canTransition(role, app.status, status)) {
    throw badRequest(`"${app.status}" төлвөөс "${status}" рүү шилжүүлэх боломжгүй.`)
  }

  const payload = { status }
  if (status !== 'applied') payload.decided_at = new Date().toISOString()
  if (status === 'cancelled') {
    payload.cancelled_by = req.user.id
    if (cancelReason) payload.cancel_reason = String(cancelReason).slice(0, 500)
  }

  const sb = asUser(req.accessToken)
  const row = unwrap(
    await sb.from('applications').update(payload).eq('id', id).select().single(),
    'Төлөв өөрчилж чадсангүй.'
  )
  return toApplication(row)
}

/**
 * Ажил олгогч ажилтныг шууд урих (FR-13).
 * RLS нь ажилтан ӨӨРИЙН нэрээр л хүсэлт үүсгэхийг зөвшөөрдөг тул үүнийг
 * өгөгдлийн сангийн `invite_worker` функцээр хийнэ — тэр нь зар үнэхээр
 * дуудагчийнх мөн эсэхийг `auth.uid()`-ээр шалгана.
 */
export async function invite(req, shiftId, workerId) {
  requireUuid(shiftId, 'Зарын ID')
  requireUuid(workerId, 'Ажилтны ID')

  const sb = asUser(req.accessToken)
  const data = unwrap(
    await sb.rpc('invite_worker', { p_shift: shiftId, p_worker: workerId }),
    'Урилга илгээж чадсангүй.'
  )
  return toApplication(Array.isArray(data) ? data[0] : data)
}

// ------------------------------
// Туслахууд
// ------------------------------
async function load(req, id) {
  const sb = asUser(req.accessToken)
  const row = unwrap(
    await sb.from('applications').select('*, shifts(employer_id)').eq('id', id).maybeSingle()
  )
  if (!row) throw notFound('Ийм хүсэлт олдсонгүй.')
  return row
}

/** Дуудагч энэ хүсэлтэд ямар талд байгаа вэ. */
async function roleInApplication(req, app) {
  if (req.user.role === 'admin') return 'admin'
  if (app.worker_id === req.user.id) return 'employee'
  if (app.shifts?.employer_id === req.user.id) return 'employer'
  throw forbidden('Энэ хүсэлт тантай холбоогүй байна.')
}
