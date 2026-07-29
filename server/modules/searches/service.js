import { asUser } from '../../core/supabase.js'
import { unwrap, badRequest, notFound } from '../../core/http.js'
import { requireUuid, requireText, requireInt } from '../../core/validate.js'

// ============================================================
// Хадгалсан хайлт (FR-5.4)
// ============================================================
// Ажилтан шүүлтээ хадгалж, тохирох зар гармагц мэдэгдэл авна.
//
// Мэдэгдэл ИЛГЭЭХ хэсэг энд БАЙХГҮЙ — түүнийг `notify_saved_searches`
// триггер хийнэ. Шалтгаан: тохироог шалгахад БҮХ ажилтны хайлтыг унших
// шаардлагатай бөгөөд RLS нь хэрэглэгчид зөвхөн өөрийнхийг харуулдаг.
// ============================================================

const MAX_PER_WORKER = 10

const toSearch = r => r && ({
  id: r.id,
  name: r.name,
  filters: r.filters || {},
  notify: r.notify,
  createdAt: r.created_at,
})

/** Дэмжигдэх шүүлтүүд. Танихгүй түлхүүрийг ХАЯНА — триггер тэдгээрийг
 *  мэдэхгүй тул хадгалбал хэрэглэгч буруу ойлголт авна. */
function cleanFilters(input = {}) {
  const filters = {}

  if (input.district && input.district !== 'Бүгд') {
    filters.district = requireText(input.district, 'Дүүрэг', { max: 60 })
  }
  if (input.category) {
    filters.category = requireText(input.category, 'Ажлын төрөл', { max: 60 })
  }
  if (input.minWage !== undefined && input.minWage !== null && input.minWage !== '') {
    filters.minWage = requireInt(input.minWage, 'Доод цалин', { min: 0, max: 10_000_000 })
  }
  if (input.search) {
    filters.search = requireText(input.search, 'Хайх үг', { max: 100 })
  }

  if (Object.keys(filters).length === 0) {
    throw badRequest('Ядаж нэг шүүлт сонгоно уу — эс тэгвээс бүх зар мэдэгдэл болно.')
  }
  return filters
}

export async function list(req) {
  const sb = asUser(req.accessToken)
  const rows = unwrap(
    await sb.from('saved_searches').select('*').order('created_at', { ascending: false })
  )
  return rows.map(toSearch)
}

export async function create(req, body) {
  const name = requireText(body?.name, 'Нэр', { max: 60 })
  const filters = cleanFilters(body?.filters)

  const sb = asUser(req.accessToken)

  // Хязгааргүй хадгалбал ажилтан өөрийгөө мэдэгдлээр дүүргэнэ
  const existing = unwrap(
    await sb.from('saved_searches').select('id').eq('worker_id', req.user.id)
  )
  if (existing.length >= MAX_PER_WORKER) {
    throw badRequest(`Хадгалсан хайлт хамгийн ихдээ ${MAX_PER_WORKER} байна. Аль нэгийг устгана уу.`)
  }

  const row = unwrap(
    await sb
      .from('saved_searches')
      .insert({ worker_id: req.user.id, name, filters, notify: body?.notify !== false })
      .select()
      .single(),
    'Хайлт хадгалж чадсангүй.'
  )
  return toSearch(row)
}

/** Мэдэгдэл авахыг асаах/унтраах. */
export async function setNotify(req, id, notify) {
  requireUuid(id, 'Хайлтын ID')
  if (typeof notify !== 'boolean') throw badRequest('Утга буруу байна.')

  const sb = asUser(req.accessToken)
  const row = unwrap(
    await sb.from('saved_searches').update({ notify }).eq('id', id).select().maybeSingle()
  )
  if (!row) throw notFound('Ийм хайлт олдсонгүй.')
  return toSearch(row)
}

export async function remove(req, id) {
  requireUuid(id, 'Хайлтын ID')

  const sb = asUser(req.accessToken)
  // RLS нь өөрийн мөрийг л устгахыг зөвшөөрнө
  unwrap(await sb.from('saved_searches').delete().eq('id', id), 'Устгаж чадсангүй.')
}
