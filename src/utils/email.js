import { supabase } from '../lib/supabase'

// ============================================================
// И-мэйл илгээх (сервер талаар)
// ============================================================
// Өмнө нь EmailJS-ээр БРАУЗЕРААС илгээдэг байсан. Тэр нь API түлхүүрийг
// bundle дотор ил гаргадаг тул хэн ч татаж аваад таны нэрээр захиа
// илгээх боломжтой байв.
//
// Одоо Supabase Edge Function (supabase/functions/send-email) дуудна.
// Түлхүүр зөвхөн серверт үлдэнэ, хүлээн авагчийг сервер өөрөө өгөгдлийн
// сангаас тодорхойлно — өөр хаяг руу илгээх боломжгүй.
// ============================================================

/**
 * Загвар ашиглан нэвтэрсэн хэрэглэгч рүү и-мэйл илгээнэ.
 * Хэзээ ч алдаа шидэхгүй — и-мэйл явахгүй байх нь үндсэн урсгалыг
 * тасалдуулах ёсгүй.
 *
 * @param {'login_alert'|'application_approved'|'invoice_due'|'payment_received'} template
 * @param {Record<string,string>} data
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function sendEmail(template, data = {}) {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { template, data },
    })

    if (error) {
      // 503 = тохируулаагүй. Энэ бол алдаа биш, зүгээр л идэвхгүй байна.
      const status = error.context?.status
      return { ok: false, reason: status === 503 ? 'not_configured' : error.message }
    }
    return { ok: Boolean(result?.ok) }
  } catch (err) {
    return { ok: false, reason: err?.message || 'send_failed' }
  }
}

/** Нэвтэрсэн тухай сэрэмжлүүлэг. */
export function sendLoginAlert({ name, method }) {
  return sendEmail('login_alert', {
    name: name || 'хэрэглэгч',
    time: new Date().toLocaleString('mn-MN'),
    method: method === 'email' ? 'и-мэйл хаягаар' : 'утасны дугаараар',
  })
}
