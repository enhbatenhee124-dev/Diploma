import { Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, Briefcase, FileText, Bookmark, User, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employee/jobs', label: 'Find Jobs', icon: Briefcase },
  { path: '/employee/applications', label: 'Applications', icon: FileText },
  { path: '/employee/saved', label: 'Saved Jobs', icon: Bookmark },
  { path: '/employee/profile', label: 'Profile', icon: User },
]

export default function EmployeeLayout() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <div className="emp-page">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="emp-sidebar w-64 flex-shrink-0 hidden lg:flex flex-col">
          <div className="p-6 border-b border-emp-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emp-accent/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-emp-accent" />
              </div>
              <div>
                <span className="text-lg font-bold text-emp-text">JobConnect</span>
                <p className="text-xs text-emp-muted">Employee Portal</p>
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
                  className={isActive ? 'emp-nav-link-active' : 'emp-nav-link'}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-emp-border">
            <button onClick={logout} className="emp-nav-link w-full text-left">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="lg:hidden emp-sidebar border-b p-4">
            <Link to="/" className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emp-accent" />
              <span className="font-bold text-emp-text">JobConnect</span>
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
