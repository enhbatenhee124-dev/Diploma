import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// ============================================================
// Тестийн орчин бэлдэх
// ============================================================
// `.env`-ийг гараар ачаална. Vitest нь `--env-file`-ийг дамжуулдаггүй
// бөгөөд `server/config.js` нь импортлогдох мөчдөө орчны хувьсагчийг
// шаарддаг тул энэ файл бүх тестээс ӨМНӨ ажиллах ёстой.
// ============================================================

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envPath = path.join(root, '.env')

if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test'

/** Бодит өгөгдлийн сан шаардсан тест ажиллах боломжтой эсэх. */
export const hasSupabase = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_ANON_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

if (!hasSupabase) {
  console.warn(
    '\n⚠ Supabase тохируулаагүй тул integration тестүүд алгасагдана.' +
    '\n  `.env`-д SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY-г бөглөнө үү.\n'
  )
}
