import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Briefcase, FileText, User, Bookmark,
  DollarSign, Clock, Settings, Users, BarChart3,
  LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = {
  employee: [
    { path: '/employee/dashboard', label: 'Хянах самбар', icon: LayoutDashboard },
    { path: '/employee/jobs', label: 'Ажил хайх', icon: Briefcase },
    { path: '/employee/applications', label: 'Миний хүсэлтүүд', icon: FileText },
    { path: '/employee/saved', label: 'Хадгалсан ажлууд', icon: Bookmark },
    { path: '/employee/profile', label: 'Профайл', icon: User },
  ],
  worker: [
    { path: '/worker/dashboard', label: 'Хянах самбар', icon: LayoutDashboard },
    { path: '/worker/jobs', label: 'Миний ажлууд', icon: Briefcase },
    { path: '/worker/earnings', label: 'Орлого', icon: DollarSign },
    { path: '/worker/availability', label: 'Идэвхтэй цаг', icon: Clock },
    { path: '/worker/profile', label: 'Профайл', icon: User },
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Хянах самбар', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Хэрэглэгчид', icon: Users },
    { path: '/admin/jobs', label: 'Ажлууд', icon: Briefcase },
    { path: '/admin/analytics', label: 'Анализ', icon: BarChart3 },
    { path: '/admin/settings', label: 'Тохиргоо', icon: Settings },
  ]
}

const themeMap = {
  employee: {
    sidebar: 'bg-emp-card border-emp-border',
    headerBorder: 'border-emp-border',
    logoBg: 'bg-emp-accent',
    logoText: 'text-emp-text',
    toggleHover: 'hover:bg-emp-border',
    linkClass: 'sidebar-link',
    userText: 'text-emp-text',
    userMuted: 'text-emp-muted',
    logoutHover: 'hover:bg-red-500/10',
  },
  worker: {
    sidebar: 'bg-wrk-card border-wrk-border',
    headerBorder: 'border-wrk-border',
    logoBg: 'bg-wrk-accent',
    logoText: 'text-wrk-text',
    toggleHover: 'hover:bg-wrk-border',
    linkClass: 'sidebar-link-worker',
    userText: 'text-wrk-text',
    userMuted: 'text-wrk-muted',
    logoutHover: 'hover:bg-red-500/10',
  },
  admin: {
    sidebar: 'bg-adm-card border-adm-border',
    headerBorder: 'border-adm-border',
    logoBg: 'bg-adm-accent',
    logoText: 'text-adm-text',
    toggleHover: 'hover:bg-adm-border',
    linkClass: 'sidebar-link-admin',
    userText: 'text-adm-text',
    userMuted: 'text-adm-muted',
    logoutHover: 'hover:bg-red-500/10',
  },
}

export default function Sidebar({ role }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const items = navItems[role] || []
  const t = themeMap[role] || themeMap.employee

  return (
    <aside className={`fixed left-0 top-0 h-full ${t.sidebar} border-r z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        <div className={`flex items-center justify-between h-16 px-4 border-b ${t.headerBorder}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className={`${t.logoBg} p-1.5 rounded-lg`}>
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className={`font-bold ${t.logoText}`}>МонголАжил</span>
            </Link>
          )}
          {collapsed && (
            <div className={`${t.logoBg} p-1.5 rounded-lg mx-auto`}>
              <Briefcase className="w-4 h-4 text-white" />
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className={`p-1 ${t.toggleHover} rounded-lg ${t.logoText}`}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${t.linkClass} ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        <div className={`p-4 border-t ${t.headerBorder}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 mb-4">
              <img src={user?.avatar} alt={user?.name} className="w-9 h-9 rounded-full" />
              <div className="overflow-hidden">
                <p className={`text-sm font-medium ${t.userText} truncate`}>{user?.name}</p>
                <p className={`text-xs ${t.userMuted} capitalize`}>{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-red-400 ${t.logoutHover} rounded-lg transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Гарах</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
