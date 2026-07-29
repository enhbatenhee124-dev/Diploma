import shifts from './shifts/routes.js'
import applications from './applications/routes.js'
import reviews from './reviews/routes.js'
import profiles from './profiles/routes.js'
import chat from './chat/routes.js'
import gamification from './gamification/routes.js'
import moderation from './moderation/routes.js'
import employers from './employers/routes.js'
import billing from './billing/routes.js'

// ============================================================
// Модулийн бүртгэл — modular monolith-ийн зүрх
// ============================================================
// Модуль бүр өөрийн `basePath` болон Router-ыг экспортлоно. `index.js` нь
// тэднийг ЗӨВХӨН энэ жагсаалтаар мэднэ — өөр хоорондоо шууд import хийхгүй.
//
// Яагаад ингэв:
//   • Модуль нэмэхэд app bootstrap-д гар хүрэхгүй, зөвхөн энд бүртгэнэ.
//   • Хил хязгаар нь тодорхой — дараа нь тусдаа микросервис болгох
//     шаардлага гарвал модулийг бүтнээр нь салгах боломжтой.
//   • Хамаарал нэг чиглэлтэй: modules → core. core нь модуль мэдэхгүй.
// ============================================================

export const modules = [
  shifts,
  applications,
  reviews,
  profiles,
  chat,
  gamification,
  moderation,
  employers,
  billing,
]

/** Бүх модулийг Express апп дээр суулгана. */
export function mountModules(app, prefix = '/api') {
  for (const mod of modules) {
    app.use(`${prefix}${mod.basePath}`, mod.router)
  }
  return modules.map(m => `${prefix}${m.basePath}`)
}
