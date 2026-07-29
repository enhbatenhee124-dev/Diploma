import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layouts — бүх хуудсанд хэрэгтэй тул шууд ачаална
import MainLayout from './layouts/MainLayout'
import EmployeeLayout from './layouts/EmployeeLayout'
import EmployerLayout from './layouts/EmployerLayout'
import AdminLayout from './layouts/AdminLayout'

// Эхний ачаалалтад хэрэгтэй хуудсууд
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// ============================================================
// Дүрээр нь хуваасан ачаалалт (NFR-1)
// ============================================================
// Ажилтан админы хуудсуудыг ХЭЗЭЭ Ч нээхгүй. Тэднийг эхний ачаалалтад
// оруулах нь утасны сүлжээнд дэмий хүлээлт үүсгэнэ. `lazy` нь дүр бүрийн
// кодыг тусдаа файл болгож, хэрэгтэй үед нь татна.
// ============================================================

const RankingPage = lazy(() => import('./pages/RankingPage'))

// Ажилтан
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'))
const JobListings = lazy(() => import('./pages/employee/JobListings'))
const JobDetail = lazy(() => import('./pages/employee/JobDetail'))
const MyApplications = lazy(() => import('./pages/employee/MyApplications'))
const EmployeeProfile = lazy(() => import('./pages/employee/EmployeeProfile'))
const SavedJobs = lazy(() => import('./pages/employee/SavedJobs'))

// Ажил олгогч
const EmployerDashboard = lazy(() => import('./pages/employer/EmployerDashboard'))
const MyPostings = lazy(() => import('./pages/employer/MyPostings'))
const EmployerProfile = lazy(() => import('./pages/employer/EmployerProfile'))
const EmployerEarnings = lazy(() => import('./pages/employer/EmployerEarnings'))
const Subscription = lazy(() => import('./pages/employer/Subscription'))
const FindWorkers = lazy(() => import('./pages/employer/FindWorkers'))

// Админ
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'))
const ManageJobs = lazy(() => import('./pages/admin/ManageJobs'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const Payments = lazy(() => import('./pages/admin/Payments'))
const Moderation = lazy(() => import('./pages/admin/Moderation'))

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
    </div>
  )
}

function RoleGuard({ role, children }) {
  const { user, loading } = useAuth()

  // Сешн уншиж дуустал хүлээнэ. Үгүй бол хуудсыг сэргээх бүрд /login руу хаяна.
  if (loading) return <Spinner />

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  const getDefaultRedirect = () => {
    if (loading || !user) return '/'
    switch (user.role) {
      case 'employee': return '/employee/dashboard'
      case 'employer': return '/employer/dashboard'
      case 'admin': return '/admin/dashboard'
      default: return '/'
    }
  }

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Нийтийн хуудсууд — өөрсдийн UI-тай */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
