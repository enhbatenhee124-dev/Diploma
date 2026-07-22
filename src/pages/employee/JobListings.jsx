import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, DollarSign, Clock, Bookmark, BookmarkCheck, Filter, ChevronDown } from 'lucide-react'

const mockJobs = [
  { id: 1, title: 'Senior Frontend Developer', company: 'TechCorp Inc.', location: 'Remote', salary: '$120k - $150k', type: 'Full-time', posted: '2 days ago', description: 'We are looking for an experienced Frontend Developer proficient in React, TypeScript, and modern web technologies.', skills: ['React', 'TypeScript', 'Tailwind'], saved: false },
  { id: 2, title: 'UX/UI Designer', company: 'Design Studio', location: 'New York, NY', salary: '$90k - $120k', type: 'Full-time', posted: '3 days ago', description: 'Join our creative team to design beautiful and intuitive user experiences for our clients.', skills: ['Figma', 'Adobe XD', 'Prototyping'], saved: true },
  { id: 3, title: 'Backend Engineer', company: 'CloudSystems', location: 'Remote', salary: '$130k - $160k', type: 'Full-time', posted: '1 day ago', description: 'Build scalable backend services using Node.js and cloud infrastructure.', skills: ['Node.js', 'AWS', 'PostgreSQL'], saved: false },
  { id: 4, title: 'Product Manager', company: 'StartupXYZ', location: 'San Francisco, CA', salary: '$140k - $180k', type: 'Full-time', posted: '5 days ago', description: 'Lead product development from ideation to launch.', skills: ['Agile', 'Analytics', 'Strategy'], saved: false },
  { id: 5, title: 'DevOps Engineer', company: 'InfraTech', location: 'Remote', salary: '$110k - $140k', type: 'Contract', posted: '1 week ago', description: 'Automate and streamline our deployment pipelines.', skills: ['Docker', 'Kubernetes', 'CI/CD'], saved: false },
]

const jobTypes = ['All Types', 'Full-time', 'Contract', 'Part-time']

export default function JobListings() {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All Types')
  const [savedJobs, setSavedJobs] = useState(new Set(mockJobs.filter(j => j.saved).map(j => j.id)))

  const toggleSaved = (id) => {
    setSavedJobs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = mockJobs.filter(job => {
    const matchSearch = search === '' ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase())
    const matchType = selectedType === 'All Types' || job.type === selectedType
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold emp-text-heading">Find Jobs</h1>
        <p className="mt-1 emp-text-body">Browse and apply for your next opportunity.</p>
      </div>

      {/* Filters */}
      <div className="emp-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emp-muted" />
            <input type="text" placeholder="Search jobs, companies..." value={search} onChange={e => setSearch(e.target.value)} className="emp-input pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emp-muted" />
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="emp-input pl-10 appearance-none pr-10 cursor-pointer">
              {jobTypes.map(t => <option key={t} value={t} className="bg-emp-card">{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emp-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-sm emp-text-body">{filtered.length} jobs found</p>
        {filtered.map(job => (
          <div key={job.id} className="emp-card animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold emp-text-heading">{job.title}</h3>
                <p className="emp-text-body">{job.company}</p>
              </div>
              <button onClick={() => toggleSaved(job.id)} className="p-2 rounded-lg hover:bg-emp-card-hover transition-colors">
                {savedJobs.has(job.id) ? <BookmarkCheck className="w-5 h-5 text-emp-accent" /> : <Bookmark className="w-5 h-5 text-emp-muted" />}
              </button>
            </div>
            <p className="text-sm emp-text-body mb-3">{job.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills.map(skill => (
                <span key={skill} className="emp-badge bg-emp-accent/10 text-emp-accent border border-emp-accent/20">{skill}</span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm emp-text-body">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.type}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.posted}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 emp-card">
            <Search className="w-12 h-12 text-emp-muted mx-auto mb-4" />
            <p className="text-lg emp-text-heading">No jobs found</p>
            <p className="emp-text-body">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
