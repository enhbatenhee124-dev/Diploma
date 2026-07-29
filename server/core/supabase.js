import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '../config.js'

// ============================================================
// Өгөгдлийн сангийн холболтууд
// ============================================================
// Modular monolith нь Postgres руу ГУРВАН өөр эрхээр ханддаг. Аль нэгийг нь
// сонгох нь аюулгүй байдлын шийдвэр тул модуль бүр ухамсартай сонгох ёстой.
//
//   anon()          — нэвтрээгүй зочин. RLS-ийн `anon` дүрмүүд хүчинтэй.
//   asUser(token)   — нэвтэрсэн хэрэглэгч. RLS хүчинтэй бөгөөд өгөгдлийн
//                     сангийн `auth.uid()` ЗӨВ утгатай болно. Энэ нь чухал:
//                     `open_chat`, `request_invoice`, `invite_worker` зэрэг
//                     security definer функцууд дуудагчийг `auth.uid()`-ээр
//                     таньдаг. Тэднийг `admin`-аар дуудвал auth.uid() нь NULL
//                     болж алдаа өгнө.
//   admin           — service_role. RLS-ийг БҮРЭН ТОЙРНО.
//
// ⚠ Анхдагч сонголт нь ҮРГЭЛЖ `asUser` байх ёстой. `admin`-ыг зөвхөн
//   хэрэглэгчийн нэрийн өмнөөс хийж БОЛОХГҮЙ үйлдэлд хэрэглэнэ — жишээ нь
//   QPay-ийн webhook (нэвтрэлтгүй ирдэг) эсвэл төлбөр баталгаажуулах.
// ============================================================

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
}

/** service_role — RLS тойрно. Хэзээ ч frontend руу гаргахгүй. */
export const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, clientOptions)

/** Нэвтрээгүй зочны клиент. */
export const anon = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions)

/**
 * Хэрэглэгчийн токеноор ажиллах клиент.
 * RLS болон `auth.uid()` хүчинтэй байна.
 */
export function asUser(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

/**
 * Хүсэлтэд тохирох клиентийг сонгоно.
 * Нэвтэрсэн бол хэрэглэгчийн эрхээр, үгүй бол зочны эрхээр.
 */
export const clientFor = req => (req.accessToken ? asUser(req.accessToken) : anon())
