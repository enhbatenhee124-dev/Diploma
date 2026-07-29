import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Briefcase, FileText, Bookmark, User, Trophy } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCosmetics } from '../hooks/useData'
import { accentStyle } from '../utils/accents'
import RailSidebar from '../components/RailSidebar'
import ChatDock from '../components/ChatDock'

const navItems = [
  { path: '/employee/dashboard', label: 'Хянах самбар', icon: LayoutDashboard },
  { path: '/employee/jobs', label: 'Ажил хайх', icon: Briefcase },
  { path: '/employee/applications', label: 'Миний хүсэлтүүд', icon: FileText },
  { path: '/employee/saved', label: 'Хадгалсан ажлууд', icon: Bookmark },
  { path: '/employee/ranking', label: 'Тэргүүлэгчид', icon: Trophy },
  { path: '/employee/profile', label: 'Профайл', icon: User },
]

export default function EmployeeLayout() {
  const { user, logout } = useAuth()
  const [cosmetics] = useCosmetics(user?.id)

  return (
    // Сонгосон accent-ийг эндээс тарааж өгнө — доорх бүх хуудас, зурвас,
    // чатын товч нэг өнгөтэй болно.
    <div className="emp-page" style={accentStyle(cosmetics.accentId)}>
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <RailSidebar
          theme="emp"
          items={navItems}
          brand="МонголАжил"
          caption="Ажил хайгчийн портал"
          logoIcon={Briefcase}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto">
          {/* Доод талд чатын товчны зай үлдээнэ */}
          <div className="p-6 lg:p-8 pb-28">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatDock />
    </div>
  )
}
