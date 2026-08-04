// ============================================================
// Service worker — PWA-ийн offline давхарга
// ============================================================
// Workbox/vite-plugin-pwa ЗОРИУД хэрэглээгүй: тэдгээр нь build-ийн үед
// файлын жагсаалт үүсгэдэг тул нэмэлт хамаарал, тохиргоо шаардана.
// Vite нь assets-ийн нэрэнд hash тавьдаг (`index-a1b2c3.js`) тул бидэнд
// жагсаалт огт хэрэггүй — hash-тай файл ХЭЗЭЭ Ч өөрчлөгддөггүй учир
// шаардлагатай үед нь кэшлээд, дараа нь кэшээс шууд өгч болно.
//
// Стратеги:
//   • Навигаци (HTML) → СҮЛЖЭЭ ЭХЛЭЭД. Шинэ хувилбарыг тэр даруй авна;
//     сүлжээгүй үед кэшлэсэн хуудсыг үзүүлнэ.
//   • /assets/* (hash-тай) → КЭШ ЭХЛЭЭД. Агуулга нь хэзээ ч
//     өөрчлөгдөхгүй тул хамгийн хурдан.
//   • Бусад GET → кэш эхлээд, дараа нь сүлжээ.
//
// ⚠ API болон Supabase рүү явах хүсэлтийг ХЭЗЭЭ Ч кэшлэхгүй — хуучин
//   ажлын зар, хуучин мэдэгдэл харуулах нь эвдэрсэнтэй адил.
// ============================================================

const VERSION = 'v1'
const SHELL = `shell-${VERSION}`
const ASSETS = `assets-${VERSION}`

self.addEventListener('install', event => {
  // Шинэ SW-г хүлээлгэлгүй идэвхжүүлнэ
  self.skipWaiting()
  event.waitUntil(caches.open(SHELL).then(cache => cache.add('/')))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Хуучин хувилбарын кэшийг цэвэрлэнэ
      const names = await caches.keys()
      await Promise.all(
        names.filter(n => n !== SHELL && n !== ASSETS).map(n => caches.delete(n))
      )
      await self.clients.claim()
    })()
  )
})

/** Кэшлэж БОЛОХГҮЙ хаягууд. */
function isDynamic(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.endsWith('.supabase.co') ||
    url.hostname.endsWith('.supabase.in')
  )
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (isDynamic(url)) return

  // Гадаад домэйн (фонт г.м.) — хөтөчид нь даатгана
  if (url.origin !== self.location.origin) return

  // ------------------------------
  // HTML — сүлжээ эхлээд
  // ------------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(SHELL)
          cache.put('/', fresh.clone())
          return fresh
        } catch {
          // Сүлжээгүй — SPA тул аль ч замд аппын бүрхүүлийг өгнө
          const cached = await caches.match('/', { cacheName: SHELL })
          return cached || Response.error()
        }
      })()
    )
    return
  }

  // ------------------------------
  // Бусад — кэш эхлээд
  // ------------------------------
  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached

      const res = await fetch(request)
      // Зөвхөн бүтэн, амжилттай хариуг кэшлэнэ. `opaque` (type: 'opaque')
      // хариуны төлөвийг уншиж чаддаггүй тул алдааг кэшлэх эрсдэлтэй.
      if (res.ok && res.type === 'basic') {
        const cache = await caches.open(ASSETS)
        cache.put(request, res.clone())
      }
      return res
    })()
  )
})
