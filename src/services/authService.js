import { supabase, toAuthEmail, normalizePhone, isPhoneEmail } from '../lib/supabase'

// ============================================================
// Supabase Auth дээр суурилсан нэвтрэлтийн үйлчилгээ
// ============================================================
// Бүх функц `{ ok, data?, error? }` хэлбэрээр буцаана — throw хийхгүй.
// Ингэснээр дуудаж буй компонент бүр try/catch бичих шаардлагагүй.
// ============================================================

/** Supabase-ийн алдааг монгол хэлээр ойлгомжтой болгоно. */
function translateError(error) {
  const msg = String(error?.message || '')

  if (/Invalid login credentials/i.test(msg)) {
    return 'Нэвтрэх мэдээлэл эсвэл нууц үг буруу байна.'
  }
  if (/Email not confirmed/i.test(msg)) {
    return 'И-мэйл хаягаа баталгаажуулна уу. Ирсэн захиаг шалгаарай.'
  }
  if (/User already registered|already been registered/i.test(msg)) {
    return 'Энэ хаяг аль хэдийн бүртгэлтэй байна.'
  }
  if (/Password should be at least/i.test(msg)) {
    return 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.'
  }
  if (/rate limit|too many/i.test(msg)) {
    return 'Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.'
  }
  if (/Failed to fetch|NetworkError/i.test(msg)) {
    return 'Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгана уу.'
  }
  return msg || 'Тодорхойгүй алдаа гарлаа.'
}

/** profiles хүснэгтийн мөрийг frontend-ийн хэлбэрт хөрвүүлнэ. */
function toUser(profile) {
  if (!profile) return null
  return {
    id: profile.id,
    role: profile.role,
    name: profile.name,
    // Утаснаас үүсгэсэн хиймэл и-мэйлийг хэрэглэгчид харуулахгүй
    email: isPhoneEmail(profile.email) ? '' : profile.email,
    phone: profile.phone || '',
    avatarUrl: profile.avatar_url,
    district: profile.district,
    bio: profile.bio || '',
    birthDate: profile.birth_date,
  }
}

/** Нэвтэрсэн хэрэглэгчийн профайлыг татна. */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return { ok: false, error: translateError(error) }
  return { ok: true, data: toUser(data) }
}

/**
 * Нэвтрэх.
 * @param {string} identifier утасны дугаар эсвэл и-мэйл
 * @param {string} password
 * @param {'phone'|'email'} method
 */
export async function signIn(identifier, password, method = 'phone') {
  const raw = String(identifier || '').trim()

  // Supabase-д нэг бүртгэл НЭГ л auth и-мэйлтэй. Хэрэглэгч утсаараа ч,
  // и-мэйлээрээ ч нэвтэрч чадах ёстой тул өгөгдлийн сангийн функцээр
  // оруулсан утгыг auth и-мэйл рүү хөрвүүлнэ.
  let email
  const { data: resolved, error: lookupError } = await supabase.rpc('auth_email_for', {
    p_identifier: raw,
  })

  if (lookupError || !resolved) {
    // Функц ажиллахгүй бол хуучин дүрмээр үргэлжлүүлнэ — нэвтрэлт бүрэн
    // тасрахаас сэргийлнэ
    email = toAuthEmail(raw, method)
  } else {
    email = resolved
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: translateError(error) }

  const profile = await fetchProfile(data.user.id)
  if (!profile.ok) return profile

  return { ok: true, data: profile.data }
}

/**
 * Бүртгүүлэх.
 * `name`, `role`, `phone` нь raw_user_meta_data-д очиж, өгөгдлийн сангийн
 * `handle_new_user` триггер профайлыг автоматаар үүсгэнэ.
 */
export async function signUp({ name, phone, email, password, role }) {
  const method = email ? 'email' : 'phone'
  const authEmail = toAuthEmail(email || phone, method)

  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password,
    options: {
      data: {
        name,
        role,
        phone: normalizePhone(phone),
      },
    },
  })

  if (error) return { ok: false, error: translateError(error) }

  // И-мэйл баталгаажуулалт асаалттай үед session шууд үүсэхгүй
  if (!data.session) {
    return {
      ok: true,
      data: null,
      needsConfirmation: true,
      message: 'Бүртгэл үүслээ. И-мэйл хаягаа баталгаажуулна уу.',
    }
  }

  const profile = await fetchProfile(data.user.id)
  if (!profile.ok) return profile

  return { ok: true, data: profile.data }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) return { ok: false, error: translateError(error) }
  return { ok: true }
}

/** Одоогийн сешн байвал профайлыг нь буцаана. */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { ok: true, data: null }
  return fetchProfile(session.user.id)
}

/** Профайл шинэчлэх. Дүр (`role`)-ийг өөрчлөхийг RLS зөвшөөрөхгүй. */
export async function updateProfile(userId, updates) {
  const payload = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.phone !== undefined) payload.phone = normalizePhone(updates.phone) || null
  if (updates.email !== undefined) payload.email = updates.email || null
  if (updates.district !== undefined) payload.district = updates.district
  if (updates.bio !== undefined) payload.bio = updates.bio
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single()

  if (error) return { ok: false, error: translateError(error) }
  return { ok: true, data: toUser(data) }
}

/** Нууц үг сэргээх захиа илгээх (зөвхөн жинхэнэ и-мэйлтэй хэрэглэгчид). */
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) return { ok: false, error: translateError(error) }
  return { ok: true }
}

/** Auth төлөв өөрчлөгдөхөд дуудагдана. Цонх хооронд ч синк болно. */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => data.subscription.unsubscribe()
}
