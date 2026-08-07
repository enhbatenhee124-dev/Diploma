import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const colors = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
  error: 'bg-red-500/15 border-red-500/30 text-red-200',
  info: 'bg-blue-500/15 border-blue-500/30 text-blue-200',
}

// Гарах анимацын үргэлжлэх хугацаа. `slideOutRight` keyframe-тэй ЯГ таарах
// ёстой — эс бөгөөс toast нь анимацаа дуусгалгүй алга болно.
const EXIT_MS = 220

export function Toast({ message, description, type = 'success', onClose, duration = 5000 }) {
  // Хаагдах үед шууд DOM-оос авахгүй, эхлээд гарах анимацаа тоглуулна.
  const [leaving, setLeaving] = useState(false)
  const timers = useRef([])

  const dismiss = useCallback(() => {
    setLeaving(true)
    timers.current.push(setTimeout(onClose, EXIT_MS))
  }, [onClose])

  useEffect(() => {
    if (duration === 0) return
    const t = setTimeout(dismiss, duration)
    timers.current.push(t)
    return () => clearTimeout(t)
  }, [duration, dismiss])

  // Компонент устахад үлдсэн бүх таймерыг цэвэрлэнэ — эс бөгөөс салсан
  // компонент дээр `onClose` дуудагдаж React анхааруулга өгнө.
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const Icon = icons[type] || Info

  return (
    <div
      role="status"
      className={`relative overflow-hidden flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl
                  bg-slate-900/90 ${leaving ? 'animate-slide-out-right' : 'animate-slide-in-right'}
                  ${colors[type] || colors.info}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pop-in" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{message}</p>
        {description && <p className="text-xs mt-0.5 opacity-90 break-words">{description}</p>}
      </div>
      <button
        onClick={dismiss}
        aria-label="Хаах"
        className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors press"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Доод ирмэг дэх зурвас нь өөрөө хаагдах хүртэлх хугацааг харуулна.
          `scaleX`-ээр агшдаг тул хөтөч зөвхөн композит хийнэ — layout
          дахин тооцохгүй. */}
      {duration > 0 && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.5 w-full bg-white/40 origin-left animate-countdown"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  )
}

/** Дэлгэцийн баруун дээд буланд байрлах toast-уудын хураангуй. */
export default function NotificationContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[min(22rem,calc(100vw-2rem))] mt-safe">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => onDismiss(toast.id)} />
      ))}
    </div>
  )
}
