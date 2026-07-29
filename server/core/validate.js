import { badRequest } from './http.js'

// ============================================================
// Оролтын шалгалт
// ============================================================
// Frontend дээрх шалгалт нь ЗӨВХӨН тав тухын төлөө. Хэн ч API руу шууд
// хүсэлт явуулж чадах тул бодит шалгалт энд болно.
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = v => typeof v === 'string' && UUID_RE.test(v)

/** UUID биш бол 400 шиднэ. Route параметрт хэрэглэнэ. */
export function requireUuid(value, label = 'ID') {
  if (!isUuid(value)) throw badRequest(`${label} буруу байна.`)
  return value
}

/** Хоосон биш мөр шаардана. */
export function requireText(value, label, { max = 500, min = 1 } = {}) {
  const text = String(value ?? '').trim()
  if (text.length < min) throw badRequest(`${label} заавал шаардлагатай.`)
  if (text.length > max) throw badRequest(`${label} хэт урт байна (дээд тал нь ${max} тэмдэгт).`)
  return text
}

/** Заасан жагсаалтад буй утга эсэхийг шалгана. */
export function requireOneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw badRequest(`${label} утга буруу байна.`)
  }
  return value
}

/** Бүхэл тоо, заасан хязгаарт. */
export function requireInt(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value)
  if (!Number.isInteger(n)) throw badRequest(`${label} бүхэл тоо байх ёстой.`)
  if (n < min || n > max) throw badRequest(`${label} ${min}-${max} хооронд байх ёстой.`)
  return n
}

/** ISO огноо. */
export function requireDate(value, label) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw badRequest(`${label} огноо буруу байна.`)
  return d.toISOString()
}

/** Заагаагүй бол undefined, заасан бол шалгасан утга. Хэсэгчилсэн засварт. */
export function optional(value, check) {
  return value === undefined ? undefined : check(value)
}
