import { useState } from 'react'
import { format } from 'date-fns'
import { Flag, Briefcase, User, Check, EyeOff, Ban, Loader2 } from 'lucide-react'
import { useReports, useShifts, useProfilesWithContact, combine } from '../../hooks/useData'
import { resolveReport, deactivateUser } from '../../data/queries'
import { useNotification } from '../../hooks/useNotification'
import { Loading, ErrorBox, Empty } from '../../components/States'

// ============================================================
// Хяналт — ирсэн мэдээллүүд (FR-9.2)
// ============================================================
// Нэг зүйл дээр олон хүн мэдээлсэн бол тэдгээрийг НЭГТГЭЖ харуулна:
// 5 хүн нэг зарыг мэдээлсэн нь 5 тусдаа мөр байхаас илүү чухал дохио.
// ============================================================

const STATUS = {
  open: { label: 'Шинэ', tone: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
  reviewing: { label: 'Хянаж буй', tone: 'text-sky-300 bg-sky-500/10 border-sky-500/25' },
  resolved: { label: 'Шийдэгдсэн', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' },
  dismissed: { label: 'Няцаасан', tone: 'text-white/50 bg-white/5 border-white/15' },
}

const TABS = [
  { value: 'open', label: 'Шийдвэрлээгүй' },
  { value: 'all', label: 'Бүгд' },
]

export default function Moderation() {
  const { notify } = useNotification()
  const reportsQ = useReports()
  const shiftsQ = useShifts()
  const usersQ = useProfilesWithContact()
  const { loading, error, refreshAll } = combine(reportsQ, shiftsQ, usersQ)

  const [tab, setTab] = useState('open')
  const [busy, setBusy] = useState(null)

  if (loading) return <Loading label="Мэдээллүүд ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  /** Мэдээлсэн зүйл юу болохыг нэрлэнэ. */
  const describe = report => {
    if (report.targetType === 'shift') {
      const shift = shiftsQ.data.find(s => s.id === report.targetId)
      return { icon: Briefcase, title: shift?.title || 'Устгагдсан зар', sub: shift?.district }
    }
    const person = usersQ.data.find(u => u.id === report.targetId)
    return { icon: User, title: person?.name || 'Устгагдсан хэрэглэгч', sub: person?.phone }
  }

  // Нэг зорилтод ирсэн мэдээллүүдийг нэгтгэнэ
  const grouped = Object.values(
    reportsQ.data.reduce((acc, r) => {
      const key = `${r.targetType}:${r.targetId}`
      acc[key] ??= { key, targetType: r.targetType, targetId: r.targetId, reports: [] }
      acc[key].reports.push(r)
      return acc
    }, {})
  )
    .map(g => ({
      ...g,
      // Бүлгийн төлөв = хамгийн "шийдвэрлээгүй" мөрийнх
      pending: g.reports.filter(r => r.status === 'open' || r.status === 'reviewing'),
      latest: g.reports.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)),
    }))
    .filter(g => (tab === 'open' ? g.pending.length > 0 : true))
    .sort((a, b) => b.reports.length - a.reports.length || (b.latest.createdAt > a.latest.createdAt ? 1 : -1))

  const resolveGroup = async (group, status) => {
    setBusy(group.key)
    // Бүлгийн БҮХ шийдвэрлээгүй мөрийг нэг дор хаана — админ нэг зүйлийг
    // 5 удаа дарах шаардлагагүй
    const results = await Promise.all(
      group.pending.map(r => resolveReport(r.id, status, null))
    )
    setBusy(null)

    const failed = results.find(r => !r.ok)
    if (failed) {
      notify({ type: 'error', message: 'Шийдвэрлэж чадсангүй', description: failed.error })
      return
    }
    notify({ type: 'success', message: status === 'dismissed' ? 'Няцаалаа' : 'Шийдвэрлэлээ' })
    reportsQ.refresh()
  }

  const blockUser = async group => {
    const reasons = group.reports.map(r => r.reason).join(' | ')

    // ⚠ Сануулга нь `ManageUsers`-тэй ижил дэлгэрэнгүй байх ёстой.
    //   Өмнө нь зөвхөн "нэвтэрч чадахаа болино" гэдэг байсан бөгөөд админ
    //   утас, и-мэйл, нэр нь БҮРМӨСӨН арчигдахыг мэдэлгүй дардаг байв.
    const { title } = describe(group.latest)
    const ok = confirm(
      `${title}-н бүртгэлийг хаах уу?\n\n` +
      '• Утас, и-мэйл, нэр, танилцуулга нь УСТАНА\n' +
      '• Идэвхтэй зар, хүсэлт нь хаагдана\n' +
      '• Ажлын түүх, үнэлгээ нь баримт болж үлдэнэ\n\n' +
      'Энэ үйлдлийг БУЦААХ БОЛОМЖГҮЙ.'
    )
    if (!ok) return

    setBusy(group.key)
    const result = await deactivateUser(group.targetId, reasons.slice(0, 500))
    if (result.ok) await Promise.all(group.pending.map(r => resolveReport(r.id, 'resolved', 'Бүртгэл хаагдсан')))
    setBusy(null)

    if (!result.ok) {
      notify({ type: 'error', message: 'Хааж чадсангүй', description: result.error })
      return
    }
    notify({ type: 'success', message: 'Бүртгэл хаагдлаа' })
    refreshAll()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Хяналт</h1>
        <p className="mt-1 adm-text-body">Хэрэглэгчдээс ирсэн мэдээллийг шийдвэрлэнэ.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border
                        ${tab === t.value
                          ? 'bg-adm-accent/20 text-white border-adm-accent/35'
                          : 'text-white/60 border-transparent hover:bg-white/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <Empty
          title={tab === 'open' ? 'Шийдвэрлээгүй мэдээлэл алга' : 'Мэдээлэл алга'}
          description="Хэрэглэгчид зар, бусад хэрэглэгчийг мэдээлбэл энд харагдана."
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(group => {
            const { icon: Icon, title, sub } = describe(group.latest)
            const status = STATUS[group.pending[0]?.status || group.latest.status]
            const isBusy = busy === group.key

            return (
              <div key={group.key} className="adm-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-300" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold adm-text-heading">{title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${status.tone}`}>
                          {status.label}
                        </span>
                        {group.reports.length > 1 && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/25">
                            {group.reports.length} мэдээлэл
                          </span>
                        )}
                      </div>
                      {sub && <p className="text-sm adm-text-body mt-0.5">{sub}</p>}
                      <p className="text-xs text-white/35 mt-1">
                        Сүүлд: {format(new Date(group.latest.createdAt), 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                  </div>

                  {group.pending.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => resolveGroup(group, 'dismissed')}
                        disabled={isBusy}
                        className="px-3 py-2 rounded-xl text-sm text-white/70 border border-white/15
                                   hover:bg-white/10 flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <EyeOff className="w-4 h-4" /> Няцаах
                      </button>
                      <button
                        onClick={() => resolveGroup(group, 'resolved')}
                        disabled={isBusy}
                        className="px-3 py-2 rounded-xl text-sm text-emerald-200 border border-emerald-500/30
                                   bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Шийдэгдсэн
                      </button>
                      {group.targetType === 'user' && (
                        <button
                          onClick={() => blockUser(group)}
                          disabled={isBusy}
                          className="px-3 py-2 rounded-xl text-sm text-red-200 border border-red-500/30
                                     bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <Ban className="w-4 h-4" /> Бүртгэл хаах
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Шалтгаанууд */}
                <ul className="mt-4 pt-4 border-t border-adm-border space-y-2">
                  {group.reports.map(r => (
                    <li key={r.id} className="flex gap-2 text-sm">
                      <Flag className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-1" />
                      <div>
                        <p className="adm-text-body">{r.reason}</p>
                        {r.adminNote && (
                          <p className="text-xs text-white/40 mt-0.5">Тэмдэглэл: {r.adminNote}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
