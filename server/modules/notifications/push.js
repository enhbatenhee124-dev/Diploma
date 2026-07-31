import { createSign } from 'node:crypto'
import { FCM } from '../../config.js'
import { admin } from '../../core/supabase.js'

// ============================================================
// FCM HTTP v1 — push илгээх
// ============================================================
// `firebase-admin` санг ЗОРИУД ашиглаагүй: тэр нь 10MB+ хэмжээтэй бөгөөд
// Vercel-ийн serverless функцийн хүйтэн эхлэлийг мэдэгдэхүйц удаашруулна.
// Бидэнд хэрэгтэй нь ганцхан дуудлага тул стандарт `node:crypto`-оор
// service account-ийн JWT-г гарын үсэглээд access token авахад хангалттай.
//
// Урсгал:
//   1. Service account-ийн хувийн түлхүүрээр RS256 JWT үүсгэнэ
//   2. Google-ээс access token сольж авна (1 цаг хүчинтэй → кэшлэнэ)
//   3. FCM v1 руу мэдэгдэл илгээнэ
//
// ⚠ Push нь ХАНГАЛТТАЙ БУС суваг: утас офлайн, зөвшөөрөл цуцлагдсан,
//   токен хуучирсан байж болно. Тиймээс алдаа гарвал ХЭЗЭЭ Ч throw хийхгүй —
//   `notifications` хүснэгт дэх in-app мэдэгдэл нь баталгаа хэвээр (NFR-6).
// ============================================================

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

const base64url = buf =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** Кэшлэсэн access token. Хугацаанаас 60 секундын өмнө шинэчилнэ. */
let cached = { token: null, expiresAt: 0 }

function buildJwt(key) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  )

  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = base64url(signer.sign(key.private_key))

  return `${header}.${claims}.${signature}`
}

async function accessToken(key) {
  if (cached.token && Date.now() < cached.expiresAt) return cached.token

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildJwt(key),
    }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.access_token) {
    throw new Error(`Google-ээс токен авч чадсангүй: ${body.error_description || res.status}`)
  }

  cached = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in - 60) * 1000,
  }
  return cached.token
}

/**
 * Нэг төхөөрөмж рүү илгээнэ.
 * @returns {'sent'|'stale'|'failed'} `stale` = токен хүчингүй, устгах ёстой
 */
async function sendOne(key, token, bearer, { title, body, data }) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${key.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          // `data` нь зөвхөн МӨР утга авдаг — тоо/null дамжуулбал FCM 400 өгнө
          data,
          android: {
            priority: 'high',
            notification: {
              // Мэдэгдэл дарахад аппын үндсэн Activity нээгдэнэ
              click_action: 'FCM_PLUGIN_ACTIVITY',
            },
          },
        },
      }),
    }
  )

  if (res.ok) return 'sent'

  const err = await res.json().catch(() => ({}))
  const status = err?.error?.details?.[0]?.errorCode || err?.error?.status

  // Апп устгагдсан, токен шинэчлэгдсэн — дахин илгээх утгагүй
  if (status === 'UNREGISTERED' || status === 'INVALID_ARGUMENT' || res.status === 404) {
    return 'stale'
  }

  console.warn('[push] илгээж чадсангүй:', res.status, err?.error?.message || '')
  return 'failed'
}

/**
 * Тухайн хэрэглэгчийн БҮХ төхөөрөмж рүү мэдэгдэл илгээнэ.
 *
 * `admin` (service_role) клиент ашиглаж байгаа нь санаатай: энэ функцыг
 * Supabase-ийн webhook дуудах бөгөөд тэнд нэвтэрсэн хэрэглэгч БАЙХГҮЙ.
 *
 * @returns {{sent:number, removed:number}}
 */
export async function sendToUser(userId, { title, body, data = {} }) {
  if (!FCM) return { sent: 0, removed: 0 }

  const { data: rows, error } = await admin
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId)

  if (error) {
    console.warn('[push] төхөөрөмж уншиж чадсангүй:', error.message)
    return { sent: 0, removed: 0 }
  }
  if (!rows?.length) return { sent: 0, removed: 0 }

  let bearer
  try {
    bearer = await accessToken(FCM)
  } catch (err) {
    console.warn('[push]', err.message)
    return { sent: 0, removed: 0 }
  }

  // FCM v1-д багц илгээх цэг байхгүй тул төхөөрөмж бүрд нэг хүсэлт. Нэг
  // хэрэглэгчид ердөө 1–3 төхөөрөмж байдаг тул зэрэг явуулна.
  const results = await Promise.all(
    rows.map(r =>
      sendOne(FCM, r.token, bearer, { title, body, data })
        .catch(() => 'failed')
        .then(status => ({ token: r.token, status }))
    )
  )

  const stale = results.filter(r => r.status === 'stale').map(r => r.token)
  if (stale.length) {
    // Хуучирсан токеныг цэвэрлэнэ — эс тэгвээс хүснэгт хогоор дүүрч,
    // илгээх бүрд дэмий хүсэлт үүснэ
    await admin.from('device_tokens').delete().in('token', stale)
  }

  return {
    sent: results.filter(r => r.status === 'sent').length,
    removed: stale.length,
  }
}
