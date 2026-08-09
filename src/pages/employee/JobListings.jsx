import { useState, lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, MapPin, DollarSign, Clock, Bookmark, BookmarkCheck, Filter, ChevronDown, Star, Building, CheckCircle, Info, List as ListIcon, Map as MapIcon } from 'lucide-react'

// Leaflet-ийг эхний ачаалалтад оруулахгүй — хэрэглэгчдийн дийлэнх нь
// жагсаалтаар хайдаг (FR-5.3)
const JobMap = lazy(() => import('../../components/JobMap'))
import { DISTRICTS } from '../../data/constants'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../hooks/useNotification'
import {
  useShifts, useApplications, useSavedJobs, useEmployerProfiles, useMyProgress,
  useWorkerProfile, combine,
} from '../../hooks/useData'
import { sortByMatch, canMatch } from '../../utils/matching'
import { applyToShift, withdrawApplication } from '../../data/queries'
import { levelAdvice, EMPTY_STATS } from '../../utils/gamification'
import { Loading, ErrorBox } from '../../components/States'
import SavedSearches from '../../components/SavedSearches'
import {
  useViewTransitionNavigate, supportsViewTransition, SHARED_JOB_CARD,
} from '../../hooks/useViewTransition'

const getSkillLabel = skill => {
  const map = {
    'waiter': 'Зөөгч',
    'cashier': 'Кассир',
    'sales': 'Борлуулагч',
    'translator': 'Орчуулагч',
    'tutor': 'Багш',
    'barista': 'Бариста',
    'cleaner': 'Цэвэрлэгч',
    'driver': 'Жолооч',
  }
  return map[skill] || skill
}

const StarRating = ({ rating, size = "w-4 h-4" }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          // Дүүрсэн од — цагаан дүүргэлттэй, дүүрээгүй нь бүдэг цагаан.
          // Ингэснээр өнгөгүй боловч үнэлгээ хэдийг харуулсан хэвээр.
          className={`${size} ${star <= rating ? 'text-white fill-white' : 'text-white/25'}`}
        />
      ))}
    </div>
  )
}

export default function JobListings() {
  const { user } = useAuth()
  // Нүүр хуудасны hero дэх хайлтын талбар `/jobs?q=...` руу илгээдэг тул
  // эхний утгыг URL-ээс авна. Дараа нь хэрэглэгч бичихэд зөвхөн энэ
  // төлөв өөрчлөгдөнө — URL-ийг дагуулж шинэчлэхгүй (буцах товч нь
  // хайлтын алхам бүрээр дүүрэхээс сэргийлнэ).
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [selectedDistrict, setSelectedDistrict] = useState('Бүгд')
  const [sortMode, setSortMode] = useState('match')   // 'match' | 'date'
  const [view, setView] = useState('list')            // 'list' | 'map'
  const { notify } = useNotification()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const orgsQ = useEmployerProfiles()
  const progressQ = useMyProgress()
  const { toggleSaved, isSaved } = useSavedJobs()
  const { profile: workerProfile } = useWorkerProfile(user?.id)
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, progressQ)

  const jobs = shiftsQ.data
  const localApplications = appsQ.data
  const myProgress = progressQ.data || EMPTY_STATS

  // Хуудас нь /jobs (нийтийн) болон /employee/jobs хоёуланд ашиглагддаг тул
  // дэлгэрэнгүйн холбоосыг байршилд нь тааруулна.
  const detailBase = user?.role === 'employee' ? '/employee/jobs' : '/jobs'

  const vtNavigate = useViewTransitionNavigate()

  /**
   * Дэлгэрэнгүй рүү шилжинэ — дарагдсан картыг дэлгэрэнгүй хуудасны толгой
   * хэсэгтэй холбож хөдөлгөнө.
   *
   * Нэрийг React-ийн төлөвөөр бус, DOM дээр ШУУД тавьж байгаа нь санаатай:
   * хөтөч `startViewTransition` дуудагдмагц зургаа авдаг тул нэр нь тэр
   * агшинд аль хэдийн байх ёстой. `setState` бол хойшлогдоно.
   */
  const openJob = (e, to) => {
    // Ctrl/Cmd+дарж шинэ таб нээх зэрэг хөтчийн жирийн зан төлөвт хөндлөнгөөс
    // орохгүй.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (!supportsViewTransition()) return // `Link` өөрөө шилжүүлнэ

    e.preventDefault()
    e.currentTarget.closest('.emp-card')?.style.setProperty('view-transition-name', SHARED_JOB_CARD)
    vtNavigate(to)
  }

  const getEmployerProfile = employerId => orgsQ.data.find(p => p.userId === employerId)

  const getUserApplication = shiftId =>
    localApplications.find(app => app.shiftId === shiftId && app.workerId === user?.id)

  const toggleApply = async (shiftId) => {
    const existing = getUserApplication(shiftId)

    const result = existing
      ? await withdrawApplication(existing.id)
      : await applyToShift(shiftId, user.id)

    if (!result.ok) {
      notify({ type: 'error', message: 'Амжилтгүй', description: result.error })
      return
    }

    notify({
      type: 'success',
      message: existing ? 'Хүсэлт цуцлагдлаа' : 'Хүсэлт илгээгдлээ',
    })
    appsQ.refresh()
  }

  if (loading) return <Loading label="Ажлууд ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  const matchProfile = { ...workerProfile, district: user?.district }
  const canRank = canMatch(workerProfile)

  const filtered = jobs.filter(job => {
    // ⚠ Ажилтан ӨӨРИЙН хүсэлт илгээсэн зарыг хаагдсаны дараа ч хардаг
    //   (ажлын түүхэд хэрэгтэй). Гэхдээ ХАЙЛТАД зөвхөн идэвхтэй зар гарна —
    //   эс тэгвээс өнгөрсөн ажилд хүсэлт илгээх гэж оролдоно.
    if (job.status !== 'Active') return false

    const matchSearch = search === '' ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase())
    const matchDistrict = selectedDistrict === 'Бүгд' || job.district === selectedDistrict
    return matchSearch && matchDistrict
  })

  // "Надад тохирох" эрэмбэ — боломжит цаг, ур чадвар, дүүрэгт суурилна
  const ranked = sortMode === 'match' && canRank
    ? sortByMatch(filtered, matchProfile)
    : filtered
        .map(shift => ({ shift, score: 0, reasons: [] }))
        .sort((a, b) => new Date(a.shift.startAt) - new Date(b.shift.startAt))

  // Газрын зураг дээр аль хэдийн хүсэлт илгээсэн ажлыг өөр өнгөөр тэмдэглэнэ
  const appliedIds = new Set(
    localApplications.filter(app => app.workerId === user?.id).map(app => app.shiftId)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold emp-text-heading">Ажил хайх</h1>
          <p className="mt-1 emp-text-body">Орох боломжтой ажлуудыг үзнэ үү.</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-emp-accent/15 border border-emp-accent/25">
          <p className="text-xs emp-text-body">Таны түвшин</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold emp-text-heading">Lv.{myProgress.level}</span>
            <span className="text-xs emp-text-body">
              · {myProgress.exp.toLocaleString('mn-MN')} EXP
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="emp-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
            <input type="text" placeholder="Ажил хайх..." value={search} onChange={e => setSearch(e.target.value)} className="emp-input pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="emp-input pl-10 appearance-none pr-10 cursor-pointer">
              <option value="Бүгд" className="bg-emp-card">Бүх дүүрэг</option>
              {DISTRICTS.map(t => <option key={t} value={t} className="bg-emp-card">{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
          </div>
        </div>

        {/* Хадгалсан хайлт (FR-5.4) — зөвхөн нэвтэрсэн ажил хайгчид */}
        {user?.role === 'employee' && (
          <div className="mt-4 pt-4 border-t border-emp-border">
            <SavedSearches
              currentFilters={{
                search: search || undefined,
                district: selectedDistrict !== 'Бүгд' ? selectedDistrict : undefined,
              }}
              onApply={filters => {
                setSearch(filters.search || '')
                setSelectedDistrict(filters.district || 'Бүгд')
              }}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm emp-text-body">{ranked.length} ажил олдлоо</p>

          <div className="flex items-center gap-2">
            {/* Жагсаалт ↔ Газрын зураг (FR-5.3) */}
            {[
              { value: 'list', label: 'Жагсаалт', icon: ListIcon },
              { value: 'map', label: 'Газрын зураг', icon: MapIcon },
            ].map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setView(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    view === opt.value
                      ? 'bg-emp-accent text-white'
                      : 'bg-white/5 emp-text-body hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {opt.label}
                </button>
              )
            })}

            <span className="w-px h-5 bg-white/10 mx-1" />

            {[
              { value: 'match', label: 'Надад тохирох' },
              { value: 'date', label: 'Огноогоор' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortMode(opt.value)}
                disabled={opt.value === 'match' && !canRank}
                title={
                  opt.value === 'match' && !canRank
                    ? 'Профайл дээрээ боломжит цаг, ур чадвараа оруулна уу'
                    : undefined
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sortMode === opt.value && (opt.value !== 'match' || canRank)
                    ? 'bg-emp-accent text-white'
                    : 'bg-white/5 emp-text-body hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {sortMode === 'match' && !canRank && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/10">
            <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            <p className="text-sm emp-text-body">
              Тохирлыг тооцохын тулд{' '}
              <Link to="/employee/profile" className="text-white underline">профайл дээрээ</Link>{' '}
              боломжит цаг, ур чадвараа оруулна уу.
            </p>
          </div>
        )}

        {/* Газрын зураг — Leaflet ~150KB тул зөвхөн сонгосон үед татагдана */}
        {view === 'map' && (
          <Suspense
            fallback={
              <div className="h-[28rem] rounded-2xl border border-white/10 bg-white/[0.03]
                              flex items-center justify-center">
                <span className="text-sm emp-text-body">Газрын зураг ачаалж байна…</span>
              </div>
            }
          >
            <JobMap
              shifts={ranked.map(r => r.shift)}
              appliedIds={appliedIds}
              basePath={user ? '/employee/jobs' : '/jobs'}
            />
          </Suspense>
        )}

        {view === 'list' && ranked.map(({ shift: job, score, reasons }, i) => {
          const employerProfile = getEmployerProfile(job.employerId)
          const applied = !!getUserApplication(job.id)
          const saved = isSaved(job.id)
          const { recommendedLevel, meetsRecommendation } = levelAdvice(job.hourlyWage, myProgress.level)
          return (
            // Зарууд дараалан гарч ирнэ. 8 дахиас хойш саатал нэмэхгүй — урт
            // жагсаалтын сүүл хэтэрхий удаж гарахаас сэргийлнэ.
            <div
              key={job.id}
              className="emp-card animate-fade-up hover-lift"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emp-accent/20 flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold emp-text-heading">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm emp-text-body">
                      <span>{employerProfile?.orgName || 'Ажил олгогч'}</span>
                      {employerProfile?.isVerified && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      {employerProfile?.ratingAvg && (
                        <div className="flex items-center gap-1">
                          <StarRating rating={employerProfile.ratingAvg} />
                          <span className="text-emp-muted">({employerProfile.ratingAvg})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleSaved(job.id)} className="p-2 rounded-lg hover:bg-emp-card-hover transition-colors">
                  {saved ? <BookmarkCheck className="w-5 h-5 text-white" /> : <Bookmark className="w-5 h-5 text-white" />}
                </button>
              </div>
              <p className="text-sm emp-text-body mb-3">{job.description}</p>

              {/* Яагаад тохирч байгаа шалтгаан */}
              {sortMode === 'match' && reasons.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {reasons.map(r => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                                 bg-emerald-500/10 text-emerald-200 border border-emerald-500/25"
                    >
                      <CheckCircle className="w-3 h-3" /> {r}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="emp-badge bg-emp-accent/10 text-emp-accent border border-emp-accent/20 text-xs">{job.category}</span>
                {recommendedLevel > 1 && (
                  <span
                    className={`emp-badge text-xs border ${
                      meetsRecommendation
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                        : 'bg-white/5 text-white/70 border-white/15'
                    }`}
                    title={
                      meetsRecommendation
                        ? 'Та энэ ажилд тохирч байна'
                        : `Lv.${recommendedLevel} санал болгож байна — гэхдээ хүсэлт илгээж болно`
                    }
                  >
                    Lv.{recommendedLevel} санал болгож байна
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm emp-text-body mb-4">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.district}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.hourlyWage.toLocaleString('mn-MN')} ₮/цаг</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(job.startAt), 'yyyy-MM-dd HH:mm')}</span>
                <span className="flex items-center gap-1">{job.slots} суваг</span>
              </div>

              {!meetsRecommendation && !applied && (
                <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-white/[0.04] border border-white/10">
                  <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  <p className="text-sm emp-text-body">
                    Энэ ажилд <strong className="text-white">Lv.{recommendedLevel}</strong> санал болгож байна
                    (та Lv.{myProgress.level}). <strong className="text-white">Хүсэлт илгээж болно</strong> —
                    шийдвэрийг ажил олгогч гаргана.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-emp-border">
                <Link
                  to={`${detailBase}/${job.id}`}
                  onClick={e => openJob(e, `${detailBase}/${job.id}`)}
                  className="text-sm text-emp-accent hover:text-emp-accent-hover"
                >
                  Дэлгэрэнгүй
                </Link>
                <button
                  onClick={() => toggleApply(job.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    applied
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-emp-accent text-white hover:bg-emp-accent-hover'
                  }`}
                >
                  {applied ? 'Оролцсон' : 'Оролцох'}
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 emp-card">
            <Search className="w-12 h-12 text-white mx-auto mb-4" />
            <p className="text-lg emp-text-heading">Ажил олдсонгүй</p>
            <p className="emp-text-body">Хайлт, шүүлтүүрээ өөрчилж үзнэ үү.</p>
          </div>
        )}
      </div>
    </div>
  )
}
