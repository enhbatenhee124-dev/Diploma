import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layouts
import MainLayout from './layouts/MainLayout'
import EmployeeLayout from './layouts/EmployeeLayout'
import WorkerLayout from './layouts/WorkerLayout'
import AdminLayout from './layouts/AdminLayout'

// Auth pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Public pages
import HomePage from './pages/HomePage'

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import JobListings from './pages/employee/JobListings'
import JobDetail from './pages/employee/JobDetail'
import MyApplications from './pages/employee/MyApplications'
import EmployeeProfile from './pages/employee/EmployeeProfile'
import SavedJobs from './pages/employee/SavedJobs'

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard'
import MyJobs from './pages/worker/MyJobs'
import WorkerProfile from './pages/worker/WorkerProfile'
import WorkerEarnings from './pages/worker/WorkerEarnings'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageJobs from './pages/admin/ManageJobs'
import AdminAnalytics from './pages/admin/AdminAnalytics'

function RoleGuard({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  const getDefaultRedirect = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'employee': return '/employee/dashboard'
      case 'worker': return '/worker/dashboard'
      case 'admin': return '/admin/dashboard'
      default: return '/'
    }
  }

  return (
    <Routes>
      {/* Public routes without MainLayout (Home, Login, Register already have their own UI) */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Other public routes that DO need MainLayout (job listings etc) */}
      <Route element={<MainLayout />}>
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Route>

      {/* Employee Routes with Employee Layout */}
      <Route path="/employee" element={<RoleGuard role="employee"><EmployeeLayout /></RoleGuard>}>
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="jobs" element={<JobListings />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="saved" element={<SavedJobs />} />
      </Route>

      {/* Worker Routes with Worker Layout */}
      <Route path="/worker" element={<RoleGuard role="worker"><WorkerLayout /></RoleGuard>}>
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="jobs" element={<MyJobs />} />
        <Route path="earnings" element={<WorkerEarnings />} />
        <Route path="profile" element={<WorkerProfile />} />
      </Route>

      {/* Admin Routes with Admin Layout */}
      <Route path="/admin" element={<RoleGuard role="admin"><AdminLayout /></RoleGuard>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="jobs" element={<ManageJobs />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  )
}
