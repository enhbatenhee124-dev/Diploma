import { createClient } from '@supabase/supabase-js'

// ============================================================
// Демо өгөгдлийн хугацааг шинэчлэх
// ============================================================
//   npm run db:refresh
//
// Яагаад хэрэгтэй вэ:
//   Демо зарууд `seed` ажиллуулсан МӨЧӨӨС хойших огноотой үүсдэг. Хэдэн
//   хоногийн дараа тэдгээр нь хугацаа хэтэрч, `close_expired_shifts` cron
//   тэднийг автоматаар хаадаг (FR-4.3 — зөв ажиллагаа). Үр дүнд нь зарын
//   самбар ХООСОРНО.
//
//   Хамгаалалт эсвэл үзүүлбэрийн өмнө үүнийг ажиллуулбал зарууд дахин
//   идэвхтэй болно.
//
// `db:seed`-ээс ялгаатай нь:
//   Энэ нь ЮУ Ч УСТГАХГҮЙ. Хүсэлт, үнэлгээ, чат, EXP бүгд хэвээр үлдэнэ —
//   тэдгээр нь демог бодитой харагдуулдаг. Зөвхөн огноог урагшлуулна.
// ============================================================

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !KEY) {
  console.error('✗ SUPABASE_URL болон SUPABASE_SERVICE_ROLE_KEY-г .env-д оруулна уу.')
  process.exit(1)
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } })

const HOUR = 3600_000
const DAY = 24 * HOUR
const now = Date.now()
const iso = ms => new Date(ms).toISOString()

// Зарын нэр → шинэ хуваарь.
// `seed.js` дахь харьцангуй байрлалыг хадгална: нэг нь маргааш, нөгөө нь
// хоёр хоногийн дараа гэх мэт.
const SCHEDULE = {
  'Кофе Ланд ажилтан': { start: now + DAY, hours: 4, status: 'Active' },
  'Кассир': { start: now + 2 * DAY, hours: 6, status: 'Active' },
  'Ахлах бариста': { start: now + 3 * DAY, hours: 6, status: 'Active' },
  // Энэ нь ДУУССАН ажил — түүх учраас өнгөрсөнд нь үлдээнэ. Үүн дээр
  // дуусгасан хүсэлт, үнэлгээ байгаа тул идэвхжүүлбэл утгагүй болно.
  'Агуулахын ажилтан': { start: now - 5 * DAY, hours: 8, status: 'Closed' },
}

const { data: shifts, error } = await admin.from('shifts').select('id, title, status')

if (error) {
  console.error('✗ Зар уншиж чадсангүй:', error.message)
  process.exit(1)
}

let updated = 0
let skipped = 0

for (const shift of shifts) {
  const plan = SCHEDULE[shift.title]

  if (!plan) {
    // Гараар үүсгэсэн зар — хүрэхгүй
    skipped++
    continue
  }

  const { error: updateError } = await admin
    .from('shifts')
    .update({
      start_at: iso(plan.start),
      end_at: iso(plan.start + plan.hours * HOUR),
      status: plan.status,
    })
    .eq('id', shift.id)

  if (updateError) {
    console.error(`  ✗ ${shift.title}: ${updateError.message}`)
    continue
  }

  const when = plan.status === 'Active'
    ? new Date(plan.start).toLocaleDateString('mn-MN')
    : 'өнгөрсөн (түүх)'
  console.log(`  ✓ ${shift.title.padEnd(22)} ${plan.status.padEnd(7)} ${when}`)
  updated++
}

const { count: active } = await admin
  .from('shifts')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'Active')

console.log(`\n${updated} зар шинэчлэв${skipped ? `, ${skipped} алгасав (гараар үүсгэсэн)` : ''}.`)
console.log(`Одоо ${active} идэвхтэй зар байна.`)
