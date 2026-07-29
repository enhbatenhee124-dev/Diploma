import { Link } from 'react-router-dom'
import { Users, Briefcase, CheckCircle, XCircle, ArrowRight, Activity, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { useShifts, useApplications, useProfilesWithContact, useEmployerQueue, combine } from '../../hooks/useData'
import { verifyEmployer, rejectEmployer } from '../../data/queries'
import { useNotification } from '../../hooks/useNotification'
import { Loading, ErrorBox } from '../../components/States'

const roleLabels = {
  employee: 'Ажил хайгч',
  employer: 'Ажил олгогч',
  admin: 'Админ',
}

export default function AdminDashboard() {
  const { notify } = useNotification()
  const profilesQ = useProfilesWithContact()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const queueQ = useEmployerQueue()
  const { loading, error, refreshAll } = combine(profilesQ, shiftsQ, appsQ, queueQ)
  const [busy, setBusy] = useState(null)

  const users = profilesQ.data
  const shifts = shiftsQ.data
  const applications = appsQ.data
  const employerProfiles = queueQ.data

  // Хараахан баталгаажаагүй ажил олгогчид
  const pendingEmployers = employerProfiles.filter(e => !e.isVerified)

  const handleVerify = async row => {
    setBusy(row.userId)
    const result = await verifyEmployer(row.userId)
    setBusy(null)
    if (!result.ok) {
      notify({ type: 'error', message: 'Баталгаажуулж чадсангүй', description: result.error })
      return
    }
    notify({
      type: 'success',
      message: 'Баталгаажлаа',
      description: `${row.orgName} одооноос зар нийтэлж чадна.`,
    })
    queueQ.refresh()
  }

  const handleReject = async row => {
    const reason = prompt(`${row.orgName}-г татгалзах шалтгаан:`)
    if (reason === null) return
    if (!reason.trim()) {
      notify({ type: 'error', message: 'Шалтгаанаа бичнэ үү' })
      return
    }

    setBusy(row.userId)
    const result = await rejectEmployer(row.userId, reason.trim())
    setBusy(null)
    if (!result.ok) {
      notify({ type: 'error', message: 'Татгалзаж чадсангүй', description: result.error })
      return
    }
    notify({ type: 'info', message: 'Татгалзлаа', description: `${row.orgName}-д мэдэгдэл очлоо.` })
    queueQ.refresh()
  }

  const completedCount = applications.filter(a => a.status === 'completed').length
  const activeShifts = shifts.filter(s => s.status === 'Active')

  const stats = [
    { label: 'Нийт хэрэглэгч', value: users.length, icon: Users, color: 'bg-emerald-500/20 text-emerald-300' },
    { label: 'Идэвхтэй зар', value: activeShifts.length, icon: Briefcase, color: 'bg-blue-500/20 text-blue-300' },
    { label: 'Нийт хүсэлт', value: applications.length, icon: Activity, color: 'bg-amber-500/20 text-amber-300' },
    { label: 'Дууссан ажил', value: completedCount, icon: CheckCircle, color: 'bg-purple-500/20 text-purple-300' },
  ]

  const recentUsers = [...users].slice(-3).reverse()
  const recentJobs = [...shifts].slice(-3).reverse()

  if (loading) return <Loading label="Мэдээлэл ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Админ хянах самбар</h1>
        <p className="mt-1 adm-text-body">Платформын ерөнхий мэдээлэл.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="adm-card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold adm-text-heading">{stat.value}</p>
                  <p className="text-sm adm-text-body">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employer Verification Queue */}
        <div className="lg:col-span-1 adm-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold adm-text-heading flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Баталгаажуулах дараалал
            </h2>
            <span className="adm-badge bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingEmployers.length} шинэ
            </span>
          </div>
          <div className="space-y-3">
            {pendingEmployers.length === 0 ? (
              <div className="text-center py-4 text-sm adm-text-body">
                Баталгаажуулах хэрэглэгч байхгүй
              </div>
            ) : (
              pendingEmployers.map(row => (
                <div key={row.userId} className="p-4 bg-adm-bg rounded-xl border border-adm-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium adm-text-heading truncate">{row.orgName}</h3>
                      <p className="text-xs adm-text-body truncate">
                        {row.contactPhone || row.contactEmail || '—'}
                        {row.regNumber && ` · РД ${row.regNumber}`}
                      </p>
                      {row.rejectReason && (
                        <p className="text-xs text-red-300 mt-1">Татгалзсан: {row.rejectReason}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleVerify(row)}
                        disabled={busy === row.userId}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-300 disabled:opacity-40"
                        title="Баталгаажуулах"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(row)}
                        disabled={busy === row.userId}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-300 disabled:opacity-40"
                        title="Татгалзах"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-1 adm-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold adm-text-heading">Сүүлд бүртгүүлсэн</h2>
            <Link to="/admin/users" className="text-sm text-adm-accent hover:text-adm-accent-hover flex items-center gap-1">
              Бүгдийг үзэх <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className="p-4 bg-adm-bg rounded-xl border border-adm-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium adm-text-heading truncate">{u.name}</h3>
                    <p className="text-sm adm-text-body truncate">{u.phone || u.email}</p>
                  </div>
                  <span className="adm-badge bg-adm-accent/10 text-adm-accent border border-adm-accent/20 flex-shrink-0">
                    {roleLabels[u.role] || u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-1 adm-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold adm-text-heading">Сүүлд оруулсан зар</h2>
            <Link to="/admin/jobs" className="text-sm text-adm-accent hover:text-adm-accent-hover flex items-center gap-1">
              Бүгдийг үзэх <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.map(job => (
              <div key={job.id} className="p-4 bg-adm-bg rounded-xl border border-adm-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium adm-text-heading truncate">{job.title}</h3>
                    <p className="text-sm adm-text-body">
                      {job.district} · {format(new Date(job.startAt), 'MM-dd HH:mm')}
                    </p>
                  </div>
                  <span className="adm-badge bg-adm-accent/10 text-adm-accent border border-adm-accent/20 flex-shrink-0">
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
