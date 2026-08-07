import { asUser, admin } from '../../core/supabase.js'
import { unwrap, notFound, forbidden, badRequest, ApiError } from '../../core/http.js'
import { requireUuid, isUuid } from '../../core/validate.js'
import { createInvoice, checkPayment, isQpayConfigured } from './qpay.js'
import {
  createCheckoutSession, verifyWebhook, retrieveSession, isStripeConfigured,
} from './stripe.js'

// ============================================================
// Захиалга ба төлбөр (Бизнес загвар — А хувилбар)
// ============================================================
// Хариуцлагын хуваарилалт:
//
//   Өгөгдлийн сан  — нэхэмжлэлийн амьдралын мөчлөг (`request_invoice`,
//                    `confirm_invoice`). `invoices`-д INSERT/UPDATE хийх RLS
//                    policy ЗОРИУДААР байхгүй тул ажил олгогч өөрийгөө
//                    "төлсөн" болгож чадахгүй.
//
//   Энэ модуль     — гадаад төлбөрийн үйлчилгээ (QPay). Өгөгдлийн сан
//                    гадагш HTTP дуудаж чадахгүй тул QR үүсгэх, төлбөр
//                    баталгаажуулах нь серверийн ажил.
//
// ⚠ QPay-ийн webhook нь нэвтрэлтгүй ирдэг тул агуулгад нь ИТГЭХГҮЙ —
//   зөвхөн "шалга" гэсэн дохио гэж үзээд QPay-ээс өөрөөс нь батална.
// ============================================================

const PLAN_ID = 'employer_monthly'

const toInvoice = r => r && ({
  id: r.id,
  employerId: r.employer_id,
  employerName: r.employer_name,
  employerEmail: r.employer_email,
  employerPhone: r.employer_phone,
  amountMnt: r.amount_mnt,
  status: r.status,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  dueAt: r.due_at,
  paidAt: r.paid_at,
  createdAt: r.created_at,
  qrText: r.qpay_qr_text ?? null,
  qrImage: r.qpay_qr_image ?? null,
})

/** Захиалгын одоогийн бодит төлөв (хугацаа шалгасан). */
export async function subscription(req) {
  const sb = asUser(req.accessToken)
  const data = unwrap(
    await sb.rpc('subscription_state', { p_employer: req.user.id }).maybeSingle()
  )
  if (!data) return null

  return {
    status: data.status,
    periodEnd: data.period_end,
    graceUntil: data.grace_until,
    daysLeft: data.days_left,
    canPost: data.can_post,
    needsPayment: data.needs_payment,
  }
}

export async function plan(req) {
  const sb = asUser(req.accessToken)
  const row = unwrap(await sb.from('plans').select('*').eq('id', PLAN_ID).single())
  return {
    id: row.id,
    name: row.name,
    priceMnt: row.price_mnt,
    intervalDays: row.interval_days,
    // Аль төлбөрийн арга бэлэн байгааг клиент мэдэх ёстой — эс тэгвээс
    // тохируулаагүй аргын товчийг үзүүлээд 503 алдаа рүү хөтөлнө.
    stripeEnabled: isStripeConfigured(),
  }
}

/**
 * Нэхэмжлэлүүд. RLS нь ажил олгогчид өөрийнх, админд бүгдийг харуулна.
 *
 * `invoice_overview` view нь ажил олгогчийн нэрийг агуулдаг ч QR-ийн
 * баганагүй. Хүлээгдэж буй нэхэмжлэлийн QR-ийг `invoices`-оос тусад нь
 * авч нэгтгэнэ — эс тэгвээс хэрэглэгч QR-ээ харахын тулд "Нэхэмжлэл
 * үүсгэх" товчийг дахин дарах шаардлагатай болно.
 */
export async function listInvoices(req) {
  const sb = asUser(req.accessToken)

  const rows = unwrap(
    await sb.from('invoice_overview').select('*').order('created_at', { ascending: false })
  )

  const pendingIds = rows.filter(r => r.status === 'pending').map(r => r.id)
  if (!pendingIds.length) return rows.map(toInvoice)

  const qr = unwrap(
    await sb
      .from('invoices')
      .select('id, qpay_qr_text, qpay_qr_image')
      .in('id', pendingIds)
  )
  const byId = new Map(qr.map(r => [r.id, r]))

  return rows.map(r => toInvoice({ ...r, ...byId.get(r.id) }))
}

/**
 * Төлөх нэхэмжлэл хүсэх.
 * Хүлээгдэж буй нэхэмжлэл байвал өгөгдлийн сан түүнийг буцаана — товч
 * дахин дарахад давхар төлөх эрсдэлгүй.
 */
export async function requestInvoice(req) {
  const sb = asUser(req.accessToken)
  const data = unwrap(await sb.rpc('request_invoice'), 'Нэхэмжлэл үүсгэж чадсангүй.')
  const row = Array.isArray(data) ? data[0] : data

  // QPay тохируулаагүй бол нэхэмжлэл дансаар төлөгдөж, админ гараар
  // баталгаажуулна. Энэ нь эхний үеийн бүрэн ажиллагаатай зам.
  if (!isQpayConfigured()) {
    return { invoice: toInvoice(row), qpayConfigured: false }
  }

  // QR аль хэдийн үүссэн бол дахин үүсгэхгүй
  if (row.qpay_qr_text) {
    return { invoice: toInvoice(row), qpayConfigured: true, reused: true }
  }

  try {
    const qpay = await createInvoice({
      invoiceId: row.id,
      customerCode: req.user.id,
      amount: row.amount_mnt,
      description: 'МонголАжил — сарын багц',
    })

    // QR-ийн мэдээллийг бичихэд service_role хэрэгтэй: `invoices`-д UPDATE
    // хийх policy байхгүй нь ЗОРИУД (дээрх тайлбарыг үз).
    const updated = unwrap(
      await admin
        .from('invoices')
        .update({
          qpay_invoice_id: qpay.qpayInvoiceId,
          qpay_qr_text: qpay.qrText,
          qpay_qr_image: qpay.qrImage,
          qpay_urls: qpay.urls,
        })
        .eq('id', row.id)
        .select()
        .single()
    )

    return { invoice: toInvoice(updated), qpayConfigured: true }
  } catch (err) {
    // QPay унасан ч нэхэмжлэл үүссэн хэвээр — хэрэглэгч дансаар төлж болно
    console.error('[qpay] QR үүсгэж чадсангүй:', err.message)
    return {
      invoice: toInvoice(row),
      qpayConfigured: true,
      qpayError: 'QR код үүсгэж чадсангүй. Дансаар шилжүүлээд админд мэдэгдэнэ үү.',
    }
  }
}

/** Хэрэглэгч "Төлсөн, шалгана уу" гэж дарахад. Webhook саатсан ч хүлээхгүй. */
export async function checkInvoice(req, invoiceId) {
  requireUuid(invoiceId, 'Нэхэмжлэлийн ID')

  const invoice = unwrap(
    await admin.from('invoices').select('*').eq('id', invoiceId).maybeSingle()
  )
  if (!invoice) throw notFound('Нэхэмжлэл олдсонгүй.')
  if (invoice.employer_id !== req.user.id && req.user.role !== 'admin') {
    throw forbidden('Энэ нэхэмжлэл танийх биш байна.')
  }

  if (invoice.status === 'paid') return { paid: true, invoice: toInvoice(invoice) }
  if (!invoice.qpay_invoice_id) return { paid: false, invoice: toInvoice(invoice) }

  // QPay-ийн тохиргоо байхгүй үед шалгах боломжгүй. Хуучин нэхэмжлэл дээр
  // qpay_invoice_id үлдсэн байж болзошгүй тул энд барихгүй бол 500 өгнө.
  if (!isQpayConfigured()) return { paid: false, invoice: toInvoice(invoice) }

  const result = await checkPayment(invoice.qpay_invoice_id)
  if (result.paid && result.paidAmount >= invoice.amount_mnt) {
    const updated = await markPaid(invoice, { source: 'manual_check', ...result })
    return { paid: true, invoice: toInvoice(updated) }
  }

  return { paid: false, invoice: toInvoice(invoice) }
}

/** Админ дансаар ирсэн төлбөрийг гараар баталгаажуулна. */
export async function confirmInvoice(req, invoiceId, note) {
  requireUuid(invoiceId, 'Нэхэмжлэлийн ID')

  // `confirm_invoice` нь дуудагч админ мөн эсэхийг өөрөө шалгаж, аудитын
  // мөр болон мэдэгдлийг нэг транзакцад бичнэ.
  const sb = asUser(req.accessToken)
  const data = unwrap(
    await sb.rpc('confirm_invoice', { p_invoice: invoiceId, p_note: note || null }),
    'Баталгаажуулж чадсангүй.'
  )
  return toInvoice(Array.isArray(data) ? data[0] : data)
}

/**
 * QPay-ийн webhook. Нэвтрэлтгүй ирнэ.
 * Агуулгад итгэхгүй — зөвхөн дохио гэж үзээд QPay-ээс баталгаажуулна.
 */
export async function handleCallback(query, body) {
  const invoiceId = query?.invoice_id || body?.sender_invoice_no

  // ⚠ Танихгүй дуудлагыг өгөгдлийн санд БИЧИХГҮЙ. Энэ зам нээлттэй тул
  //   бүгдийг бүртгэвэл хэн ч `payment_events`-ийг хязгааргүй өсгөж чадна.
  //   Аудитын мөр нь БОДИТ нэхэмжлэлд хамаарах үед л утга учиртай.
  if (!isUuid(invoiceId)) {
    console.warn('[qpay] танихгүй callback — invoice_id буруу:', invoiceId)
    return
  }

  // Нэхэмжлэлийг ЭХЛЭЭД шалгана. Байхгүй бол бүртгэл ч хийхгүй — санамсаргүй
  // UUID илгээгээд хүснэгт дүүргэх боломжийг хаана.
  const { data: invoice } = await admin
    .from('invoices').select('*').eq('id', invoiceId).maybeSingle()

  if (!invoice) {
    console.warn('[qpay] танихгүй нэхэмжлэлийн callback:', invoiceId)
    return
  }

  // Юу ирснийг бүртгэнэ — маргаан гарвал энэ бол баримт
  await admin.from('payment_events').insert({
    invoice_id: invoiceId,
    provider: 'qpay',
    event_type: 'callback',
    raw_payload: { query, body },
  })

  if (invoice.status === 'paid' || !invoice.qpay_invoice_id) return

  const result = await checkPayment(invoice.qpay_invoice_id)
  if (result.paid && result.paidAmount >= invoice.amount_mnt) {
    await markPaid(invoice, { source: 'callback', ...result })
  }
}

// ============================================================
// Stripe (олон улсын карт — туршилтын горим)
// ============================================================

/** Нэхэмжлэлийг олж, дуудагчийнх мөн эсэхийг шалгана. */
async function ownedInvoice(req, invoiceId) {
  requireUuid(invoiceId, 'Нэхэмжлэлийн ID')

  const invoice = unwrap(
    await admin.from('invoices').select('*').eq('id', invoiceId).maybeSingle()
  )
  if (!invoice) throw notFound('Нэхэмжлэл олдсонгүй.')
  if (invoice.employer_id !== req.user.id && req.user.role !== 'admin') {
    throw forbidden('Энэ нэхэмжлэл танийх биш байна.')
  }
  return invoice
}

/** Stripe-ийн төлбөрийн хуудас үүсгэж, хаягийг нь буцаана. */
export async function createStripePayment(req, invoiceId, origin) {
  if (!isStripeConfigured()) {
    throw new ApiError(503, 'Картаар төлөх боломж одоогоор тохируулагдаагүй байна.')
  }

  const invoice = await ownedInvoice(req, invoiceId)
  if (invoice.status === 'paid') {
    return { alreadyPaid: true, invoice: toInvoice(invoice) }
  }

  // Буцах хаягийг клиентээс авна — вэб, апп, preview deploy бүр өөр домэйнтэй.
  const base = String(origin || '').replace(/\/$/, '')
  const session = await createCheckoutSession({
    invoiceId: invoice.id,
    amountMnt: invoice.amount_mnt,
    email: invoice.employer_email,
    successUrl: `${base}/employer/subscription?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/employer/subscription?stripe=cancel`,
  })

  await admin.from('payment_events').insert({
    invoice_id: invoice.id,
    provider: 'stripe',
    event_type: 'session_created',
    raw_payload: { sessionId: session.id, amount: session.amount, currency: session.currency },
  })

  return { url: session.url, sessionId: session.id }
}

/**
 * Stripe webhook. Нэвтрэлтгүй ирнэ.
 *
 * ⚠ QPay-ээс ялгаатай нь энд дахин "шалгах" дуудлага хийх шаардлагагүй:
 *   Stripe хүсэлт бүрийг хуваалцсан нууцаар гарын үсэг зурдаг тул гарын
 *   үсэг тааруулсан нь эх сурвалжийн баталгаа болно.
 */
export async function handleStripeWebhook(rawBody, signature) {
  const event = verifyWebhook(rawBody, signature)

  if (event.type !== 'checkout.session.completed') return { ignored: event.type }

  const session = event.data.object
  const invoiceId = session.client_reference_id || session.metadata?.invoice_id

  if (!isUuid(invoiceId)) {
    console.warn('[stripe] танихгүй сешн — invoice_id буруу:', invoiceId)
    return { ignored: 'bad_invoice_id' }
  }

  // Төлөгдөөгүй сешнийг үл тоомсорлоно (жишээ нь хугацаа дуусах үед)
  if (session.payment_status !== 'paid') {
    return { ignored: session.payment_status }
  }

  const invoice = unwrap(
    await admin.from('invoices').select('*').eq('id', invoiceId).maybeSingle()
  )
  if (!invoice) {
    console.warn('[stripe] нэхэмжлэл олдсонгүй:', invoiceId)
    return { ignored: 'invoice_not_found' }
  }
  if (invoice.status === 'paid') return { alreadyPaid: true }

  await markPaid(invoice, {
    source: 'stripe_webhook',
    sessionId: session.id,
    paymentIntent: session.payment_intent,
    amountTotal: session.amount_total,
    currency: session.currency,
  }, 'stripe')

  return { paid: true, invoiceId }
}

/**
 * Төлбөрийн хуудаснаас буцаж ирэхэд шалгах зам.
 *
 * Webhook нь локал орчинд `stripe listen`-гүйгээр ирдэггүй тул үзүүлэн
 * дундуур тасрахгүйн тулд энэ шууд зам хэрэгтэй. Аль нэг нь эхэлж
 * ажилласан ч `markPaid` доторх `.eq('status','pending')` нь давхардлаас
 * хамгаална.
 */
export async function checkStripeSession(req, invoiceId, sessionId) {
  if (!isStripeConfigured()) throw new ApiError(503, 'Stripe тохируулаагүй байна.')

  // Сешний ID-г ЭНД шалгана: эс тэгвээс Stripe SDK нь ойлгомжгүй алдаа
  // шидэж, хэрэглэгчид 500 болж харагдана.
  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    throw badRequest('Төлбөрийн сешний ID буруу байна.')
  }

  const invoice = await ownedInvoice(req, invoiceId)
  if (invoice.status === 'paid') return { paid: true, invoice: toInvoice(invoice) }

  const session = await retrieveSession(sessionId)

  // ⚠ Сешн ЯГ энэ нэхэмжлэлийнх мөн эсэхийг шалгана — үгүй бол хэрэглэгч
  //   өөр (хямд) нэхэмжлэлийн сешнээр энэ нэхэмжлэлийг хаах боломжтой.
  const ref = session.client_reference_id || session.metadata?.invoice_id
  if (ref !== invoice.id) throw forbidden('Энэ төлбөр өөр нэхэмжлэлийнх байна.')

  if (session.payment_status !== 'paid') {
    return { paid: false, invoice: toInvoice(invoice) }
  }

  const updated = await markPaid(invoice, {
    source: 'stripe_return',
    sessionId: session.id,
    paymentIntent: session.payment_intent,
    amountTotal: session.amount_total,
    currency: session.currency,
  }, 'stripe')

  return { paid: true, invoice: toInvoice(updated) }
}

// ------------------------------
// Туслах
// ------------------------------
/**
 * Нэхэмжлэлийг төлөгдсөн болгож, захиалгыг сунгана.
 * `confirm_invoice`-той ижил алхмуудыг хийнэ, гэхдээ админгүйгээр —
 * төлбөрийн үйлчилгээнээс баталгаа авсан үед л дуудагдана.
 */
async function markPaid(invoice, evidence, provider = 'qpay') {
  const now = new Date().toISOString()

  await admin.from('payment_events').insert({
    invoice_id: invoice.id,
    provider,
    event_type: 'paid',
    raw_payload: evidence,
  })

  // `.eq('status', 'pending')` нь давхар боловсруулахаас сэргийлнэ:
  // webhook болон "шалгах" товч зэрэг ажилласан ч нэг л удаа хэрэгжинэ.
  const { data: updated } = await admin
    .from('invoices')
    .update({ status: 'paid', paid_at: now })
    .eq('id', invoice.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle()

  // Өөр процесс аль хэдийн боловсруулсан бол дахин хийхгүй
  if (!updated) {
    const { data: current } = await admin
      .from('invoices').select('*').eq('id', invoice.id).single()
    return current
  }

  const graceUntil = new Date(new Date(invoice.period_end).getTime() + 14 * 86400_000)

  await admin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: invoice.period_start,
      current_period_end: invoice.period_end,
      grace_until: graceUntil.toISOString(),
    })
    .eq('employer_id', invoice.employer_id)

  await admin.from('notifications').insert({
    user_id: invoice.employer_id,
    type: 'success',
    message: 'Төлбөр амжилттай хийгдлээ',
    description: `Захиалга ${new Date(invoice.period_end).toLocaleDateString('mn-MN')} хүртэл сунгагдлаа.`,
  })

  return updated
}
