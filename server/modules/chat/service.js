import { asUser } from '../../core/supabase.js'
import { unwrap, badRequest } from '../../core/http.js'
import { requireUuid } from '../../core/validate.js'

// ============================================================
// Платформ доторх чат (FR-6.4)
// ============================================================
// Утасны дугаар шууд ил гарахгүй — зөвшөөрөгдсөн хүсэлт бүрд чат нээгдэнэ.
//
// Бодит цагийн шинэчлэл нь Supabase Realtime-аар БРАУЗЕР РУУ ШУУД ирнэ
// (`subscribeToMessages`). Сервер нь бичих/унших логикийг хариуцна.
// Ингэснээр WebSocket-ийн масштаблалтыг Supabase хариуцаж, монолит нь
// төлөвгүй (stateless) хэвээр үлдэнэ.
// ============================================================

const MAX_MESSAGE = 2000

const toMessage = r => r && ({
  id: r.id,
  threadId: r.thread_id,
  senderId: r.sender_id,
  content: r.content,
  readAt: r.read_at,
  createdAt: r.created_at,
})

/** Зөвшөөрөгдсөн хүсэлтэд чат нээх (байвал одоо байгааг буцаана). */
export async function openThread(req, applicationId) {
  requireUuid(applicationId, 'Хүсэлтийн ID')

  // `open_chat` нь security definer бөгөөд дуудагчийг `auth.uid()`-ээр
  // таньдаг тул ЗААВАЛ хэрэглэгчийн токеноор дуудна.
  const sb = asUser(req.accessToken)
  const data = unwrap(
    await sb.rpc('open_chat', { p_application: applicationId }),
    'Чат нээж чадсангүй.'
  )
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, applicationId: row.application_id }
}

/** Миний бүх чат — ажлын гарчиг, оролцогчидтой нь. */
export async function listThreads(req) {
  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb
      .from('chat_threads')
      .select('id, application_id, created_at, applications(shift_id, worker_id, status, shifts(title, employer_id))')
      .order('created_at', { ascending: false })
  )

  return rows.map(t => ({
    id: t.id,
    applicationId: t.application_id,
    shiftTitle: t.applications?.shifts?.title,
    workerId: t.applications?.worker_id,
    employerId: t.applications?.shifts?.employer_id,
    status: t.applications?.status,
  }))
}

export async function listMessages(req, threadId) {
  requireUuid(threadId, 'Чатын ID')
  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb.from('chat_messages').select('*').eq('thread_id', threadId).order('created_at')
  )
  return rows.map(toMessage)
}

export async function send(req, threadId, content) {
  requireUuid(threadId, 'Чатын ID')

  const text = String(content || '').trim()
  if (!text) throw badRequest('Хоосон мессеж илгээх боломжгүй.')
  if (text.length > MAX_MESSAGE) {
    throw badRequest(`Мессеж хэт урт байна (дээд тал нь ${MAX_MESSAGE} тэмдэгт).`)
  }

  // sender_id-г токеноос авна — өөр хүний нэрээр бичих боломжгүй.
  // Дуудагч чатын оролцогч мөн эсэхийг RLS шалгана.
  const sb = asUser(req.accessToken)
  const row = unwrap(
    await sb
      .from('chat_messages')
      .insert({ thread_id: threadId, sender_id: req.user.id, content: text })
      .select()
      .single(),
    'Мессеж илгээж чадсангүй.'
  )
  return toMessage(row)
}

/** Нөгөө талын уншаагүй мессежийг уншсан болгоно. */
export async function markRead(req, threadId) {
  requireUuid(threadId, 'Чатын ID')
  const sb = asUser(req.accessToken)
  unwrap(
    await sb
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .neq('sender_id', req.user.id)
      .is('read_at', null)
  )
}
