import { useState } from 'react'
import { Search, MapPin, Star, Building, CheckCircle, PlusCircle } from 'lucide-react'
import { DISTRICTS } from '../../data/constants'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../hooks/useNotification'
import { useShifts, useApplications, useProfiles, useWorkerDirectory, combine } from '../../hooks/useData'
import { inviteWorker } from '../../data/queries'
import { Loading, ErrorBox } from '../../components/States'
import ReportButton from '../../components/ReportButton'

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

const statusColors = {
  'applied': 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  'approved': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'in-progress': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'completed': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'cancelled': 'text-red-400 bg-red-400/10 border-red-400/20',
}

const statusLabels = {
  'applied': 'Илгээсэн',
  'approved': 'Зөвшөөрсөн',
  'in-progress': 'Хийгдэж буй',
  'completed': 'Дууссан',
  'cancelled': 'Цуцлагдсан',
}

export default function FindWorkers() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('Бүгд')
  const { notify } = useNotification()
  const appsQ = useApplications()
  const shiftsQ = useShifts()
  const profilesQ = useProfiles()
  const directory = useWorkerDirectory()
  const { loading, error, refreshAll } = combine(appsQ, shiftsQ, profilesQ, directory)

  const localApplications = appsQ.data
  const localShifts = shiftsQ.data
  const users = profilesQ.data
  const [showRequestModal, setShowRequestModal] = useState(null) // workerId
  const [selectedShift, setSelectedShift] = useState('')

  const employerShifts = localShifts.filter(s => s.employerId === user?.id && s.status === 'Active')

  const filteredWorkers = users
    .filter(u => u.role === 'employee')
    .filter(u => {
      // ⚠ Нийтийн профайлд утас ОРОХГҮЙ (NFR-3) тул `u.phone` нь null байж
      //   болно — шууд `.includes` дуудвал хайлт бичихэд апп унана.
      const matchesSearch =
        search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || '').includes(search)
      const matchesDistrict = selectedDistrict === 'Бүгд' || u.district === selectedDistrict
      return matchesSearch && matchesDistrict
    })

  // Ур чадвар/үнэлгээг өгөгдлийн сангаас авна. Өмнө нь mockData-гаас хайдаг
  // байсан бөгөөд тэнд ID нь 'u1' маягийн байсан тул бодит (UUID) хэрэглэгчид
  // ХЭЗЭЭ Ч олдохгүй, ур чадвар нь харагддаггүй байв.
  const getWorkerProfile = userId => directory.get(userId)

  const hasActiveRequest = (workerId) => {
    return localApplications.some(app => 
      app.shiftId === selectedShift && 
      app.workerId === workerId && 
      app.status !== 'cancelled' && app.status !== 'completed'
    )
  }

  const sendWorkRequest = async (workerId) => {
    if (!selectedShift) return

    // RLS нь ажилтан ӨӨРИЙН нэрээр л хүсэлт үүсгэхийг зөвшөөрдөг тул
    // ажил олгогчийн урилгыг өгөгдлийн сангийн функцээр хийнэ. Тэр функц
    // зар үнэхээр дуудагчийнх мөн эсэхийг шалгана.
    const result = await inviteWorker(selectedShift, workerId)

    if (!result.ok) {
      notify({
        type: 'error',
        message: 'Урилга илгээж чадсангүй',
        description: result.error,
      })
      return
    }

    notify({
      type: 'success',
      message: 'Урилга илгээгдлээ',
      description: 'Ажилтантай чатаар холбогдох боломжтой боллоо.',
    })
    appsQ.refresh()
    setShowRequestModal(null)
    setSelectedShift('')
  }

  if (loading) return <Loading label="Ажилтнууд ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold wrk-text-heading">Ажилтан хайх</h1>
        <p className="mt-1 wrk-text-body">Ажилтнуудыг хайж, ажилд урьж удирда.</p>
      </div>

      {/* Filters */}
      <div className="wrk-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-wrk-muted" />
            <input 
              type="text" 
              placeholder="Ажилтан хайх..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="wrk-input pl-10" 
            />
          </div>
          <div className="relative">
            <select 
              value={selectedDistrict} 
              onChange={e => setSelectedDistrict(e.target.value)} 
              className="wrk-input appearance-none pr-10 cursor-pointer"
            >
              <option value="Бүгд" className="bg-wrk-card">Бүх дүүрэг</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Workers List */}
      <div className="space-y-4">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-16 wrk-card">
            <Search className="w-12 h-12 text-wrk-muted mx-auto mb-4" />
            <p className="text-lg wrk-text-heading">Ажилтан олдсонгүй</p>
          </div>
        ) : filteredWorkers.map(worker => {
          const profile = getWorkerProfile(worker.id)
          return (
            <div key={worker.id} className="wrk-card animate-slide-up">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-wrk-accent/20 flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-wrk-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold wrk-text-heading">{worker.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm wrk-text-body mt-1">
                      <span>{worker.district}</span>
                      <span>{worker.phone}</span>
                      {profile?.ratingAvg && (
                        <div className="flex items-center gap-1">
                          <StarRating rating={profile.ratingAvg} />
                          <span className="text-wrk-muted">({profile.ratingAvg})</span>
                        </div>
                      )}
                    </div>
                    {profile?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.skills.map(skill => (
                          <span key={skill} className="wrk-badge bg-wrk-accent/10 text-wrk-accent border border-wrk-accent/20 text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {worker.bio && (
                      <p className="text-sm text-wrk-muted mt-2">{worker.bio}</p>
                    )}
                    {/* FR-9.2 */}
                    <div className="mt-3">
                      <ReportButton targetType="user" targetId={worker.id} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (employerShifts.length > 0) setSelectedShift(employerShifts[0].id)
                    setShowRequestModal(worker.id)
                  }}
                  className="wrk-btn-primary flex items-center gap-2 flex-shrink-0"
                >
                  <PlusCircle className="w-4 h-4" /> Ажилд урь
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Send Work Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="wrk-card max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold wrk-text-heading">Ажилд урьж</h3>
              <button onClick={() => setShowRequestModal(null)} className="text-wrk-muted hover:text-wrk-text">
                <div className="w-6 h-6 flex items-center justify-center">&times;</div>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm wrk-text-body mb-1 block">Ажил сонгох</label>
                <select 
                  value={selectedShift} 
                  onChange={e => setSelectedShift(e.target.value)}
                  className="wrk-input"
                >
                  {employerShifts.length === 0 ? (
                    <option value="" disabled>Одоогоор байршуулсан ажил байхгүй</option>
                  ) : (
                    employerShifts.map(shift => (
                      <option key={shift.id} value={shift.id}>{shift.title} - {format(new Date(shift.startAt), 'yyyy-MM-dd HH:mm')}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowRequestModal(null)} className="wrk-btn-secondary flex-1">
                  Болих
                </button>
                <button 
                  onClick={() => sendWorkRequest(showRequestModal)} 
                  disabled={!selectedShift || hasActiveRequest(showRequestModal)}
                  className="bg-wrk-accent text-white rounded-xl px-6 py-2 hover:bg-wrk-accent-hover transition-colors disabled:opacity-50"
                >
                  Илгээх
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
