import { Link } from 'react-router-dom'
import { Briefcase, FileText, Bookmark, Clock, ArrowRight } from 'lucide-react'

const stats = [
  { label: 'Нийт хүсэлтүүд', value: 12, icon: FileText, color: 'bg-purple-500/20 text-purple-400' },
  { label: 'Хадгалсан ажлууд', value: 8, icon: Bookmark, color: 'bg-pink-500/20 text-pink-400' },
  { label: 'Хүлээгдсэн ярилцлага', value: 3, icon: Clock, color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Идэвхтэй зарнууд', value: 24, icon: Briefcase, color: 'bg-emerald-500/20 text-emerald-400' },
]

const recentApplications = [
  { company: 'TechCorp', role: 'Сенсор Фронтенд хөгжүүлэгч', status: 'Ярилцлага томьёолсон', date: '2 өдрийн өмнө', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { company: 'Design Studio', role: 'UX Дизайнер', status: 'Хянаж байна', date: '3 өдрийн өмнө', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { company: 'StartupXYZ', role: 'React хөгжүүлэгч', status: 'Илгээсэн', date: '5 өдрийн өмнө', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
]

export default function EmployeeDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold emp-text-heading">Тавтай морил!</h1>
        <p className="mt-1 emp-text-body">Таны ажлын хайлтанд юу болж байгааг эндээс харна уу.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="emp-card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold emp-text-heading">{stat.value}</p>
                  <p className="text-sm emp-text-body">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 emp-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold emp-text-heading">Сүүлийн хүсэлтүүд</h2>
            <Link to="/employee/applications" className="text-sm text-emp-accent hover:text-emp-accent-hover flex items-center gap-1">
              Бүгдийг үзэх <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentApplications.map(app => (
              <div key={app.company + app.role} className="flex items-center justify-between p-4 bg-emp-bg rounded-xl border border-emp-border">
                <div>
                  <h3 className="font-medium emp-text-heading">{app.role}</h3>
                  <p className="text-sm emp-text-body">{app.company} · {app.date}</p>
                </div>
                <span className={`emp-badge border ${app.color}`}>{app.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="emp-card">
          <h2 className="text-lg font-semibold emp-text-heading mb-5">Хурдан үйлдлүүд</h2>
          <div className="space-y-3">
            <Link to="/employee/jobs" className="emp-btn-primary block text-center">Ажил хайх</Link>
            <Link to="/employee/profile" className="emp-btn-secondary block text-center">Профайлыг шинэчлэх</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
