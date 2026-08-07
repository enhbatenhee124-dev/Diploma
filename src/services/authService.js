import {
  supabase, toAuthEmail, normalizePhone, isPhoneEmail,
  SUPABASE_URL, SUPABASE_ANON_KEY,
} from '../lib/supabase'
import { Browser } from '@capacitor/browser'
import { WEB_ORIGIN, isNative, OAUTH_CALLBACK_URL } from '../config/runtime'

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

// ------------------------------
// Нэвтрэлтийн провайдерууд
// ------------------------------
// Supabase нь `/auth/v1/settings` дээр аль провайдер асаалттай байгааг
// НИЙТЭД зарладаг. Үүнийг ашиглан хэрэглэгчийг ажиллахгүй урсгал руу
// оруулахаас сэргийлнэ.
//
// Хариуг кэшлэнэ — товч дарах бүрд сүлжээ рүү явах шаардлагагүй.
let providersCache = null

/**
 * Тухайн провайдер идэвхтэй эсэх.
 *
 * @returns {Promise<boolean|null>} `null` бол ТОДОРХОЙГҮЙ (сүлжээ тасарсан,
 *          хариу буруу). Тэр үед нэвтрэлтийг ЗОГСООХГҮЙ — сүлжээний түр
 *          саатлаас болж ажиллах боломжтой урсгалыг хаах нь буруу.
 */
export async function isProviderEnabled(provider) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  if (!providersCache) {
    providersCache = (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        })
        if (!res.ok) return null
        const json = await res.json()
        return json?.external || null
      } catch {
        return null
      }
    })()
  }

  const external = await providersCache
  if (!external) {
    // Дараагийн оролдлогод дахин асуухын тулд кэшийг цэвэрлэнэ
    providersCache = null
    return null
  }
  return Boolean(external[provider])
}

/**
 * OAuth-аас буцаж ирсэн алдааг URL-аас уншина.
 *
 * Supabase амжилтгүй нэвтрэлтийг `?error=...&error_description=...` эсвэл
 * hash (`#error=...`) хэлбэрээр буцаадаг. Үүнийг барихгүй бол хэрэглэгч
 * нүүр хуудсанд ЧИМЭЭГҮЙ хаягдаж, юу болсноо мэдэхгүй үлдэнэ.
 *
 * @returns {string|null} Монгол тайлбар, эсвэл алдаа байхгүй бол `null`
 */
export function readOAuthError() {
  if (typeof window === 'undefined') return null

  const search = new URLSearchParams(window.location.search)
  // Hash нь `#access_token=...&error=...` хэлбэртэй тул `#`-ийг хасна
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const code = search.get('error') || hash.get('error')
  if (!code) return null

  const description =
    search.get('error_description') || hash.get('error_description') || ''

  // Хаягийг цэвэрлэнэ — хэрэглэгч сэргээхэд алдаа дахин гарахгүй
  const clean = window.location.pathname
  window.history.replaceState({}, '', clean)

  if (/provider is not enabled|Unsupported provider/i.test(description)) {
    return 'Google-ээр нэвтрэх боломж одоогоор идэвхжээгүй байна.'
  }
  if (/access_denied/i.test(code)) {
    return 'Нэвтрэлтийг цуцаллаа.'
  }
  if (/redirect_uri|redirect/i.test(description)) {
    return 'Буцах хаяг зөвшөөрөгдөөгүй байна. Supabase-ийн Redirect URLs тохиргоог шалгана уу.'
  }
  return description.replace(/\+/g, ' ') || 'Нэвтрэлт амжилтгүй боллоо.'
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
    // Хэрэглэгч дүрээ ӨӨРӨӨ сонгосон эсэх. OAuth-аар анх нэвтэрсэн хүнд
    // `false` — тэднээс дүрийг нь асуух ёстой.
    //
    // ⚠ Багана байхгүй хуучин өгөгдлийн санд `undefined` ирнэ. Тэр үед
    //   `true` гэж үзнэ — эс бөгөөс migration ажиллуулаагүй орчинд БҮХ
    //   хэрэглэгч дүр сонгох дэлгэцэнд түгжигдэнэ.
    roleConfirmed: profile.role_confirmed !== false,
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

/**
 * Google-ээр нэвтрэх.
 *
 * ⚠ Supabase Dashboard → Authentication → Providers → Google-г асааж,
 *   Google Cloud Console дээр OAuth client үүсгэсэн байх шаардлагатай.
 *   Тохируулаагүй үед Supabase алдаа буцаах бөгөөд бид түүнийг хэрэглэгчид
 *   ойлгомжтой хэлнэ — чимээгүй юу ч болохгүй байснаас хамаагүй дээр.
 *
 * Вэб дээр браузер Google руу шилжих тул энэ функц буцаж ирэхгүй.
 *
 * Аппын хувьд Google нь WebView доторх нэвтрэлтийг блоклодог (disallowed_useragent)
 * тул системийн браузерыг (Chrome Custom Tab) нээж, `mn.ajil.app://auth-callback`
 * deep link-ээр буцаж ирнэ. Сешнийг `NativeBridge` дуусгана — энд `{ ok: true }`
 * гэдэг нь "браузер нээгдлээ" гэсэн үг, "нэвтэрлээ" гэсэн үг БИШ.
 */
export async function signInWithGoogle() {
  // ⚠ Провайдерыг ӨМНӨ нь шалгах ЁСТОЙ.
  //
  //   `signInWithOAuth` нь вэб дээр провайдерыг ШАЛГАДАГГҮЙ: зүгээр л
  //   `/authorize?provider=google` хаягийг угсраад `window.location.assign`
  //   хийж, ҮРГЭЛЖ `error: null` буцаадаг
  //   (@supabase/auth-js → GoTrueClient `_handleProviderSignIn`).
  //
  //   Тиймээс доорх `if (error)` мөчир вэб дээр ХЭЗЭЭ Ч ажиллахгүй бөгөөд
  //   провайдер идэвхгүй үед хэрэглэгч Supabase-ийн түүхий алдааны хуудсанд
  //   хаягдаж байв. Одоо шилжихээс өмнө асууж, ойлгомжтой хэлнэ.
  const enabled = await isProviderEnabled('google')
  if (enabled === false) {
    return {
      ok: false,
      error: 'Google-ээр нэвтрэх боломж одоогоор идэвхжээгүй байна. '
        + 'Утас эсвэл и-мэйлээрээ нэвтэрнэ үү.',
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: isNative
      ? { redirectTo: OAUTH_CALLBACK_URL, skipBrowserRedirect: true }
      // `/` БИШ: нүүр хуудас нэвтэрсэн эсэхийг мэддэггүй тул "Нэвтрэх"
      // товч хэвээр харагдаж, хэрэглэгч нэвтэрсэн атлаа нэвтрээгүй мэт
      // бодон дахин дарж төгсгөлгүй давтдаг байв.
      : { redirectTo: `${WEB_ORIGIN}/auth/callback` },
  })

  if (!error && isNative) {
    if (!data?.url) {
      return { ok: false, error: 'Нэвтрэх хуудсыг нээж чадсангүй. Дахин оролдоно уу.' }
    }
    await Browser.open({ url: data.url, presentationStyle: 'popover' })
    return { ok: true }
  }

  if (error) {
    if (/provider is not enabled|Unsupported provider/i.test(error.message)) {
      return { ok: false, error: 'Google-ээр нэвтрэх боломж одоогоор идэвхжээгүй байна. Утас эсвэл и-мэйлээрээ нэвтэрнэ үү.' }
    }
    return { ok: false, error: translateError(error) }
  }
  return { ok: true }
}

/**
 * Дүрийг НЭГ УДАА сонгож баталгаажуулна.
 *
 * ⚠ Энэ нь энгийн `update` БИШ, RPC байх ёстой: `profiles_update_own` дүрэм
 *   нь `role = current_role_of()` гэж шаарддаг тул клиентээс дүр солих
 *   оролдлого бүр няцаагдана. Серверийн `confirm_role` функц нь дотроо
 *   админ дүр сонгохыг хориглож, зөвхөн нэг удаа ажиллана.
 *
 * @param {'employee'|'employer'} role
 */
export async function confirmRole(role) {
  const { data, error } = await supabase.rpc('confirm_role', { p_role: role })

  if (error) {
    if (/аль хэдийн сонгогдсон/i.test(error.message)) {
      return { ok: false, error: 'Дүр аль хэдийн сонгогдсон байна.' }
    }
    if (/Could not find the function|does not exist/i.test(error.message)) {
      return {
        ok: false,
        error: 'Дүр сонгох боломж серверт бэлэн болоогүй байна. Migration-оо ажиллуулна уу.',
      }
    }
    return { ok: false, error: translateError(error) }
  }

  return { ok: true, data: toUser(data) }
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
    redirectTo: `${WEB_ORIGIN}/reset-password`,
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
