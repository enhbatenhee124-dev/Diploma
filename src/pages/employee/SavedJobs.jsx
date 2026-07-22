import { useState } from 'react'
import { BookmarkCheck, Trash2, MapPin, DollarSign, Clock, ExternalLink } from 'lucide-react'

const initialSaved = [
  { id: 2, title: 'UX/UI Designer', company: 'Design Studio', location: 'New York, NY', salary: '$90k - $120k', type: 'Full-time', posted: '3 days ago', skills: ['Figma', 'Adobe XD'] },
  { id: 3, title: 'Backend Engineer', company: 'CloudSystems', location: 'Remote', salary: '$130k - $160k', type: 'Full-time', posted: '1 day ago', skills: ['Node.js', 'AWS'] },
  { id: 6, title: 'Full Stack Developer', company: 'GrowthCo', location: 'Remote', salary: '$100k - $130k', type: 'Full-time', posted: '4 days ago', skills: ['React', 'Node.js'] },
]

export default function SavedJobs() {
  const [saved, setSaved] = useState(initialSaved)

  const remove = (id) => setSaved(prev => prev.filter(j => j.id !== id))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold emp-text-heading">Saved Jobs</h1>
        <p className="mt-1 emp-text-body">Jobs you've bookmarked for later.</p>
      </div>

      {saved.length > 0 ? (
        <div className="space-y-4">
          {saved.map(job => (
            <div key={job.id} className="emp-card animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold emp-text-heading">{job.title}</h3>
                  <p className="emp-text-body">{job.company}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-emp-accent/15 text-emp-accent hover:bg-emp-accent/25 transition-colors">
                    <BookmarkCheck className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(job.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {job.skills.map(s => (
                  <span key={s} className="emp-badge bg-emp-accent/10 text-emp-accent border border-emp-accent/20">{s}</span>
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
        </div>
      ) : (
        <div className="text-center py-16 emp-card">
          <BookmarkCheck className="w-12 h-12 text-emp-muted mx-auto mb-4" />
          <p className="text-lg emp-text-heading">No saved jobs</p>
          <p className="emp-text-body">Browse jobs and save ones you're interested in.</p>
        </div>
      )}
    </div>
  )
}
