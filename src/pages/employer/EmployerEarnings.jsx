import { useState } from 'react'
import { TrendingUp, Calendar, Wallet, Clock, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useShifts, useApplications, useProfiles, combine } from '../../hooks/useData'
import { formatCurrency } from '../../utils/helpers'
import { Loading, ErrorBox } from '../../components/States'

const filters = [
  { value: 'all', label: 'Бүгд' },
  { value: 'paid', label: 'Төлсөн' },
  { value: 'pending', label: 'Хүлээгдэж буй' },
]

/** Ээлжийн үргэлжлэх хугацаагаар нэг ажилтны цалинг тооцно. */
function shiftCost(shift) {
  const hours = (new Date(shift.endAt) - new Date(shift.startAt)) / 3600000
  if (!Number.isFinite(hours) || hours <= 0) return 0
  return Math.round(hours * shift.hourlyWage)
}

export default function EmployerEarnings() {
  const { user } = useAuth()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const profilesQ = useProfiles()
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, profilesQ)

  const shifts = shiftsQ.data
  const applications = appsQ.data
  const users = profilesQ.data
  const [filter, setFilter] = useState('all')

  const myShifts = shifts.filter(s => s.employerId === user?.id)
  const myShiftIds = new Set(myShifts.map(s => s.id))

  // Гүйлгээ = зөвшөөрөгдсөнөөс хойших хүсэлт бүр.
  // Дууссан бол "төлсөн", хийгдэж буй бол "хүлээгдэж буй".
  const transactions = applications
    .filter(app => myShiftIds.has(app.shiftId) && ['in-progress', 'completed'].includes(app.status))
    .map(app => {
      const shift = myShifts.find(s => s.id === app.shiftId)
      return {
        id: app.id,
        job: shift?.title || 'Устгагдсан зар',
        worker: users.find(u => u.id === app.workerId)?.name || 'Тодорхойгүй',
        amount: shift ? shiftCost(shift) : 0,
        date: shift?.startAt || app.appliedAt,
        status: app.status === 'completed' ? 'paid' : 'pending',
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const totalPaid = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0)
  const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0)

  const now = new Date()
  const thisMonth = transactions
    .filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, t) => sum + t.amount, 0)

  // Сүүлийн 6 сарын зардлын график
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const amount = transactions
      .filter(t => {
        const td = new Date(t.date)
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
      })
      .reduce((sum, t) => sum + t.amount, 0)
    return { month: format(d, 'MM сар'), amount }
  })

  const filteredTransactions = filter === 'all' ? transactions : transactions.filter(t => t.status === filter)

  const cards = [
    { label: 'Нийт төлсөн', value: totalPaid, icon: Wallet, tint: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Хүлээгдэж буй', value: pendingAmount, icon: Clock, tint: 'bg-amber-500/10 text-amber-400' },
    { label: 'Энэ сар', value: thisMonth, icon: TrendingUp, tint: 'bg-blue-500/10 text-blue-400' },
  ]

  if (loading) return <Loading label="Зардлын мэдээлэл ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold wrk-text-heading">Зардал</h1>
          <p className="mt-1 wrk-text-body">Ажилтнуудад төлсөн болон төлөх дүн.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="wrk-card">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.tint}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm wrk-text-body">{card.label}</span>
              </div>
              <p className="text-3xl font-bold wrk-text-heading">{formatCurrency(card.value)}</p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="wrk-card">
        <h2 className="text-lg font-semibold wrk-text-heading mb-6">Сарын зардал</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#e3e9f2" />
              <YAxis
                stroke="#e3e9f2"
                allowDecimals={false}
                tickFormatter={v => (v >= 1000 ? `${Math.round(v / 1000).toLocaleString('mn-MN')}мян` : String(v))}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#ffffff' }}
                labelStyle={{ color: '#ffffff' }}
                formatter={value => [formatCurrency(value), 'Зардал']}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions */}
      <div className="wrk-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold wrk-text-heading">Гүйлгээ</h2>
          <div className="flex gap-2">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f.value
                    ? 'bg-wrk-accent text-white'
                    : 'bg-wrk-bg wrk-text-body hover:bg-wrk-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-wrk-muted mx-auto mb-3" />
              <p className="wrk-text-body">Гүйлгээ алга. Ажилтныг зөвшөөрч ажил дуусгасны дараа энд харагдана.</p>
            </div>
          ) : (
            filteredTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-wrk-bg border border-wrk-border">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.status === 'paid' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}
                  >
                    {tx.status === 'paid' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium wrk-text-heading truncate">{tx.job}</p>
                    <p className="text-sm wrk-text-body flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {format(new Date(tx.date), 'yyyy-MM-dd')} · {tx.worker}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-semibold wrk-text-heading">{formatCurrency(tx.amount)}</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {tx.status === 'paid' ? 'Төлсөн' : 'Хүлээгдэж буй'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
