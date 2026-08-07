import { createClient } from '@supabase/supabase-js'
import { isNative } from '../config/runtime'

// ============================================================
// Браузерын талын Supabase холболт
// ============================================================
// anon key нь НИЙТИЙН зориулалттай — bundle дотор ил гарах нь хэвийн.
// Өгөгдлийг RLS (Row Level Security) дүрмүүд хамгаална, түлхүүр биш.
// ============================================================

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Нэвтрэлтийн тохиргоог шууд асуухад хэрэгтэй (`/auth/v1/settings`).
// anon key нь дээр тайлбарласны дагуу нийтийн зориулалттай.
export const SUPABASE_URL = url
export const SUPABASE_ANON_KEY = anonKey

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL эсвэл VITE_SUPABASE_ANON_KEY тохируулаагүй байна.\n' +
    '           .env файлаа шалгаад dev серверээ ДАХИН АСААНА УУ ' +
    '(Vite нь орчны хувьсагчийг зөвхөн эхлэхдээ уншдаг).'
  )
}

// ------------------------------
// Вэб vs. Android аппын ялгаа
// ------------------------------
// Вэб дээр OAuth-ийн хариу нь ижил цонхны URL-д ирдэг тул `detectSessionInUrl`
// автоматаар барьж авна (implicit flow).
//
// Апп дотор нэвтрэлт нь ГАДНА браузерт (Custom Tab) явагдаж, `mn.ajil.app://`
// deep link-ээр буцаж ирнэ. Аппын өөрийн URL нь хэзээ ч токен агуулахгүй тул
// `detectSessionInUrl`-ийг унтраана. Оронд нь PKCE ашиглаж, буцаж ирсэн
// `code`-ыг `NativeBridge` гараар солино — токен URL-д ил гарахгүй тул
// гадаад браузераар дамжуулахад илүү аюулгүй.
export const supabase = createClient(url || 'http://localhost', anonKey || 'anon-key-missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative,
    flowType: isNative ? 'pkce' : 'implicit',
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
