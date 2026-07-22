import { useState } from 'react'
import { Search, MapPin, DollarSign, Clock, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react'

const jobs = [
  { id: 1, title: 'Website Redesign', client: 'TechCorp Inc.', budget: '$3,000 - $5,000', deadline: 'Dec 30, 2024', status: 'In Progress', progress: 65, posted: '2 weeks ago' },
  { id: 2, title: 'Mobile App UI', client: 'Design Studio', budget: '$4,500 - $7,000', deadline: 'Jan 15, 2025', status: 'In Progress', progress: 30, posted: '1 week ago' },
  { id: 3, title: 'API Integration', client: 'CloudSystems', budget: '$2,000 - $3,500', deadline: 'Dec 20, 2024', status: 'Almost Done', progress: 90, posted: '3 weeks ago' },
  { id: 4, title: 'E-commerce Setup', client: 'Shopify Client', budget: '$1,500 - $2,500', deadline: 'Nov 30, 2024', status: 'Completed', progress: 100, posted: '1 month ago' },
  { id: 5, title: 'Landing Page', client: 'StartupXYZ', budget: '$800 - $1,200', deadline: 'Oct 15, 2024', status: 'Completed', progress: 100, posted: '2 months ago' },
]

const tabs = ['All', 'In Progress', 'Completed']

const statusColor = {
  'In Progress': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Almost Done': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'Completed': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

const statusIcon = {
  'In Progress': Clock,
  'Almost Done': Clock,
  'Completed': CheckCircle,
}

export default function MyJobs() {
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = jobs.filter(job => {
    const matchTab = activeTab === 'All' || job.status === activeTab
    const matchSearch = search === '' || job.title.toLowerCase().includes(search.toLowerCase()) || job.client.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold wrk-text-heading">My Jobs</h1>
        <p className="mt-1 wrk-text-body">Manage all your freelance projects.</p>
      </div>

      {/* Filters */}
      <div className="wrk-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-wrk-muted" />
            <input type="text" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="wrk-input pl-10" />
          </div>
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-wrk-accent text-white' : 'bg-wrk-card text-wrk-text border border-wrk-border hover:bg-wrk-card-hover'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filtered.map(job => {
          const Icon = statusIcon[job.status] || Clock
          const colorClass = statusColor[job.status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'
          return (
            <div key={job.id} className="wrk-card animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold wrk-text-heading">{job.title}</h3>
                  <p className="wrk-text-body">{job.client}</p>
                </div>
                <span className={`wrk-badge border flex items-center gap-1 ${colorClass}`}>
                  <Icon className="w-3 h-3" /> {job.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm wrk-text-body mb-3">
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.budget}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.deadline}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Remote</span>
              </div>
              {job.progress < 100 && (
                <div className="w-full bg-wrk-border rounded-full h-2">
                  <div className="bg-wrk-accent h-2 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 wrk-card">
            <Search className="w-12 h-12 text-wrk-muted mx-auto mb-4" />
            <p className="text-lg wrk-text-heading">No jobs found</p>
          </div>
        )}
      </div>
    </div>
  )
}
