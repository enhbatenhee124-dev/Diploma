import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Briefcase, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'

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
    <nav className="bg-white/95 backdrop-blur border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-home-blue p-2 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-home-blue to-home-purple bg-clip-text text-transparent">МонголАжил</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/jobs" className="text-gray-600 hover:text-home-blue font-medium transition-colors">Ажил Хайх</Link>
            <Link to="/" className="text-gray-600 hover:text-home-blue font-medium transition-colors">Компани</Link>
            <Link to="/" className="text-gray-600 hover:text-home-blue font-medium transition-colors">Цалин</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={getDashboardLink()} className="flex items-center gap-2 text-gray-600 hover:text-home-purple font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  Хянах самбар
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-home-blue font-medium">Нэвтрэх</Link>
                <Link to="/register" className="btn-primary">Эхлэх</Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link to="/jobs" className="block text-gray-600 font-medium py-2">Ажил Хайх</Link>
          <Link to="/" className="block text-gray-600 font-medium py-2">Компани</Link>
          <Link to="/" className="block text-gray-600 font-medium py-2">Цалин</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="flex items-center gap-2 text-gray-600 font-medium py-2">
                <LayoutDashboard className="w-4 h-4" /> Хянах самбар
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-medium py-2">
                <LogOut className="w-4 h-4" /> Гарах
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-gray-600 font-medium py-2">Нэвтрэх</Link>
              <Link to="/register" className="block btn-primary text-center">Эхлэх</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
