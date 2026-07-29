import { useState } from 'react'
import { User, Phone, MapPin, FileText, Save, Camera, Star, Calendar, Mail, Flag, Timer, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { SKILLS, DISTRICTS } from '../../data/constants'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../hooks/useNotification'
import {
  useShifts, useApplications, useMyProgress, useCosmetics, useWorkerProfile, combine,
} from '../../hooks/useData'
import { getBadges, EMPTY_STATS } from '../../utils/gamification'
import { Loading, ErrorBox } from '../../components/States'
import { ProfileHero, BadgeGrid, resolveLook } from '../../components/Gamification'
import ProfileCustomizer from '../../components/ProfileCustomizer'

const days = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням']
const timeSlots = ['Өглөө', 'Өдөр', 'Орой']

export default function EmployeeProfile() {
  const { user, updateProfile } = useAuth()
  const { notify } = useNotification()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const progressQ = useMyProgress()
  const [cosmetics] = useCosmetics(user?.id)
  const { profile: workerProfile, save: saveWorker } = useWorkerProfile(user?.id)
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, progressQ)

  const shifts = shiftsQ.data
  const applications = appsQ.data
  const stats = progressQ.data || EMPTY_STATS
  const progress = stats
  const badges = getBadges(stats)
  const look = resolveLook(cosmetics, stats.level)

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    location: user?.district || 'Сүхбаатар',
    bio: user?.bio || '',
  })
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Ур чадвар, боломжит цаг нь өгөгдлийн санд хадгалагдана (worker_profiles).
  // Эдгээр нь "Надад тохирох" эрэмбийг ажиллуулна.
  const skills = workerProfile.skills || []
  const availability = workerProfile.availability || {}

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  /** Хадгалалт бүтэлгүйтвэл чимээгүй өнгөрөхгүй — хэрэглэгчид хэлнэ. */
  const persist = async patch => {
    const result = await saveWorker(patch)
    if (result && !result.ok) {
      notify({ type: 'error', message: 'Хадгалж чадсангүй', description: result.error })
    }
  }

  const toggleSkill = skill => {
    const next = skills.includes(skill)
      ? skills.filter(s => s !== skill)
      : [...skills, skill]
    persist({ skills: next })
  }

  const toggleAvailability = (dayIdx, slotIdx) => {
    const day = availability[dayIdx] || []
    const nextDay = day.includes(slotIdx)
      ? day.filter(s => s !== slotIdx)
      : [...day, slotIdx]
    persist({ availability: { ...availability, [dayIdx]: nextDay } })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveError(null)

    const result = await updateProfile({
      name: form.name,
      phone: form.phone,
      email: form.email,
      district: form.location,
      bio: form.bio,
    })

    if (!result.ok) {
      setSaveError(result.error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Дуусгасан ажлууд — EXP-ийн задаргаатай
  const workHistory = applications
    .filter(a => a.status === 'completed' && a.workerId === user?.id)
    .map(a => {
      const shift = shifts.find(s => s.id === a.shiftId)
      const hours = shift ? (new Date(shift.endAt) - new Date(shift.startAt)) / 3600000 : 0
      return {
        id: a.id,
        title: shift?.title || 'Устгагдсан зар',
        startAt: shift?.startAt || null,
        date: shift ? format(new Date(shift.startAt), 'yyyy-MM-dd') : '—',
        hours: Math.max(0, hours),
        exp: 25 + Math.round(Math.max(0, hours) * 10),
      }
    })
    .sort((a, b) => new Date(b.startAt || 0) - new Date(a.startAt || 0))

  const getSkillLabel = (skill) => {
    const labels = {
      'waiter': 'Зөөгч',
      'cashier': 'Кассир',
      'sales': 'Борлуулагч',
      'translator': 'Орчуулагч',
      'tutor': 'Багш',
      'barista': 'Бариста',
      'cleaner': 'Цэвэрлэгч',
      'driver': 'Жолооч',
    }
    return labels[skill] || skill
  }

  if (loading) return <Loading label="Профайл ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Гоёолттой толгой хэсэг */}
      <ProfileHero
        user={user}
        progress={progress}
        look={look}
        subtitle="Ажил хайгч"
      />

      {/* Товч статистик */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Дууссан ажил', value: stats.completed, Icon: Flag },
          { label: 'Ажилласан цаг', value: `${stats.hours}ц`, Icon: Timer },
          { label: 'Дундаж үнэлгээ', value: stats.avgRating || '—', Icon: Star },
          { label: 'Нийт EXP', value: stats.exp.toLocaleString('mn-MN'), Icon: Zap },
        ].map(item => (
          <div key={item.label} className="emp-card-sm text-center">
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <item.Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-bold emp-text-heading">{item.value}</p>
            <p className="text-xs emp-text-body">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Амжилтын тэмдэг */}
        <div className="emp-card">
          <h2 className="text-lg font-semibold emp-text-heading mb-4">
            Амжилтууд
            <span className="text-sm font-normal emp-text-body ml-2">
              {badges.filter(b => b.earned).length}/{badges.length}
            </span>
          </h2>
          <BadgeGrid badges={badges} />
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 emp-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">Бүтэн Нэр</label>
                <input name="name" value={form.name} onChange={handleChange} className="emp-input" />
              </div>
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">Утасны дугаар</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="emp-input" />
              </div>
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">И-мэйл хаяг</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="emp-input" />
              </div>
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">Дүүрэг</label>
                <select name="location" value={form.location} onChange={handleChange} className="emp-input">
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium emp-text-body mb-1.5">Танилцуулга</label>
              <textarea name="bio" rows={4} value={form.bio} onChange={handleChange} className="emp-input resize-none" />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium emp-text-body mb-1.5">Ур чадвар</label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                      skills.includes(skill)
                        ? 'bg-emp-accent/20 border-emp-accent text-emp-accent'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {getSkillLabel(skill)}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 emp-text-body" />
                <label className="block text-sm font-medium emp-text-body">Боломжит цаг</label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-left emp-text-body"></th>
                      {timeSlots.map(slot => (
                        <th key={slot} className="py-2 px-3 text-center emp-text-body">{slot}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day, dayIdx) => (
                      <tr key={day} className="border-t border-white/10">
                        <td className="py-2 px-3 font-medium emp-text-body">{day}</td>
                        {timeSlots.map((slot, slotIdx) => (
                          <td key={slot} className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleAvailability(dayIdx, slotIdx)}
                              className={`w-6 h-6 rounded transition-all border ${
                                availability[dayIdx]?.includes(slotIdx)
                                  ? 'bg-emp-accent border-emp-accent'
                                  : 'bg-white/5 border-white/10 hover:border-white/20'
                              }`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button type="submit" className="emp-btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Хадгалах
              </button>
              {saved && <span className="text-sm text-emerald-400">Профайл шинэчлэгдлээ!</span>}
              {saveError && <span className="text-sm text-red-300">{saveError}</span>}
            </div>

            <p className="text-xs emp-text-body">
              Ур чадвар, боломжит цаг нь дарах бүрд шууд хадгалагдана.
            </p>
          </form>
        </div>
      </div>

      {/* Профайлын гоёолт */}
      <ProfileCustomizer
        user={user}
        progress={progress}
        cardClass="emp-card"
        headingClass="emp-text-heading"
        bodyClass="emp-text-body"
      />

      {/* Ажлын түүх */}
      <div className="emp-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emp-accent/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold emp-text-heading">Ажлын түүх</h3>
            <p className="text-sm emp-text-body">Платформ дээр дуусгасан ажлууд</p>
          </div>
        </div>

        {workHistory.length === 0 ? (
          <p className="text-center py-8 emp-text-body">
            Одоогоор дуусгасан ажил алга. Эхний ажлаа дуусгаад EXP цуглуулж эхлээрэй!
          </p>
        ) : (
          <div className="space-y-3">
            {workHistory.map(item => (
              <div key={item.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-medium emp-text-heading truncate">{item.title}</p>
                    <p className="text-sm emp-text-body">
                      {item.date} · {item.hours.toFixed(1)} цаг
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      +{item.exp} EXP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
