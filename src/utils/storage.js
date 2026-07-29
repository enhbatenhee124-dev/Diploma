// ------------------------------
// Мэдэгдлийн түүх (зөвхөн браузерт)
// ------------------------------
// Аппын БҮХ өгөгдөл Supabase руу шилжсэн (src/data/queries.js + hooks/useData.js).
// Энд зөвхөн toast мэдэгдлийн богино түүх үлдсэн — энэ нь тухайн төхөөрөмжид
// л хамаатай, сервер дээр хадгалах шаардлагагүй.
// ------------------------------

export const NOTIFICATIONS_KEY = 'jobplatform_notifications'

const MAX_HISTORY = 50

export function readNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function pushNotification(entry) {
  try {
    const next = [entry, ...readNotifications()].slice(0, MAX_HISTORY)
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next))
  } catch {
    // хадгалах зай дүүрсэн бол чимээгүй өнгөрөөнө
  }
}
