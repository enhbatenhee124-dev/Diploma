import { useState } from 'react'
import { format } from 'date-fns'
import { CreditCard, Copy, Check, Building2, Hash, Info, RefreshCw, QrCode, Smartphone } from 'lucide-react'
import { useSubscription, usePlan, useInvoices, combine } from '../../hooks/useData'
import { requestInvoice, checkInvoice } from '../../data/queries'
import { useNotification } from '../../hooks/useNotification'
import { Loading, ErrorBox } from '../../components/States'
import { BANK_ACCOUNT, paymentReference, SUBSCRIPTION_STATUS, INVOICE_STATUS } from '../../config/billing'

/** Хуулж авах боломжтой мөр. */
function CopyRow({ label, value, icon: Icon }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard хаалттай бол чимээгүй өнгөрөөнө — хэрэглэгч гараар хуулна
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-wrk-bg border border-wrk-border">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-white flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs wrk-text-body">{label}</p>
          <p className="font-medium text-white truncate">{value}</p>
        </div>
      </div>
      <button
        onClick={copy}
        aria-label={`${label} хуулах`}
        className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function Subscription() {
  const { notify } = useNotification()
  const subQ = useSubscription()
  const planQ = usePlan()
  const invQ = useInvoices()
  const { loading, error, refreshAll } = combine(subQ, planQ, invQ)
  const [creating, setCreating] = useState(false)
  const [checking, setChecking] = useState(false)

  const sub = subQ.data
  const plan = planQ.data
  const invoices = invQ.data
  const pending = invoices.find(i => i.status === 'pending')

  const handleRequest = async () => {
    setCreating(true)
    const result = await requestInvoice()
    setCreating(false)

    if (!result.ok) {
      notify({ type: 'error', message: 'Нэхэмжлэл үүсгэж чадсангүй', description: result.error })
      return
    }
    notify({ type: 'success', message: 'Нэхэмжлэл бэлэн', description: 'Доорх заавраар төлнө үү.' })
    invQ.refresh()
  }

  /**
   * "Төлсөн, шалгана уу" — QPay-ээс шууд баталгаажуулна.
   * Webhook саатсан эсвэл ирээгүй ч хэрэглэгч хүлээж суухгүй.
   */
  const handleCheck = async () => {
    if (!pending) return
    setChecking(true)
    const result = await checkInvoice(pending.id)
    setChecking(false)

    if (!result.ok) {
      notify({ type: 'error', message: 'Шалгаж чадсангүй', description: result.error })
      return
    }

    if (result.data?.paid) {
      notify({ type: 'success', message: 'Төлбөр баталгаажлаа', description: 'Захиалга сунгагдлаа.' })
      refreshAll()
    } else {
      notify({
        type: 'info',
        message: 'Төлбөр хараахан ороогүй байна',
        description: 'Банкнаас баталгаажихад 1-2 минут шаардаж болно. Дахин шалгана уу.',
      })
    }
  }

  if (loading) return <Loading label="Захиалгын мэдээлэл ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  const statusInfo = SUBSCRIPTION_STATUS[sub?.status] || SUBSCRIPTION_STATUS.expired

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold wrk-text-heading">Захиалга</h1>
        <p className="mt-1 wrk-text-body">Зуучлалын үйлчилгээний сарын багц.</p>
      </div>

      {/* Одоогийн төлөв */}
      <div className="wrk-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.tone}`}>
              {statusInfo.label}
            </span>
            <p className="text-3xl font-extrabold wrk-text-heading mt-3">
              {plan ? `${plan.priceMnt.toLocaleString('mn-MN')} ₮` : '—'}
              <span className="text-base font-medium wrk-text-body"> / сар</span>
            </p>
            {sub && (
              <p className="text-sm wrk-text-body mt-1">
                {sub.status === 'expired'
                  ? 'Шинэ зар нийтлэх боломжгүй болсон.'
                  : `${format(new Date(sub.periodEnd), 'yyyy-MM-dd')} хүртэл хүчинтэй`}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-sm wrk-text-body">Үлдсэн хугацаа</p>
            <p className="text-3xl font-extrabold wrk-text-heading">
              {sub?.daysLeft ?? 0}
              <span className="text-base font-medium wrk-text-body"> хоног</span>
            </p>
          </div>
        </div>

        {/* Юу болохыг тодорхой хэлнэ */}
        {sub && !sub.canPost && (
          <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
            <Info className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">
              Хугацаа дууссан тул <strong>шинэ зар нийтлэх боломжгүй</strong>. Одоо байгаа зар,
              ирсэн хүсэлтүүд хэвийн ажиллаж байна.
            </p>
          </div>
        )}
        {sub?.needsPayment && sub.canPost && (
          <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200">
              Төлбөрийн хугацаа хэтэрсэн. <strong>{format(new Date(sub.graceUntil), 'yyyy-MM-dd')}</strong>-с
              хойш шинэ зар нийтлэх боломжгүй болно.
            </p>
          </div>
        )}
      </div>

      {/* Төлөх */}
      <div className="wrk-card">
        <h2 className="text-lg font-semibold wrk-text-heading mb-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-white" /> Төлбөр төлөх
        </h2>
        <p className="text-sm wrk-text-body mb-5">
          Дансаар шилжүүлээд гүйлгээний утгад доорх кодыг бичнэ үү. Админ баталгаажуулмагц
          захиалга шууд сунгагдана.
        </p>

        {pending ? (
          <div className="space-y-5">
            {/* QPay — QR байвал энэ нь хамгийн хурдан зам */}
            {pending.qrImage && (
              <div className="p-4 rounded-xl bg-wrk-bg/50 border border-wrk-border">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium wrk-text-heading">QPay-ээр төлөх</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  <img
                    src={`data:image/png;base64,${pending.qrImage}`}
                    alt="QPay QR код"
                    className="w-40 h-40 rounded-lg bg-white p-2 flex-shrink-0"
                  />
                  <div className="text-sm wrk-text-body space-y-2">
                    <p className="flex items-start gap-2">
                      <Smartphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      Банкны апп (Хаан, Голомт, ХХБ, Төрийн банк) эсвэл Monpay/SocialPay-ээр
                      QR-ыг уншуулна уу.
                    </p>
                    <p>Төлсний дараа доорх товчийг дарж баталгаажуулна.</p>
                  </div>
                </div>

                <button
                  onClick={handleCheck}
                  disabled={checking}
                  className="wrk-btn-primary mt-4 flex items-center gap-2 disabled:opacity-60"
                >
                  {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {checking ? 'Шалгаж байна…' : 'Төлсөн, шалгана уу'}
                </button>
              </div>
            )}

            {/* Дансаар шилжүүлэх — QPay байхгүй үед ганц зам, байсан ч нөөц зам */}
            <div className="space-y-3">
              {pending.qrImage && (
                <p className="text-sm font-medium wrk-text-heading">Эсвэл дансаар шилжүүлэх</p>
              )}
              <CopyRow label="Банк" value={BANK_ACCOUNT.bank} icon={Building2} />
              <CopyRow label="Дансны дугаар" value={BANK_ACCOUNT.number} icon={CreditCard} />
              <CopyRow label="Хүлээн авагч" value={BANK_ACCOUNT.holder} icon={Building2} />
              <CopyRow label="Дүн" value={`${pending.amountMnt.toLocaleString('mn-MN')} ₮`} icon={Hash} />
              <CopyRow label="Гүйлгээний утга" value={paymentReference(pending)} icon={Hash} />

              <p className="text-xs wrk-text-body pt-2">
                Нэхэмжлэлийн хугацаа: {format(new Date(pending.dueAt), 'yyyy-MM-dd HH:mm')} хүртэл
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={creating}
            className="wrk-btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {creating ? 'Үүсгэж байна…' : 'Нэхэмжлэл үүсгэх'}
          </button>
        )}

        {pending && !pending.qrImage && (
          <p className="text-xs wrk-text-body mt-5 pt-4 border-t border-wrk-border">
            QPay-ийн QR идэвхжээгүй байна. Дансаар шилжүүлээд админд мэдэгдэнэ үү —
            баталгаажмагц захиалга сунгагдана.
          </p>
        )}
      </div>

      {/* Түүх */}
      <div className="wrk-card">
        <h2 className="text-lg font-semibold wrk-text-heading mb-4">Төлбөрийн түүх</h2>

        {invoices.length === 0 ? (
          <p className="text-center py-8 wrk-text-body text-sm">Нэхэмжлэл байхгүй байна.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => {
              const info = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-wrk-bg border border-wrk-border"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {inv.amountMnt.toLocaleString('mn-MN')} ₮
                    </p>
                    <p className="text-xs wrk-text-body">
                      {format(new Date(inv.periodStart), 'yyyy-MM-dd')} –{' '}
                      {format(new Date(inv.periodEnd), 'yyyy-MM-dd')}
                      {inv.paidAt && ` · төлсөн ${format(new Date(inv.paidAt), 'yyyy-MM-dd')}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${info.tone}`}>
                    {info.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
