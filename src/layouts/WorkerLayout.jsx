import { Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, Briefcase, DollarSign, User, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { path: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/worker/jobs', label: 'My Jobs', icon: Briefcase },
  { path: '/worker/earnings', label: 'Earnings', icon: DollarSign },
  { path: '/worker/profile', label: 'Profile', icon: User },
]

export default function WorkerLayout() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <div className="wrk-page">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="wrk-sidebar w-64 flex-shrink-0 hidden lg:flex flex-col">
          <div className="p-6 border-b border-wrk-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-wrk-accent/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-wrk-accent" />
              </div>
              <div>
                <span className="text-lg font-bold text-wrk-text">JobConnect</span>
                <p className="text-xs text-wrk-muted">Freelancer Portal</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={isActive ? 'wrk-nav-link-active' : 'wrk-nav-link'}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-wrk-border">
            <button onClick={logout} className="wrk-nav-link w-full text-left">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="lg:hidden wrk-sidebar border-b p-4">
            <Link to="/" className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-wrk-accent" />
              <span className="font-bold text-wrk-text">JobConnect</span>
            </Link>
          </div>
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
