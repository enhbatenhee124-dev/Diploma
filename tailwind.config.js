/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Public page colors
        'home-blue': '#2563EB',
        'home-purple': '#7C3AED',

        // ==================== MUFI (нийтийн хуудсууд) ====================
        // Claude Design-ийн "Mufi Landing v2" загвараас. Өмнөх "Chadal"
        // (бараан цэнхэр, `#8ECBFB` акцент) сэдвийг БҮРЭН орлосон тул түүний
        // `chadal-*` токенуудыг устгав.
        //
        // Загварын гол санаа нь ХОЁР акцент: ЯГААН (үндсэн үйлдэл, холбоос)
        // ба УЛБАР ШАР (хоёрдогч тодотгол). Хуудасны эхэнд hero-гийн зүүн
        // талд улбар шар, баруун талд ягаан туяа тулгарч, тэр хоёр өнгө
        // хуудсын турш ээлжилнэ.
        //
        // ⚠ Хэд хэдэн өнгийг ЗОРИУД өөрчилсөн — эх загвар нь AA (4.5:1)
        //   тодролыг давдаггүй байсан. Тайлбар нь өнгө бүрийн ард байна.
        'mufi-bg': '#0A0611',          // хуудасны суурь
        'mufi-bg-deep': '#08040D',     // хуудсаас ч бараан (html дэвсгэр)
        'mufi-card': '#150E21',        // карт, самбар
        'mufi-card-hover': '#1F1533',
        'mufi-card-purple': '#1A1030', // ягаан өнгө шингэсэн онцлох карт
        'mufi-card-warm': '#221219',   // улбар шар шингэсэн онцлох карт
        'mufi-border': '#2A2435',      // картын ирмэг (эх: rgba(255,255,255,.09))
        'mufi-line': '#1E1729',        // цэс/хөлийн зураас
        'mufi-field': '#33254A',       // оролтын ирмэг
        'mufi-accent': '#B884FF',      // ҮНДСЭН акцент — ягаан (картан дээр 6.97:1)
        'mufi-accent-deep': '#6D33C9', // дүүргэлттэй ягаан (цагаан текст 7.08:1)
        'mufi-warm': '#FF9D4A',        // хоёрдогч акцент — улбар шар (9.11:1)
        'mufi-warm-deep': '#A8410A',   // дүүргэлттэй улбар шар (цагаан текст 6.13:1)
        // Эх загварын #EF5F16 дээр цагаан текст ердөө 3.32:1 болдог тул
        // ДҮҮРГЭЛТТЭЙ хувилбарыг нь бараандав. Зөвхөн текстгүй чимэглэлд
        // (градиент, туяа) эх #EF5F16-г шууд хэрэглэнэ.
        'mufi-ink': '#170D22',         // ягаан/цайвар дэвсгэр дээрх бараан текст
        'mufi-warm-ink': '#2A1003',    // улбар шар дэвсгэр дээрх бараан текст (8.67:1)
        'mufi-light': '#F6F2FA',       // загварын цайвар товч
        'mufi-fg': '#F3EEF8',          // үндсэн текст
        'mufi-muted': '#A099B4',       // хоёрдогч текст — картан дээр 6.9:1
        // Эх загвар rgba(255,255,255,0.48) → #85828C. Энгийн картан дээр
        // 4.99:1 боловч ягаан/улбар шар өнгөтэй картан дээр 4.77:1 хүртэл
        // унадаг тул бүх картад найдвартай байхаар тодруулав.
        'mufi-dim': '#8E88A0',         // гуравдагч текст — картан дээр 5.5:1
        // Эх загвар rgba(255,255,255,0.38) → #6E6A75, ердөө 3.57:1 (AA унана).

        // Үнийн онцлох карт: улбар шар. Загварын hero дээрх «Start sessions»
        // товчны өнгө — тэнд бараан текстээр байсныг энд ЦАГААН текст болгосон
        // тул дүүргэлтийг бараандав (6.13:1).
        'mufi-flame': '#A8410A',
        'mufi-flame-soft': '#FFE7D3',  // онцлох картан дээрх хоёрдогч текст (5.14:1)

        // Mascot-ийн хоёр цайвар карт. Загварт цайвар хэсэг БАЙХГҮЙ тул
        // хоёр акцентийг нь цайвар талд нь буулгав: ажил хайгч → ягаан,
        // ажил олгогч → улбар шар. (Chadal-ын ногоон `mint` устав.)
        'mufi-lilac': '#EDE4FB',
        'mufi-lilac-ink': '#1E1030',
        'mufi-lilac-eyebrow': '#6A3FB8',  // 5.67:1
        'mufi-lilac-body': '#5D4A7A',     // 6.27:1
        'mufi-lilac-btn': '#6D33C9',      // цагаан текст 7.08:1
        'mufi-peach': '#FBE6D6',
        'mufi-peach-ink': '#2A1206',
        'mufi-peach-eyebrow': '#9A3D06',  // 5.71:1
        'mufi-peach-body': '#6E4630',     // 6.74:1
        'mufi-peach-btn': '#A8410A',      // цагаан текст 6.13:1

        // Employee dark theme
        // Тайлбар: dashboard-ийн текстийг цагаан болгохын тулд `-text` нь цэвэр
        // цагаан, `-muted` нь бараг цагаан (хоёрдогч текст, icon-д) болгосон.
        'emp-bg': '#0F0A1A',
        'emp-card': '#1A1433',
        'emp-card-hover': '#231B45',
        'emp-border': '#2D2454',
        'emp-text': '#FFFFFF',
        'emp-muted': '#E8E4F5',
        // Accent нь CSS хувьсагчаас уншина — хэрэглэгч мэндчилгээн дээр дарж
        // өнгөө солиход `text-emp-accent`, `bg-emp-accent/15` гэх мэт БҮХ класс
        // автоматаар шинэ өнгө рүү шилжинэ. <alpha-value> нь /15 гэх мэт
        // тунгалаг байдлыг ажиллуулна.
        'emp-accent': 'rgb(var(--emp-accent) / <alpha-value>)',
        'emp-accent-hover': 'rgb(var(--emp-accent-hover) / <alpha-value>)',

        // Worker / Employer dark theme
        'wrk-bg': '#0A0F1A',
        'wrk-card': '#111827',
        'wrk-card-hover': '#1A2332',
        'wrk-border': '#1E293B',
        'wrk-text': '#FFFFFF',
        'wrk-muted': '#E3E9F2',
        'wrk-accent': '#3B82F6',
        'wrk-accent-hover': '#2563EB',

        // Admin dark theme
        'adm-bg': '#0A120A',
        'adm-card': '#111A11',
        'adm-card-hover': '#1A261A',
        'adm-border': '#1E331E',
        'adm-text': '#FFFFFF',
        'adm-muted': '#E4F0E4',
        'adm-accent': '#22C55E',
        'adm-accent-hover': '#16A34A',

        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Mufi загварын үсэг. Эх загвар нь Plus Jakarta Sans-ыг ШУУД
        // нэрлэсэн бөгөөд Google Fonts дээр үнэгүй тул яг тэрийг нь авав.
        // (Өмнөх Chadal сэдвийн `manrope` түлхүүрийг устгав — одоо хаана ч
        // хэрэглэгдэхгүй.)
        jakarta: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // ==================== ХӨДӨЛГӨӨНИЙ ТОКЕН ====================
      // Бүх анимац ижил хэмнэлтэй байхын тулд эвдрэлтийн муруйг нэг дор
      // тодорхойлов. `spring` нь бага зэрэг үсэрч буцдаг тул товч, тэмдэг
      // зэрэг ЖИЖИГ элементэд; `smooth` нь хальтирч зогсдог тул хуудас,
      // карт зэрэг ТОМ элементэд тохирно.
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-out-right': 'slideOutRight 0.22s ease-in forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pop-in': 'popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulseRing 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        // Диаграмын багана/зурвас 0-оос ургана. `width`/`height` биш
        // `transform`-оор томордог тул хөтөч layout дахин тооцохгүй.
        'grow-x': 'growX 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'grow-y': 'growY 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        // Toast-ийн үлдсэн хугацааг харуулах зурвас. Үргэлжлэх хугацааг нь
        // JS-ээс `animationDuration`-аар өгнө.
        countdown: 'countdown linear forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        slideOutRight: {
          '0%': { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(24px) scale(0.97)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Skeleton дээгүүр гүйх гэрлийн туяа
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        // Ачаалалтын тэмдгийн эргэн тойрны тэлэх цагираг
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        countdown: {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
        growX: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        growY: {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
