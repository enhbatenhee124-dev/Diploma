import { Loader2, AlertCircle, RefreshCw, Inbox } from 'lucide-react'

// ------------------------------
// Ачаалалт / алдаа / хоосон төлөвүүд
// ------------------------------
// Өгөгдөл одоо асинхроноор ирдэг тул эдгээр төлөвийг хуудас бүрт
// давхардуулан бичихгүйн тулд нэг дор цуглуулав.
// ------------------------------

export function Loading({ label = 'Ачаалж байна…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
      <p className="text-sm text-white/60">{label}</p>
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-300" />
      </div>
      <p className="font-medium text-white mb-1">Өгөгдөл ачаалж чадсангүй</p>
      <p className="text-sm text-white/60 mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white hover:bg-white/15 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Дахин оролдох
        </button>
      )}
    </div>
  )
}

export function Empty({ title, description, action }) {
  return (
    <div className="text-center py-14">
      <Inbox className="w-10 h-10 text-white/40 mx-auto mb-3" />
      <p className="font-medium text-white">{title}</p>
      {description && <p className="text-sm text-white/60 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Мөр бүхий жагсаалтын ачаалалтын хий үзэгдэл. */
export function SkeletonRows({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/[0.04] border border-white/10 animate-pulse" />
      ))}
    </div>
  )
}
