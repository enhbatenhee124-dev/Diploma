import { AlertCircle, RefreshCw, Inbox } from 'lucide-react'

// ------------------------------
// Ачаалалт / алдаа / хоосон төлөвүүд
// ------------------------------
// Өгөгдөл асинхроноор ирдэг тул эдгээр төлөвийг хуудас бүрт давхардуулан
// бичихгүйн тулд нэг дор цуглуулав.
//
// Ачаалалтыг эргэлдэх дугуйгаар бус ХИЙ ҮЗЭГДЛЭЭР (skeleton) харуулах нь
// дээр: хэрэглэгч агуулга хаана, ямар хэлбэртэй гарахыг урьдчилан хараад
// хүлээлт нь богино мэт санагддаг. Мөн дэлгэц үсрэхгүй — хий үзэгдэл нь
// бодит агуулгатай ойролцоо өндөртэй.
// ------------------------------

/** Хий үзэгдлийн нэг тэгш өнцөгт. Өргөн/өндрийг Tailwind классаар өгнө. */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

/** Мөр бүхий жагсаалтын ачаалалтын хий үзэгдэл. */
export function SkeletonList({ rows = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Карт хэлбэрийн хий үзэгдэл — самбар, статистикийн хайрцагт. */
export function SkeletonCards({ count = 3, className = 'grid grid-cols-1 sm:grid-cols-3 gap-4' }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      ))}
    </div>
  )
}

/**
 * Ерөнхий ачаалалтын төлөв.
 *
 * `skeleton` пропоор дамжуулж тухайн хуудсанд тохирсон хий үзэгдэл өгч
 * болно; өгөөгүй бол ерөнхий гурван карт + жагсаалт харуулна.
 */
export function Loading({ label = 'Ачаалж байна…', skeleton }) {
  return (
    <div className="space-y-5 animate-fade-in" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {skeleton || (
        <>
          <Skeleton className="h-9 w-56 rounded-xl" />
          <SkeletonCards />
          <SkeletonList rows={3} />
        </>
      )}
    </div>
  )
}

/**
 * Богино хүлээлтэд зориулсан жижиг тэмдэг (skeleton хэт их байх газарт).
 * Гадуур нь тэлж бүдгэрэх цагираг — «амьд» гэдгийг мэдэгдэнэ.
 */
export function Spinner({ className = 'w-8 h-8', label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4" role="status">
      <span className="relative flex items-center justify-center">
        <span className={`absolute rounded-full bg-white/20 animate-pulse-ring ${className}`} />
        <span
          className={`relative rounded-full border-2 border-white/15 border-t-white animate-spin ${className}`}
        />
      </span>
      {label && <p className="text-sm text-white/60 animate-pulse">{label}</p>}
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto text-center py-16 animate-fade-up">
      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4 animate-pop-in">
        <AlertCircle className="w-6 h-6 text-red-300" />
      </div>
      <p className="font-medium text-white mb-1">Өгөгдөл ачаалж чадсангүй</p>
      <p className="text-sm text-white/60 mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white hover:bg-white/15 transition-colors press"
        >
          {/* Товч дээр хулгана хүрэхэд сум эргэнэ — «дахин оролдоно» гэдгийг
              үгээс өмнө хөдөлгөөнөөр хэлнэ. */}
          <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
          Дахин оролдох
        </button>
      )}
    </div>
  )
}

export function Empty({ title, description, action }) {
  return (
    <div className="text-center py-14 animate-fade-up">
      <Inbox className="w-10 h-10 text-white/40 mx-auto mb-3 animate-float" />
      <p className="font-medium text-white">{title}</p>
      {description && <p className="text-sm text-white/60 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
