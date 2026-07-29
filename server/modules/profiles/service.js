import { asUser, clientFor } from '../../core/supabase.js'
import { unwrap, badRequest } from '../../core/http.js'
import { requireUuid, requireText } from '../../core/validate.js'

// ============================================================
// Профайл (FR-2, FR-3, NFR-3)
// ============================================================
// Хувийн мэдээллийн хил:
//   • `public_profiles` view — утас/и-мэйл ОРОХГҮЙ. Хэн ч уншина.
//   • `contact_info(uuid)` функц — зөвхөн өөрөө, админ, эсвэл зөвшөөрөгдсөн
//     ажлын нөгөө тал авна (NFR-3).
//   • `profiles` хүснэгт бүтнээрээ — зөвхөн админ (RLS).
// ============================================================

const toProfile = r => r && ({
  id: r.id,
  role: r.role,
  name: r.name,
  email: r.email,
  phone: r.phone,
  avatarUrl: r.avatar_url,
  district: r.district,
  bio: r.bio,
  deactivatedAt: r.deactivated_at,
})

/** Нийтэд харагдах профайлууд — холбоо барих мэдээлэлгүй. */
export async function listPublic(req) {
  const sb = clientFor(req)
  const rows = unwrap(await sb.from('public_profiles').select('*').order('created_at'))
  return rows.map(toProfile)
}

/** Бүрэн жагсаалт. RLS нь админаас бусдад хоосон буцаана. */
export async function listWithContact(req) {
  const sb = asUser(req.accessToken)
  const rows = unwrap(await sb.from('profiles').select('*').order('created_at'))
  return rows.map(toProfile)
}

/** Нэг хэрэглэгчийн утас/и-мэйл — эрхтэй үед л утга буцна. */
export async function contactInfo(req, userId) {
  requireUuid(userId, 'Хэрэглэгчийн ID')
  const sb = asUser(req.accessToken)
  const data = unwrap(await sb.rpc('contact_info', { p_user: userId }))
  const row = Array.isArray(data) ? data[0] : data
  return row ? { phone: row.phone, email: row.email } : null
}

// ------------------------------
// Ажилтны ур чадвар ба боломжит цаг (FR-2.2, FR-2.3)
// ------------------------------
const toWorkerProfile = r => ({
  userId: r.user_id,
  skills: r.skills || [],
  availability: r.availability || {},
})

export async function getWorker(req, userId) {
  requireUuid(userId, 'Хэрэглэгчийн ID')
  const sb = clientFor(req)
  const row = unwrap(
    await sb.from('worker_profiles').select('*').eq('user_id', userId).maybeSingle()
  )
  return row ? toWorkerProfile(row) : { userId, skills: [], availability: {} }
}

export async function listWorkers(req) {
  const sb = clientFor(req)
  const rows = unwrap(await sb.from('worker_profiles').select('*'))
  return rows.map(toWorkerProfile)
}

export async function saveWorker(req, body) {
  const payload = { user_id: req.user.id }

  if (body?.skills !== undefined) {
    if (!Array.isArray(body.skills)) throw badRequest('Ур чадвар жагсаалт байх ёстой.')
    if (body.skills.length > 30) throw badRequest('Ур чадвар хэт олон байна (дээд тал нь 30).')
    payload.skills = body.skills.map(s => requireText(s, 'Ур чадвар', { max: 60 }))
  }

  if (body?.availability !== undefined) {
    if (typeof body.availability !== 'object' || body.availability === null) {
      throw badRequest('Боломжит цагийн хуваарь буруу байна.')
    }
    payload.availability = body.availability
  }

  if (Object.keys(payload).length === 1) throw badRequest('Хадгалах зүйл алга.')

  const sb = asUser(req.accessToken)
  unwrap(
    await sb.from('worker_profiles').upsert(payload, { onConflict: 'user_id' }),
    'Хадгалж чадсангүй.'
  )
}

// ------------------------------
// Ажил олгогчийн профайл (FR-3.1)
// ------------------------------
export async function listEmployers(req) {
  const sb = clientFor(req)
  const rows = unwrap(await sb.from('employer_profiles').select('*'))
  return rows.map(r => ({
    userId: r.user_id,
    orgName: r.org_name,
    logoUrl: r.logo_url,
    regNumber: r.reg_number,
    address: r.address,
    isVerified: r.is_verified,
  }))
}

// ------------------------------
// Профайлын гоёолт (gamification-ийн шагнал)
// ------------------------------
const COSMETIC_FIELDS = {
  themeId: 'theme_id',
  frameId: 'frame_id',
  bannerId: 'banner_id',
  titleId: 'title_id',
  accentId: 'accent_id',
}

export async function getCosmetics(req, userId) {
  requireUuid(userId, 'Хэрэглэгчийн ID')
  const sb = clientFor(req)
  const row = unwrap(
    await sb.from('cosmetics').select('*').eq('user_id', userId).maybeSingle()
  )
  if (!row) return {}
  return Object.fromEntries(
    Object.entries(COSMETIC_FIELDS).map(([camel, snake]) => [camel, row[snake]])
  )
}

export async function saveCosmetics(req, body) {
  const payload = { user_id: req.user.id }
  for (const [camel, snake] of Object.entries(COSMETIC_FIELDS)) {
    if (body?.[camel] !== undefined) {
      payload[snake] = body[camel] === null ? null : String(body[camel]).slice(0, 60)
    }
  }

  if (Object.keys(payload).length === 1) throw badRequest('Хадгалах зүйл алга.')

  const sb = asUser(req.accessToken)
  unwrap(
    await sb.from('cosmetics').upsert(payload, { onConflict: 'user_id' }),
    'Тохиргоо хадгалж чадсангүй.'
  )
}
