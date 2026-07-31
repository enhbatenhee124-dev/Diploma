import { asUser } from '../../core/supabase.js'
import { unwrap } from '../../core/http.js'
import { requireUuid, requireInt, requireText, requireOneOf } from '../../core/validate.js'
import { sendToUser } from './push.js'

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

// ============================================================
// Push — төхөөрөмжийн бүртгэл
// ============================================================

/**
 * Утасны FCM токеныг бүртгэнэ. Апп нээгдэх бүрд дуудагдана: FCM нь токеныг
 * үе үе солидог тул давтан бүртгэх нь хэвийн.
 *
 * `upsert` нь санаатай — ижил утсанд өөр хэрэглэгч нэвтэрвэл мөр нь шинэ
 * эзэн рүү шилжиж, хуучин эзэнд нь мэдэгдэл очихоо болино.
 */
export async function registerDevice(req, { token, platform = 'android' } = {}) {
  // FCM токен ~160 тэмдэгт байдаг ч тогтмол биш тул өгөөмөр хязгаар
  const value = requireText(token, 'Төхөөрөмжийн токен', { min: 20, max: 400 })
  const os = requireOneOf(platform, ['android', 'ios', 'web'], 'Платформ')

  const sb = asUser(req.accessToken)
  unwrap(
    await sb
      .from('device_tokens')
      .upsert({ token: value, user_id: req.user.id, platform: os }, { onConflict: 'token' }),
    'Төхөөрөмжийг бүртгэж чадсангүй.'
  )
}

/**
 * Токеныг устгана — гарах үед дуудна.
 * Эс тэгвээс дараагийн хэрэглэгчийн мэдэгдэл өмнөх эзэн рүү очно.
 */
export async function unregisterDevice(req, token) {
  const value = requireText(token, 'Төхөөрөмжийн токен', { min: 20, max: 400 })

  const sb = asUser(req.accessToken)
  unwrap(
    await sb.from('device_tokens').delete().eq('token', value),
    'Төхөөрөмжийг устгаж чадсангүй.'
  )
}

/**
 * Supabase-ийн Database Webhook-ийн биетийг боловсруулна.
 *
 * `notifications` хүснэгтэд мөр ОРМОГЦ дуудагдана. Ингэснээр push нь
 * мэдэгдэл үүсгэдэг БҮХ эх сурвалжийг (триггер, төлбөрийн модуль, админ)
 * автоматаар хамарна — шинэ төрөл нэмэхэд энд юу ч засах шаардлагагүй.
 *
 * Алдаа гаргахгүй: push унасан ч in-app мэдэгдэл үлдэнэ (NFR-6).
 */
export async function handleNotificationEvent(payload) {
  if (payload?.type !== 'INSERT' || payload?.table !== 'notifications') {
    return { sent: 0, removed: 0, skipped: true }
  }

  const row = payload.record
  if (!row?.user_id || !row?.message) return { sent: 0, removed: 0, skipped: true }

  return sendToUser(row.user_id, {
    title: row.message,
    body: row.description || '',
    // FCM-ийн `data` нь зөвхөн мөр утга авна
    data: {
      type: String(row.type || 'info'),
      notificationId: String(row.id || ''),
    },
  })
}
