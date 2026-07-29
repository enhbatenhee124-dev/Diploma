// ============================================================
// И-мэйл илгээх Edge Function
// ============================================================
// Яагаад сервер тал руу зөөв:
//   EmailJS нь браузераас илгээдэг тул түлхүүр нь bundle дотор ИЛ гардаг.
//   Хэн ч татаж аваад таны нэрээр захиа илгээх боломжтой байсан.
//   Энд Resend-ийн API түлхүүр зөвхөн серверт үлдэнэ.
//
// Тохируулах:
//   1. resend.com дээр бүртгүүлж домэйнээ баталгаажуулна
//   2. supabase secrets set RESEND_API_KEY=re_xxx
//   3. supabase secrets set MAIL_FROM="МонголАжил <noreply@tanii-domain.mn>"
//   4. supabase functions deploy send-email
//
// Тохируулаагүй үед 503 буцаана — апп унахгүй, зөвхөн и-мэйл явахгүй.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'МонголАжил <onboarding@resend.dev>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

/** Зөвшөөрөгдсөн захианы төрлүүд — дурын агуулга илгээхийг хориглоно. */
type Template = 'login_alert' | 'application_approved' | 'invoice_due' | 'payment_received'

function render(template: Template, data: Record<string, string>) {
  switch (template) {
    case 'login_alert':
      return {
        subject: 'Таны бүртгэлд нэвтэрлээ',
        html: `<p>Сайн байна уу, ${data.name}.</p>
               <p>Таны МонголАжил бүртгэлд <b>${data.time}</b>-д ${data.method} нэвтэрлээ.</p>
               <p>Хэрэв энэ та биш бол нууц үгээ яаралтай солино уу.</p>`,
      }
    case 'application_approved':
      return {
        subject: 'Хүсэлт зөвшөөрөгдлөө',
        html: `<p>Сайн байна уу, ${data.name}.</p>
               <p><b>${data.shiftTitle}</b> ажилд таны хүсэлт зөвшөөрөгдлөө.</p>
               <p>Ажил олгогчтой апп дотроос чатаар холбогдоно уу.</p>`,
      }
    case 'invoice_due':
      return {
        subject: 'Захиалгын төлбөр',
        html: `<p>Сайн байна уу, ${data.name}.</p>
               <p>Захиалгын хугацаа <b>${data.periodEnd}</b>-д дуусна.</p>
               <p>Дүн: <b>${data.amount} ₮</b> · Гүйлгээний утга: <b>${data.reference}</b></p>`,
      }
    case 'payment_received':
      return {
        subject: 'Төлбөр баталгаажлаа',
        html: `<p>Сайн байна уу, ${data.name}.</p>
               <p>Төлбөр хүлээн авлаа. Захиалга <b>${data.periodEnd}</b> хүртэл сунгагдлаа.</p>`,
      }
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (!RESEND_KEY) {
    return json({ error: 'И-мэйл үйлчилгээ тохируулаагүй байна.' }, 503)
  }

  // Нэвтэрсэн хэрэглэгч мөн эсэхийг шалгана — задгай илгээгч болгохгүй
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return json({ error: 'Нэвтрэх шаардлагатай.' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: auth, error: authError } = await admin.auth.getUser(token)
  if (authError || !auth?.user) return json({ error: 'Токен хүчингүй.' }, 401)

  let body: { template: Template; data?: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Хүсэлтийн бие буруу байна.' }, 400)
  }

  const rendered = render(body.template, body.data ?? {})
  if (!rendered) return json({ error: 'Ийм загвар байхгүй.' }, 400)

  // ⚠ Хүлээн авагчийг хүсэлтээс АВАХГҮЙ — өгөгдлийн сангаас нэвтэрсэн
  // хэрэглэгчийн и-мэйлээр л илгээнэ. Ингэснээр энэ функцийг ашиглаж
  // дурын хаяг руу спам илгээх боломжгүй.
  const { data: profile } = await admin
    .from('profiles').select('email, name').eq('id', auth.user.id).single()

  if (!profile?.email) {
    return json({ error: 'Хэрэглэгчид и-мэйл хаяг бүртгэгдээгүй байна.' }, 400)
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: profile.email,
      subject: rendered.subject,
      html: rendered.html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error('[send-email] Resend алдаа:', detail)
    return json({ error: 'И-мэйл илгээж чадсангүй.' }, 502)
  }

  return json({ ok: true })
})
