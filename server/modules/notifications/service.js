import { asUser } from '../../core/supabase.js'
import { unwrap } from '../../core/http.js'
import { requireUuid, requireInt } from '../../core/validate.js'

// ============================================================
// Мэдэгдэл (FR-8, NFR-6)
// ============================================================
// `notifications` хүснэгтэд өгөгдлийн сангийн триггерүүд болон төлбөрийн
// модуль бичдэг: хүсэлт зөвшөөрөгдсөн, байгууллага баталгаажсан, төлбөр
// орсон гэх мэт.
//
// NFR-6: "Push/SMS амжилтгүй болсон ч in-app мэдэгдэл үлдэнэ" — тиймээс
// энэ бол мэдэгдлийн ҮНДСЭН суваг. Push (FCM) нь дараа нэмэгдэх нэмэлт
// давхарга болохоос орлуулагч биш.
//
// Бичих үйлдэл ЭНД БАЙХГҮЙ нь санаатай: мэдэгдлийг зөвхөн өгөгдлийн сан
// өөрөө үүсгэнэ. Эс тэгвээс хэрэглэгч бусдад дурын мэдэгдэл илгээж чадна.
// ============================================================

const toNotification = r => r && ({
  id: r.id,
  type: r.type,
  message: r.message,
  description: r.description,
  isRead: r.is_read,
  createdAt: r.created_at,
})

/**
 * Миний мэдэгдлүүд, шинэ нь эхэндээ.
 * RLS нь `user_id = auth.uid()` шалгадаг тул өөр хүнийхийг харах боломжгүй.
 */
export async function list(req, { limit = 50 } = {}) {
  const max = requireInt(limit, 'Хязгаар', { min: 1, max: 100 })

  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(max)
  )

  return {
    items: rows.map(toNotification),
    unread: rows.filter(r => !r.is_read).length,
  }
}

export async function markRead(req, id) {
  requireUuid(id, 'Мэдэгдлийн ID')

  const sb = asUser(req.accessToken)
  unwrap(
    await sb.from('notifications').update({ is_read: true }).eq('id', id),
    'Тэмдэглэж чадсангүй.'
  )
}

/** Бүгдийг уншсан болгоно. Аль хэдийн уншсаныг дахин шинэчлэхгүй. */
export async function markAllRead(req) {
  const sb = asUser(req.accessToken)
  unwrap(
    await sb
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false),
    'Тэмдэглэж чадсангүй.'
  )
}
