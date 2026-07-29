// ============================================================
// HTTP давхаргын нийтлэг хэрэгслүүд
// ============================================================
// Модуль бүр ижилхэн алдааны хэлбэр буцаадаг байх ёстой — frontend нэг л
// газар алдаа боловсруулна.
//
// Амжилттай:  { data: ... }
// Алдаатай:   { error: "монгол хэл дээрх мессеж" }
// ============================================================

/** Хэрэглэгчид харуулах ёстой, урьдчилан таамагласан алдаа. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.expected = true
  }
}

export const badRequest = msg => new ApiError(400, msg)
export const unauthorized = (msg = 'Нэвтрэх шаардлагатай.') => new ApiError(401, msg)
export const forbidden = (msg = 'Танд энэ үйлдлийг хийх эрх алга.') => new ApiError(403, msg)
export const notFound = (msg = 'Олдсонгүй.') => new ApiError(404, msg)
export const conflict = msg => new ApiError(409, msg)

/** Express-ийн async route-ийн алдааг next() руу дамжуулна. */
export const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * Supabase/Postgres-ийн алдааг хэрэглэгчид ойлгомжтой ApiError болгоно.
 *
 * Өгөгдлийн сангийн триггерүүд аль хэдийн монголоор мессеж шиддэг
 * (жишээ нь "Lv.3 шаардлагатай") тул тэднийг ШУУД дамжуулна — сервер
 * дээр логикийг давхардуулах шаардлагагүй.
 */
export function fromPostgres(error, fallback = 'Үйлдэл гүйцэтгэж чадсангүй.') {
  if (!error) return null

  const code = error.code
  const msg = String(error.message || '')

  // Давхардсан утга (unique constraint)
  if (code === '23505') return conflict('Ийм бичлэг аль хэдийн байна.')
  // Гадаад түлхүүр зөрчил
  if (code === '23503') return badRequest('Холбоотой бичлэг олдсонгүй.')
  // RLS татгалзсан
  if (code === '42501') return forbidden()
  // Триггер/функцээс шидсэн монгол мессежийг шууд харуулна
  if (code === 'P0001' || /шаардлагатай|боломжгүй|эрхгүй|байхгүй/.test(msg)) {
    return badRequest(msg)
  }

  const wrapped = new ApiError(500, fallback)
  wrapped.cause = error
  wrapped.expected = false
  return wrapped
}

/**
 * Supabase-ийн `{ data, error }`-ийг задалж, алдаатай бол шиднэ.
 * Модулиуд `const rows = unwrap(await sb.from(...).select())` гэж бичнэ.
 */
export function unwrap({ data, error }, fallback) {
  const wrapped = fromPostgres(error, fallback)
  if (wrapped) throw wrapped
  return data
}

/** Бүх алдааг нэг хэлбэрт оруулж буцаах Express handler. */
export function errorHandler(err, req, res, _next) {
  const status = err?.status || 500

  // Хүлээгээгүй алдааг л бүртгэнэ — 4xx нь хэвийн ажиллагаа
  if (!err?.expected) {
    console.error(`[алдаа] ${req.method} ${req.originalUrl}`, err?.cause || err)
  }

  res.status(status).json({
    error: status === 500 ? 'Серверийн алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.' : err.message,
  })
}
