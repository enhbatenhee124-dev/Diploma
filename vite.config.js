import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // SPA-д ЗААВАЛ '/' байх ёстой. './' үед `/employee/dashboard` гэх мэт дэд замыг
  // шууд нээхэд assets `/employee/assets/...` гэж хайгдаад 404 болж, хуудас
  // цагаанаар ачаалагддаг байсан.
  base: '/',
  server: {
    port: 5173,
    // /api-аар эхэлсэн хүсэлтийг Express сервер рүү дамжуулна.
    // Ингэснээр frontend-ээс зүгээр `/api/...` гэж дуудахад хангалттай бөгөөд
    // CORS болон орчны хувьсагчийн асуудал гарахгүй.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // NFR-1 (mobile-first): нэг 1MB-ын багц нь удаан сүлжээнд хүлээлт
        // үүсгэнэ. Сангуудыг тусад нь салгаснаар тэдгээр нь браузерын кэшэд
        // үлдэж, аппын код өөрчлөгдөхөд ДАХИН татагдахгүй.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
