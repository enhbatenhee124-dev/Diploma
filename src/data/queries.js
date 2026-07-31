import { apiGet, apiPost, apiPatch, apiPut, apiDelete, qs } from '../lib/api'
import { supabase } from '../lib/supabase'

// ============================================================
// Өгөгдлийн хандалтын давхарга
// ============================================================
// Компонентууд ЗӨВХӨН эндүүр өгөгдөл авна. Дотоод хэрэгжүүлэлт нь
// modular monolith (Express) руу HTTP хүсэлт явуулна.
//
// Яагаад браузераас Postgres руу ШУУД хандахаа больсон бэ:
//   • Бизнес дүрэм (хүсэлтийн урсгал, хэн хэнийг үнэлж болох, төлбөр)
//     нэг л газар — сервер дээр байх ёстой. Клиент дээрх дүрэмд итгэх
//     боломжгүй, харин RLS дангаараа урсгалын дараалал мэдэхгүй.
//   • Гадаад үйлчилгээ (QPay) руу нууц түлхүүрээр хандах шаардлагатай.
//   • Аудит, rate limit, метрик нэг цэгээс хийгдэнэ.
//
// Сервер нь хэрэглэгчийн токеноор Postgres рүү ханддаг тул RLS ХЭВЭЭР
// хүчинтэй — хамгаалалт хоёр давхар болсон болохоос сулраагүй.
//
// Бүх функц `{ ok, data?, error? }` буцаана.
// ============================================================

// ------------------------------
// Зар (FR-4)
// ------------------------------
export const fetchShifts = () => apiGet('/shifts')

// Нэг зарын дэлгэрэнгүйг тусад нь татахгүй — JobDetail нь жагсаалтаас
// олдог тул нэмэлт хүсэлт хэрэггүй. Серверийн `GET /shifts/:id` зам нь
// нийтийн зарын хуваалцсан холбоосыг шууд нээхэд хэрэгтэй хэвээр.

export const createShift = shift =>
  apiPost('/shifts', {
    title: shift.title,
    category: shift.category,
    description: shift.description,
    district: shift.district,
    lat: shift.lat,
    lng: shift.lng,
    startAt: shift.startAt,
    endAt: shift.endAt,
    hourlyWage: shift.hourlyWage,
    slots: shift.slots,
  })

export const updateShift = (id, updates) => apiPatch(`/shifts/${id}`, updates)

export const deleteShift = id => apiDelete(`/shifts/${id}`)

// ------------------------------
// Хүсэлт (FR-6)
// ------------------------------
export const fetchApplications = () => apiGet('/applications')

// `workerId` нь нийцтэй байдлын үүднээс үлдсэн — серверт хэрэггүй.
// Хэн хүсэлт илгээж буйг токеноос тодорхойлно.
export const applyToShift = shiftId => apiPost('/applications', { shiftId })

export const withdrawApplication = id => apiDelete(`/applications/${id}`)

export const setApplicationStatus = (id, status, _cancelledBy, cancelReason) =>
  apiPatch(`/applications/${id}/status`, { status, cancelReason })

export const inviteWorker = (shiftId, workerId) =>
  apiPost('/applications/invite', { shiftId, workerId })

// ------------------------------
// Үнэлгээ (FR-7)
// ------------------------------
export const fetchReviews = () => apiGet('/reviews')

// `revieweeId` нь серверт хэрэггүй — хэнийг үнэлж буйг ажлын хоёр талаас
// сервер өөрөө тодорхойлно (хуурамч үнэлгээнээс сэргийлнэ).
export const createReview = ({ applicationId, stars, comment }) =>
  apiPost('/reviews', { applicationId, stars, comment })

// ------------------------------
// Профайл (FR-2, FR-3, NFR-3)
// ------------------------------
export const fetchProfiles = () => apiGet('/profiles')

export const fetchProfilesWithContact = () => apiGet('/profiles/admin')

export const fetchContactInfo = userId => apiGet(`/profiles/${userId}/contact`)

export const fetchEmployerProfiles = () => apiGet('/profiles/employers')

export const fetchWorkerProfiles = () => apiGet('/profiles/workers')

export const fetchWorkerProfile = userId => apiGet(`/profiles/${userId}/worker`)

export const saveWorkerProfile = (_userId, { skills, availability }) =>
  apiPut('/profiles/me/worker', { skills, availability })

export const fetchCosmetics = userId => apiGet(`/profiles/${userId}/cosmetics`)

export const saveCosmetics = (_userId, patch) => apiPut('/profiles/me/cosmetics', patch)

// ------------------------------
// EXP / түвшин / тэргүүлэгчид
// ------------------------------
export const fetchMyProgress = () => apiGet('/gamification/me')

export const fetchRanking = role => apiGet(`/gamification/ranking${qs({ role })}`)

// ------------------------------
// Хадгалсан ажил
// ------------------------------
export const fetchSavedJobs = () => apiGet('/shifts/saved')

export const toggleSavedJob = (_userId, shiftId, currentlySaved) =>
  currentlySaved ? apiDelete(`/shifts/${shiftId}/save`) : apiPost(`/shifts/${shiftId}/save`)

// ------------------------------
// Чат (FR-6.4)
// ------------------------------
export const fetchMyThreads = () => apiGet('/chat/threads')

export const fetchMessages = threadId => apiGet(`/chat/threads/${threadId}/messages`)

export const sendMessage = (threadId, _senderId, content) =>
  apiPost(`/chat/threads/${threadId}/messages`, { content })

export const markMessagesRead = threadId => apiPost(`/chat/threads/${threadId}/read`)

/**
 * Шинэ мессежийг шууд сонсох. Салгах функц буцаана.
 *
 * ⚠ Энэ нь Supabase Realtime руу ШУУД холбогдоно — API-аар дамжихгүй.
 * Шалтгаан: WebSocket-ийн холболтыг Supabase хариуцаж байгаа тул монолит
 * төлөвгүй (stateless) хэвээр үлдэж, хэвтээ масштаблахад асуудал гарахгүй.
 * Мессежийг харах эрхийг RLS шалгана.
 */
export function subscribeToMessages(threadId, onMessage) {
  const channel = supabase
    .channel(`chat:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
      payload => {
        const r = payload.new
        onMessage({
          id: r.id,
          threadId: r.thread_id,
          senderId: r.sender_id,
          content: r.content,
          readAt: r.read_at,
          createdAt: r.created_at,
        })
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ------------------------------
// Хадгалсан хайлт (FR-5.4)
// ------------------------------
export const fetchSavedSearches = () => apiGet('/searches')

export const createSavedSearch = ({ name, filters, notify }) =>
  apiPost('/searches', { name, filters, notify })

export const setSearchNotify = (id, notify) => apiPatch(`/searches/${id}`, { notify })

export const deleteSavedSearch = id => apiDelete(`/searches/${id}`)

// ------------------------------
// Мэдэгдэл (FR-8, NFR-6)
// ------------------------------
export const fetchNotifications = () => apiGet('/notifications')

export const markNotificationRead = id => apiPost(`/notifications/${id}/read`)

export const markAllNotificationsRead = () => apiPost('/notifications/read-all')

/**
 * Утасны push токеныг бүртгэнэ (зөвхөн Android апп).
 * FCM токен үе үе шинэчлэгддэг тул апп нээгдэх бүрд дуудна.
 */
export const registerDevice = (token, platform = 'android') =>
  apiPost('/notifications/devices', { token, platform })

/** Гарах үед токеныг устгана — эс тэгвээс дараагийн эзэнд нь мэдэгдэл очно. */
export const unregisterDevice = token => apiPost('/notifications/devices/remove', { token })

/**
 * Шинэ мэдэгдэл ирэхэд шууд сонсох. Салгах функц буцаана.
 *
 * Чаттай ижил шалтгаанаар Supabase Realtime руу ШУУД холбогдоно —
 * сервер WebSocket барихгүй тул төлөвгүй хэвээр үлдэнэ. RLS нь хэрэглэгч
 * зөвхөн ӨӨРИЙН мэдэгдлийг сонсохыг баталгаажуулна.
 */
export function subscribeToNotifications(userId, onNotification) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      payload => {
        const r = payload.new
        onNotification({
          id: r.id,
          type: r.type,
          message: r.message,
          description: r.description,
          isRead: r.is_read,
          createdAt: r.created_at,
        })
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ------------------------------
// Мэдээлэх / хянах (FR-9.2)
// ------------------------------
export const createReport = ({ targetType, targetId, reason }) =>
  apiPost('/moderation/reports', { targetType, targetId, reason })

export const fetchReports = () => apiGet('/moderation/reports')

export const resolveReport = (id, status, note) =>
  apiPatch(`/moderation/reports/${id}`, { status, note })

export const deactivateUser = (userId, reason) =>
  apiPost(`/moderation/users/${userId}/deactivate`, { reason })

// ------------------------------
// Ажил олгогчийн баталгаажуулалт (FR-3.2, FR-9.1)
// ------------------------------
export const fetchEmployerQueue = () => apiGet('/employers/queue')

export const verifyEmployer = employerId => apiPost(`/employers/${employerId}/verify`)

export const rejectEmployer = (employerId, reason) =>
  apiPost(`/employers/${employerId}/reject`, { reason })

// ------------------------------
// Захиалга ба төлбөр
// ------------------------------
export const fetchSubscription = () => apiGet('/billing/subscription')

export const fetchPlan = () => apiGet('/billing/plan')

export const fetchInvoices = () => apiGet('/billing/invoices')

export const requestInvoice = () => apiPost('/billing/invoices')

export const checkInvoice = invoiceId => apiPost(`/billing/invoices/${invoiceId}/check`)

export const confirmInvoice = (invoiceId, note) =>
  apiPost(`/billing/invoices/${invoiceId}/confirm`, { note })
