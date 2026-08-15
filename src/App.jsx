import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { roleHome } from './utils/roleHome'

// Layouts — бүх хуудсанд хэрэгтэй тул шууд ачаална
import MainLayout from './layouts/MainLayout'
import EmployeeLayout from './layouts/EmployeeLayout'
import EmployerLayout from './layouts/EmployerLayout'
import AdminLayout from './layouts/AdminLayout'

// Эхний ачаалалтад хэрэгтэй хуудсууд
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Бүх lazy хуудас `routes/lazyRoutes.js`-д — хажуугийн цэс мөн тэднийг
// урьдчилан татдаг тул нэг цэгээс тарааж, тойрог хамааралгүй байлгав.
import {
  TermsPage, ResetPasswordPage, AuthCallback, ChooseRolePage,
  RankingPage, JobListings, JobDetail,
  EmployeeDashboard, MyApplications, EmployeeProfile, SavedJobs,
  EmployerDashboard, MyPostings, EmployerProfile, EmployerEarnings, Subscription, FindWorkers,
  AdminDashboard, ManageUsers, ManageJobs, AdminAnalytics, Payments, Moderation,
} from './routes/lazyRoutes'

/**
 * Хуудас татагдаж байх үеийн дэлгэц.
 *
 * Энэ нь аппын ХАМГИЙН ЭХЭНД харагддаг зүйл тул зүгээр нэг эргэлдэх дугуй
 * биш, брэндийн тэмдэгтэй байлгав: цүнхний дүрс амьсгалж, гадуур нь
 * цагираг тэлэн бүдгэрнэ.
 */
function Spinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-slate-950">
      <div className="relative flex items-center justify-center">
        <span className="absolute w-16 h-16 rounded-2xl bg-violet-500/25 animate-pulse-ring" />
        <span className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-float">
          <Briefcase className="w-8 h-8 text-white" />
        </span>
      </div>
      <p className="text-sm text-slate-400 animate-pulse">Ачаалж байна…</p>
    </div>
  )
}

function RoleGuard({ role, children }) {
  const { user, loading } = useAuth()

  // Сешн уншиж дуустал хүлээнэ. Үгүй бол хуудсыг сэргээх бүрд /login руу хаяна.
  if (loading) return <Spinner />

  if (!user) return <Navigate to="/login" replace />

  // Google-ээр анх нэвтэрсэн хүнд дүр нь автоматаар оноогдсон байдаг тул
  // өөрөөр нь сонгуулах хүртэл цааш нэвтрүүлэхгүй.
  if (!user.roleConfirmed) return <Navigate to="/choose-role" replace />

  if (user.role !== role) return <Navigate to="/" replace />
  return children
}

/** Дүрээ сонгосон хүнийг сонголтын дэлгэц рүү дахин оруулахгүй. */
function ChooseRoleGuard() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.roleConfirmed) return <Navigate to={`/${user.role}/dashboard`} replace />
  return <ChooseRolePage />
}

/**
 * Нүүр хуудас нь НЭВТРЭЭГҮЙ зочдод зориулсан танилцуулга. Нэвтэрсэн хүнийг
 * энд үлдээвэл "Нэвтрэх" товч харагдсаар байх тул тэрээр нэвтэрсэн атлаа
 * нэвтрээгүй мэт бодож дахин дардаг.
 *
 * `loading` үед нүүр хуудсыг харуулна — зочин бол илүү түгээмэл тохиолдол
 * бөгөөд тэдэнд эргэлдэх дугуй үзүүлэх нь дэмий. Нэвтэрсэн хүн нэг агшин
 * хараад шилжинэ.
 */
function HomeRoute() {
  const { user, loading } = useAuth()

  if (loading || !user) return <HomePage />

  // Дүр нь танигдахгүй бол хаашаа ч явуулахгүй — эс тэгвээс `/` → `/`
  // гэсэн төгсгөлгүй чиглүүлэлт үүснэ.
  const home = roleHome(user)
  return home === '/' ? <HomePage /> : <Navigate to={home} replace />
}

export default function App() {
  const { user, loading } = useAuth()

  // Сешн уншигдтал нүүр хуудсанд үлдээнэ; дараа нь дүрд нь тохирсон газар.
  const getDefaultRedirect = () => (loading || !user ? '/' : roleHome(user))

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Нийтийн хуудсууд — өөрсдийн UI-тай */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Google-ээр нэвтэрсний дараах буцах цэг — дүрд нь тохирсон
            хянах самбар руу аваачна */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Нэвтэрсэн ч дүрээ сонгоогүй хүний нэг удаагийн алхам */}
        <Route path="/choose-role" element={<ChooseRoleGuard />} />

        {/* MainLayout шаардлагатай нийтийн хуудсууд */}
        <Route element={<MainLayout />}>
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
        </Route>

        {/* Ажилтан */}
        <Route path="/employee" element={<RoleGuard role="employee"><EmployeeLayout /></RoleGuard>}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="jobs" element={<JobListings />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="saved" element={<SavedJobs />} />
          <Route path="ranking" element={<RankingPage />} />
        </Route>

        {/* Ажил олгогч */}
        <Route path="/employer" element={<RoleGuard role="employer"><EmployerLayout /></RoleGuard>}>
          <Route path="dashboard" element={<EmployerDashboard />} />
          <Route path="postings" element={<MyPostings />} />
          <Route path="workers" element={<FindWorkers />} />
          <Route path="earnings" element={<EmployerEarnings />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="profile" element={<EmployerProfile />} />
          <Route path="ranking" element={<RankingPage />} />
        </Route>

        {/* Админ */}
        <Route path="/admin" element={<RoleGuard role="admin"><AdminLayout /></RoleGuard>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="jobs" element={<ManageJobs />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="payments" element={<Payments />} />
        </Route>

        <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
      </Routes>
    </Suspense>
  )
}
