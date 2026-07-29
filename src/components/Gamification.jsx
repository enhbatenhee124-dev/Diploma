import { Link } from 'react-router-dom'
import {
  Lock, Sparkles, TrendingUp, Trophy, Activity, Flame, Star, Heart, Timer,
  Rocket, Award, Sprout, BookOpen, Zap, HeartHandshake, Target, Gem, Crown, Circle,
} from 'lucide-react'
import {
  TITLES, THEMES, FRAMES, BANNERS,
  defaultTitle, resolveChoice,
} from '../utils/gamification'

// ------------------------------
// Дүрсний бүртгэл
// ------------------------------
// gamification.js нь дүрсийг нэрээр (мөр) заадаг. Энд түүнийг бодит
// компонент руу хөрвүүлнэ. Бүх дүрс ЦАГААН — өнгө нь зөвхөн төлөв
// (түгжээтэй/авсан) илэрхийлэхэд ашиглагдана.
const ICONS = {
  sparkles: Sparkles, activity: Activity, flame: Flame, star: Star,
  heart: Heart, timer: Timer, rocket: Rocket, award: Award, trophy: Trophy,
  sprout: Sprout, book: BookOpen, zap: Zap, handshake: HeartHandshake,
  target: Target, gem: Gem, crown: Crown,
}

/** Нэрээр дүрс гаргана. Олдоогүй бол дугуй тэмдэг. */
export function GameIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICONS[name] || Circle
  return <Icon className={className} />
}

// ------------------------------
// Хэрэглэгчийн сонгосон гоёолтыг level-ээр шүүж буцаана
// ------------------------------
export function resolveLook(cosmetics = {}, level = 1) {
  return {
    theme: resolveChoice(THEMES, cosmetics.themeId, level),
    frame: resolveChoice(FRAMES, cosmetics.frameId, level),
    banner: resolveChoice(BANNERS, cosmetics.bannerId, level),
    title: resolveChoice(TITLES, cosmetics.titleId, level) || defaultTitle(level),
  }
}

// ------------------------------
// Аватар + нээгдсэн хүрээ + level тэмдэг
// ------------------------------
export function AvatarWithFrame({ user, level, frame, size = 'md', showLevel = true }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }
  const initials = (user?.name || '?')
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="relative inline-block flex-shrink-0">
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className={`${sizes[size]} rounded-full object-cover ${frame?.ring || ''}`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-white/10 flex items-center justify-center
                      font-bold text-white ${frame?.ring || ''}`}
        >
          {initials}
        </div>
      )}
      {showLevel && (
        <span
          className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-900
                     border border-white/20 text-[10px] font-bold text-white shadow"
        >
          Lv.{level}
        </span>
      )}
    </div>
  )
}

// ------------------------------
// EXP явцын мөр
// ------------------------------
export function LevelProgress({ progress, theme, compact = false }) {
  const { level, exp, intoLevel, neededForNext, progress: pct, nextLevelExp, currentLevelExp } = progress
  const span = nextLevelExp - currentLevelExp

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-1.5 gap-3">
        <span className={`font-bold text-white ${compact ? 'text-sm' : 'text-base'}`}>
          Түвшин {level}
        </span>
        <span className={`text-white/80 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {intoLevel.toLocaleString('mn-MN')} / {span.toLocaleString('mn-MN')} EXP
        </span>
      </div>

      <div className={`w-full rounded-full bg-white/15 overflow-hidden ${compact ? 'h-2' : 'h-3'}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${theme?.gradient || 'from-violet-500 to-fuchsia-500'} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!compact && (
        <p className="text-xs text-white/80 mt-1.5">
          {neededForNext > 0
            ? `Дараагийн түвшин хүртэл ${neededForNext.toLocaleString('mn-MN')} EXP · Нийт ${exp.toLocaleString('mn-MN')} EXP`
            : `Хамгийн дээд түвшин! Нийт ${exp.toLocaleString('mn-MN')} EXP`}
        </p>
      )}
    </div>
  )
}

// ------------------------------
// Хэрэглэгчийн толгой хэсэг (баннер + аватар + цол + EXP)
// ------------------------------
export function ProfileHero({ user, progress, look, subtitle, children }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${look.banner.className} p-6 sm:p-8`}>
      {/* Гэрэлтүүлэг */}
      <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-black/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <AvatarWithFrame user={user} level={progress.level} frame={look.frame} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate">{user?.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold text-white whitespace-nowrap">
              <GameIcon name={look.title.icon} className="w-3.5 h-3.5" />
              {look.title.label}
            </span>
          </div>
          {subtitle && <p className="text-white/85 text-sm mb-4">{subtitle}</p>}
          <div className="max-w-md">
            <LevelProgress progress={progress} theme={look.theme} />
          </div>
        </div>

        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  )
}

// ------------------------------
// Дугуй EXP бөгж
// ------------------------------
export function LevelRing({ progress, look, size = 190 }) {
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress.progress / 100)
  const gradientId = `ring-${look.theme.id}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" className="text-emp-accent" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-white/8"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`url(#${gradientId})`} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.55))' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] uppercase tracking-widest text-white/50">Түвшин</span>
        <span className="text-4xl font-extrabold text-white leading-none">{progress.level}</span>
        <span className="text-xs text-white/60 mt-1">
          {progress.exp.toLocaleString('mn-MN')} EXP
        </span>
      </div>
    </div>
  )
}

// ------------------------------
// Даалгаврын мөр (явцын хувьтай)
// ------------------------------
export function QuestRow({ quest }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/10 p-3.5 hover:bg-white/[0.07] transition-colors">
      {/* Явцыг арын дүүргэлтээр илэрхийлнэ */}
      <div
        className="absolute inset-y-0 left-0 bg-emp-accent/10 transition-all duration-700"
        style={{ width: `${quest.percent}%` }}
      />
      <div className="relative flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
          <GameIcon name={quest.icon} className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{quest.hint}</p>
          <p className="text-xs text-white/55 mt-0.5">
            {quest.current.toLocaleString('mn-MN')} / {quest.goal.toLocaleString('mn-MN')} {quest.unit}
          </p>
        </div>
        <span className={`text-sm font-bold flex-shrink-0 ${quest.percent > 0 ? 'text-emp-accent' : 'text-white/40'}`}>
          {quest.percent}%
        </span>
      </div>
    </div>
  )
}

// ------------------------------
// Амжилтын тэмдгүүд
// ------------------------------
export function BadgeGrid({ badges, limit }) {
  const shown = limit ? badges.slice(0, limit) : badges

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {shown.map(badge => (
        <div
          key={badge.id}
          title={badge.earned ? badge.label : `Түгжээтэй — ${badge.hint}`}
          className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
            badge.earned
              ? 'bg-white/10 border-white/25 hover:bg-white/15'
              : 'bg-white/[0.03] border-white/10 opacity-50'
          }`}
        >
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 text-white
                        ${badge.earned ? 'bg-white/15' : 'bg-white/[0.06]'}`}
          >
            <GameIcon name={badge.icon} className="w-4 h-4" />
          </span>
          <span className="text-[11px] font-medium text-white leading-tight">{badge.label}</span>
          {badge.earned ? (
            <span className="text-[10px] text-emerald-300 mt-1">Авсан</span>
          ) : (
            <span className="text-[10px] text-white/50 mt-1">{badge.percent}%</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ------------------------------
// Тэргүүлэгчдийн жагсаалт
// ------------------------------
export function RankingList({ entries, currentUserId, limit, accentClass = 'bg-white/10' }) {
  const shown = limit ? entries.slice(0, limit) : entries
  const me = entries.find(e => e.userId === currentUserId)
  const meOutside = me && limit && me.rank > limit

  const Row = ({ entry, highlight }) => {
    // Эхний гурав нь өнгөт тойрогтой, бусад нь зөвхөн дугаар
    const medalTone = { 1: 'bg-amber-400/25 text-amber-200', 2: 'bg-slate-300/25 text-slate-100', 3: 'bg-orange-500/25 text-orange-200' }[entry.rank]
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          highlight ? `${accentClass} border-white/30` : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
        }`}
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${medalTone || 'text-white/70'}`}
        >
          {entry.rank}
        </span>
        <AvatarWithFrame user={entry} level={entry.level} frame={null} size="sm" showLevel={false} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">
            {entry.name}
            {highlight && <span className="ml-2 text-xs text-white/70">(та)</span>}
          </p>
          <p className="text-xs text-white/70">
            Lv.{entry.level} · {entry.completed} ажил
            {entry.avgRating > 0 && ` · ${entry.avgRating} од`}
          </p>
        </div>
        <span className="text-sm font-bold text-white flex-shrink-0">
          {entry.exp.toLocaleString('mn-MN')}
          <span className="text-[10px] font-normal text-white/60 ml-1">EXP</span>
        </span>
      </div>
    )
  }

  if (entries.length === 0) {
    return <p className="text-center py-8 text-white/70">Оролцогч алга.</p>
  }

  return (
    <div className="space-y-2">
      {shown.map(entry => (
        <Row key={entry.userId} entry={entry} highlight={entry.userId === currentUserId} />
      ))}
      {meOutside && (
        <>
          <p className="text-center text-white/40 text-sm">···</p>
          <Row entry={me} highlight />
        </>
      )}
    </div>
  )
}

// ------------------------------
// Dashboard-ийн ranking хайрцаг
// ------------------------------
export function RankingCard({ title, entries, currentUserId, to, accentClass }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-white" /> {title}
        </h2>
        {to && (
          <Link to={to} className="text-sm text-white/70 hover:text-white flex items-center gap-1">
            Бүгд <TrendingUp className="w-4 h-4" />
          </Link>
        )}
      </div>
      <RankingList entries={entries} currentUserId={currentUserId} limit={5} accentClass={accentClass} />
    </div>
  )
}

// ------------------------------
// Гоёолт сонгох самбар (профайл хуудсанд)
// ------------------------------
export function CosmeticPicker({ label, items, selectedId, onSelect, level, renderPreview }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-white" />
        <h3 className="text-sm font-semibold text-white">{label}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map(item => {
          const unlocked = level >= item.minLevel
          const selected = item.id === selectedId
          return (
            <button
              key={item.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelect(item.id)}
              title={unlocked ? item.label : `Lv.${item.minLevel}-д нээгдэнэ`}
              className={`relative rounded-xl border-2 p-2 transition-all ${
                selected ? 'border-white scale-105' : 'border-white/15'
              } ${unlocked ? 'hover:border-white/50 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
            >
              {renderPreview(item)}
              <span className="block text-[11px] mt-1.5 text-white text-center">{item.label}</span>
              {!unlocked && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-white">
                    <Lock className="w-3 h-3" /> Lv.{item.minLevel}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
