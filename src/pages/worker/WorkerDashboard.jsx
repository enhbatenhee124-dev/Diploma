import { Link } from 'react-router-dom'
import { Briefcase, DollarSign, Clock, Star, ArrowRight, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Active Jobs', value: 3, icon: Briefcase, color: 'bg-blue-500/20 text-blue-400' },
  { label: 'Completed Jobs', value: 12, icon: Clock, color: 'bg-emerald-500/20 text-emerald-400' },
  { label: 'Total Earnings', value: '$24.5k', icon: DollarSign, color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Rating', value: '4.9', icon: Star, color: 'bg-purple-500/20 text-purple-400' },
]

const activeJobs = [
  { title: 'Website Redesign', client: 'TechCorp Inc.', progress: 65, deadline: 'Dec 30, 2024', status: 'In Progress' },
  { title: 'Mobile App UI', client: 'Design Studio', progress: 30, deadline: 'Jan 15, 2025', status: 'In Progress' },
  { title: 'API Integration', client: 'CloudSystems', progress: 90, deadline: 'Dec 20, 2024', status: 'Almost Done' },
]

export default function WorkerDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold wrk-text-heading">Freelancer Dashboard</h1>
        <p className="mt-1 wrk-text-body">Welcome back! Here's your freelancing overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="wrk-card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold wrk-text-heading">{stat.value}</p>
                  <p className="text-sm wrk-text-body">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <div className="lg:col-span-2 wrk-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold wrk-text-heading">Active Jobs</h2>
            <Link to="/worker/jobs" className="text-sm text-wrk-accent hover:text-wrk-accent-hover flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {activeJobs.map(job => (
              <div key={job.title} className="p-4 bg-wrk-bg rounded-xl border border-wrk-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium wrk-text-heading">{job.title}</h3>
                    <p className="text-sm wrk-text-body">{job.client}</p>
                  </div>
                  <span className="wrk-badge bg-wrk-accent/10 text-wrk-accent border border-wrk-accent/20">{job.status}</span>
                </div>
                <div className="w-full bg-wrk-border rounded-full h-2 mb-2">
                  <div className="bg-wrk-accent h-2 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                </div>
                <p className="text-xs wrk-text-body">{job.progress}% complete · Due {job.deadline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings Quick View */}
        <div className="wrk-card">
          <h2 className="text-lg font-semibold wrk-text-heading mb-5">Earnings Overview</h2>
          <div className="space-y-4">
            <div className="p-4 bg-wrk-bg rounded-xl border border-wrk-border">
              <p className="text-sm wrk-text-body">This Month</p>
              <p className="text-2xl font-bold wrk-text-heading">$5,200</p>
              <div className="flex items-center gap-1 text-emerald-400 text-sm mt-1">
                <TrendingUp className="w-4 h-4" /> +12% vs last month
              </div>
            </div>
            <div className="p-4 bg-wrk-bg rounded-xl border border-wrk-border">
              <p className="text-sm wrk-text-body">Pending Payments</p>
              <p className="text-2xl font-bold wrk-text-heading">$1,800</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
