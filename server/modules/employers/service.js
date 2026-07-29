import { asUser } from '../../core/supabase.js'
import { unwrap } from '../../core/http.js'
import { requireUuid, requireText } from '../../core/validate.js'

// ============================================================
// Ажил олгогчийн баталгаажуулалт (FR-3.2, NFR-5)
// ============================================================
// Эхэн үед чанарын хяналт нь итгэлийн үндэс: баталгаажаагүй ажил олгогч
// зар нийтлэхгүй. Шалгалтыг өгөгдлийн сангийн `enforce_shift_quota`
// триггер хийдэг тул энд зөвхөн админы ажлын урсгал байна.
// ============================================================

const toQueueRow = r => r && ({
  userId: r.user_id,
  orgName: r.org_name,
  regNumber: r.reg_number,
  address: r.address,
  logoUrl: r.logo_url,
  isVerified: r.is_verified,
  rejectedAt: r.rejected_at,
  rejectReason: r.reject_reason,
  verifiedAt: r.verified_at,
  contactName: r.contact_name,
  contactPhone: r.contact_phone,
  contactEmail: r.contact_email,
  joinedAt: r.joined_at,
  shiftCount: r.shift_count,
})

/** Баталгаажуулах дараалал (FR-9.1). RLS нь админаас бусдад хоосон буцаана. */
export async function queue(req) {
  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb.from('employer_queue').select('*').order('joined_at', { ascending: false })
  )
  return rows.map(toQueueRow)
}

export async function verify(req, employerId) {
  requireUuid(employerId, 'Ажил олгогчийн ID')
  const sb = asUser(req.accessToken)
  unwrap(
    await sb.rpc('verify_employer', { p_employer: employerId }),
    'Баталгаажуулж чадсангүй.'
  )
}

export async function reject(req, employerId, reason) {
  requireUuid(employerId, 'Ажил олгогчийн ID')
  // Татгалзсан шалтгаан ЗААВАЛ байна — ажил олгогч юуг засахаа мэдэх ёстой
  const text = requireText(reason, 'Татгалзсан шалтгаан', { max: 1000, min: 3 })

  const sb = asUser(req.accessToken)
  unwrap(
    await sb.rpc('reject_employer', { p_employer: employerId, p_reason: text }),
    'Татгалзаж чадсангүй.'
  )
}
