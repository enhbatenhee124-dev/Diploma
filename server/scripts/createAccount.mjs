import { createClient } from '@supabase/supabase-js'

// ============================================================
// Бүртгэл үүсгэх / шинэчлэх (аль ч дүрээр)
// ============================================================
//   npm run account -- --email a@gmail.com --password 12345678 --role admin --name "Нэр" [--phone 99112233]
//
// service_role түлхүүрээр admin API ашиглана. Давуу тал:
//   • И-мэйл ШУУД баталгаажсан байдлаар үүснэ — баталгаажуулах захиа
//     илгээхгүй тул үнэгүй багцын цагийн хязгаарт (2-3 захиа) хамаарахгүй
//   • Админ дүр үүсгэж чадна — нийтийн бүртгүүлэх формоор үүсгэх БОЛОМЖГҮЙ
//     байх ёстой (эс тэгвээс хэн ч өөрийгөө админ болгоно)
//
// Хэрэглэгч аль хэдийн байвал нууц үг, дүр, нэрийг нь шинэчилнэ.
// ============================================================

const { SUPABASE_URL: URL, SUPABASE_SERVICE_ROLE_KEY: KEY } = process.env

if (!URL || !KEY) {
  console.error('✗ SUPABASE_URL болон SUPABASE_SERVICE_ROLE_KEY-г .env-д оруулна уу.')
  process.exit(1)
}

// --- аргументуудыг унших ---
const args = {}
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i]?.replace(/^--/, '')
  if (key) args[key] = process.argv[i + 1]
}

const { email, password, role = 'employee', name, phone } = args

const ROLES = ['employee', 'employer', 'admin']

if (!email || !password) {
  console.error(`
Хэрэглээ:
  npm run account -- --email <и-мэйл> --password <нууц үг> [--role <дүр>] [--name <нэр>] [--phone <утас>]

Дүр: ${ROLES.join(' | ')}   (анхдагч: employee)

Жишээ:
  npm run account -- --email ajiltan@gmail.com  --password 12345678 --role employee --name "Батаа"    --phone 99110011
  npm run account -- --email ajilolgogch@gmail.com --password 12345678 --role employer --name "Түшиг ХХК" --phone 70110011
  npm run account -- --email admin@gmail.com    --password 12345678 --role admin    --name "Админ"     --phone 99000011
`)
  process.exit(1)
}

if (!ROLES.includes(role)) {
  console.error(`✗ Дүр буруу: "${role}". Зөвшөөрөгдөх утга: ${ROLES.join(', ')}`)
  process.exit(1)
}

if (password.length < 6) {
  console.error('✗ Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.')
  process.exit(1)
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } })
const displayName = name || email.split('@')[0]
const digits = String(phone || '').replace(/\D/g, '') || null

/** И-мэйлээр одоо байгаа хэрэглэгчийг хайна. */
async function findByEmail(target) {
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find(u => u.email?.toLowerCase() === target.toLowerCase())
    if (hit) return hit
    if (data.users.length < 200) return null
    page++
  }
}

async function main() {
  const existing = await findByEmail(email)

  if (existing) {
    // Нууц үг, метадатаг шинэчилнэ
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { name: displayName, role, phone: digits },
    })
    if (error) throw error

    // profiles дахь дүрийг ШУУД засна — триггер зөвхөн ҮҮСГЭХ үед ажилладаг
    const { error: pErr } = await admin.from('profiles')
      .update({ role, name: displayName, email, phone: digits })
      .eq('id', existing.id)
    if (pErr) throw pErr

    // Дүр өөрчлөгдсөн бол тохирох дэд профайлыг нөхнө
    await ensureRoleProfile(existing.id, role, displayName)

    console.log(`\n✓ Шинэчлэгдлээ: ${email}`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // баталгаажуулах захиа ИЛГЭЭХГҮЙ
      user_metadata: { name: displayName, role, phone: digits },
    })
    if (error) throw error

    // Триггер профайлыг үүсгэсэн — и-мэйл, утсыг нөхнө
    const { error: pErr } = await admin.from('profiles')
      .update({ email, phone: digits })
      .eq('id', data.user.id)
    if (pErr) throw pErr

    console.log(`\n✓ Үүслээ: ${email}`)
  }

  const roleLabel = { employee: 'Ажил хайгч', employer: 'Ажил олгогч', admin: 'Админ' }[role]
  console.log(`  Нэр      : ${displayName}`)
  console.log(`  Дүр      : ${roleLabel}`)
  console.log(`  Утас     : ${digits || '—'}`)
  console.log(`  Нууц үг  : ${password}`)
  console.log(`\n  И-мэйлээр эсвэл утсаараа нэвтэрч болно.`)
}

/** Дүрд тохирсон дэд профайл байхыг баталгаажуулна. */
async function ensureRoleProfile(userId, userRole, displayName) {
  if (userRole === 'employer') {
    await admin.from('employer_profiles')
      .upsert({ user_id: userId, org_name: displayName }, { onConflict: 'user_id' })
  } else if (userRole === 'employee') {
    await admin.from('worker_profiles')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
  }
}

main().catch(err => {
  console.error('\n✗ Алдаа:', err.message)
  process.exit(1)
})
