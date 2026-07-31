import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

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

export function Toast({ message, description, type = 'success', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration === 0) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const Icon = icons[type] || Info

  return (
    <div
      role="status"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl
                  bg-slate-900/90 animate-slide-up ${colors[type] || colors.info}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{message}</p>
        {description && <p className="text-xs mt-0.5 opacity-90 break-words">{description}</p>}
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white">
        <X className="w-4 h-4" />
      </button>
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
