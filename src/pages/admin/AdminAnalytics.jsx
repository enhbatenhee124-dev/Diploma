import { TrendingUp, Users, Briefcase, DollarSign, Activity } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format } from 'date-fns'
import { useShifts, useApplications, useProfiles, combine } from '../../hooks/useData'
import { formatCurrency } from '../../utils/helpers'
import { Loading, ErrorBox } from '../../components/States'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const categoryLabels = {
  food: 'Хоол',
  retail: 'Худалдаа',
  delivery: 'Хүргэлт',
  cleaning: 'Цэвэрлэгээ',
  other: 'Бусад',
}

const axisStyle = { stroke: '#e4f0e4' }

/** Мөнгөн тэнхлэгийг богиносгож бичнэ (1.2сая / 45мян / 0). */
const shortAmount = value => {
  if (!value) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('mn-MN', { maximumFractionDigits: 1 })}сая`
  if (value >= 1000) return `${Math.round(value / 1000).toLocaleString('mn-MN')}мян`
  return value.toLocaleString('mn-MN')
}
const tooltipStyle = {
  contentStyle: { backgroundColor: '#111a11', border: '1px solid #1e331e', borderRadius: '8px' },
  itemStyle: { color: '#ffffff' },
  labelStyle: { color: '#ffffff' },
}

/** Ээлжийн үргэлжлэх хугацаагаар нэг ажилтны цалинг тооцно. */
function shiftCost(shift) {
  const hours = (new Date(shift.endAt) - new Date(shift.startAt)) / 3600000
  if (!Number.isFinite(hours) || hours <= 0) return 0
  return Math.round(hours * shift.hourlyWage)
}

export default function AdminAnalytics() {
  const profilesQ = useProfiles()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const { loading, error, refreshAll } = combine(profilesQ, shiftsQ, appsQ)

  const users = profilesQ.data
  const shifts = shiftsQ.data
  const applications = appsQ.data

  const activeShifts = shifts.filter(s => s.status === 'Active')
  const completedApps = applications.filter(a => a.status === 'completed')

  // Платформын нийт эргэлт — дууссан ажлуудын цалингийн нийлбэр
  const totalVolume = completedApps.reduce((sum, app) => {
    const shift = shifts.find(s => s.id === app.shiftId)
    return sum + (shift ? shiftCost(shift) : 0)
  }, 0)

  const decidedApps = applications.filter(a => a.status !== 'applied')
  const completionRate = decidedApps.length
    ? Math.round((completedApps.length / decidedApps.length) * 100)
    : 0

  const overview = [
    { label: 'Нийт хэрэглэгч', value: users.length, icon: Users, tint: 'bg-blue-500/10 text-blue-400' },
    { label: 'Идэвхтэй зар', value: activeShifts.length, icon: Briefcase, tint: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Нийт эргэлт', value: formatCurrency(totalVolume), icon: DollarSign, tint: 'bg-amber-500/10 text-amber-400' },
    { label: 'Гүйцэтгэлийн хувь', value: `${completionRate}%`, icon: Activity, tint: 'bg-purple-500/10 text-purple-400' },
  ]

  // Сүүлийн 6 сарын зар / хүсэлтийн өсөлт
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1))

  const inMonth = (dateString, month) => {
    const d = new Date(dateString)
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()
  }

  const growthData = months.map(m => ({
    month: format(m, 'MM сар'),
    Зар: shifts.filter(s => inMonth(s.startAt, m)).length,
    Хүсэлт: applications.filter(a => a.appliedAt && inMonth(a.appliedAt, m)).length,
  }))

  const volumeData = months.map(m => ({
    month: format(m, 'MM сар'),
    Эргэлт: completedApps.reduce((sum, app) => {
      const shift = shifts.find(s => s.id === app.shiftId)
      if (!shift || !inMonth(shift.startAt, m)) return sum
      return sum + shiftCost(shift)
    }, 0),
  }))

  // Ангилал тус бүрийн зарын тоо
  const categoryData = Object.entries(
    shifts.reduce((acc, s) => {
      const key = categoryLabels[s.category] || s.category
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  if (loading) return <Loading label="Статистик ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold adm-text-heading">Анализ</h1>
          <p className="mt-1 adm-text-body">Платформын статистик, чиг хандлага.</p>
        </div>
        <span className="text-sm adm-text-body">{format(now, 'yyyy-MM-dd HH:mm')}</span>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="adm-card">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.tint}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm adm-text-body">{card.label}</span>
              </div>
              <p className="text-3xl font-bold adm-text-heading">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Өсөлт */}
        <div className="adm-card">
          <h2 className="text-lg font-semibold adm-text-heading mb-6">Зар ба хүсэлтийн өсөлт</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e331e" />
                <XAxis dataKey="month" {...axisStyle} />
                <YAxis {...axisStyle} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ color: '#ffffff' }} />
                <Area type="monotone" dataKey="Зар" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="Хүсэлт" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ангилал */}
        <div className="adm-card">
          <h2 className="text-lg font-semibold adm-text-heading mb-6">Ажлын ангилал</h2>
          {categoryData.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <p className="adm-text-body">Зар алга.</p>
            </div>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm adm-text-body">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Эргэлт */}
      <div className="adm-card">
        <h2 className="text-lg font-semibold adm-text-heading mb-6">Сарын эргэлт</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e331e" />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis {...axisStyle} tickFormatter={shortAmount} allowDecimals={false} />
              <Tooltip {...tooltipStyle} formatter={value => [formatCurrency(value), 'Эргэлт']} />
              <Line type="monotone" dataKey="Эргэлт" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
