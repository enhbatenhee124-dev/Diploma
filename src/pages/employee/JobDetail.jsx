import { useParams, Link } from 'react-router-dom'
import { jobs } from '../../data/mockData'
import { formatCurrency, timeAgo } from '../../utils/helpers'
import {
  ArrowLeft, MapPin, DollarSign, Clock, Briefcase,
  Share2, Bookmark, CheckCircle, Building2, Users
} from 'lucide-react'
import { useState } from 'react'

export default function JobDetail() {
  const { id } = useParams()
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const job = jobs.find(j => j.id === id)

  if (!job) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Job not found.</p>
        <Link to="/jobs" className="btn-primary mt-4 inline-block">Back to Jobs</Link>
      </div>
    )
  }

  const handleApply = () => {
    setApplied(true)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <img src={job.logo} alt={job.company} className="w-16 h-16 rounded-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-500">{job.company}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />
                  {job.salaryType === 'hourly'
                    ? `$${job.salary.min}-$${job.salary.max}/hr`
                    : `${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}`
                  }
                </span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {timeAgo(job.postedAt)}</span>
                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded">{job.type}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSaved(!saved)} className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              {saved ? <Bookmark className="w-5 h-5 text-primary-600 fill-primary-600" /> : <Bookmark className="w-5 h-5 text-gray-400" />}
            </button>
            <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {job.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">{tag}</span>
          ))}
        </div>

        {applied ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Application submitted successfully!</span>
          </div>
        ) : (
          <button onClick={handleApply} className="btn-primary w-full sm:w-auto">
            Apply Now
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <p className="text-gray-600 leading-relaxed">{job.description}</p>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
            <ul className="space-y-3">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Company Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{job.company}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{job.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{job.applicants} applicants</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{job.type}</span>
              </div>
            </div>
          </div>

          <div className="card bg-primary-50 border-primary-100">
            <h3 className="font-semibold text-primary-900 mb-2">Need help?</h3>
            <p className="text-sm text-primary-700 mb-3">Our team is here to assist you with your application.</p>
            <a href="#" className="text-sm text-primary-600 font-medium hover:underline">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  )
}
