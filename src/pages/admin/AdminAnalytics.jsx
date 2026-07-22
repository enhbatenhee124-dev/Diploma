import { TrendingUp, Users, Briefcase, DollarSign, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'

const userGrowthData = [
  { month: 'Jan', employees: 120, workers: 80 },
  { month: 'Feb', employees: 150, workers: 95 },
  { month: 'Mar', employees: 180, workers: 120 },
  { month: 'Apr', employees: 220, workers: 150 },
  { month: 'May', employees: 280, workers: 190 },
  { month: 'Jun', employees: 350, workers: 240 },
]

const jobStats = [
  { name: 'Development', value: 35 },
  { name: 'Design', value: 25 },
  { name: 'Marketing', value: 20 },
  { name: 'Writing', value: 15 },
  { name: 'Other', value: 5 },
]

const revenueData = [
  { month: 'Jan', revenue: 12000 },
  { month: 'Feb', revenue: 15000 },
  { month: 'Mar', revenue: 18000 },
  { month: 'Apr', revenue: 22000 },
  { month: 'May', revenue: 28000 },
  { month: 'Jun', revenue: 35000 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-adm-text">Analytics</h1>
        <span className="text-sm text-adm-muted">Last updated: Just now</span>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-adm-card border border-adm-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-adm-muted">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-adm-text">590</p>
          <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% this month
          </p>
        </div>

        <div className="rounded-xl bg-adm-card border border-adm-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-adm-muted">Active Jobs</span>
          </div>
          <p className="text-3xl font-bold text-adm-text">142</p>
          <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% this month
          </p>
        </div>

        <div className="rounded-xl bg-adm-card border border-adm-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-adm-muted">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-adm-text">$35K</p>
          <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +25% this month
          </p>
        </div>

        <div className="rounded-xl bg-adm-card border border-adm-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-adm-muted">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-adm-text">94%</p>
          <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +3% this month
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="rounded-xl bg-adm-card border border-adm-border p-6">
          <h2 className="text-lg font-semibold text-adm-text mb-6">User Growth</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="employees" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="workers" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Categories */}
        <div className="rounded-xl bg-adm-card border border-adm-border p-6">
          <h2 className="text-lg font-semibold text-adm-text mb-6">Job Categories</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {jobStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {jobStats.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-adm-muted">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl bg-adm-card border border-adm-border p-6">
        <h2 className="text-lg font-semibold text-adm-text mb-6">Revenue Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
