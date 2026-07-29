// ------------------------------
// "Надад тохирох" оноо (FR-5.2)
// ------------------------------
// Ажилтны боломжит цаг, ур чадвар, дүүрэгтэй хэр таарч байгаагаар зарыг
// эрэмбэлнэ. Оноо өндөр байх тусам дээр гарна.
// ------------------------------

/** Долоо хоногийн өдрийн индекс: 0=Даваа … 6=Ням (профайлын гридтэй адил). */
function dayIndex(date) {
  const js = date.getDay()        // 0=Ням … 6=Бямба
  return js === 0 ? 6 : js - 1
}

/** Цагийн интервалын индекс: 0=өглөө, 1=өдөр, 2=орой. */
function slotIndex(date) {
  const h = date.getHours()
  if (h < 12) return 0
  if (h < 18) return 1
  return 2
}

/** Ажлын ангилал ↔ профайлын ур чадварын харгалзаа. */
const CATEGORY_SKILLS = {
  food: ['waiter', 'barista', 'cashier'],
  retail: ['cashier', 'sales'],
  delivery: ['driver'],
  cleaning: ['cleaner'],
  other: [],
}

/**
 * Нэг зарын тохирлын оноо.
 *
 * @returns {{score:number, reasons:string[]}} 0–100 оноо, тайлбартай
 */
export function matchScore(shift, { skills = [], availability = {}, district } = {}) {
  const reasons = []
  let score = 0

  // 1. Боломжит цаг — хамгийн чухал (40 оноо)
  const start = new Date(shift.startAt)
  const day = dayIndex(start)
  const slot = slotIndex(start)
  const daySlots = availability[day] || availability[String(day)] || []

  if (daySlots.includes(slot)) {
    score += 40
    reasons.push('Таны боломжит цагт таарч байна')
  }

  // 2. Ур чадвар (35 оноо)
  const wanted = CATEGORY_SKILLS[shift.category] || []
  const overlap = wanted.filter(s => skills.includes(s))
  if (overlap.length > 0) {
    score += 35
    reasons.push('Таны ур чадварт тохирно')
  }

  // 3. Дүүрэг (15 оноо)
  if (district && shift.district === district) {
    score += 15
    reasons.push('Таны дүүрэгт байна')
  }

  // 4. Цалин — өндөр цалин бага зэрэг дээгүүр (10 оноо хүртэл)
  score += Math.min(10, Math.round((shift.hourlyWage || 0) / 3000))

  return { score, reasons }
}

/**
 * Зарыг тохирлоор нь эрэмбэлнэ.
 * Профайл хоосон бол эрэмбэ өөрчлөгдөхгүй (бүх оноо ойролцоо гарна).
 */
export function sortByMatch(shifts, profile) {
  return [...shifts]
    .map(s => ({ shift: s, ...matchScore(s, profile) }))
    .sort((a, b) => b.score - a.score || new Date(a.shift.startAt) - new Date(b.shift.startAt))
}

/** Профайл тохироо тооцоход хангалттай бөглөгдсөн эсэх. */
export function canMatch(profile) {
  const hasAvailability = Object.values(profile?.availability || {}).some(v => v?.length > 0)
  return hasAvailability || (profile?.skills || []).length > 0
}
