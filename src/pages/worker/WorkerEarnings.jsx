import { useState } from 'react'
import { DollarSign, TrendingUp, Calendar, Download, Wallet, Clock, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const earningsData = [
  { month: 'Jan', amount: 2400 },
  { month: 'Feb', amount: 3200 },
  { month: 'Mar', amount: 2800 },
  { month: 'Apr', amount: 4100 },
  { month: 'May', amount: 3600 },
  { month: 'Jun', amount: 5200 },
]

const transactions = [
  { id: 1, job: 'Website Redesign for TechCorp', amount: 2500, date: '2024-06-15', status: 'paid' },
  { id: 2, job: 'Mobile App UI Design', amount: 1800, date: '2024-06-10', status: 'paid' },
  { id: 3, job: 'API Integration Project', amount: 3200, date: '2024-06-05', status: 'pending' },
  { id: 4, job: 'Logo Design for Startup', amount: 800, date: '2024-05-28', status: 'paid' },
  { id: 5, job: 'E-commerce Dashboard', amount: 4500, date: '2024-05-20', status: 'paid' },
]

export default function WorkerEarnings() {
  const [filter, setFilter] = useState('all')

  const totalEarned = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0)
  const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0)
  const thisMonth = earningsData[earningsData.length - 1].amount

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-wrk-text">Earnings</h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-wrk-accent px-4 py-2 text-sm font-medium text-white hover:bg-wrk-accentHover">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-wrk-card border border-wrk-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-wrk-muted">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-wrk-text">${totalEarned.toLocaleString()}</p>
        </div>

        <div className="rounded-xl bg-wrk-card border border-wrk-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-wrk-muted">Pending</span>
          </div>
          <p className="text-3xl font-bold text-wrk-text">${pendingAmount.toLocaleString()}</p>
        </div>

        <div className="rounded-xl bg-wrk-card border border-wrk-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-wrk-muted">This Month</span>
          </div>
          <p className="text-3xl font-bold text-wrk-text">${thisMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-wrk-card border border-wrk-border p-6">
        <h2 className="text-lg font-semibold text-wrk-text mb-6">Monthly Earnings</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-xl bg-wrk-card border border-wrk-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-wrk-text">Transactions</h2>
          <div className="flex gap-2">
            {['all', 'paid', 'pending'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  filter === f
                    ? 'bg-wrk-accent text-white'
                    : 'bg-wrk-bg text-wrk-muted hover:bg-wrk-border'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-wrk-bg border border-wrk-border">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.status === 'paid' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                }`}>
                  {tx.status === 'paid' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-wrk-text">{tx.job}</p>
                  <p className="text-sm text-wrk-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {tx.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-wrk-text">${tx.amount.toLocaleString()}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  tx.status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {tx.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
