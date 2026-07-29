import { asUser, clientFor } from '../../core/supabase.js'
import { unwrap, notFound, forbidden, conflict, badRequest } from '../../core/http.js'
import { requireUuid, requireInt } from '../../core/validate.js'

// ============================================================
// Үнэлгээ — итгэлийн систем (FR-7)
// ============================================================
// Дүрмүүд:
//   • Зөвхөн ДУУССАН ажил дээр үнэлгээ өгнө
//   • Зөвхөн тухайн ажлын хоёр талын нэг нь өгнө
//   • Нэг ажилд нэг тал НЭГ л удаа
//   • Үнэлгээ хоёул өгсний дараа (эсвэл 7 хоногийн дараа) нээгдэнэ —
//     энэ логик өгөгдлийн сангийн `review_visible`-д байгаа тул сервер
//     давхардуулахгүй.
// ============================================================

export const toReview = r => r && ({
  id: r.id,
  applicationId: r.application_id,
  reviewerId: r.reviewer_id,
  revieweeId: r.reviewee_id,
  stars: r.stars,
  comment: r.comment,
  publishedAt: r.published_at,
})

export async function list(req) {
  // RLS нь нээгдээгүй үнэлгээг нуух тул шүүлт хийх шаардлагагүй
  const sb = clientFor(req)
  const rows = unwrap(await sb.from('reviews').select('*'))
  return rows.map(toReview)
}

export async function create(req, body) {
  const applicationId = requireUuid(body?.applicationId, 'Хүсэлтийн ID')
  const stars = requireInt(body?.stars, 'Одны тоо', { min: 1, max: 5 })
  const comment = String(body?.comment || '').trim().slice(0, 1000)

  const sb = asUser(req.accessToken)

  // Хэнийг үнэлж байгааг СЕРВЕР тодорхойлно — frontend-ийн явуулсан
  // reviewee_id-д итгэвэл хэн ч дурын хүнд 1 од өгч чадна.
  const app = unwrap(
    await sb
      .from('applications')
      .select('id, status, worker_id, shifts(employer_id)')
      .eq('id', applicationId)
      .maybeSingle()
  )

  if (!app) throw notFound('Ийм ажил олдсонгүй.')
  if (app.status !== 'completed') {
    throw badRequest('Зөвхөн дууссан ажил дээр үнэлгээ өгнө.')
  }

  const employerId = app.shifts?.employer_id
  let revieweeId
  if (app.worker_id === req.user.id) revieweeId = employerId
  else if (employerId === req.user.id) revieweeId = app.worker_id
  else throw forbidden('Та энэ ажилд оролцоогүй тул үнэлгээ өгөх боломжгүй.')

  const { data, error } = await sb
    .from('reviews')
    .insert({
      application_id: applicationId,
      reviewer_id: req.user.id,
      reviewee_id: revieweeId,
      stars,
      comment,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw conflict('Та энэ ажлыг аль хэдийн үнэлсэн байна.')
    unwrap({ data: null, error }, 'Үнэлгээ өгч чадсангүй.')
  }

  return toReview(data)
}
