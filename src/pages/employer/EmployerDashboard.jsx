import { Link } from 'react-router-dom'
import {
  Briefcase, ArrowRight, Sparkles, PlusCircle, Inbox,
  Moon, Sun, CloudSun, Sunset, ClipboardList, Flag, Star, Megaphone,
  Search, Palette, CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import {
  useShifts, useApplications, useProfiles, useMyProgress, useRanking, useCosmetics,
  useSubscription, combine,
} from '../../hooks/useData'
import { CreditCard } from 'lucide-react'
import { getBadges, shiftHours, EMPTY_STATS } from '../../utils/gamification'
import { ProfileHero, BadgeGrid, RankingCard, resolveLook } from '../../components/Gamification'
import { formatCurrency } from '../../utils/helpers'
import { Loading, ErrorBox } from '../../components/States'
import { CountUp, Stagger } from '../../components/Motion'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return { text: 'Сайхан амраарай', Icon: Moon }
  if (h < 12) return { text: 'Өглөөний мэнд', Icon: Sun }
  if (h < 18) return { text: 'Өдрийн мэнд', Icon: CloudSun }
  return { text: 'Оройн мэнд', Icon: Sunset }
}

export default function EmployerDashboard() {
  const { user } = useAuth()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const profilesQ = useProfiles()
  const progressQ = useMyProgress()
  const rankQ = useRanking('employer')
  const subQ = useSubscription()
  const [cosmetics] = useCosmetics(user?.id)
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, progressQ, rankQ)

  const shifts = shiftsQ.data
  const applications = appsQ.data
  const users = profilesQ.data
  const ranking = rankQ.data
  const stats = progressQ.data || EMPTY_STATS
  const progress = stats
  const badges = getBadges(stats)
  const look = resolveLook(cosmetics, stats.level)
  const myRank = ranking.find(e => e.userId === user?.id)

  const myShifts = shifts.filter(s => s.employerId === user?.id)
  const myShiftIds = new Set(myShifts.map(s => s.id))
  const myApps = applications.filter(a => myShiftIds.has(a.shiftId))

  const activeShifts = myShifts.filter(s => s.status === 'Active')
  const pendingApps = myApps.filter(a => a.status === 'applied')

  const totalSpend = myApps
    .filter(a => a.status === 'completed')
    .reduce((sum, app) => {
      const shift = myShifts.find(s => s.id === app.shiftId)
      return sum + (shift ? Math.round(shiftHours(shift) * shift.hourlyWage) : 0)
    }, 0)

  const hi = greeting()

  const tiles = [
    { label: 'Идэвхтэй зар', value: activeShifts.length, Icon: ClipboardList, to: '/employer/postings' },
    { label: 'Шийдвэр хүлээж буй', value: pendingApps.length, Icon: Inbox, to: '/employer/postings' },
    { label: 'Дуусгасан ажил', value: stats.completed, Icon: Flag, to: '/employer/earnings' },
    { label: 'Үнэлгээ', value: stats.avgRating || '—', Icon: Star, to: '/employer/profile' },
  ]

  const workerName = id => users.find(u => u.id === id)?.name || 'Тодорхойгүй'

  if (loading) return <Loading label="Хянах самбар ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <ProfileHero
        user={user}
        progress={progress}
        look={look}
        subtitle={`${hi.text}! Танай багт хэн нэгэн хэрэгтэй байна уу?`}
      >
        <div className="text-center px-5 py-3 rounded-2xl bg-white/15 backdrop-blur">
          <p className="text-xs text-white/80">Байршил</p>
          <p className="text-2xl font-extrabold text-white">
            {myRank ? `#${myRank.rank}` : '—'}
          </p>
          <p className="text-[11px] text-white/70">/ {ranking.length}</p>
        </div>
      </ProfileHero>

      {/* Захиалгын анхааруулга — төлбөр хэтэрсэн эсвэл зар нийтлэх хаагдсан үед */}
      {subQ.data?.needsPayment && (
        <div
          className={`wrk-card ${
            subQ.data.canPost
              ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/25'
              : 'bg-gradient-to-r from-red-500/10 to-transparent border-red-500/25'
          }`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <p className="font-semibold wrk-text-heading">
                {subQ.data.canPost
                  ? 'Захиалгын хугацаа дууссан байна'
                  : 'Шинэ зар нийтлэх боломжгүй болсон'}
              </p>
              <p className="text-sm wrk-text-body mt-0.5">
                {subQ.data.canPost
                  ? `${format(new Date(subQ.data.graceUntil), 'yyyy-MM-dd')}-с хойш шинэ зар нийтлэх боломжгүй болно.`
                  : 'Одоо байгаа зар, ирсэн хүсэлтүүд хэвийн ажиллаж байна.'}
              </p>
            </div>
            <Link to="/employer/subscription" className="wrk-btn-primary flex items-center gap-2 flex-shrink-0">
              Төлбөр төлөх <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Шийдвэр хүлээж буй хүсэлт */}
      {pendingApps.length > 0 && (
        <div className="wrk-card bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Inbox className="w-6 h-6 text-amber-300" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold wrk-text-heading">
                {pendingApps.length} хүсэлт таны шийдвэрийг хүлээж байна
              </p>
              <p className="text-sm wrk-text-body mt-0.5">
                {pendingApps.slice(0, 3).map(a => workerName(a.workerId)).join(', ')}
                {pendingApps.length > 3 && ` болон бусад ${pendingApps.length - 3}`}
              </p>
            </div>
            <Link to="/employer/postings" className="wrk-btn-primary flex items-center gap-2">
              Хянах <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Тоон үзүүлэлт */}
      <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map(tile => (
          <Link
            key={tile.label}
            to={tile.to}
            className="wrk-card-sm text-center group animate-fade-up hover-lift press"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center transition-transform duration-200 ease-spring group-hover:scale-110">
              <tile.Icon className="w-5 h-5 text-white" />
            </div>
            {/* Үнэлгээ нь «—» эсвэл 4.8 гэх мэт бутархай тул тоо байвал л
                өсгөж тоолно; эс бөгөөс хэвээр нь харуулна. */}
            <p className="text-2xl font-extrabold wrk-text-heading">
              {Number.isInteger(tile.value)
                ? <CountUp value={tile.value} />
                : tile.value}
            </p>
            <p className="text-xs wrk-text-body">{tile.label}</p>
          </Link>
        ))}
      </Stagger>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Идэвхтэй зарууд */}
          <div className="wrk-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold wrk-text-heading">Идэвхтэй зарууд</h2>
              <Link to="/employer/postings" className="text-sm text-wrk-accent hover:text-wrk-accent-hover flex items-center gap-1">
                Бүгдийг үзэх <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {activeShifts.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-9 h-9 text-white/70 mx-auto mb-3" />
                  <p className="wrk-text-heading font-medium">Эхний зараа нийтэлье!</p>
                  <p className="wrk-text-body text-sm mt-1">
                    Ажил амжилттай хаагдах бүрд +20 XP болон түвшин ахина.
                  </p>
                  <Link to="/employer/postings" className="wrk-btn-primary mt-4 inline-flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Шинэ зар
                  </Link>
                </div>
              ) : (
                activeShifts.slice(0, 4).map(shift => {
                  const apps = myApps.filter(a => a.shiftId === shift.id)
                  const filled = apps.filter(a => ['approved', 'in-progress', 'completed'].includes(a.status)).length
                  const pct = shift.slots > 0 ? Math.min(100, Math.round((filled / shift.slots) * 100)) : 0
                  return (
                    <div key={shift.id} className="p-4 bg-wrk-bg rounded-xl border border-wrk-border">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-medium wrk-text-heading truncate">{shift.title}</h3>
                          <p className="text-sm wrk-text-body">
                            {shift.district} · {format(new Date(shift.startAt), 'MM-dd HH:mm')}
                          </p>
                        </div>
                        <span className="wrk-badge bg-wrk-accent/15 text-wrk-accent border border-wrk-accent/25 flex-shrink-0">
                          {apps.length} хүсэлт
                        </span>
                      </div>
                      <div className="w-full bg-wrk-border rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-wrk-accent'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs wrk-text-body flex items-center gap-1 flex-wrap">
                        <span>
                          {filled}/{shift.slots} суваг дүүрсэн · {shift.hourlyWage.toLocaleString('mn-MN')} ₮/цаг
                        </span>
                        {pct >= 100 && (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            · <CheckCircle2 className="w-3.5 h-3.5" /> дүүрсэн!
                          </span>
                        )}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Ranking */}
          <RankingCard
            title="Тэргүүлэгч ажил олгогчид"
            entries={ranking}
            currentUserId={user?.id}
            to="/employer/ranking"
            accentClass="bg-wrk-accent/25"
          />
        </div>

        {/* Баруун багана */}
        <div className="space-y-6">
          <div className="wrk-card">
            <h2 className="text-lg font-semibold wrk-text-heading mb-4">Зардлын тойм</h2>
            <div className="space-y-3">
              <div className="p-4 bg-wrk-bg rounded-xl border border-wrk-border">
                <p className="text-sm wrk-text-body">Дууссан ажилд төлсөн</p>
                <p className="text-2xl font-bold wrk-text-heading">{formatCurrency(totalSpend)}</p>
              </div>
              <div className="p-4 bg-wrk-bg rounded-xl border border-wrk-border">
                <p className="text-sm wrk-text-body">Ажиллуулсан цаг</p>
                <p className="text-2xl font-bold wrk-text-heading">{stats.hours} цаг</p>
              </div>
            </div>
          </div>

          <div className="wrk-card">
            <h2 className="text-lg font-semibold wrk-text-heading mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Амжилтууд
              <span className="text-sm font-normal wrk-text-body">
                {badges.filter(b => b.earned).length}/{badges.length}
              </span>
            </h2>
            <BadgeGrid badges={badges} limit={6} />
          </div>

          <div className="wrk-card">
            <h2 className="text-lg font-semibold wrk-text-heading mb-4">Хурдан үйлдлүүд</h2>
            <div className="space-y-3">
              {/* Дүрсийг lucide-ээс авна — аппын бусад хэсэгтэй нэг загвартай
                  байх ёстой. Emoji нь үйлдлийн систем бүр дээр өөр харагддаг
                  бөгөөд өнгө нь сэдэвт тохирдоггүй. */}
              <Link to="/employer/postings" className="wrk-btn-primary flex items-center justify-center gap-2">
                <ClipboardList className="w-4 h-4" /> Зар удирдах
              </Link>
              <Link to="/employer/workers" className="wrk-btn-secondary flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> Ажилтан хайх
              </Link>
              <Link to="/employer/profile" className="wrk-btn-secondary flex items-center justify-center gap-2">
                <Palette className="w-4 h-4" /> Профайл гоёох
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
