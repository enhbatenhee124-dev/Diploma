import { useState } from 'react'
import { format } from 'date-fns'
import { Building, FileText, Save, ShieldCheck, Flag, Timer, Star, Zap } from 'lucide-react'
import { DISTRICTS } from '../../data/constants'
import { useAuth } from '../../hooks/useAuth'
import {
  useShifts, useApplications, useEmployerProfiles, useMyProgress, useCosmetics, combine,
} from '../../hooks/useData'
import { getBadges, EMPTY_STATS } from '../../utils/gamification'
import { Loading, ErrorBox } from '../../components/States'
import { ProfileHero, BadgeGrid, resolveLook } from '../../components/Gamification'
import ProfileCustomizer from '../../components/ProfileCustomizer'

export default function EmployerProfile() {
  const { user, updateProfile } = useAuth()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const orgsQ = useEmployerProfiles()
  const progressQ = useMyProgress()
  const [cosmetics] = useCosmetics(user?.id)
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, orgsQ, progressQ)

  const shifts = shiftsQ.data
  const applications = appsQ.data
  const stats = progressQ.data || EMPTY_STATS
  const progress = stats
  const badges = getBadges(stats)
  const look = resolveLook(cosmetics, stats.level)

  const orgProfile = orgsQ.data.find(p => p.userId === user?.id)

  const [form, setForm] = useState({
    orgName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    location: user?.district || 'Сүхбаатар',
    registrationNumber: orgProfile?.regNumber || '',
    bio: user?.bio || '',
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateProfile({
      name: form.orgName,
      phone: form.phone,
      email: form.email,
      district: form.location,
      bio: form.bio,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Байршуулж дуусгасан ажлууд
  const myShiftIds = new Set(shifts.filter(s => s.employerId === user?.id).map(s => s.id))
  const history = applications
    .filter(a => a.status === 'completed' && myShiftIds.has(a.shiftId))
    .map(a => {
      const shift = shifts.find(s => s.id === a.shiftId)
      const hours = shift ? (new Date(shift.endAt) - new Date(shift.startAt)) / 3600000 : 0
      return {
        id: a.id,
        title: shift?.title || 'Устгагдсан зар',
        startAt: shift?.startAt || null,
        date: shift ? format(new Date(shift.startAt), 'yyyy-MM-dd') : '—',
        hours: Math.max(0, hours),
        exp: 20 + Math.round(Math.max(0, hours) * 4),
      }
    })
    .sort((a, b) => new Date(b.startAt || 0) - new Date(a.startAt || 0))

  if (loading) return <Loading label="Профайл ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Гоёолттой толгой хэсэг */}
      <ProfileHero
        user={user}
        progress={progress}
        look={look}
        subtitle="Ажил олгогч"
      >
        {orgProfile?.isVerified && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm font-medium text-white">
            <ShieldCheck className="w-4 h-4" /> Баталгаажсан
          </span>
        )}
      </ProfileHero>

      {/* Товч статистик */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Дуусгасан ажил', value: stats.completed, Icon: Flag },
          { label: 'Ажиллуулсан цаг', value: `${stats.hours}ц`, Icon: Timer },
          { label: 'Дундаж үнэлгээ', value: stats.avgRating || '—', Icon: Star },
          { label: 'Нийт EXP', value: stats.exp.toLocaleString('mn-MN'), Icon: Zap },
        ].map(item => (
          <div key={item.label} className="wrk-card-sm text-center">
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <item.Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-bold wrk-text-heading">{item.value}</p>
            <p className="text-xs wrk-text-body">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Амжилтууд */}
        <div className="wrk-card">
          <h2 className="text-lg font-semibold wrk-text-heading mb-4">
            Амжилтууд
            <span className="text-sm font-normal wrk-text-body ml-2">
              {badges.filter(b => b.earned).length}/{badges.length}
            </span>
          </h2>
          <BadgeGrid badges={badges} />
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 wrk-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Байгууллагын нэр</label>
                <input name="orgName" value={form.orgName} onChange={handleChange} className="wrk-input" />
              </div>
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Утасны дугаар</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="wrk-input" />
              </div>
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">И-мэйл хаяг</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="wrk-input" />
              </div>
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Регистрийн дугаар</label>
                <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} className="wrk-input" />
              </div>
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Дүүрэг</label>
                <select name="location" value={form.location} onChange={handleChange} className="wrk-input">
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium wrk-text-body mb-1.5">Танилцуулга</label>
              <textarea name="bio" rows={4} value={form.bio} onChange={handleChange} className="wrk-input resize-none" />
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" className="wrk-btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Хадгалах
              </button>
              {saved && <span className="text-sm text-emerald-400">Профайл шинэчлэгдлээ!</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Профайлын гоёолт */}
      <ProfileCustomizer
        user={user}
        progress={progress}
        cardClass="wrk-card"
        headingClass="wrk-text-heading"
        bodyClass="wrk-text-body"
      />

      {/* Дуусгасан ажлууд */}
      <div className="wrk-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-wrk-accent/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold wrk-text-heading">Дуусгасан ажлууд</h3>
            <p className="text-sm wrk-text-body">Платформ дээр амжилттай хаагдсан зар</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-center py-8 wrk-text-body">
            Одоогоор дуусгасан ажил алга. Зар нийтэлж ажилтан ажиллуулаад EXP цуглуулаарай!
          </p>
        ) : (
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-medium wrk-text-heading truncate">{item.title}</p>
                    <p className="text-sm wrk-text-body">{item.date} · {item.hours.toFixed(1)} цаг</p>
                  </div>
                  <span className="text-sm text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full flex-shrink-0">
                    +{item.exp} EXP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
