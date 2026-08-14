import { supabase } from './supabase'
import { API_BASE } from '../config/runtime'

// ============================================================
// API клиент — frontend ↔ modular monolith
// ============================================================
// Хөгжүүлэлтэд Vite нь `/api`-г http://localhost:3001 рүү дамжуулна
// (vite.config.js). Продакшнд `VITE_API_URL`-ээр серверийн хаягийг заана.
// Android апп дотор харьцангуй зам ажиллахгүй тул `config/runtime.js` нь
// бүтэн хаяг руу шилжүүлнэ.
//
// Бүх функц `{ ok, data?, error? }` буцаана — throw хийхгүй. Ингэснээр
// дуудаж буй компонент бүр try/catch бичих шаардлагагүй.
// ============================================================

const BASE = API_BASE

/**
 * Одоогийн сешний токеныг авна.
 * Supabase нь хугацаа нь дуусах гэж буй токеныг автоматаар шинэчилдэг тул
 * хүсэлт бүрд `getSession()` дуудаж, шинэ токеныг авна.
 */
async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const UNREACHABLE = 'Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.'

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(await authHeader()),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    // Сүлжээ тасарсан, эсвэл хүсэлт огт гарч чадаагүй
    return { ok: false, error: UNREACHABLE }
  }

  // 204 эсвэл хоосон биет
  const text = await res.text()
  let payload = {}
  let parsed = true
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      parsed = false
    }
  }

  // ⚠ API сервер асаагүй үед дээрх `catch` ХЭЗЭЭ Ч ажиллахгүй: хүсэлтийг
  //   завсрын давхарга барьж аваад бүрэн хүчинтэй HTTP хариу буцаадаг.
  //   Хөгжүүлэлтэд Vite proxy нь ХООСОН БИЕТТЭЙ 500, продакшнд gateway нь
  //   HTML-тэй 502/504 өгнө. Урьд нь энэ нь хэрэглэгчид «Алдаа гарлаа
  //   (500).» гэж харагдаж, юу эвдэрснийг огт хэлдэггүй байв.
  //
  //   Серверийн ӨӨРИЙН алдаа ҮРГЭЛЖ `{ error }` JSON буцаадаг
  //   (`server/core/http.js` → `errorHandler`). Тиймээс «JSON биш, эсвэл
  //   `error` талбаргүй 5xx» гэдэг нь хүсэлт сервер хүртэл ОГТ хүрээгүй
  //   гэсэн найдвартай шинж — жинхэнэ 500-г далдлахгүй.
  if (res.status >= 500 && (!parsed || payload?.error === undefined)) {
    if (import.meta.env.DEV) {
      console.warn(
        `[api] ${method} ${path} → ${res.status} биет хоосон. API сервер ажиллаж байна уу?`
        + ' `npm run dev` нь Express-ийг 3001 дээр зэрэг асаах ёстой.'
      )
    }
    return { ok: false, error: UNREACHABLE, status: res.status }
  }

  if (!parsed) {
    return { ok: false, error: 'Серверээс буруу хариу ирлээ.' }
  }

  if (!res.ok) {
    // Токен хүчингүй болсон бол хэрэглэгчийг гаргана — эс тэгвээс апп
    // "Нэвтрэх шаардлагатай" гэсэн алдааг тасралтгүй давтана.
    if (res.status === 401) {
      supabase.auth.signOut().catch(() => {})
    }
    return { ok: false, error: payload.error || `Алдаа гарлаа (${res.status}).`, status: res.status }
  }

  return { ok: true, data: payload.data }
}

export const apiGet = path => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body ?? {})
export const apiPatch = (path, body) => request('PATCH', path, body ?? {})
export const apiPut = (path, body) => request('PUT', path, body ?? {})
export const apiDelete = path => request('DELETE', path)

/** Query string-ийг аюулгүй угсарна. */
export const qs = params => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  )
  const str = search.toString()
  return str ? `?${str}` : ''
}
