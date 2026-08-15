import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Briefcase, FileText, Bookmark, User, Trophy } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCosmetics } from '../hooks/useData'
import { accentStyle } from '../utils/accents'
import RailSidebar from '../components/RailSidebar'
import ChatDock from '../components/ChatDock'
import { Loading } from '../components/States'
import { PageTransition } from '../components/Motion'

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
            {/* ⚠ Энэ Suspense нь ЗААВАЛ layout дотор байх ёстой. Урьд нь
                зөвхөн App-ийн дээд түвшинд байсан тул цэс солих бүрд
                хажуугийн зурвас, чат хүртэл бүтэн дэлгэцийн эргэлдэх
                дугуйгаар солигдож, шинэ хуудас руу «үсэрч» байгаа мэт
                удаан мэдрэгддэг байв. Одоо зөвхөн агуулга солигдоно. */}
            <Suspense fallback={<Loading />}>
              {/* Цэсээр шилжих бүрд агуулга зөөлөн орж ирнэ */}
              <PageTransition>
                <Outlet />
              </PageTransition>
            </Suspense>
          </div>
        </main>
      </div>

      <ChatDock />
    </div>
  )
}
