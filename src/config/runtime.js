import { Capacitor } from '@capacitor/core'

// ============================================================
// Ажиллах орчны тохиргоо — вэб vs. Android апп
// ============================================================
// Capacitor апп доторх хуудсын origin нь `https://localhost` (файлын
// системээс ачаалагддаг). Тиймээс вэб дээр ажилладаг ХАРЬЦАНГУЙ зам болон
// `window.location.origin`-д тулгуурласан логик апп дотор ажиллахгүй:
//
//   • `/api/...`  → https://localhost/api/... руу очиж унана
//   • и-мэйлээр илгээх `${origin}/reset-password` линк нь утасны браузерт
//     нээгдэхэд `https://localhost` — хоосон хуудас
//
// Тиймээс native үед хоёуланг нь БҮТЭН хаягаар солино.
// ============================================================

/** Android/iOS бүрхүүл дотор ажиллаж байгаа эсэх. */
export const isNative = Capacitor.isNativePlatform()

const trimSlash = value => String(value || '').trim().replace(/\/$/, '')

/**
 * Нийтийн вэб хаяг. Апп доторх и-мэйлийн линкүүд энэ рүү заана —
 * хэрэглэгч утасныхаа браузерт нээж баталгаажуулаад апп руугаа буцна.
 */
export const PUBLIC_WEB_URL =
  trimSlash(import.meta.env.VITE_PUBLIC_WEB_URL) || 'https://ajil-iota.vercel.app'

/**
 * API-ийн үндсэн хаяг.
 * Вэб дээр `/api` (нэг домэйн эсвэл Vite proxy) хэвээр — юу ч өөрчлөгдөхгүй.
 * Апп дотор заавал бүтэн хаяг: VITE_NATIVE_API_URL → абсолют VITE_API_URL →
 * нийтийн вэб хаягийн `/api`.
 */
export const API_BASE = (() => {
  const configured = trimSlash(import.meta.env.VITE_API_URL)

  if (!isNative) return configured || '/api'

  const native = trimSlash(import.meta.env.VITE_NATIVE_API_URL)
  if (native) return native
  if (/^https?:\/\//i.test(configured)) return configured
  return `${PUBLIC_WEB_URL}/api`
})()

/**
 * Гадагш өгөх линк угсрахад хэрэглэх origin — и-мэйлийн баталгаажуулалт,
 * нууц үг сэргээх, OAuth буцах хаяг, ажлыг хуваалцах холбоос.
 *
 * Вэб дээр одоогийн домэйн (preview deploy, өөрийн домэйн автоматаар зөв).
 * Апп дотор `https://localhost` БИШ, жинхэнэ вэб хаяг байх ЁСТОЙ.
 */
export const WEB_ORIGIN = isNative ? PUBLIC_WEB_URL : window.location.origin

/**
 * Аппын өөрийн URL scheme. Android дээр `AndroidManifest.xml`-ийн
 * intent-filter-тэй ЯГ таарах ёстой, мөн Supabase → Authentication →
 * URL Configuration → Redirect URLs-д нэмэгдсэн байх шаардлагатай.
 */
export const APP_SCHEME = 'mn.ajil.app'

/** Гадна браузерт нэвтэрсний дараа апп руу буцах хаяг. */
export const OAUTH_CALLBACK_URL = `${APP_SCHEME}://auth-callback`
