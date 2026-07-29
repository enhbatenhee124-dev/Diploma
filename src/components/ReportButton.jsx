import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'
import { createReport } from '../data/queries'
import { useNotification } from '../hooks/useNotification'

// ============================================================
// Мэдээлэх товч (FR-9.2)
// ============================================================
// Зар эсвэл хэрэглэгчийг админд мэдээлнэ. Ижил бүртгэлээс нэг зүйлийг
// хоёр удаа мэдээлэх боломжгүй (өгөгдлийн сангийн unique constraint) —
// сервер 409 буцаахад ойлгомжтой мессеж харуулна.
// ============================================================

const REASONS = [
  'Хуурамч эсвэл төөрөгдүүлсэн зар',
  'Цалин бодит бус',
  'Доромжилсон, зохисгүй агуулга',
  'Залилан гэж сэжиглэж байна',
  'Бусад',
]

export default function ReportButton({ targetType, targetId, label = 'Мэдээлэх', className = '' }) {
  const { notify } = useNotification()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [detail, setDetail] = useState('')
  const [sending, setSending] = useState(false)

  const close = () => {
    setOpen(false)
    setReason(REASONS[0])
    setDetail('')
  }

  const submit = async e => {
    e.preventDefault()

    // "Бусад" сонговол тайлбар заавал — эс тэгвээс админ юу болсныг мэдэхгүй
    const text = reason === 'Бусад' ? detail.trim() : [reason, detail.trim()].filter(Boolean).join(' — ')
    if (text.length < 3) {
      notify({ type: 'error', message: 'Шалтгаанаа бичнэ үү' })
      return
    }

    setSending(true)
    const result = await createReport({ targetType, targetId, reason: text })
    setSending(false)

    if (!result.ok) {
      notify({ type: 'error', message: 'Илгээж чадсангүй', description: result.error })
      return
    }

    notify({
      type: 'success',
      message: 'Мэдээлэл хүлээн авлаа',
      description: 'Админ хянаад шийдвэрлэнэ. Баярлалаа.',
    })
    close()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Админд мэдээлэх"
        className={`inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-red-300
                    transition-colors ${className}`}
      >
        <Flag className="w-3.5 h-3.5" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

          <form
            onSubmit={submit}
            className="relative w-full max-w-md rounded-2xl border border-white/15
                       bg-slate-900 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-300" />
                {targetType === 'shift' ? 'Зарыг мэдээлэх' : 'Хэрэглэгчийг мэдээлэх'}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Хаах"
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Шалтгаан</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15
                             text-white focus:outline-none focus:border-white/40"
                >
                  {REASONS.map(r => (
                    <option key={r} value={r} className="bg-slate-900">{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Дэлгэрэнгүй {reason === 'Бусад' && <span className="text-red-300">*</span>}
                </label>
                <textarea
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                  rows={3}
                  maxLength={900}
                  placeholder="Юу болсныг товч бичнэ үү…"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15
                             text-white placeholder-white/30 resize-none
                             focus:outline-none focus:border-white/40"
                />
              </div>

              <p className="text-xs text-white/40">
                Худал мэдээлэл өгөх нь таны бүртгэлд нөлөөлж болно.
              </p>
            </div>

            <div className="flex justify-end gap-2 p-5 pt-0">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 rounded-xl text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                Болих
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/90 hover:bg-red-500
                           text-white flex items-center gap-2 disabled:opacity-60 transition-colors"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                {sending ? 'Илгээж байна…' : 'Илгээх'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
