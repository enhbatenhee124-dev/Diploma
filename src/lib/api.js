import { supabase } from './supabase'

// ============================================================
// API клиент — frontend ↔ modular monolith
// ============================================================
// Хөгжүүлэлтэд Vite нь `/api`-г http://localhost:3001 рүү дамжуулна
// (vite.config.js). Продакшнд `VITE_API_URL`-ээр серверийн хаягийг заана.
//
// Бүх функц `{ ok, data?, error? }` буцаана — throw хийхгүй. Ингэснээр
// дуудаж буй компонент бүр try/catch бичих шаардлагагүй.
// ============================================================

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

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
    // Сүлжээ тасарсан, эсвэл сервер асаагүй
    return { ok: false, error: 'Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгана уу.' }
  }

  // 204 эсвэл хоосон биет
  const text = await res.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
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
