import { useAuth } from '../hooks/useAuth'

const themeMap = {
  employee: {
    card: 'card-employee',
    muted: 'text-emp-muted',
    text: 'text-emp-text',
    bg: 'bg-emp-accent/10',
    icon: 'text-emp-accent',
  },
  worker: {
    card: 'card-worker',
    muted: 'text-wrk-muted',
    text: 'text-wrk-text',
    bg: 'bg-wrk-accent/10',
    icon: 'text-wrk-accent',
  },
  admin: {
    card: 'card-admin',
    muted: 'text-adm-muted',
    text: 'text-adm-text',
    bg: 'bg-adm-accent/10',
    icon: 'text-adm-accent',
  },
}

export default function StatCard({ title, value, icon: Icon, change, changeType = 'positive' }) {
  const { user } = useAuth()
  const role = user?.role || 'employee'
  const t = themeMap[role] || themeMap.employee

  return (
    <div className={t.card}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${t.muted} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
          {change && (
            <p className={`text-sm mt-1 font-medium ${changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
              {changeType === 'positive' ? '+' : ''}{change} өмнөх сараас
            </p>
          )}
        </div>
        <div className={`${t.bg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${t.icon}`} />
        </div>
      </div>
    </div>
  )
}
