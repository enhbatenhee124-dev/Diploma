import { createClient } from '@supabase/supabase-js'

// ============================================================
// Supabase-д демо өгөгдөл оруулах
// ============================================================
//   npm run db:seed:supabase
//
// service_role түлхүүр ашиглана — RLS-ийг тойрч, auth хэрэглэгч үүсгэнэ.
// Аль хэдийн байгаа бүртгэлийг алгасна тул дахин ажиллуулж болно.
// ============================================================

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !KEY) {
  console.error('✗ SUPABASE_URL болон SUPABASE_SERVICE_ROLE_KEY-г .env-д оруулна уу.')
  process.exit(1)
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } })

const PASSWORD = 'demo1234'
const PHONE_DOMAIN = 'phone.mongolajil.mn'

const users = [
  { phone: '99112233', email: 'bolor.erdene@example.mn', role: 'employee', name: 'Болор Эрдэнэ', district: 'Сүхбаатар' },
  { phone: '95112233', email: 'munkhbat@example.mn', role: 'employee', name: 'Мөнхбат', district: 'Чингэлтэй' },
  { phone: '70112233', email: 'info@acme.mn', role: 'employer', name: 'Акмэ Корп', district: 'Сүхбаатар' },
  { phone: '75112233', email: 'hello@coffeeland.mn', role: 'employer', name: 'Кофе Ланд', district: 'Чингэлтэй' },
  { phone: '99001122', email: 'admin@mongolajil.mn', role: 'admin', name: 'Админ', district: 'Сүхбаатар' },
]

const HOUR = 3600_000
const DAY = 24 * HOUR
const now = Date.now()
const iso = ms => new Date(ms).toISOString()

/** Хэрэглэгчийг үүсгэнэ. Байвал одоо байгаагийн ID-г буцаана. */
async function ensureUser(u) {
  // Утсаар нэвтрэх боломжтой байхын тулд утаснаас үүссэн и-мэйлээр бүртгэнэ.
  // Жинхэнэ и-мэйл нь profiles хүснэгтэд тусад нь хадгалагдана.
  const authEmail = `${u.phone}@${PHONE_DOMAIN}`

  const { data, error } = await admin.auth.admin.createUser({
    email: authEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: u.name, role: u.role, phone: u.phone },
  })

  if (error) {
    if (/already|exists|registered/i.test(error.message)) {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
      const found = list?.users.find(x => x.email === authEmail)
      if (found) return { id: found.id, existed: true }
    }
    throw new Error(`${u.name}: ${error.message}`)
  }

  // Триггер профайлыг үүсгэсэн — жинхэнэ и-мэйл, дүүргийг нь нөхнө
  await admin.from('profiles')
    .update({ email: u.email, district: u.district })
    .eq('id', data.user.id)

  // Демо ажил олгогчийг баталгаажуулна — эс тэгвээс зар нийтэлж чадахгүй
  // (NFR-5: баталгаажаагүй ажил олгогч зар нийтлэхгүй)
  if (u.role === 'employer') {
    await admin.from('employer_profiles')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('user_id', data.user.id)
  }

  return { id: data.user.id, existed: false }
}

async function main() {
  console.log('Хэрэглэгч үүсгэж байна...')
  const ids = {}
  let created = 0

  for (const u of users) {
    const { id, existed } = await ensureUser(u)
    ids[u.phone] = id
    if (!existed) created++
    console.log(`  ${existed ? '·' : '+'} ${u.role.padEnd(9)} ${u.phone}  ${u.name}`)
  }

  // Зар аль хэдийн байвал дахин оруулахгүй
  const { count } = await admin.from('shifts').select('*', { count: 'exact', head: true })
  if (count > 0) {
    console.log(`\n· ${count} зар аль хэдийн байна — зар оруулахыг алгаслаа.`)
    console.log(`\n✓ Бэлэн. Демо нууц үг: ${PASSWORD}`)
    return
  }

  const acme = ids['70112233']
  const coffee = ids['75112233']

  const shifts = [
    { employer_id: acme, title: 'Кофе Ланд ажилтан', category: 'food', description: 'Өглөөний ээлж, 8-12 цаг.', district: 'Сүхбаатар', lat: 47.9189, lng: 106.9177, start_at: iso(now + DAY), end_at: iso(now + DAY + 4 * HOUR), hourly_wage: 12000, slots: 2, status: 'Active' },
    { employer_id: coffee, title: 'Кассир', category: 'retail', description: 'Өдрийн ээлж, өдөр бүр.', district: 'Чингэлтэй', lat: 47.9214, lng: 106.9124, start_at: iso(now + 2 * DAY), end_at: iso(now + 2 * DAY + 6 * HOUR), hourly_wage: 10000, slots: 1, status: 'Active' },
    { employer_id: acme, title: 'Ахлах бариста', category: 'food', description: 'Туршлагатай ажилтан. Өндөр цалин.', district: 'Сүхбаатар', lat: 47.9189, lng: 106.9177, start_at: iso(now + 3 * DAY), end_at: iso(now + 3 * DAY + 6 * HOUR), hourly_wage: 22000, slots: 1, status: 'Active' },
    { employer_id: coffee, title: 'Агуулахын ажилтан', category: 'other', description: 'Барааны бүртгэл, ачилт.', district: 'Баянзүрх', lat: 47.91, lng: 106.95, start_at: iso(now - 5 * DAY), end_at: iso(now - 5 * DAY + 8 * HOUR), hourly_wage: 11000, slots: 1, status: 'Closed' },
  ]

  console.log('\nЗар оруулж байна...')
  const { data: inserted, error: shiftError } = await admin.from('shifts').insert(shifts).select()
  if (shiftError) throw shiftError
  console.log(`  + ${inserted.length} зар`)

  const byTitle = t => inserted.find(s => s.title === t)?.id

  const applications = [
    { shift_id: byTitle('Кофе Ланд ажилтан'), worker_id: ids['99112233'], status: 'applied', applied_at: iso(now - DAY) },
    { shift_id: byTitle('Кассир'), worker_id: ids['95112233'], status: 'approved', applied_at: iso(now - 2 * DAY), decided_at: iso(now - DAY) },
    { shift_id: byTitle('Агуулахын ажилтан'), worker_id: ids['99112233'], status: 'completed', applied_at: iso(now - 6 * DAY), decided_at: iso(now - 5 * DAY) },
  ]

  const { data: apps, error: appError } = await admin.from('applications').insert(applications).select()
  if (appError) throw appError
  console.log(`  + ${apps.length} хүсэлт`)

  const completed = apps.find(a => a.status === 'completed')
  if (completed) {
    const { error: reviewError } = await admin.from('reviews').insert({
      application_id: completed.id,
      reviewer_id: coffee,
      reviewee_id: ids['99112233'],
      stars: 5,
      comment: 'Маш сайн ажилтан, цагтаа ирсэн!',
    })
    if (reviewError) throw reviewError
    console.log('  + 1 үнэлгээ')
  }

  console.log(`\n✓ Бэлэн (${created} шинэ хэрэглэгч). Демо нууц үг: ${PASSWORD}`)
  console.log('  Утсаар эсвэл и-мэйлээр нэвтэрч болно.')
}

main().catch(err => {
  console.error('\n✗ Алдаа:', err.message)
  process.exit(1)
})
