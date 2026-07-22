import { useState } from 'react'
import { Search, Briefcase, MapPin, DollarSign, Clock, Trash2, Eye, Filter } from 'lucide-react'

const jobs = [
  { id: 1, title: 'Senior Frontend Developer', company: 'TechCorp Inc.', location: 'Remote', salary: '$120k - $150k', type: 'Full-time', posted: '2 days ago', applications: 45, status: 'Active' },
  { id: 2, title: 'UX/UI Designer', company: 'Design Studio', location: 'New York, NY', salary: '$90k - $120k', type: 'Full-time', posted: '3 days ago', applications: 23, status: 'Active' },
  { id: 3, title: 'Backend Engineer', company: 'CloudSystems', location: 'Remote', salary: '$130k - $160k', type: 'Full-time', posted: '1 day ago', applications: 18, status: 'Active' },
  { id: 4, title: 'Product Manager', company: 'StartupXYZ', location: 'San Francisco, CA', salary: '$140k - $180k', type: 'Full-time', posted: '5 days ago', applications: 67, status: 'Active' },
  { id: 5, title: 'DevOps Engineer', company: 'InfraTech', location: 'Remote', salary: '$110k - $140k', type: 'Contract', posted: '1 week ago', applications: 12, status: 'Expired' },
]

const jobTypes = ['All Types', 'Full-time', 'Contract']
const jobStatuses = ['All Statuses', 'Active', 'Expired']

export default function ManageJobs() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  const filtered = jobs.filter(job => {
    const matchSearch = search === '' || job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All Types' || job.type === typeFilter
    const matchStatus = statusFilter === 'All Statuses' || job.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Manage Jobs</h1>
        <p className="mt-1 adm-text-body">View and manage all job postings on the platform.</p>
      </div>

      {/* Filters */}
      <div className="adm-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-adm-muted" />
            <input type="text" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="adm-input pl-10" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="adm-input appearance-none pr-10 cursor-pointer">
            {jobTypes.map(t => <option key={t} value={t} className="bg-adm-card">{t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="adm-input appearance-none pr-10 cursor-pointer">
            {jobStatuses.map(s => <option key={s} value={s} className="bg-adm-card">{s}</option>)}
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="adm-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-adm-border">
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Job</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Type</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Status</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Apps</th>
              <th className="pb-3 text-sm font-medium adm-text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(job => (
              <tr key={job.id} className="border-b border-adm-border last:border-0">
                <td className="py-4 pr-4">
                  <div>
                    <p className="font-medium adm-text-heading text-sm">{job.title}</p>
                    <p className="text-xs adm-text-body">{job.company}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs adm-text-body">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.posted}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <span className="adm-badge bg-adm-bg text-adm-muted border border-adm-border">{job.type}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className={`adm-badge border ${job.status === 'Active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>{job.status}</span>
                </td>
                <td className="py-4 pr-4 text-sm adm-text-body">{job.applications}</td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-adm-card-hover text-adm-muted hover:text-adm-text transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-adm-muted hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Briefcase className="w-10 h-10 text-adm-muted mx-auto mb-2" />
            <p className="adm-text-body">No jobs found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
