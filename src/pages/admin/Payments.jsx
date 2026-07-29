import { useState } from 'react'
import { format } from 'date-fns'
import { Check, Search, CreditCard, Hash } from 'lucide-react'
import { useInvoices } from '../../hooks/useData'
import { confirmInvoice } from '../../data/queries'
import { useNotification } from '../../hooks/useNotification'
import { Loading, ErrorBox, Empty } from '../../components/States'
import { paymentReference, INVOICE_STATUS } from '../../config/billing'

const filters = [
  { value: 'pending', label: 'Хүлээгдэж буй' },
  { value: 'paid', label: 'Төлөгдсөн' },
  { value: 'all', label: 'Бүгд' },
]

export default function Payments() {
  const { notify } = useNotification()
  const { data: invoices, loading, error, refresh } = useInvoices()
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState(null)

  const handleConfirm = async invoice => {
    const ok = confirm(
      `${invoice.employerName}-ийн ${invoice.amountMnt.toLocaleString('mn-MN')} ₮ төлбөрийг ` +
      `баталгаажуулах уу?\n\nГүйлгээний утга: ${paymentReference(invoice)}\n\n` +
      `Захиалга ${format(new Date(invoice.periodEnd), 'yyyy-MM-dd')} хүртэл сунгагдана.`
    )
    if (!ok) return

    setConfirming(invoice.id)
    const result = await confirmInvoice(invoice.id, 'Дансаар шилжүүлсэн')
    setConfirming(null)

    if (!result.ok) {
      notify({ type: 'error', message: 'Баталгаажуулж чадсангүй', description: result.error })
      return
    }
    notify({
      type: 'success',
      message: 'Төлбөр баталгаажлаа',
      description: `${invoice.employerName}-ийн захиалга сунгагдлаа.`,
    })
    refresh()
  }

  const filtered = invoices.filter(inv => {
    const matchStatus = filter === 'all' || inv.status === filter
    const term = search.toLowerCase().trim()
    const matchSearch = !term
      || inv.employerName?.toLowerCase().includes(term)
      || inv.employerPhone?.includes(term)
      || paymentReference(inv).toLowerCase().includes(term)
    return matchStatus && matchSearch
  })

  const pendingTotal = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amountMnt, 0)

  const paidTotal = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountMnt, 0)

  if (loading) return <Loading label="Төлбөрүүд ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refresh} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Төлбөр</h1>
        <p className="mt-1 adm-text-body">Дансаар ирсэн төлбөрийг баталгаажуулна.</p>
      </div>

      {/* Тойм */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Хүлээгдэж буй', value: `${pendingTotal.toLocaleString('mn-MN')} ₮`, Icon: Hash },
          { label: 'Нийт орлого', value: `${paidTotal.toLocaleString('mn-MN')} ₮`, Icon: CreditCard },
          { label: 'Нэхэмжлэл', value: invoices.length, Icon: Hash },
        ].map(s => (
          <div key={s.label} className="adm-card">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-3">
              <s.Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs adm-text-body">{s.label}</p>
            <p className="text-2xl font-extrabold adm-text-heading">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Шүүлтүүр */}
      <div className="adm-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
            <input
              type="text"
              placeholder="Нэр, утас, гүйлгээний утгаар хайх..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="adm-input pl-10"
            />
          </div>
          <div className="flex gap-2">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.value ? 'bg-adm-accent text-white' : 'bg-white/5 adm-text-body hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty title="Нэхэмжлэл олдсонгүй" description="Шүүлтүүрээ өөрчилж үзнэ үү." />
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => {
              const info = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending
              return (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-adm-bg border border-adm-border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium adm-text-heading truncate">{inv.employerName}</p>
                    <p className="text-xs adm-text-body">
                      {inv.employerPhone || inv.employerEmail || '—'}
                      {' · '}
                      <span className="font-mono">{paymentReference(inv)}</span>
                    </p>
                    <p className="text-xs adm-text-body mt-0.5">
                      {format(new Date(inv.periodStart), 'yyyy-MM-dd')} –{' '}
                      {format(new Date(inv.periodEnd), 'yyyy-MM-dd')}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold adm-text-heading">
                      {inv.amountMnt.toLocaleString('mn-MN')} ₮
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${info.tone}`}>
                      {info.label}
                    </span>
                  </div>

                  {inv.status === 'pending' && (
                    <button
                      onClick={() => handleConfirm(inv)}
                      disabled={confirming === inv.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-sm text-emerald-200 hover:bg-emerald-500/25 transition-colors disabled:opacity-60 flex-shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      {confirming === inv.id ? 'Түр хүлээнэ үү…' : 'Баталгаажуулах'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
