import { useEffect, useMemo, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { defaultTitle } from '../utils/gamification'
import { GameIcon } from './Gamification'

// ------------------------------
// Түвшин ахих баяр
// ------------------------------
// Хэрэглэгч ажил дуусгаж XP цуглуулдаг ч түвшин ахих МӨЧ нь өмнө нь огт
// мэдрэгддэггүй байсан — зүгээр л дараагийн ачаалалт дээр тоо өөрчлөгдөнө.
// Энэ нь тоглоомжуулалтын хамгийн үнэ цэнэтэй мөчийг дэмий үрж байна.
//
// Тиймээс өмнө харсан түвшинг хадгалж, өссөн үед нэг удаа баярлана.
// ------------------------------

const STORAGE_PREFIX = 'mj:levelSeen:'

/**
 * Түвшин ахисан эсэхийг илрүүлнэ.
 *
 * ⚠ Анх орж ирсэн хэрэглэгчид баярлахгүй: хадгалсан утга байхгүй бол зүгээр
 *   л одоогийн түвшинг тэмдэглээд өнгөрнө. Эс бөгөөс Lv.3 хэрэглэгч анх
 *   нэвтрэхэд «Lv.1 → Lv.3 ахилаа» гэсэн худал баяр гарна.
 */
export function useLevelUp(userId, level) {
  const [from, setFrom] = useState(null)

  useEffect(() => {
    // Өгөгдөл ачаалагдаж дуустал `level` нь undefined байж болно.
    if (!userId || typeof level !== 'number' || level < 1) return

    const key = STORAGE_PREFIX + userId
    let seen
    // Нууцлалын горимд localStorage хаалттай байж болзошгүй — унавал
    // баяр алдагдана, гэхдээ хуудас унахгүй.
    try {
      seen = window.localStorage.getItem(key)
    } catch {
      return
    }

    const previous = seen === null ? null : Number(seen)

    if (previous !== null && level > previous) setFrom(previous)

    if (previous === null || level !== previous) {
      try {
        window.localStorage.setItem(key, String(level))
      } catch { /* хадгалж чадахгүй бол дараагийн удаа дахин баярлаж магадгүй */ }
    }
  }, [userId, level])

  return { from, dismiss: () => setFrom(null) }
}

/** Хөдөлгөөн багасгасан хэрэглэгчид цаас шидэхгүй. */
function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const CONFETTI_COLORS = ['#a855f7', '#22d3ee', '#f472b6', '#facc15', '#34d399']

function Confetti({ count = 34 }) {
  // Санамсаргүй утгыг НЭГ Л удаа тооцно — эс бөгөөс дахин зурагдах бүрд
  // цааснууд байрлалаа сольж, унаж буй хөдөлгөөн нь тасалдана.
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      dx: `${(Math.random() - 0.5) * 240}px`,
      rot: `${Math.random() * 900 - 450}deg`,
      dur: `${1.8 + Math.random() * 1.4}s`,
      delay: `${Math.random() * 0.5}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })),
    [count],
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            background: p.color,
            '--dx': p.dx,
            '--rot': p.rot,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Түвшин ахисныг мэдэгдэх бүрэн дэлгэцийн давхарга.
 *
 * @param {number} from  Өмнөх түвшин
 * @param {number} to    Шинэ түвшин
 */
export default function LevelUpOverlay({ from, to, onClose }) {
  const title = defaultTitle(to)
  const previousTitle = defaultTitle(from)
  const titleChanged = title.label !== previousTitle.label

  // 6 секундын дараа өөрөө хаагдана — хэрэглэгч дарах шаардлагагүй.
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  // Escape товчоор хаах — гараар ажилладаг хэрэглэгчид зайлшгүй.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Түвшин ${to} боллоо`}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4
                 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      {!reducedMotion() && <Confetti />}

      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm text-center rounded-3xl border border-white/15
                   bg-gradient-to-br from-violet-600/30 via-slate-900 to-slate-900
                   p-8 shadow-2xl animate-pop-in"
      >
        <button
          onClick={onClose}
          aria-label="Хаах"
          className="absolute top-3 right-3 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors press"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Түвшин ахилаа
        </span>

        {/* Тэлэн бүдгэрэх цагираг нь тоо руу анхаарал татна */}
        <div className="relative flex items-center justify-center mb-5">
          <span className="absolute w-28 h-28 rounded-full bg-violet-500/30 animate-pulse-ring" />
          <span className="relative flex items-baseline gap-2">
            <span className="text-lg font-semibold text-white/40 line-through">{from}</span>
            <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-violet-300 to-cyan-300">
              {to}
            </span>
          </span>
        </div>

        {titleChanged ? (
          <>
            <p className="text-sm text-white/60">Шинэ цол нээгдлээ</p>
            <p className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-white">
              <GameIcon name={title.icon} className="w-5 h-5" />
              {title.label}
            </p>
          </>
        ) : (
          <p className="text-sm text-white/70">
            Дараагийн цол хүртэл үргэлжлүүлээрэй.
          </p>
        )}

        <p className="mt-4 text-xs text-white/50">
          Илүү өндөр цалинтай ажлууд нээгдсэн байж магадгүй.
        </p>
      </div>
    </div>
  )
}
