import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase, BarChart3, Shield, CreditCard, Flag } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import RailSidebar from '../components/RailSidebar'
import { Loading } from '../components/States'
import { PageTransition } from '../components/Motion'

const navItems = [
  { path: '/admin/dashboard', label: 'Хянах самбар', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Хэрэглэгчид', icon: Users },
  { path: '/admin/jobs', label: 'Ажлын зарууд', icon: Briefcase },
  { path: '/admin/moderation', label: 'Хяналт', icon: Flag },
  { path: '/admin/payments', label: 'Төлбөр', icon: CreditCard },
  { path: '/admin/analytics', label: 'Анализ', icon: BarChart3 },
]

export default function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="adm-page">
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <RailSidebar
          theme="adm"
          items={navItems}
          brand="МонголАжил"
          caption="Админ портал"
          logoIcon={Shield}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
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
    </div>
  )
}
