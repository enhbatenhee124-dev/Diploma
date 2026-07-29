import { Link } from 'react-router-dom'
import { BookmarkCheck, Trash2, MapPin, DollarSign, Clock, Users } from 'lucide-react'
import { format } from 'date-fns'
import { useShifts, useSavedJobs, useEmployerProfiles, combine } from '../../hooks/useData'
import { Loading, ErrorBox, Empty } from '../../components/States'

export default function SavedJobs() {
  const shiftsQ = useShifts()
  const orgsQ = useEmployerProfiles()
  const { saved, toggleSaved, loading: savedLoading, error: savedError, refresh } = useSavedJobs()
  const { loading, error, refreshAll } = combine(shiftsQ, orgsQ)

  // Хадгалсан id-уудаас жинхэнэ зарыг олно. Устгагдсан/хаагдсан зарыг алгасна.
  const savedShifts = saved.map(id => shiftsQ.data.find(s => s.id === id)).filter(Boolean)

  const employerName = employerId =>
    orgsQ.data.find(p => p.userId === employerId)?.orgName || 'Ажил олгогч'

  if (loading || savedLoading) return <Loading label="Хадгалсан ажлууд ачаалж байна…" />
  if (error || savedError) {
    return <ErrorBox message={error || savedError} onRetry={() => { refreshAll(); refresh() }} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold emp-text-heading">Хадгалсан ажлууд</h1>
        <p className="mt-1 emp-text-body">Дараа үзэхээр тэмдэглэсэн ажлууд.</p>
      </div>

      {savedShifts.length > 0 ? (
        <div className="space-y-4">
          {savedShifts.map(job => (
            <div key={job.id} className="emp-card animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold emp-text-heading">{job.title}</h3>
                  <p className="emp-text-body">{employerName(job.employerId)}</p>
                </div>
                <button
                  onClick={() => toggleSaved(job.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Хадгалснаас хасах"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm emp-text-body mb-3">{job.description}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="emp-badge bg-emp-accent/10 text-emp-accent border border-emp-accent/20">
                  {job.category}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm emp-text-body">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-white" /> {job.district}</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-white" /> {job.hourlyWage.toLocaleString('mn-MN')} ₮/цаг
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-white" /> {format(new Date(job.startAt), 'yyyy-MM-dd HH:mm')}
                </span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-white" /> {job.slots} суваг</span>
              </div>

              <div className="pt-3 mt-3 border-t border-emp-border">
                <Link to={`/employee/jobs/${job.id}`} className="text-sm text-white hover:text-emp-accent transition-colors">
                  Дэлгэрэнгүй
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="emp-card">
          <Empty
            title="Хадгалсан ажил алга"
            description="Ажил хайж, сонирхсоноо тэмдэглээрэй."
            action={<Link to="/employee/jobs" className="emp-btn-primary inline-block">Ажил хайх</Link>}
          />
        </div>
      )}
    </div>
  )
}
