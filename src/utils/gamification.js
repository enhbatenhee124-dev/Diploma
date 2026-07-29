// ------------------------------
// EXP / Level тооцоолол
// ------------------------------
// ⚠ Энэ логик өгөгдлийн санд (supabase/migrations/..._gamification.sql) шилжсэн.
//
// Яагаад клиент дээр тооцох БОЛОМЖГҮЙ вэ:
//   RLS-ээс болж ажилтан зөвхөн 'Active' зар болон ӨӨРИЙН хүсэлтийг л хардаг.
//   Дуусгасан ажил нь 'Closed' төлөвтэй тул клиент дээр тооцвол өөрийнх нь
//   ажилласан EXP ороогүй, бусдын EXP бүр 0 гарна.
//
// Одоо EXP-г `useMyProgress()`, тэргүүлэгчдийг `useRanking()` hook-оор
// өгөгдлийн сангийн view-гээс уншина.

/** Ээлжийн үргэлжлэх хугацаа (цагаар) — цалин харуулахад хэрэглэнэ. */
export function shiftHours(shift) {
  if (!shift) return 0
  const hours = (new Date(shift.endAt) - new Date(shift.startAt)) / 3600000
  return Number.isFinite(hours) && hours > 0 ? hours : 0
}

// ------------------------------
// Цол (title) — level-ээр нээгдэнэ
// ------------------------------
// `icon` нь lucide-react дүрсний нэр. Дүрсийг components/Gamification.jsx доторх
// бүртгэлээр шийднэ — ингэснээр энэ файл зөвхөн логик хэвээр үлдэж, UI-н
// сан (lucide) EXP тооцоолол ашигладаг бүх газарт чирэгдэхгүй.
export const TITLES = [
  { id: 'newcomer', label: 'Шинэ гишүүн', minLevel: 1, icon: 'sprout' },
  { id: 'trainee', label: 'Дадлагажигч', minLevel: 2, icon: 'book' },
  { id: 'active', label: 'Идэвхтэн', minLevel: 3, icon: 'zap' },
  { id: 'reliable', label: 'Найдвартай', minLevel: 4, icon: 'handshake' },
  { id: 'experienced', label: 'Туршлагатай', minLevel: 5, icon: 'target' },
  { id: 'pro', label: 'Мэргэжилтэн', minLevel: 7, icon: 'gem' },
  { id: 'master', label: 'Мастер', minLevel: 9, icon: 'crown' },
  { id: 'legend', label: 'Домог', minLevel: 11, icon: 'flame' },
]

/** Тухайн level-д хамгийн өндөр автомат цол. */
export function defaultTitle(level) {
  return [...TITLES].reverse().find(t => level >= t.minLevel) || TITLES[0]
}

// ------------------------------
// Профайл гоёолт — level-ээр нээгдэнэ
// ------------------------------
export const THEMES = [
  { id: 'violet', label: 'Нил ягаан', minLevel: 1, gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'ocean', label: 'Далай', minLevel: 2, gradient: 'from-sky-500 to-blue-600' },
  { id: 'forest', label: 'Ой', minLevel: 3, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'sunset', label: 'Нар жаргах', minLevel: 4, gradient: 'from-orange-500 to-pink-500' },
  { id: 'candy', label: 'Чихэр', minLevel: 5, gradient: 'from-pink-500 to-rose-400' },
  { id: 'aurora', label: 'Туйлын гэрэл', minLevel: 7, gradient: 'from-green-400 via-cyan-400 to-purple-500' },
  { id: 'gold', label: 'Алт', minLevel: 9, gradient: 'from-yellow-400 via-amber-500 to-orange-600' },
  { id: 'nebula', label: 'Мананцар', minLevel: 11, gradient: 'from-indigo-500 via-purple-500 to-pink-500' },
]

export const FRAMES = [
  { id: 'none', label: 'Хүрээгүй', minLevel: 1, ring: '' },
  { id: 'silver', label: 'Мөнгө', minLevel: 2, ring: 'ring-4 ring-slate-300/70' },
  { id: 'emerald', label: 'Маргад', minLevel: 3, ring: 'ring-4 ring-emerald-400/70' },
  { id: 'sky', label: 'Тэнгэр', minLevel: 4, ring: 'ring-4 ring-sky-400/70' },
  { id: 'rose', label: 'Сарнай', minLevel: 6, ring: 'ring-4 ring-rose-400/70' },
  { id: 'gold', label: 'Алтан', minLevel: 8, ring: 'ring-4 ring-amber-400/80 shadow-lg shadow-amber-500/30' },
  { id: 'rainbow', label: 'Солонго', minLevel: 10, ring: 'ring-4 ring-fuchsia-400/80 shadow-lg shadow-fuchsia-500/40' },
]

export const BANNERS = [
  { id: 'plain', label: 'Энгийн', minLevel: 1, className: 'bg-gradient-to-r from-slate-700 to-slate-800' },
  { id: 'dawn', label: 'Үүр цайх', minLevel: 2, className: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500' },
  { id: 'meadow', label: 'Нуга', minLevel: 4, className: 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500' },
  { id: 'ember', label: 'Гал', minLevel: 6, className: 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-400' },
  { id: 'galaxy', label: 'Галактик', minLevel: 8, className: 'bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-700' },
  { id: 'prism', label: 'Призм', minLevel: 10, className: 'bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-yellow-300' },
]

/** Сонголтын жагсаалтыг нээгдсэн эсэхээр нь тэмдэглэж буцаана. */
/** Сонгосон утга нээгдээгүй бол хамгийн ойрын нээлттэйг буцаана. */
export function resolveChoice(items, selectedId, level) {
  const selected = items.find(i => i.id === selectedId)
  if (selected && level >= selected.minLevel) return selected
  const unlocked = items.filter(i => level >= i.minLevel)
  return unlocked[unlocked.length - 1] || items[0]
}

// ------------------------------
// Амжилтын тэмдэг (badge) — үйлдлээр нээгдэнэ
// ------------------------------
// `goal` нь зорилтот тоо, `current` нь одоогийн байдал — явцыг хувиар харуулна.
const BADGE_DEFS = [
  { id: 'first-job', label: 'Анхны алхам', icon: 'sparkles', hint: 'Эхний ажлаа дуусга', goal: 1, current: s => s.completed, unit: 'ажил' },
  { id: 'five-jobs', label: 'Тогтвортой', icon: 'activity', hint: '5 ажил дуусга', goal: 5, current: s => s.completed, unit: 'ажил' },
  { id: 'ten-jobs', label: 'Хөдөлмөрч', icon: 'flame', hint: '10 ажил дуусга', goal: 10, current: s => s.completed, unit: 'ажил' },
  { id: 'first-five-star', label: 'Таван од', icon: 'star', hint: '5 одтой үнэлгээ ав', goal: 1, current: s => s.fiveStars, unit: 'үнэлгээ' },
  { id: 'beloved', label: 'Хүндлэгдсэн', icon: 'heart', hint: '5 ширхэг 5 одтой үнэлгээ ав', goal: 5, current: s => s.fiveStars, unit: 'үнэлгээ' },
  { id: 'century', label: 'Зуут', icon: 'timer', hint: '100 цаг ажилла', goal: 100, current: s => s.hours, unit: 'цаг' },
  { id: 'exp-1000', label: 'Мянгат', icon: 'rocket', hint: '1000 EXP цуглуул', goal: 1000, current: s => s.exp, unit: 'EXP' },
  { id: 'level-5', label: 'Тавдугаар түвшин', icon: 'award', hint: 'Lv.5-д хүр', goal: 5, current: s => s.level, unit: 'түвшин' },
  { id: 'level-10', label: 'Аварга', icon: 'trophy', hint: 'Lv.10-д хүр', goal: 10, current: s => s.level, unit: 'түвшин' },
]

/** Өгөгдөл ирээгүй байхад ашиглах хоосон статистик. */
export const EMPTY_STATS = {
  completed: 0, hours: 0, reviews: 0, fiveStars: 0, avgRating: 0,
  exp: 0, level: 1, intoLevel: 0, neededForNext: 120, progress: 0,
  currentLevelExp: 0, nextLevelExp: 120,
}

/**
 * Статистикаас амжилтын тэмдгүүдийг тооцно.
 *
 * ⚠ Статистикийг өгөгдлийн сангийн `user_progress` view-гээс авна, клиент дээр
 * тооцохгүй. Учир нь RLS-ээс болж ажилтан зөвхөн 'Active' зар болон өөрийн
 * хүсэлтийг л хардаг — дуусгасан ажил нь 'Closed' төлөвтэй тул клиент дээр
 * тооцвол EXP дутуу гарна.
 *
 * @param {object} stats useMyProgress()-ээс ирсэн статистик
 */
export function getBadges(stats = EMPTY_STATS) {
  const badges = BADGE_DEFS.map(b => {
    const current = Math.max(0, b.current(stats))
    const earned = current >= b.goal
    return {
      ...b,
      current: Math.min(current, b.goal),
      earned,
      percent: Math.min(100, Math.round((current / b.goal) * 100)),
      remaining: Math.max(0, b.goal - current),
    }
  })

  return badges
}

/**
 * Дараагийн зорилтууд — аваагүй амжилтуудаас хамгийн ойрыг нь эхэнд.
 * Dashboard-ийн "даалгавар" жагсаалтад ашиглана.
 */
export function nextQuests(badges, limit = 4) {
  return badges
    .filter(b => !b.earned)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit)
}

// ------------------------------
// Цалин ↔ шаардлагатай level
// ------------------------------
// Цалин өндөр байх тусам илүү туршлага шаардана.
const WAGE_GATES = [
  { minWage: 30000, level: 8 },
  { minWage: 25000, level: 6 },
  { minWage: 20000, level: 5 },
  { minWage: 17000, level: 4 },
  { minWage: 15000, level: 3 },
  { minWage: 12500, level: 2 },
]

/** Тухайн цалинтай ажилд орохын тулд шаардагдах level. */
function requiredLevelForWage(hourlyWage) {
  const wage = Number(hourlyWage) || 0
  return WAGE_GATES.find(g => wage >= g.minWage)?.level ?? 1
}

/**
 * Ажлын түвшний зөвлөмж.
 *
 * ⚠ Энэ нь ХОРИГЛОХГҮЙ — хэн ч ямар ч ажилд хүсэлт илгээж болно.
 * Түвшин нь зөвхөн "энэ ажилд ийм туршлага санал болгож байна" гэсэн
 * зөвлөмж бөгөөд ажил олгогчид хүсэлт харахад мэдээлэл болно.
 *
 * Хатуу хаалт нь шинэ хэрэглэгчийг шууд хааж, marketplace-ийн гол
 * зорилт болох liquidity-г алдагдуулдаг тул авсан.
 */
export function levelAdvice(hourlyWage, userLevel) {
  const recommended = requiredLevelForWage(hourlyWage)
  return {
    recommendedLevel: recommended,
    meetsRecommendation: userLevel >= recommended,
    /** Зөвлөмжөөс хэр дутаж байна (0 бол хангасан) */
    levelsShort: Math.max(0, recommended - userLevel),
  }
}

/** Дараагийн цалингийн шатанд хүрэхэд шаардагдах level (dashboard-д зөвлөмж болгон). */
export function nextWageTier(userLevel) {
  const sorted = [...WAGE_GATES].sort((a, b) => a.level - b.level)
  return sorted.find(g => g.level > userLevel) || null
}

