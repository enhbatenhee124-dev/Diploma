import { useState } from 'react'
import { Trophy, Users, Building2, Info, Flag, Timer, Star, ThumbsUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useRanking, useMyProgress, combine } from '../hooks/useData'
import { nextWageTier, EMPTY_STATS } from '../utils/gamification'
import { RankingList } from '../components/Gamification'
import { Loading, ErrorBox } from '../components/States'

const tabs = [
  { value: 'employee', label: 'Ажил хайгч', icon: Users },
  { value: 'employer', label: 'Ажил олгогч', icon: Building2 },
]

export default function RankingPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState(user?.role === 'employer' ? 'employer' : 'employee')

  const rankQ = useRanking(tab)
  const progressQ = useMyProgress()
  const { loading, error, refreshAll } = combine(rankQ, progressQ)

  const entries = rankQ.data
  const stats = progressQ.data || EMPTY_STATS
  const myEntry = entries.find(e => e.userId === user?.id)
  const nextTier = nextWageTier(stats.level)

  const isEmployer = user?.role === 'employer'
  const card = isEmployer ? 'wrk-card' : 'emp-card'
  const heading = isEmployer ? 'wrk-text-heading' : 'emp-text-heading'
  const body = isEmployer ? 'wrk-text-body' : 'emp-text-body'
  const accentBtn = isEmployer ? 'bg-wrk-accent' : 'bg-emp-accent'
  const accentRow = isEmployer ? 'bg-wrk-accent/20' : 'bg-emp-accent/20'

  if (loading) return <Loading label="Тэргүүлэгчид ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className={`text-3xl font-bold ${heading} flex items-center gap-3`}>
          <Trophy className="w-8 h-8 text-white" /> Тэргүүлэгчид
        </h1>
        <p className={`mt-1 ${body}`}>Ажил хийж XP цуглуулан дээшлээрэй.</p>
      </div>

      {/* Миний байршил */}
      <div className={`${card} bg-gradient-to-r from-white/5 to-transparent`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={`text-sm ${body}`}>Таны байршил</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${heading}`}>
                {myEntry ? `#${myEntry.rank}` : '—'}
              </span>
              <span className={`text-base font-medium ${body}`}>
                {myEntry ? `/ ${entries.length}` : 'Жагсаалтад ороогүй'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm ${body}`}>Нийт XP</p>
            <p className={`text-3xl font-extrabold ${heading}`}>
              {stats.exp.toLocaleString('mn-MN')}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${body}`}>Түвшин</p>
            <p className={`text-3xl font-extrabold ${heading}`}>Lv.{stats.level}</p>
          </div>
        </div>

        {nextTier && !isEmployer && (
          <div className={`mt-4 pt-4 border-t ${isEmployer ? 'border-wrk-border' : 'border-emp-border'} flex items-start gap-2`}>
            <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            <p className={`text-sm ${body}`}>
              Lv.{nextTier.level}-д хүрвэл цагийн{' '}
              <strong className={heading}>{nextTier.minWage.toLocaleString('mn-MN')} ₮</strong>-с
              дээш цалинтай ажилд орох боломжтой болно.
            </p>
          </div>
        )}
      </div>

      {/* Табууд */}
      <div className={card}>
        <div className="flex gap-2 mb-5">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === t.value ? `${accentBtn} text-white` : `bg-white/5 ${body} hover:bg-white/10`
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            )
          })}
        </div>

        <RankingList entries={entries} currentUserId={user?.id} accentClass={accentRow} />
      </div>

      {/* XP хэрхэн олох вэ */}
      <div className={card}>
        <h2 className={`text-lg font-semibold ${heading} mb-4`}>XP хэрхэн цуглуулах вэ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(isEmployer
            ? [
                [Flag, 'Ажлаа амжилттай дуусгах', '+20 XP'],
                [Timer, 'Ажилтан ажилласан цаг тутам', '+4 XP'],
                [Star, '5 одтой үнэлгээ авах', '+30 XP'],
                [ThumbsUp, '4 одтой үнэлгээ авах', '+15 XP'],
              ]
            : [
                [Flag, 'Ажил бүрэн дуусгах', '+25 XP'],
                [Timer, 'Ажилласан цаг тутам', '+10 XP'],
                [Star, '5 одтой үнэлгээ авах', '+30 XP'],
                [ThumbsUp, '4 одтой үнэлгээ авах', '+15 XP'],
              ]
          ).map(([Icon, label, value]) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </span>
              <span className={`flex-1 text-sm ${body}`}>{label}</span>
              <span className="text-sm font-bold text-emerald-400">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
