import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// ============================================================
// Аппын icon / splash-ийн ЭХ зургийг үүсгэнэ
// ============================================================
// Төсөлд лого файл байхгүй тул брэндийн өнгө (slate дэвсгэр + violet
// портфель) дээр суурилсан тэмдгийг код дотроос зурна. Ингэснээр эх зураг
// git-д хадгалагдаж, дизайн өөрчлөгдвөл энэ файлыг л засна.
//
// Ажиллуулах:  node scripts/generate-app-assets.mjs
// Дараа нь:    npm run app:icons   (бүх хэмжээ рүү хөрвүүлнэ)
// ============================================================

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'assets')

const BG = '#0f172a'      // slate-900 — аппын бараан дэвсгэр
const ACCENT = '#8b5cf6'  // violet-500 — ажилтны үндсэн accent

/** Lucide-ийн `Briefcase` тэмдэг. `scale` нь 24x24 виртуал торыг томсгоно. */
const briefcase = (size, stroke) => `
  <g transform="translate(${size / 2}, ${size / 2}) scale(${size / 24 * 0.5}) translate(-12, -12)"
     fill="none" stroke="${ACCENT}" stroke-width="${stroke}"
     stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </g>`

/** Дэвсгэртэй бүтэн icon (Play Store, хуучин Android). */
const iconSvg = size => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}" />
    ${briefcase(size, 1.6)}
  </svg>`

/**
 * Adaptive icon-ий урд давхарга — Android нь ирмэгийг нь тайрч дугуй/дөрвөлжин
 * хэлбэрт оруулдаг тул тэмдгийг ТӨВИЙН ~66%-д багтаана.
 */
const foregroundSvg = size => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${size / 2}, ${size / 2}) scale(0.62) translate(${-size / 2}, ${-size / 2})">
      ${briefcase(size, 1.6)}
    </g>
  </svg>`

const backgroundSvg = size => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${BG}" />
  </svg>`

/** Splash — дэвсгэр дээр төвд нь жижиг тэмдэг (аль ч утасны харьцаанд тайрагдана). */
const splashSvg = size => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}" />
    <g transform="translate(${size / 2}, ${size / 2}) scale(0.22) translate(${-size / 2}, ${-size / 2})">
      ${briefcase(size, 1.4)}
    </g>
  </svg>`

const png = (svg, file) =>
  sharp(Buffer.from(svg)).png().toFile(join(OUT, file)).then(() => console.log('  ✓', file))

await mkdir(OUT, { recursive: true })

await Promise.all([
  png(iconSvg(1024), 'icon-only.png'),
  png(foregroundSvg(1024), 'icon-foreground.png'),
  png(backgroundSvg(1024), 'icon-background.png'),
  png(splashSvg(2732), 'splash.png'),
  png(splashSvg(2732), 'splash-dark.png'),
])

// Вэбийн favicon — `index.html` нь `/favicon.svg`-г заадаг ч файл байхгүй байсан.
await mkdir(join(ROOT, 'public'), { recursive: true })
await writeFile(join(ROOT, 'public', 'favicon.svg'), iconSvg(64).trim() + '\n')
console.log('  ✓ public/favicon.svg')
