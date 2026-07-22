import { FileText, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

const applications = [
  { company: 'TechCorp Inc.', role: 'Senior Frontend Developer', status: 'Interview Scheduled', date: 'Dec 15, 2024', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { company: 'Design Studio', role: 'UX/UI Designer', status: 'Under Review', date: 'Dec 12, 2024', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { company: 'CloudSystems', role: 'Backend Engineer', status: 'Applied', date: 'Dec 10, 2024', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
  { company: 'StartupXYZ', role: 'Product Manager', status: 'Rejected', date: 'Dec 5, 2024', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  { company: 'InfraTech', role: 'DevOps Engineer', status: 'Offer Received', date: 'Dec 1, 2024', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
]

const statusIcons = {
  'Interview Scheduled': Clock,
  'Under Review': Clock,
  'Applied': FileText,
  'Rejected': XCircle,
  'Offer Received': CheckCircle,
}

export default function MyApplications() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold emp-text-heading">My Applications</h1>
        <p className="mt-1 emp-text-body">Track all your job applications in one place.</p>
      </div>

      <div className="space-y-4">
        {applications.map(app => {
          const Icon = statusIcons[app.status] || FileText
          return (
            <div key={app.company + app.role} className="emp-card animate-slide-up">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold emp-text-heading">{app.role}</h3>
                    <span className={`emp-badge border flex items-center gap-1 ${app.color}`}>
                      <Icon className="w-3 h-3" /> {app.status}
                    </span>
                  </div>
                  <p className="emp-text-body">{app.company}</p>
                  <p className="text-sm emp-text-body mt-1">Applied on {app.date}</p>
                </div>
                <button className="emp-btn-secondary py-2 px-3 text-sm flex items-center gap-1">
                  Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
