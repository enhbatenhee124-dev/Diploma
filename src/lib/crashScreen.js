import { isNative } from '../config/runtime'

// ============================================================
// Аппын алдааг ДЭЛГЭЦЭД гаргах
// ============================================================
// Утсан дээр хөгжүүлэгчийн консол байхгүй. JS унавал `#root` хоосон
// үлдэж, хэрэглэгч (болон бид) цагаан дэлгэцээс өөр юу ч харахгүй —
// "болдоггүй" гэхээс цаашгүй, засах мэдээлэл алга.
//
// Тиймээс аппад ХАМГИЙН СҮҮЛИЙН нөөц болгож алдааны текстийг шууд
// хуудсанд бичнэ. Вэб дээр ажиллахгүй — тэнд DevTools нээхэд хангалттай.
//
// Энэ нь алдааг ЗАСАХГҮЙ, зөвхөн ХАРАГДУУЛНА.
// ============================================================

const STYLE = `
  position:fixed; inset:0; z-index:2147483647; overflow:auto;
  background:#0f172a; color:#e2e8f0; padding:24px;
  font:13px/1.5 ui-monospace, Menlo, Consolas, monospace;
  -webkit-user-select:text; user-select:text;
`

function describe(error) {
  if (!error) return 'Тодорхойгүй алдаа'
  if (error instanceof Error) return `${error.name}: ${error.message}\n\n${error.stack || ''}`
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error, null, 2)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

function show(title, error) {
  // Апп аль хэдийн зурагдсан бол дарж бүү бич — жижиг алдаанаас болж
  // ажиллаж буй дэлгэцийг устгах нь илүү муу
  const root = document.getElementById('root')
  if (root?.children.length) return
  if (document.getElementById('crash-screen')) return

  const box = document.createElement('pre')
  box.id = 'crash-screen'
  box.setAttribute('style', STYLE)
  box.textContent =
    `${title}\n\n${describe(error)}\n\n` +
    `— — —\nЭнэ текстийг зургаар авч илгээнэ үү.\n` +
    `Хаяг: ${location.href}`

  document.body.appendChild(box)
}

/** Аппын хамгийн эхэнд дуудна. */
export function installCrashScreen() {
  if (!isNative) return

  window.addEventListener('error', e => show('Аппад алдаа гарлаа', e.error || e.message))
  window.addEventListener('unhandledrejection', e => show('Боловсруулаагүй алдаа', e.reason))
}

export { show as showCrash }
