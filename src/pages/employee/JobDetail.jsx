import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, DollarSign, Clock, Briefcase,
  Share2, Bookmark, CheckCircle, Building2, Users, Star, Info, Zap
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../hooks/useNotification'
import {
  useShifts, useApplications, useSavedJobs, useEmployerProfiles, useMyProgress, combine,
} from '../../hooks/useData'
import { applyToShift, withdrawApplication } from '../../data/queries'
import { WEB_ORIGIN } from '../../config/runtime'
import ReportButton from '../../components/ReportButton'
import { levelAdvice, shiftHours, EMPTY_STATS } from '../../utils/gamification'
import { Loading, ErrorBox } from '../../components/States'
import { SHARED_JOB_CARD } from '../../hooks/useViewTransition'

const StarRating = ({ rating, size = "w-4 h-4" }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
        />
      ))}
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { notify } = useNotification()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const orgsQ = useEmployerProfiles()
  const progressQ = useMyProgress()
  const { toggleSaved, isSaved } = useSavedJobs()
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, progressQ)

  const localShifts = shiftsQ.data
  const localApplications = appsQ.data
  const myProgress = progressQ.data || EMPTY_STATS

  const shift = localShifts.find(s => s.id === id)
  const employerProfile = shift ? orgsQ.data.find(p => p.userId === shift.employerId) : null
  const employer = employerProfile ? { name: employerProfile.orgName } : null
  const getUserApplication = (shiftId) => localApplications.find(app => app.shiftId === shiftId && app.workerId === user?.id)
  const applied = !!getUserApplication(shift?.id)
  const saved = isSaved(shift?.id)

  // Хуудас нь /jobs/:id болон /employee/jobs/:id хоёуланд ажилладаг.
  const listUrl = user?.role === 'employee' ? '/employee/jobs' : '/jobs'

  /**
   * Ажлыг хуваалцах.
   * Утсан дээр системийн хуваалцах цонхыг нээнэ; компьютер дээр холбоосыг
   * хуулна. Нийтийн `/jobs/:id` хаягийг хуваалцана — хүлээн авагч нэвтрээгүй
   * байж болзошгүй тул дүрийн доторх зам тохирохгүй.
   */
  const handleShare = async () => {
    // Апп дотор `window.location.origin` нь `https://localhost` — хуваалцсан
    // линк хүлээн авагчид ажиллахгүй. Тиймээс нийтийн вэб хаягийг ашиглана.
    const url = `${WEB_ORIGIN}/jobs/${shift.id}`

    if (navigator.share) {
      try {
        await navigator.share({ title: shift.title, text: `${shift.title} — ${shift.district}`, url })
        return
      } catch {
        // Хэрэглэгч цуцалсан эсвэл дэмжигдээгүй — доорх хуулах руу шилжинэ
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      notify({ type: 'success', message: 'Холбоос хуулагдлаа', description: url })
    } catch {
      notify({ type: 'error', message: 'Хуулж чадсангүй', description: url })
    }
  }

  if (loading) return <Loading label="Ажлын мэдээлэл ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  if (!shift) {
    return (
      <div className="emp-card text-center py-16">
        <p className="emp-text-body">Ажил олдсонгүй эсвэл хаагдсан байна.</p>
        <Link to={listUrl} className="emp-btn-primary mt-4 inline-block">Ажлын жагсаалт руу буцах</Link>
      </div>
    )
  }

  const { recommendedLevel, meetsRecommendation } = levelAdvice(shift.hourlyWage, myProgress.level)
  const showAdvice = !meetsRecommendation && !applied

  const toggleApply = async (shiftId) => {
    const existing = getUserApplication(shiftId)
    const result = existing
      ? await withdrawApplication(existing.id)
      : await applyToShift(shiftId, user.id)

    if (!result.ok) {
      notify({ type: 'error', message: 'Амжилтгүй', description: result.error })
      return
    }
    notify({ type: 'success', message: existing ? 'Хүсэлт цуцлагдлаа' : 'Хүсэлт илгээгдлээ' })
    appsQ.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to={listUrl} className="inline-flex items-center gap-2 text-emp-muted hover:text-emp-text mb-6">
        <ArrowLeft className="w-4 h-4" /> Буцах
      </Link>

      {/* Жагсаалтаас дарсан картын `view-transition-name` энэ хайрцагтай
          таарна — хөтөч хоёрыг холбож, карт нь энэ толгой хэсэг БОЛЖ
          томордог мэт харагдана. Дэмждэггүй хөтөч дээр энэ шинж чанар
          үл тоомсорлогдоно. */}
      <div className="emp-card mb-6" style={{ viewTransitionName: SHARED_JOB_CARD }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-emp-accent/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-emp-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold emp-text-heading">{shift.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-emp-text mt-2">
                <span>{employerProfile?.orgName || employer?.name}</span>
                {employerProfile?.isVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                {employerProfile?.ratingAvg && (
                  <div className="flex items-center gap-1">
                    <StarRating rating={employerProfile.ratingAvg} />
                    <span className="text-emp-muted">({employerProfile.ratingAvg})</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-emp-muted">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {shift.district}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {shift.hourlyWage} ₮/цаг</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(shift.startAt), 'yyyy-MM-dd HH:mm')}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {shift.slots} суваг</span>
                <span className="emp-badge bg-emp-accent/10 text-emp-accent border border-emp-accent/20">{shift.category}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleSaved(shift.id)} className="p-3 border border-emp-border rounded-xl hover:bg-emp-card-hover transition-colors">
              {saved ? <Bookmark className="w-5 h-5 text-emp-accent fill-emp-accent" /> : <Bookmark className="w-5 h-5 text-emp-muted" />}
            </button>
            <button
              onClick={handleShare}
              title="Хуваалцах"
              className="p-3 border border-emp-border rounded-xl hover:bg-emp-card-hover transition-colors"
            >
              <Share2 className="w-5 h-5 text-emp-muted" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="emp-badge bg-emp-accent/10 text-emp-accent border border-emp-accent/20">{shift.category}</span>
          {recommendedLevel > 1 && (
            <span
              className={`emp-badge border ${
                meetsRecommendation
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                  : 'bg-white/5 text-white/70 border-white/15'
              }`}
            >
              Lv.{recommendedLevel} санал болгож байна
            </span>
          )}
        </div>

        {/* Энэ ажлыг дуусгавал хэдэн XP авахыг урьдчилан харуулна */}
        <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-emp-accent/10 border border-emp-accent/20">
          <Zap className="w-5 h-5 text-emp-accent flex-shrink-0" />
          <p className="text-sm emp-text-body">
            Энэ ажлыг дуусгавал{' '}
            <strong className="emp-text-heading">
              +{(25 + Math.round(shiftHours(shift) * 10)).toLocaleString('mn-MN')} XP
            </strong>{' '}
            авна ({shiftHours(shift).toFixed(1)} цаг). Сайн үнэлгээ авбал нэмэлт XP.
          </p>
        </div>

        {applied ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Оролцсон!</span>
          </div>
        ) : (
          <div className="space-y-3">
            {showAdvice && (
              <div className="flex items-start gap-3 p-4 bg-white/[0.04] border border-white/10 rounded-xl">
                <Info className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Lv.{recommendedLevel} санал болгож байна</p>
                  <p className="text-sm emp-text-body mt-0.5">
                    Та одоо Lv.{myProgress.level}. Хүсэлт илгээх боломжтой — сонголтыг ажил
                    олгогч хийнэ. Ажил дуусгах тусам түвшин ахина.
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => toggleApply(shift.id)}
              className="bg-emp-accent text-white rounded-xl px-6 py-3 hover:bg-emp-accent-hover transition-colors"
            >
              Оролцох
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="emp-card">
            <h2 className="text-lg font-semibold emp-text-heading mb-4">Тайлбар</h2>
            <p className="emp-text-body">{shift.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="emp-card">
            <h3 className="font-semibold emp-text-heading mb-4">Ажлын мэдээлэл</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emp-muted" />
                <span className="emp-text-body">{employerProfile?.orgName || employer?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emp-muted" />
                <span className="emp-text-body">{shift.district}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emp-muted" />
                <span className="emp-text-body">{shift.slots} суваг</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-emp-muted" />
                <span className="emp-text-body">{shift.category}</span>
              </div>
            </div>

            {/* FR-9.2 — сэжигтэй зарыг админд мэдээлэх.
                Зөвхөн нэвтэрсэн хэрэглэгч: мэдээлэгчийг тодорхойлж чадахгүй
                бол спам шүүх боломжгүй. */}
            {user && (
              <div className="mt-5 pt-4 border-t border-emp-border">
                <ReportButton targetType="shift" targetId={shift.id} label="Энэ зарыг мэдээлэх" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
