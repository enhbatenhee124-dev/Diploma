import { createClient } from '@supabase/supabase-js'

// ============================================================
// Браузерын талын Supabase холболт
// ============================================================
// anon key нь НИЙТИЙН зориулалттай — bundle дотор ил гарах нь хэвийн.
// Өгөгдлийг RLS (Row Level Security) дүрмүүд хамгаална, түлхүүр биш.
// ============================================================

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL эсвэл VITE_SUPABASE_ANON_KEY тохируулаагүй байна.\n' +
    '           .env файлаа шалгаад dev серверээ ДАХИН АСААНА УУ ' +
    '(Vite нь орчны хувьсагчийг зөвхөн эхлэхдээ уншдаг).'
  )
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'anon-key-missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ------------------------------
// Утас ↔ и-мэйл хөрвүүлэг
// ------------------------------
// Supabase-ийн утсаар нэвтрэх боломж нь SMS үйлчилгээ (Twilio гэх мэт) шаарддаг
// бөгөөд төлбөртэй. Тиймээс утасны дугаарыг дотооддоо тогтмол и-мэйл хэлбэрт
// буулгаж, нууц үгтэй нэвтрэлтийг ашиглана.
//
// ⚠ Хязгаарлалт: энэ арга нь утас ЭЗЭМШИЖ БУЙГ баталгаажуулахгүй. Нууц үг
//   сэргээхийг и-мэйлээр л хийнэ. Хэрэв SMS баталгаажуулалт шаардлагатай бол
//   Supabase Auth → Phone provider-ыг асааж, энэ хөрвүүлгийг устгана.
const PHONE_DOMAIN = 'phone.mongolajil.mn'

/** Утасны дугаарыг цэвэрлэнэ (зөвхөн цифр). */
export const normalizePhone = phone => String(phone || '').replace(/\D/g, '')

/** Утасны дугаарыг Supabase-д ойлгогдох и-мэйл болгоно. */
const phoneToEmail = phone => `${normalizePhone(phone)}@${PHONE_DOMAIN}`

/** Тухайн и-мэйл нь утаснаас үүссэн эсэх. */
export const isPhoneEmail = email => String(email || '').endsWith(`@${PHONE_DOMAIN}`)

/** Нэвтрэх мэдээллийг Supabase-ийн и-мэйл болгож хөрвүүлнэ. */
export function toAuthEmail(identifier, method) {
  const value = String(identifier || '').trim()
  return method === 'email' ? value.toLowerCase() : phoneToEmail(value)
}
