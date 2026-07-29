import { asUser } from '../../core/supabase.js'
import { unwrap, conflict, badRequest } from '../../core/http.js'
import { requireUuid, requireText, requireOneOf } from '../../core/validate.js'

// ============================================================
// Мэдээлэх ба хянах (FR-9.2)
// ============================================================

const TARGET_TYPES = ['shift', 'user']
// `report_status` enum-тэй яг таарна. 'open' нь анхны төлөв тул шийдвэрт орохгүй.
const RESOLUTIONS = ['reviewing', 'resolved', 'dismissed']

const toReport = r => r && ({
  id: r.id,
  reporterId: r.reporter_id,
  targetType: r.target_type,
  targetId: r.target_id,
  reason: r.reason,
  status: r.status,
  adminNote: r.admin_note,
  createdAt: r.created_at,
  resolvedAt: r.resolved_at,
})

/** Хэрэглэгч зар эсвэл өөр хэрэглэгчийг мэдээлнэ. */
export async function createReport(req, body) {
  const targetType = requireOneOf(body?.targetType, TARGET_TYPES, 'Мэдээлэх төрөл')
  const targetId = requireUuid(body?.targetId, 'Мэдээлэх зүйлийн ID')
  // Хязгаар нь өгөгдлийн сангийн check constraint-тэй яг таарна
  const reason = requireText(body?.reason, 'Шалтгаан', { max: 1000, min: 3 })

  if (targetType === 'user' && targetId === req.user.id) {
    throw badRequest('Өөрийгөө мэдээлэх боломжгүй.')
  }

  const sb = asUser(req.accessToken)
  const { data, error } = await sb
    .from('reports')
    .insert({ reporter_id: req.user.id, target_type: targetType, target_id: targetId, reason })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw conflict('Та үүнийг аль хэдийн мэдээлсэн байна.')
    unwrap({ data: null, error }, 'Мэдээлэл илгээж чадсангүй.')
  }

  return toReport(data)
}

/** Бүх мэдээлэл — RLS нь админаас бусдад хоосон буцаана. */
export async function listReports(req) {
  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb.from('reports').select('*').order('created_at', { ascending: false })
  )
  return rows.map(toReport)
}

export async function resolveReport(req, id, status, note) {
  requireUuid(id, 'Мэдээллийн ID')
  requireOneOf(status, RESOLUTIONS, 'Шийдвэр')

  const sb = asUser(req.accessToken)
  unwrap(
    await sb
      .from('reports')
      .update({
        status,
        admin_note: note ? String(note).slice(0, 1000) : null,
        resolved_by: req.user.id,
        // 'reviewing' нь ажил дуусаагүй гэсэн үг тул огноог бичихгүй
        resolved_at: status === 'reviewing' ? null : new Date().toISOString(),
      })
      .eq('id', id),
    'Шийдвэрлэж чадсангүй.'
  )
}

/**
 * Хэрэглэгчийг идэвхгүй болгоно.
 * `deactivate_user` нь security definer — дуудагч админ мөн эсэхийг өөрөө
 * шалгадаг тул хэрэглэгчийн токеноор дуудна.
 */
export async function deactivateUser(req, userId, reason) {
  requireUuid(userId, 'Хэрэглэгчийн ID')
  if (userId === req.user.id) throw badRequest('Өөрийгөө идэвхгүй болгох боломжгүй.')

  const sb = asUser(req.accessToken)
  unwrap(
    await sb.rpc('deactivate_user', { p_user: userId, p_reason: reason || null }),
    'Идэвхгүй болгож чадсангүй.'
  )
}
