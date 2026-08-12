import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Briefcase, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'

// Mufi сэдэв: бараан хагас тунгалаг зурвас + доод зураас. Загварын
// цэстэй ижил — лого нь ягаан градиент тэмдэгтэй, «Эхлэх» нь ЦАЙВАР
// шахмал товч (загварын «Book a Demo»).

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    return `/${user.role}/dashboard`
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-mufi-line bg-mufi-bg/80 backdrop-blur-xl">
      <div className="container-page">
        <div className="flex h-[4.5rem] items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight text-white">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-mufi-accent to-mufi-accent-deep shadow-[0_0_20px_rgba(150,80,240,0.45)]">
              <Briefcase className="h-4 w-4 text-white" />
            </span>
            Mongol<span className="font-normal text-mufi-dim">Job</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {/* «Ажил олгогчид» холбоосыг АВСАН: нүүр хуудасны `#employers`
                хэсэг устсан тул хаана ч хүрэхгүй болно. */}
            <Link to="/jobs" className="mufi-nav-link">Ажил хайх</Link>
            <Link to="/#contact" className="mufi-nav-link">Холбоо барих</Link>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={getDashboardLink()} className="mufi-nav-link flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Хянах самбар
                </Link>
                <div className="flex items-center gap-3 border-l border-mufi-border pl-4">
                  <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
                  <span className="text-sm font-semibold text-mufi-fg">{user.name}</span>
                  <button onClick={handleLogout} className="text-mufi-dim transition-colors hover:text-red-400">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="mufi-nav-link">Нэвтрэх</Link>
                <Link
                  to="/register"
                  className="rounded-full bg-mufi-light px-6 py-2.5 text-sm font-bold text-mufi-ink shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-colors hover:bg-white"
                >
                  Эхлэх
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-white md:hidden">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-3 border-t border-mufi-line bg-mufi-card px-4 py-4 md:hidden">
          <Link to="/jobs" className="mufi-nav-link block py-2">Ажил хайх</Link>
          <Link to="/#contact" className="mufi-nav-link block py-2">Холбоо барих</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="mufi-nav-link flex items-center gap-2 py-2">
                <LayoutDashboard className="h-4 w-4" /> Хянах самбар
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 py-2 font-semibold text-red-400">
                <LogOut className="h-4 w-4" /> Гарах
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mufi-nav-link block py-2">Нэвтрэх</Link>
              <Link
                to="/register"
                className="block rounded-full bg-mufi-light px-7 py-2.5 text-center font-bold text-mufi-ink"
              >
                Эхлэх
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
