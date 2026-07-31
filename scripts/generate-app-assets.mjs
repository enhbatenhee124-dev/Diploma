import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ============================================================
// Аппын icon / splash-ийн ЭХ зургийг үүсгэнэ
// ============================================================
// Төсөлд лого файл байхгүй тул брэндийн өнгө (slate дэвсгэр + violet
// портфель) дээр суурилсан тэмдгийг код дотроос зурна. Ингэснээр эх зураг
// git-д хадгалагдаж, дизайн өөрчлөгдвөл энэ файлыг л засна.
//
// ⚠ ЗӨВХӨН SVG бичнэ — гуравдагч сан ХЭРЭГЛЭХГҮЙ. Өмнө нь `sharp`-аар PNG
//   рендерлэдэг байсан ч тэр нь Linux дээр эх кодоос эмхэтгэгдэж (node-gyp
//   + libvips-dev) GitHub Actions дээр `npm ci`-г унагаадаг. `@capacitor/assets`
//   нь SVG эхийг шууд хүлээж авдаг тул бидэнд растержуулагч хэрэггүй.
//
// Ажиллуулах:  node scripts/generate-app-assets.mjs
// Дараа нь:    npm run app:icons   (бүх хэмжээ рүү хөрвүүлнэ)
// ============================================================

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'assets')

const BG = '#0f172a'      // slate-900 — аппын бараан дэвсгэр
const ACCENT = '#8b5cf6'  // violet-500 — ажилтны үндсэн accent

/** Lucide-ийн `Briefcase` тэмдэг. `scale` нь 24x24 виртуал торыг томсгоно. */
const briefcase = (size, scale) => `
    <g transform="translate(${size / 2}, ${size / 2}) scale(${(size / 24) * scale}) translate(-12, -12)"
       fill="none" stroke="${ACCENT}" stroke-width="1.6"
       stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </g>`

const svg = (size, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}\n</svg>\n`

const fill = size => `\n    <rect width="${size}" height="${size}" fill="${BG}" />`

const files = {
  // Дэвсгэртэй бүтэн icon (Play Store, хуучин Android)
  'icon-only.svg': svg(1024, fill(1024) + briefcase(1024, 0.5)),

  // Adaptive icon-ий урд давхарга — Android ирмэгийг нь тайрч дугуй/дөрвөлжин
  // хэлбэрт оруулдаг тул тэмдгийг төвийн ~66%-д багтаана
  'icon-foreground.svg': svg(1024, briefcase(1024, 0.31)),
  'icon-background.svg': svg(1024, fill(1024)),

  // Splash — аль ч утасны харьцаанд тайрагдах тул тэмдэг жижиг, төвд
  'splash.svg': svg(2732, fill(2732) + briefcase(2732, 0.11)),
  'splash-dark.svg': svg(2732, fill(2732) + briefcase(2732, 0.11)),
}

await mkdir(OUT, { recursive: true })

for (const [name, content] of Object.entries(files)) {
  await writeFile(join(OUT, name), content)
  console.log('  ✓', name)
}

// Вэбийн favicon — `index.html` нь `/favicon.svg`-г заадаг ч файл байхгүй байсан.
await mkdir(join(ROOT, 'public'), { recursive: true })
await writeFile(join(ROOT, 'public', 'favicon.svg'), svg(64, fill(64) + briefcase(64, 0.5)))
console.log('  ✓ public/favicon.svg')
