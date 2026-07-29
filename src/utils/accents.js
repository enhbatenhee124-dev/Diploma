// ------------------------------
// Интерфэйсийн үндсэн өнгө (accent)
// ------------------------------
// Мэндчилгээн дээр дарахад энэ жагсаалтаар ээлжлэн солигдоно.
// Level-ээс ХАМААРАХГҮЙ — энэ бол зүгээр л амтын асуудал.
// (Профайл дээрх THEMES/FRAMES нь тусдаа, түвшингээр нээгддэг гоёолт.)
//
// Утгыг "R G B" хэлбэрээр бичнэ — Tailwind-ийн <alpha-value> ажиллахын тулд.
// ------------------------------

export const ACCENTS = [
  { id: 'violet', label: 'Нил ягаан', rgb: '168 85 247', hoverRgb: '147 51 234', swatch: '#A855F7' },
  { id: 'pink', label: 'Цайвар ягаан', rgb: '244 114 182', hoverRgb: '236 72 153', swatch: '#F472B6' },
  { id: 'rose', label: 'Сарнай', rgb: '253 164 175', hoverRgb: '251 113 133', swatch: '#FDA4AF' },
  { id: 'sky', label: 'Тэнгэр', rgb: '56 189 248', hoverRgb: '14 165 233', swatch: '#38BDF8' },
  { id: 'mint', label: 'Мятан', rgb: '52 211 153', hoverRgb: '16 185 129', swatch: '#34D399' },
  { id: 'amber', label: 'Хув', rgb: '251 191 36', hoverRgb: '245 158 11', swatch: '#FBBF24' },
]

export const DEFAULT_ACCENT = ACCENTS[0]

export const getAccent = id => ACCENTS.find(a => a.id === id) || DEFAULT_ACCENT

/** Жагсаалтын дараагийн өнгө (эцэст нь хүрвэл эхэлж эргэнэ). */
export function nextAccent(id) {
  const index = ACCENTS.findIndex(a => a.id === id)
  return ACCENTS[(index + 1) % ACCENTS.length]
}

/** Элементэд өгөх style объект — CSS хувьсагчийг тохируулна. */
export function accentStyle(id) {
  const accent = getAccent(id)
  return {
    '--emp-accent': accent.rgb,
    '--emp-accent-hover': accent.hoverRgb,
  }
}
