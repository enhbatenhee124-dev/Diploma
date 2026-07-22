import { Link } from 'react-router-dom'
import { MapPin, DollarSign, Clock, Bookmark, BookmarkCheck } from 'lucide-react'
import { formatCurrency, timeAgo } from '../utils/helpers'
import { useState } from 'react'

export default function JobCard({ job, showSave = true, variant = 'default' }) {
  const [saved, setSaved] = useState(false)

  const toggleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setSaved(!saved)
  }

  if (variant === 'compact') {
    return (
      <Link to={`/jobs/${job.id}`} className="card hover:shadow-md transition-shadow block">
        <div className="flex items-start gap-4">
          <img src={job.logo} alt={job.company} className="w-12 h-12 rounded-xl" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
            <p className="text-sm text-gray-500">{job.company}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/jobs/${job.id}`} className="card hover:shadow-lg transition-all block group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <img src={job.logo} alt={job.company} className="w-14 h-14 rounded-xl" />
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{job.title}</h3>
            <p className="text-sm text-gray-500">{job.company}</p>
          </div>
        </div>
        {showSave && (
          <button onClick={toggleSave} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {saved ? <BookmarkCheck className="w-5 h-5 text-primary-600" /> : <Bookmark className="w-5 h-5 text-gray-400" />}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.tags.map(tag => (
          <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{tag}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
        <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />
          {job.salaryType === 'hourly'
            ? `$${job.salary.min}-$${job.salary.max}/hr`
            : `${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}`
          }
        </span>
        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded">{job.type}</span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{job.applicants} applicants</span>
        <span className="text-xs text-gray-400">{timeAgo(job.postedAt)}</span>
      </div>
    </Link>
  )
}
