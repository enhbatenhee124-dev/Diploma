import { Link } from 'react-router-dom'
import { Users, Briefcase, DollarSign, TrendingUp, ArrowRight, Activity } from 'lucide-react'

const stats = [
  { label: 'Total Users', value: '2,847', icon: Users, color: 'bg-emerald-500/20 text-emerald-400' },
  { label: 'Active Jobs', value: '1,234', icon: Briefcase, color: 'bg-blue-500/20 text-blue-400' },
  { label: 'Monthly Revenue', value: '$48.2k', icon: DollarSign, color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Growth Rate', value: '+23%', icon: TrendingUp, color: 'bg-purple-500/20 text-purple-400' },
]

const recentUsers = [
  { name: 'John Doe', email: 'john@example.com', role: 'Employee', date: '2 hours ago', status: 'Active' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'Freelancer', date: '5 hours ago', status: 'Active' },
  { name: 'Mike Johnson', email: 'mike@example.com', role: 'Employee', date: '1 day ago', status: 'Pending' },
]

const recentJobs = [
  { title: 'Senior Frontend Developer', company: 'TechCorp', posted: '2 hours ago', applications: 45 },
  { title: 'UX Designer', company: 'Design Studio', posted: '5 hours ago', applications: 23 },
  { title: 'Backend Engineer', company: 'CloudSystems', posted: '1 day ago', applications: 18 },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Admin Dashboard</h1>
        <p className="mt-1 adm-text-body">Platform overview and key metrics.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="adm-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold adm-text-heading">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-adm-accent hover:text-adm-accent-hover flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.email} className="flex items-center justify-between p-4 bg-adm-bg rounded-xl border border-adm-border">
                <div>
                  <h3 className="font-medium adm-text-heading">{u.name}</h3>
                  <p className="text-sm adm-text-body">{u.email} · {u.role}</p>
                </div>
                <div className="text-right">
                  <span className={`adm-badge border ${u.status === 'Active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>{u.status}</span>
                  <p className="text-xs adm-text-body mt-1">{u.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="adm-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold adm-text-heading">Recent Jobs</h2>
            <Link to="/admin/jobs" className="text-sm text-adm-accent hover:text-adm-accent-hover flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.map(job => (
              <div key={job.title} className="flex items-center justify-between p-4 bg-adm-bg rounded-xl border border-adm-border">
                <div>
                  <h3 className="font-medium adm-text-heading">{job.title}</h3>
                  <p className="text-sm adm-text-body">{job.company}</p>
                </div>
                <div className="text-right">
                  <span className="adm-badge bg-adm-accent/10 text-adm-accent border border-adm-accent/20">{job.applications} apps</span>
                  <p className="text-xs adm-text-body mt-1">{job.posted}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
