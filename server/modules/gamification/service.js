import { asUser, clientFor } from '../../core/supabase.js'
import { unwrap } from '../../core/http.js'
import { requireOneOf } from '../../core/validate.js'

// ============================================================
// EXP / түвшин / тэргүүлэгчид
// ============================================================
// ⚠ Эдгээрийг клиент дээр тооцох БОЛОМЖГҮЙ бөгөөд тооцох ч ЁСГҮЙ:
//   • RLS-ээс болж ажилтан зөвхөн 'Active' зар, өөрийн хүсэлтийг л хардаг
//     тул дуусгасан ажлын бүрэн түүх түүнд харагдахгүй.
//   • Клиент дээр тооцсон EXP-д итгэж болохгүй — хэрэглэгч өөрчилж чадна.
// Тиймээс өгөгдлийн сангийн `user_progress` / `rankings` view-гээс уншина.
// ============================================================

const toProgress = r => r && ({
  userId: r.user_id,
  role: r.role,
  name: r.name,
  avatarUrl: r.avatar_url,
  completed: r.completed_jobs,
  hours: r.total_hours,
  reviews: r.review_count,
  avgRating: Number(r.avg_rating) || 0,
  fiveStars: r.five_stars,
  exp: r.exp,
  level: r.level,
  currentLevelExp: r.current_level_exp,
  nextLevelExp: r.next_level_exp,
  intoLevel: r.into_level,
  neededForNext: r.needed_for_next,
  progress: r.progress_pct ?? 0,
  rank: r.rank,
})

/** Нэвтэрсэн хэрэглэгчийн өөрийн явц. */
export async function myProgress(req) {
  const sb = asUser(req.accessToken)
  const row = unwrap(
    await sb.from('user_progress').select('*').eq('user_id', req.user.id).maybeSingle()
  )
  return toProgress(row)
}

/** Тэргүүлэгчдийн жагсаалт. Дүрээр тусад нь. */
export async function ranking(req, role) {
  requireOneOf(role, ['employee', 'employer'], 'Дүр')
  const sb = clientFor(req)
  const rows = unwrap(
    await sb.from('rankings').select('*').eq('role', role).order('rank')
  )
  return rows.map(toProgress)
}
