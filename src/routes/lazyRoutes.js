import { lazy } from 'react'

// ============================================================
// Дүрээр хуваасан хуудсуудын нэг цэг (NFR-1)
// ============================================================
// Ажилтан админы хуудсуудыг ХЭЗЭЭ Ч нээхгүй. Тэднийг эхний ачаалалтад
// оруулах нь утасны сүлжээнд дэмий хүлээлт үүсгэнэ. `lazy` нь дүр бүрийн
// кодыг тусдаа файл болгож, хэрэгтэй үед нь татна.
//
// ⚠ Эдгээр урьд нь `App.jsx` дотор байсан. Тусад нь гаргасан ганц шалтгаан:
//   хажуугийн цэс нь чанкийг УРЬДЧИЛАН татах хэрэгтэй боловч `App.jsx` нь
//   layout-уудыг импортолдог тул layout-ээс буцаад App руу импортлох нь
//   тойрог хамаарал үүсгэнэ.
//
// Нэг specifier-ийг `import()` хийхэд модуль браузерын кэшэд ордог: цэсэн
// дээр хулгана хүрэхэд татагдсан чанк нь дарах үед `lazy()`-д АЛЬ ХЭДИЙН
// бэлэн болсон байна.
// ============================================================

// Замтай холбогдоогүй (шууд URL-аар л ордог) хуудсууд
export const TermsPage = lazy(() => import('../pages/TermsPage'))
export const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'))
export const AuthCallback = lazy(() => import('../pages/AuthCallback'))
export const ChooseRolePage = lazy(() => import('../pages/ChooseRolePage'))

// Цэснээс хүрдэг хуудсууд. Татагчийг тусад нь нэрлэсэн нь `lazy()` болон
// урьдчилсан татах хоёр ЯГ нэг specifier ашиглахыг баталгаажуулна — өөр
// бичиглэл (жишээ нь өргөтгөлтэй/өргөтгөлгүй) нь хоёр өөр чанк үүсгэж,
// урьдчилан татсан нь дэмий болно.
const load = {
  ranking: () => import('../pages/RankingPage'),
  jobListings: () => import('../pages/employee/JobListings'),
  jobDetail: () => import('../pages/employee/JobDetail'),

  employeeDashboard: () => import('../pages/employee/EmployeeDashboard'),
  myApplications: () => import('../pages/employee/MyApplications'),
  employeeProfile: () => import('../pages/employee/EmployeeProfile'),
  savedJobs: () => import('../pages/employee/SavedJobs'),

  employerDashboard: () => import('../pages/employer/EmployerDashboard'),
  myPostings: () => import('../pages/employer/MyPostings'),
  employerProfile: () => import('../pages/employer/EmployerProfile'),
  employerEarnings: () => import('../pages/employer/EmployerEarnings'),
  subscription: () => import('../pages/employer/Subscription'),
  findWorkers: () => import('../pages/employer/FindWorkers'),

  adminDashboard: () => import('../pages/admin/AdminDashboard'),
  manageUsers: () => import('../pages/admin/ManageUsers'),
  manageJobs: () => import('../pages/admin/ManageJobs'),
  adminAnalytics: () => import('../pages/admin/AdminAnalytics'),
  payments: () => import('../pages/admin/Payments'),
  moderation: () => import('../pages/admin/Moderation'),
}

export const RankingPage = lazy(load.ranking)
export const JobListings = lazy(load.jobListings)
export const JobDetail = lazy(load.jobDetail)

export const EmployeeDashboard = lazy(load.employeeDashboard)
export const MyApplications = lazy(load.myApplications)
export const EmployeeProfile = lazy(load.employeeProfile)
export const SavedJobs = lazy(load.savedJobs)

export const EmployerDashboard = lazy(load.employerDashboard)
export const MyPostings = lazy(load.myPostings)
export const EmployerProfile = lazy(load.employerProfile)
export const EmployerEarnings = lazy(load.employerEarnings)
export const Subscription = lazy(load.subscription)
export const FindWorkers = lazy(load.findWorkers)

export const AdminDashboard = lazy(load.adminDashboard)
export const ManageUsers = lazy(load.manageUsers)
export const ManageJobs = lazy(load.manageJobs)
export const AdminAnalytics = lazy(load.adminAnalytics)
export const Payments = lazy(load.payments)
export const Moderation = lazy(load.moderation)

/**
 * Цэсний зам → түүний чанкийг татах функц.
 *
 * Зөвхөн хажуугийн цэснээс хүрдэг замууд энд байна. Жагсаалтад байхгүй зам
 * нь урьдчилан татагдахгүй — алдаа биш, зүгээр л хэвийн байдлаараа
 * дарсны дараа татагдана.
 */
const BY_PATH = {
  '/jobs': load.jobListings,

  '/employee/dashboard': load.employeeDashboard,
  '/employee/jobs': load.jobListings,
  '/employee/applications': load.myApplications,
  '/employee/saved': load.savedJobs,
  '/employee/ranking': load.ranking,
  '/employee/profile': load.employeeProfile,

  '/employer/dashboard': load.employerDashboard,
  '/employer/postings': load.myPostings,
  '/employer/workers': load.findWorkers,
  '/employer/earnings': load.employerEarnings,
  '/employer/subscription': load.subscription,
  '/employer/ranking': load.ranking,
  '/employer/profile': load.employerProfile,

  '/admin/dashboard': load.adminDashboard,
  '/admin/users': load.manageUsers,
  '/admin/jobs': load.manageJobs,
  '/admin/moderation': load.moderation,
  '/admin/payments': load.payments,
  '/admin/analytics': load.adminAnalytics,
}

// Нэг зам дээр дахин дахин хулгана хүрэхэд `import()` дуудагдаад байхаас
// сэргийлнэ. Хөтөч өөрөө кэшилдэг ч, эхний таталт дуусаагүй байхад олон
// удаа дуудвал дэмий Promise үүснэ.
const started = new Set()

/**
 * Цэсний чанкийг урьдчилан татна. Хулгана хүрэх/фокус авах үед дуудагдана.
 *
 * ⚠ Алдааг ЗОРИУДААР залгина: энэ бол зөвхөн хурдасгах оролдлого. Сүлжээ
 *   тасарсан ч хэрэглэгч дарах үед React `lazy` дахин оролдох тул энд
 *   алдаа шидвэл юуг ч сайжруулахгүй, зөвхөн консолыг бохирдуулна.
 */
export function prefetchRoute(path) {
  if (started.has(path)) return
  const loader = BY_PATH[path]
  if (!loader) return
  started.add(path)
  loader().catch(() => started.delete(path))
}
