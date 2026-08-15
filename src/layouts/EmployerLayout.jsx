import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Briefcase, DollarSign, User, Users, Trophy, CreditCard } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import RailSidebar from '../components/RailSidebar'
import ChatDock from '../components/ChatDock'
import { Loading } from '../components/States'
import { PageTransition } from '../components/Motion'

const navItems = [
  { path: '/employer/dashboard', label: 'Хянах самбар', icon: LayoutDashboard },
  { path: '/employer/postings', label: 'Миний зар', icon: Briefcase },
  { path: '/employer/workers', label: 'Ажилтан хайх', icon: Users },
  { path: '/employer/earnings', label: 'Зардал', icon: DollarSign },
  { path: '/employer/subscription', label: 'Захиалга', icon: CreditCard },
  { path: '/employer/ranking', label: 'Тэргүүлэгчид', icon: Trophy },
  { path: '/employer/profile', label: 'Профайл', icon: User },
]

export default function EmployerLayout() {
  const { logout } = useAuth()

  return (
    <div className="wrk-page">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <RailSidebar
          theme="wrk"
          items={navItems}
          brand="МонголАжил"
          caption="Ажил олгогчийн портал"
          logoIcon={Briefcase}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto">
          {/* Доод талд чатын товчны зай үлдээнэ */}
          <div className="p-6 lg:p-8 pb-28">
            {/* Хажуугийн зурвас байрандаа үлдэж, зөвхөн агуулга солигдоно
                — тайлбарыг `EmployeeLayout`-оос үзнэ үү. */}
            <Suspense fallback={<Loading />}>
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
