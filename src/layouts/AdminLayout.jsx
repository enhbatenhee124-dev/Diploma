import { Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <div className="adm-page">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="adm-sidebar w-64 flex-shrink-0 hidden lg:flex flex-col">
          <div className="p-6 border-b border-adm-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-adm-accent/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-adm-accent" />
              </div>
              <div>
                <span className="text-lg font-bold text-adm-text">JobConnect</span>
                <p className="text-xs text-adm-muted">Admin Portal</p>
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
                  className={isActive ? 'adm-nav-link-active' : 'adm-nav-link'}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-adm-border">
            <button onClick={logout} className="adm-nav-link w-full text-left">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="lg:hidden adm-sidebar border-b p-4">
            <Link to="/" className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-adm-accent" />
              <span className="font-bold text-adm-text">JobConnect</span>
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
