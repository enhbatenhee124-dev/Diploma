import { useState, useEffect, useRef } from 'react'
// ⚠ `AlertCircle` — lucide 0.294-т `CircleAlert` гэсэн нэр БАЙХГҮЙ
//   (тэр нь хожмын хувилбарын нэр). Notification.jsx-тэй ижил нэр ашиглав.
import { Bell, Check, CheckCheck, AlertCircle, Info, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../hooks/useData'

// ============================================================
// Мэдэгдлийн хонх (FR-8, NFR-6)
// ============================================================
// Хажуугийн зурвасны нэг хэсэг. Гурван дүрд ижил ажиллана.
//
// Зурвас нь нарийн (5rem) тул самбарыг дотор нь оруулах боломжгүй —
// `fixed` байрлалаар зурвасны хажууд хөвүүлнэ.
// ============================================================

const ICONS = {
  success: Check,
  error: AlertCircle,
  info: Info,
}

const TONES = {
  success: 'text-emerald-300',
  error: 'text-red-300',
  info: 'text-sky-300',
}

/** "3 цагийн өмнө" — огноог хүн уншихад ойлгомжтой болгоно. */
function timeAgo(iso) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return ''
  }
}

export default function NotificationBell({ iconCol, labelClass, idleClass, rail }) {
  const { items, unread, loading, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  // Гадуур дарахад хаана
  useEffect(() => {
    if (!open) return
    const onDown = e => {
      // Товчийг ӨӨРИЙГ нь оруулж тооцно. Үгүй бол товч дээр дарахад энэ
      // handler эхлээд хааж, дараа нь onClick дахин нээх гэж оролдоод
      // самбар анивчина.
      if (panelRef.current?.contains(e.target)) return
      if (buttonRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onEsc = e => e.key === 'Escape' && setOpen(false)

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        title={rail ? 'Мэдэгдэл' : undefined}
        aria-label={unread ? `Мэдэгдэл, ${unread} шинэ` : 'Мэдэгдэл'}
        className={`flex items-center h-12 w-full rounded-r-xl text-sm font-medium transition-colors ${idleClass}`}
      >
        <span className={`${iconCol} relative`}>
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-4 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full
                             bg-red-500 text-white text-[0.65rem] font-bold
                             flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        <span className={labelClass}>Мэдэгдэл</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed left-2 lg:left-24 top-20 z-[60] mt-safe
                     w-[min(22rem,calc(100vw-1rem))] max-h-[70vh] flex flex-col
                     rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl
                     shadow-2xl animate-slide-up"
        >
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Мэдэгдэл</h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-white/60 hover:text-white
                             px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Бүгдийг уншсан
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Хаах"
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-white/50">Ачаалж байна…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-white/50">Мэдэгдэл алга</p>
            ) : (
              items.map(n => {
                const Icon = ICONS[n.type] || Info
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className={`w-full text-left flex gap-3 p-4 border-b border-white/5
                                transition-colors hover:bg-white/5
                                ${n.isRead ? 'opacity-55' : ''}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${TONES[n.type] || TONES.info}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{n.message}</p>
                      {n.description && (
                        <p className="text-xs text-white/60 mt-0.5">{n.description}</p>
                      )}
                      <p className="text-[0.7rem] text-white/35 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </>
  )
}
