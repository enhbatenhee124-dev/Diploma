import { admin } from './supabase.js'
import { asyncHandler, unauthorized, forbidden } from './http.js'

// ============================================================
// Нэвтрэлт шалгах middleware
// ============================================================
// Токеныг Supabase Auth үүсгэдэг, сервер зөвхөн БАТАЛГААЖУУЛНА.
//
// Чухал: дүрийг (`role`) токеноос БУС, өгөгдлийн сангаас уншина. Хэрэглэгч
// өөрийн user_metadata-г засах боломжтой тул токен доторх дүрд итгэвэл хэн
// ч өөрийгөө админ болгож чадна.
// ============================================================

const PROFILE_FIELDS = 'id, role, name, phone, email, avatar_url, district, bio, birth_date, deactivated_at'

function bearer(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

/** Токеныг шалгаад профайлыг буцаана. Буруу бол null. */
async function resolveUser(token) {
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) return null

  const { data: profile } = await admin
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', data.user.id)
    .single()

  return profile || null
}

/** Нэвтрэлт ЗААВАЛ шаардана. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = bearer(req)
  if (!token) throw unauthorized()

  const profile = await resolveUser(token)
  if (!profile) throw unauthorized('Токен хүчингүй эсвэл хугацаа нь дууссан байна.')

  // Админ идэвхгүй болгосон хэрэглэгч цааш явахгүй
  if (profile.deactivated_at) {
    throw forbidden('Таны бүртгэл түр хаагдсан байна. Админтай холбогдоно уу.')
  }

  req.user = profile
  req.accessToken = token
  next()
})

/** Токен байвал шалгана, байхгүй бол зочноор үргэлжлүүлнэ. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = bearer(req)
  if (!token) return next()

  const profile = await resolveUser(token)
  if (profile && !profile.deactivated_at) {
    req.user = profile
    req.accessToken = token
  }
  next()
})

/** Тодорхой дүр шаардана. requireAuth-ийн ДАРАА ашиглана. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized())
    if (!roles.includes(req.user.role)) return next(forbidden())
    next()
  }
}
