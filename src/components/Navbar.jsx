import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Briefcase, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'

// Chadal сэдэв: бараан хагас тунгалаг зурвас + доод зураас. Загварын
// цэстэй ижил — лого нь цайвар цэнхэр дугуйтай, «Эхлэх» нь дүүрэн
// акцент товч.

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
    <nav className="sticky top-0 z-50 border-b border-chadal-line bg-chadal-bg/80 backdrop-blur-xl">
      <div className="container-page">
        <div className="flex h-[4.5rem] items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-chadal-accent">
              <Briefcase className="h-4 w-4 text-chadal-ink" />
            </span>
            Mongol<span className="font-bold text-chadal-dim">Job</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {/* «Ажил олгогчид» холбоосыг АВСАН: нүүр хуудасны `#employers`
                хэсэг устсан тул хаана ч хүрэхгүй болно. */}
            <Link to="/jobs" className="chadal-nav-link">Ажил хайх</Link>
            <Link to="/#contact" className="chadal-nav-link">Холбоо барих</Link>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={getDashboardLink()} className="chadal-nav-link flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Хянах самбар
                </Link>
                <div className="flex items-center gap-3 border-l border-chadal-border pl-4">
                  <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
                  <span className="text-sm font-semibold text-chadal-fg">{user.name}</span>
                  <button onClick={handleLogout} className="text-chadal-dim transition-colors hover:text-red-400">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="chadal-nav-link">Нэвтрэх</Link>
                <Link
                  to="/register"
                  className="rounded-full bg-chadal-accent px-6 py-2.5 text-sm font-bold text-chadal-ink transition-colors hover:bg-white"
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
        <div className="space-y-3 border-t border-chadal-line bg-chadal-card px-4 py-4 md:hidden">
          <Link to="/jobs" className="chadal-nav-link block py-2">Ажил хайх</Link>
          <Link to="/#contact" className="chadal-nav-link block py-2">Холбоо барих</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="chadal-nav-link flex items-center gap-2 py-2">
                <LayoutDashboard className="h-4 w-4" /> Хянах самбар
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 py-2 font-semibold text-red-400">
                <LogOut className="h-4 w-4" /> Гарах
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="chadal-nav-link block py-2">Нэвтрэх</Link>
              <Link
                to="/register"
                className="block rounded-full bg-chadal-accent px-7 py-2.5 text-center font-bold text-chadal-ink"
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
