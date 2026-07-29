import { useState } from 'react'
import { Search, Briefcase, MapPin, DollarSign, Clock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useShifts, useApplications, useProfiles, combine } from '../../hooks/useData'
import { deleteShift as removeShift } from '../../data/queries'
import { Loading, ErrorBox } from '../../components/States'

const shiftStatuses = ['Бүх төлөв', 'Active', 'Filled', 'Closed']

export default function ManageJobs() {
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const profilesQ = useProfiles()
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, profilesQ)

  const shifts = shiftsQ.data
  const applications = appsQ.data
  const users = profilesQ.data
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Бүх төлөв')

  const deleteShift = async (shiftId) => {
    if (!confirm('Энэ зарыг устгахдаа итгэлтэй байна уу?\n\nХолбогдох хүсэлтүүд ч устана.')) return
    const result = await removeShift(shiftId)
    if (!result.ok) {
      alert(`Устгаж чадсангүй: ${result.error}`)
      return
    }
    shiftsQ.refresh()
  }

  const getEmployerName = (employerId) => {
    const employer = users.find(u => u.id === employerId)
    return employer ? employer.name : 'Тодорхойгүй'
  }

  const getApplicantsCount = (shiftId) => {
    return applications.filter(app => app.shiftId === shiftId).length
  }

  const filtered = shifts.filter(shift => {
    const matchSearch = search === '' || shift.title.toLowerCase().includes(search.toLowerCase()) || getEmployerName(shift.employerId).toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Бүх төлөв' || shift.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <Loading label="Зарууд ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Ажлын зарууд</h1>
        <p className="mt-1 adm-text-body">Платформ дээрх бүх зарыг харах, удирдах.</p>
      </div>

      {/* Filters */}
      <div className="adm-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-adm-muted" />
            <input type="text" placeholder="Зар хайх..." value={search} onChange={e => setSearch(e.target.value)} className="adm-input pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="adm-input appearance-none pr-10 cursor-pointer">
            {shiftStatuses.map(s => <option key={s} value={s} className="bg-adm-card">{s}</option>)}
          </select>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="adm-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-adm-border">
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Зар</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Ажил олгогч</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Төлөв</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Хүсэлт</th>
              <th className="pb-3 text-sm font-medium adm-text-body text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(shift => (
              <tr key={shift.id} className="border-b border-adm-border last:border-0">
                <td className="py-4 pr-4">
                  <div>
                    <p className="font-medium adm-text-heading text-sm">{shift.title}</p>
                    <p className="text-xs adm-text-body">{shift.category}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs adm-text-body">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {shift.district}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {shift.hourlyWage} ₮/цаг</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(shift.startAt), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <span className="adm-badge bg-adm-bg text-adm-muted border border-adm-border">{getEmployerName(shift.employerId)}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className={`adm-badge border ${shift.status === 'Active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : shift.status === 'Filled' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>{shift.status}</span>
                </td>
                <td className="py-4 pr-4 text-sm adm-text-body">{getApplicantsCount(shift.id)}</td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => deleteShift(shift.id)} 
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-adm-muted hover:text-red-400 transition-colors"
                      title="Зар устгах"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Briefcase className="w-10 h-10 text-adm-muted mx-auto mb-2" />
            <p className="adm-text-body">Зар олдсонгүй.</p>
          </div>
        )}
      </div>
    </div>
  )
}
