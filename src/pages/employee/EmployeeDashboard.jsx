import { Link } from 'react-router-dom'
import {
  Briefcase, FileText, Clock, ArrowRight, Zap, Lock,
  Moon, Sun, CloudSun, Sunset, Sprout, PartyPopper,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import {
  useShifts, useApplications, useEmployerProfiles,
  useMyProgress, useRanking, useCosmetics, combine,
} from '../../hooks/useData'
import { levelAdvice, nextWageTier, nextQuests, getBadges, TITLES, EMPTY_STATS } from '../../utils/gamification'
import { resolveLook, LevelRing, QuestRow, AvatarWithFrame, GameIcon } from '../../components/Gamification'
import ExpandingSearch from '../../components/ExpandingSearch'
import { getAccent, nextAccent } from '../../utils/accents'
import { Loading, ErrorBox } from '../../components/States'

const statusColors = {
  applied: 'text-gray-200 bg-gray-400/15 border-gray-400/25',
  approved: 'text-blue-200 bg-blue-400/15 border-blue-400/25',
  'in-progress': 'text-amber-200 bg-amber-400/15 border-amber-400/25',
  completed: 'text-emerald-200 bg-emerald-400/15 border-emerald-400/25',
  cancelled: 'text-red-200 bg-red-400/15 border-red-400/25',
}

const statusLabels = {
  applied: 'Илгээсэн',
  approved: 'Зөвшөөрсөн',
  'in-progress': 'Хийгдэж буй',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return { text: 'Сайхан амраарай', Icon: Moon }
  if (h < 12) return { text: 'Өглөөний мэнд', Icon: Sun }
  if (h < 18) return { text: 'Өдрийн мэнд', Icon: CloudSun }
  return { text: 'Оройн мэнд', Icon: Sunset }
}

export default function EmployeeDashboard() {
  const { user } = useAuth()

  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const orgsQ = useEmployerProfiles()
  const progressQ = useMyProgress()
  const rankQ = useRanking('employee')
  const [cosmetics, setCosmetics] = useCosmetics(user?.id)

  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, progressQ, rankQ)

  const shifts = shiftsQ.data
  const applications = appsQ.data
  const ranking = rankQ.data
  const stats = progressQ.data || EMPTY_STATS

  const accent = getAccent(cosmetics.accentId)
  const look = resolveLook(cosmetics, stats.level)
  const badges = getBadges(stats)
  const quests = nextQuests(badges, 3)
  const nextTitle = TITLES.find(t => t.minLevel > stats.level)
  const myRank = ranking.find(e => e.userId === user?.id)

  const myApps = applications.filter(a => a.workerId === user?.id)
  const activeShifts = shifts.filter(s => s.status === 'Active')
  const unlockedJobs = activeShifts.filter(s => levelAdvice(s.hourlyWage, stats.level).meetsRecommendation)
  const nextTier = nextWageTier(stats.level)
  const hi = greeting()

  const employerName = employerId =>
    orgsQ.data.find(o => o.userId === employerId)?.orgName
    || ranking.find(r => r.userId === employerId)?.name
    || 'Ажил олгогч'

  const tiles = [
    { label: 'Илгээсэн хүсэлт', value: myApps.length, icon: FileText, to: '/employee/applications' },
    { label: 'Дууссан ажил', value: stats.completed, icon: Clock, to: '/employee/applications' },
    { label: 'Нээлттэй ажил', value: unlockedJobs.length, icon: Briefcase, to: '/employee/jobs' },
  ]

  const recent = [...myApps]
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .slice(0, 4)

  if (loading) return <Loading label="Хянах самбар ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Мэндчилгээ + хайлт */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          <span className="text-white">Тавтай морил, </span>
          <span className="text-white/50">{user?.name?.split(' ')[0]}</span>
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCosmetics({ accentId: nextAccent(accent.id).id })}
            title={`Өнгө солих — одоо: ${accent.label}`}
            className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl
                       bg-emp-card border border-emp-border text-sm emp-text-body
                       hover:border-emp-accent/50 transition-colors"
          >
            <hi.Icon className="w-4 h-4 text-white" />
            <span>{hi.text}</span>
            <span
              className="w-4 h-4 rounded-full border border-white/25 flex-shrink-0"
              style={{ backgroundColor: accent.swatch }}
            />
          </button>
          <ExpandingSearch theme="emp" placeholder="Ажил хайх..." />
          <AvatarWithFrame user={user} level={stats.level} frame={look.frame} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Зүүн: түвшин + даалгавар */}
        <div className="emp-card flex flex-col items-center">
          <LevelRing progress={stats} look={look} />

          <div className="w-full mt-5 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="emp-text-body">Дараагийн цол</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                {nextTitle && <GameIcon name={nextTitle.icon} className="w-4 h-4" />}
                {nextTitle ? nextTitle.label : 'Дээд цол'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="emp-text-body">Байршил</span>
              <Link to="/employee/ranking" className="font-semibold text-white hover:text-emp-accent">
                {myRank ? `#${myRank.rank} / ${ranking.length}` : '—'}
              </Link>
            </div>

            <div className="pt-3 mt-1 border-t border-emp-border">
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2.5">
                Биелүүлэх даалгавар
              </p>
              <div className="space-y-2">
                {quests.length === 0 ? (
                  <p className="flex items-center justify-center gap-2 text-sm emp-text-body py-3">
                    <PartyPopper className="w-4 h-4 text-white" /> Бүх даалгавар биеллээ!
                  </p>
                ) : (
                  quests.map(q => <QuestRow key={q.id} quest={q} />)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Баруун */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tiles.map(tile => {
              const Icon = tile.icon
              return (
                <Link
                  key={tile.label}
                  to={tile.to}
                  className="emp-card hover:border-emp-accent/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/15 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs emp-text-body mb-1">{tile.label}</p>
                  <p className="text-2xl font-extrabold text-white">{tile.value}</p>
                </Link>
              )
            })}
          </div>

          {nextTier && (
            <div className="relative overflow-hidden rounded-2xl border border-emp-border p-6 bg-gradient-to-br from-emp-accent/25 via-fuchsia-500/10 to-transparent">
              <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emp-accent/20 blur-3xl pointer-events-none" />
              <div className="relative flex flex-wrap items-center gap-5">
                <div className="flex-1 min-w-[220px]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-medium text-white mb-3">
                    <Lock className="w-3 h-3" /> Lv.{nextTier.level} шаардлагатай
                  </span>
                  <h2 className="text-xl font-bold text-white leading-snug">
                    {nextTier.minWage.toLocaleString('mn-MN')} ₮/цаг-с дээш ажлууд
                  </h2>
                  <p className="text-sm text-white/70 mt-1.5">
                    Дараагийн түвшин хүртэл {stats.neededForNext?.toLocaleString('mn-MN') ?? 0} EXP —
                    ойролцоогоор {Math.ceil((stats.neededForNext || 0) / 65)} ажил.
                  </p>
                </div>
                <Link to="/employee/jobs" className="emp-btn-primary flex items-center gap-2 flex-shrink-0">
                  <Zap className="w-4 h-4" /> Ажил хайх
                </Link>
              </div>
            </div>
          )}

          {/* Сүүлийн хүсэлтүүд */}
          <div className="emp-card">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base font-semibold emp-text-heading">Сүүлийн хүсэлтүүд</h2>
              <Link
                to="/employee/applications"
                className="text-xs text-white hover:text-emp-accent flex items-center gap-1 transition-colors"
              >
                Бүгд <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="text-center py-6">
                <p className="flex items-center justify-center gap-2 emp-text-body text-sm">
                  <Sprout className="w-4 h-4 text-white" /> Эхний ажлаа дуусгаад +25 EXP аваарай.
                </p>
                <Link to="/employee/jobs" className="text-sm text-white hover:text-emp-accent transition-colors">
                  Ажил хайх
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-emp-border">
                {recent.map(app => {
                  const shift = shifts.find(s => s.id === app.shiftId)
                  return (
                    <div key={app.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {shift?.title || 'Хаагдсан зар'}
                        </p>
                        <p className="text-xs emp-text-body truncate">
                          {shift ? employerName(shift.employerId) : '—'}
                          {app.appliedAt && ` · ${format(new Date(app.appliedAt), 'MM-dd')}`}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border flex-shrink-0
                                    ${statusColors[app.status] || statusColors.applied}`}
                      >
                        {statusLabels[app.status] || app.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
