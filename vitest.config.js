import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // `.env`-ийг ЗААВАЛ модулиудаас өмнө ачаална: server/config.js нь орчны
    // хувьсагч дутуу үед process.exit(1) хийдэг тул setup дараалал чухал.
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js', 'server/**/*.test.js'],
    // Integration тест бодит Supabase рүү ханддаг тул удаан байж болно
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Нэг өгөгдлийн санг хуваалцдаг тул тестүүд зэрэг ажиллавал бие биедээ
    // саад болно (жишээ нь ижил зарыг зэрэг устгах)
    fileParallelism: false,
  },
})
