import { lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CyclingText, Marquee, Reveal, ScrollSkew, SpotlightCard, StatCounter } from '../components/Motion';
import SplitHeading from '../components/SplitHeading';
import HorizontalScroller from '../components/HorizontalScroller';
import AnimatedBackground from '../components/AnimatedBackground';
import CursorGlow from '../components/CursorGlow';

// anime.js ~43KB (gzip) нэмдэг ба энэ хэсэг ЗӨВХӨН нүүр хуудсанд байдаг.
// Шууд импортловол ажилтан, ажил олгогч, админ хэн ч түүнийг харахгүй
// мөртлөө эхний ачаалалтад татна. JobMap-ийг Leaflet-ийн улмаас салгасантай
// ижил шалтгаан (NFR-1).
const ScrollStory = lazy(() => import('../components/ScrollStory'));
const bgImage = new URL('../assets/hero-bg.jpg', import.meta.url).href;

// Inline SVG icons
const Icons = {
  Briefcase: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Search: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  User: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Phone: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  MapPin: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Coffee: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  GraduationCap: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3" />
    </svg>
  ),
  Truck: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  ShoppingBag: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Laptop: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  ),
  Calendar: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Send: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  ArrowRight: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  TrendingUp: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Globe: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Zap: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Users: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Target: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  CheckCircle: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Check: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ------------------------------
// Дээд цэс
// ------------------------------
// Нүүр хуудас нэг урт хуудас тул цэс нь тухайн хэсэг рүү гүйлгэнэ.
// `id` нь доорх <section>-уудтай таарна.
// Гарчгийн дунд эргэлдэх үгс. Урт нь ойролцоо байх нь чухал — эс бөгөөс
// солигдох бүрд мөрийн өргөн үсэрч, доорх текст чичирнэ.
const HERO_WORDS = ['Ажиллах.', 'Хөгжих.', 'Бүтээх.', 'Дэвших.']

// Зурвасаар гүйх ажлын чиглэлүүд
const MARQUEE_ITEMS = [
  'Бариста', 'Хүргэлт', 'Кассир', 'Хувийн багш', 'Зөөгч', 'Орчуулагч',
  'Дизайнер', 'Агуулахын туслах', 'Борлуулагч', 'Үзэсгэлэнгийн ажилтан',
  'Виртуал туслах', 'Цэвэрлэгч',
]

// Хоёр дахь мөр — эсрэг тийш гүйнэ
const MARQUEE_ITEMS_ALT = [
  'Уян хатан цаг', 'Оюутанд ээлтэй', 'Долоо хоногийн эцэст', 'Оройн ээлж',
  'Алсаас', 'Богино хугацаа', 'Туршлага шаардахгүй', 'Өдрийн ажил',
  'Улирлын ажил', 'Багаар ажиллах',
]

// Ажил олгогчид зориулсан давуу талууд
const CTA_BENEFITS = [
  'Анхны ажлыг үнэгүй зарлах',
  'Хүсэлттэй шууд мессеж',
  'Хүсэлт засах самбар',
  'Эрхэм дэмжлэг',
]

// Нүүр хуудсанд үзүүлэх ЖИШЭЭ зарууд (бодит өгөгдөл биш)
const SAMPLE_JOBS = [
  {
    title: 'Цагийн UI Дизайнер',
    applicants: 24,
    location: 'Улаанбаатар • Алсаас OK',
    tone: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    title: 'Амар Наасны Маркетинг Туслах',
    applicants: 18,
    location: 'Улаанбаатар • Дэлгэрэнгүй',
    tone: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  {
    title: 'Хүргэлтийн Хамтран',
    applicants: 31,
    location: 'Олон хот',
    tone: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  },
]

// Холбоо барих мөрүүд. `icon` нь дээрх `Icons` объектын түлхүүр.
const CONTACT_ROWS = [
  { icon: 'Mail', label: 'И-мэйл', value: 'hello@mongoljob.mn' },
  { icon: 'Phone', label: 'Утас', value: '+976 9911-2233' },
  {
    icon: 'MapPin',
    label: 'Офис',
    value: (
      <>
        Чингисын Чөлөө 15, Сүхбаатар дүүрэг<br />
        Улаанбаатар 14250, Монгол
      </>
    ),
  },
]

const NAV_SECTIONS = [
  { label: 'Нүүр', id: null },              // хамгийн дээш
  { label: 'Ажил олгогчид', id: 'employers' },
  { label: 'Алдартай Ажил', id: 'popular-jobs' },
  { label: 'Статистик', id: 'stats' },
  { label: 'Холбоо барих', id: 'contact' },
]

/**
 * Хэсэг рүү гүйлгэнэ. `id` байхгүй бол хуудасны эхэнд.
 *
 * Хөдөлгөөн багасгах тохиргоотой хэрэглэгчид анимацгүй шууд шилжинэ.
 */
function scrollToSection(id) {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior = smooth ? 'smooth' : 'auto'

  if (!id) {
    window.scrollTo({ top: 0, behavior })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
}

export default function HomePage() {
  const navigate = useNavigate();

  // ⚠ Өмнө нь энд `window`-ийн `mousemove`-ыг сонсож, хулгана хөдлөх БҮРД
  //   төлөв шинэчилдэг байв. Уншсан газар нь байхгүй байсан ч энэ нь 800
  //   мөрт хуудсыг секундэд олон арван удаа дахин зуруулж, гүйлгэлтийг
  //   чирэгддэг болгож байсан тул авав. Картын гэрэл нь одоо `SpotlightCard`
  //   дотор ЗӨВХӨН тухайн карт дээр л хэмжигдэнэ.

  const categories = [
    { 
      title: "Кафе ба Ресторан", 
      desc: "Бариста, үйлчлэгч, хоолны өрөөний ажилтан, хослолч", 
      color: "from-orange-500/20 to-orange-600/20", 
      hoverGradient: "rgba(249, 115, 22, 0.3)",
      iconColor: "text-orange-400",
      icon: <Icons.Coffee className="text-orange-400" size={28} />
    },
    { 
      title: "Багш ба Номлогч", 
      desc: "Хувийн багш, хэлний багш, STEM зөвлөгч", 
      color: "from-violet-500/20 to-violet-600/20", 
      hoverGradient: "rgba(139, 92, 246, 0.3)",
      iconColor: "text-violet-400",
      icon: <Icons.GraduationCap className="text-violet-400" size={28} />
    },
    { 
      title: "Хүргэлт ба Логистик", 
      desc: "Хоолны хүргэлт, курьер үйлчилгээ, агуулахын тусламж", 
      color: "from-emerald-500/20 to-emerald-600/20", 
      hoverGradient: "rgba(16, 185, 129, 0.3)",
      iconColor: "text-emerald-400",
      icon: <Icons.Truck className="text-emerald-400" size={28} />
    },
    { 
      title: "Борлуулалт ба Захиалга", 
      desc: "Дэлгүүрийн туслах, кассир, брэндийн дэмжигч", 
      color: "from-pink-500/20 to-pink-600/20", 
      hoverGradient: "rgba(236, 72, 153, 0.3)",
      iconColor: "text-pink-400",
      icon: <Icons.ShoppingBag className="text-pink-400" size={28} />
    },
    { 
      title: "Фриланс ба Алсаас", 
      desc: "Дизайн, бичих, кодлогч, виртуал туслах", 
      color: "from-blue-500/20 to-blue-600/20", 
      hoverGradient: "rgba(59, 130, 246, 0.3)",
      iconColor: "text-blue-400",
      icon: <Icons.Laptop className="text-blue-400" size={28} />
    },
    { 
      title: "Үзэсгэлэнт Ажил", 
      desc: "Дэмжигч, удирдагч, засварын ажилтан, брэндийн төлөөлөгч", 
      color: "from-cyan-500/20 to-cyan-600/20", 
      hoverGradient: "rgba(6, 182, 212, 0.3)",
      iconColor: "text-cyan-400",
      icon: <Icons.Calendar className="text-cyan-400" size={28} />
    },
  ];

  const stats = [
    { 
      value: "45,200+", 
      label: "Идэвхит Оюутан Ажил хайгч", 
      desc: "Одоогоор Монгол дахь цагийн ажил хайж байгаа", 
      color: "from-violet-500 to-indigo-500",
      hoverGradient: "rgba(139, 92, 246, 0.3)"
    },
    { 
      value: "68%", 
      label: "Цагийн Ажилд Оруулсан Оюутнууд", 
      desc: "Дээд их сургуулийн оюутнууд ажил болон сургалтыг харилцуулж байна", 
      color: "from-pink-500 to-rose-500",
      hoverGradient: "rgba(236, 72, 153, 0.3)"
    },
    { 
      value: "32%", 
      label: "Жилийн Өсөлт", 
      desc: "2025 онд цагийн ажлын зарлалын нэмэгдэл", 
      color: "from-cyan-500 to-blue-500",
      hoverGradient: "rgba(6, 182, 212, 0.3)"
    },
    { 
      value: "4.2K", 
      label: "Сарын Тохиролцоо", 
      desc: "Туршилттай ажил олгогдох бүх сар", 
      color: "from-indigo-500 to-violet-500",
      hoverGradient: "rgba(99, 102, 241, 0.3)"
    },
  ];

  const demandData = [
    { category: "Кафе ба Ресторан", percent: 28, color: "bg-orange-500" },
    { category: "Багш", percent: 22, color: "bg-violet-500" },
    { category: "Хүргэлт", percent: 18, color: "bg-emerald-500" },
    { category: "Борлуулалт", percent: 15, color: "bg-pink-500" },
    { category: "Фриланс", percent: 12, color: "bg-blue-500" },
    { category: "Үзэсгэлэн", percent: 5, color: "bg-cyan-500" },
  ];

  return (
    // ⚠ `overflow-hidden` байж БОЛОХГҮЙ: `overflow: hidden` бүхий эцэг элемент
    //   доторх `position: sticky`-г идэвхгүй болгодог (гүйлгэлтийн контейнер
    //   болж хувирдаг тул) — `ScrollStory`-гийн наалдалт ажиллахгүй болно.
    //   `overflow-x: clip` нь хэвтээ халилтыг ижилхэн таслах ч гүйлгэлтийн
    //   контейнер ҮҮСГЭДЭГГҮЙ тул sticky хэвээр ажиллана.
    <div className="min-h-screen text-white font-sans relative overflow-x-clip">
      {/* Уншилтын явцын зурвас. Өргөн нь JS-гүйгээр, гүйлгэлтийн байрлалаас
          шууд тооцогдоно (index.css → `.scroll-progress`). */}
      <div className="scroll-progress" aria-hidden="true" />

      {/* Хөдөлгөөнт дэвсгэр — хөвөгч гэрлийн толбууд, гүйх сүлжээ.
          Гэрэл зураг бүдэг үлдэж, зөвхөн бүтэц өгнө. */}
      <AnimatedBackground image={bgImage} />

      {/* Курсорын араас дагах гэрэл. Агуулгын цаана байрлах тул текстийг
          бүдгэрүүлэхгүй, зөвхөн дэвсгэрийг гэрэлтүүлнэ. */}
      <CursorGlow />

      <div className="relative z-10">
        {/* Navbar */}
        {/* Гүйлгэхэд цэс нягтарна — index.css → `.nav-condense` */}
        <nav className="nav-condense sticky top-0 z-50 backdrop-blur-xl border-b bg-slate-950/60 border-white/5">
          <div className="nav-condense-inner container-page flex items-center justify-between h-20 transition-[height]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Icons.Briefcase size={26} className="text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Mongol<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Job</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {NAV_SECTIONS.map(item => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.id)}
                  className="text-slate-300 hover:text-white transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium">
                Нэвтрэх
              </Link>
              <Link to="/register" className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold hover:shadow-xl hover:shadow-violet-500/30 transition-all transform hover:scale-105 active:scale-95">
                Эхлэх
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container-page py-16 sm:py-24">
          {/* Текстийг САНААТАЙГААР нарийн үлдээв — өргөн дэлгэцэнд догол мөр
              бүтнээрээ сунавал нэг мөрөнд 120+ тэмдэгт багтаж, нүд мөрийн
              эхлэлийг олоход хүндэрнэ. Доорх статистик харин бүтэн өргөнөөр. */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              {/* Hero нь эхний дэлгэцэнд байдаг тул гүйлгэлт хүлээхгүй —
                  ачаалмагц дараалан орж ирнэ. */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sm text-slate-300">#1 Монголын Ажил Тохиргох Платформ</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
                Холбогдох. <br />
                {/* Дунд үг тасралтгүй солигдоно — хуудас хэзээ ч бүрэн
                    зогсдоггүйн гол дохио. Градиент нь бас аажим урсана. */}
                <CyclingText
                  words={HERO_WORDS}
                  className="gradient-flow inline-block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400"
                />
                <br />
                Өсөх.
              </h1>
              <p className="text-xl text-slate-400 mb-4 leading-relaxed animate-fade-up" style={{ animationDelay: '160ms' }}>
                Монгол дахь цагийн ажилчин, оюутнуудыг ажил олгогчтой холбосон тэргүүн платформ.
                Таны цагтаа тохирсон хязгааргүй ажил олж эсвэл минутын дотор урлагтай ажилтан ол.
              </p>
              <p className="text-slate-500 mb-10 animate-fade-up" style={{ animationDelay: '220ms' }}>
                Хэрэв та анхны ажлыг хайж буй оюутан, нэмэгдэлтэй орлого хайж буй мэргэжилтэн эсвэл
                хязгааргүй ажилчдыг байгуулж буй ажил олгогч бол — MongolJob энэ бүгдийг хялбар, хурдан, найдвартай хийнэ.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '280ms' }}>
                <button
                  onClick={() => navigate('/register')}
                  className="shine shine-auto w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Icons.Search size={24} />
                  Ажил Олох
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Icons.Briefcase size={24} />
                  Ажил Зарлах
                </button>
              </div>
            </div>

            {/* Hero Stats — текстээс өргөн, хэсгийн бүтэн өргөнийг эзэлнэ.
                Сөрөг margin нь эцгийн `max-w-4xl` хязгаараас гаргаж байна. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 lg:-mx-[8vw] xl:-mx-[12vw]">
              {[
                { value: "12K+", label: "Идэвхит Ажил Хайгч" },
                { value: "3.5K+", label: "Зарлагдсан Ажил" },
                { value: "850+", label: "Ажил Олгогч" },
                { value: "95%", label: "Тохиргооны Хувь" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover-lift animate-fade-up"
                  style={{ animationDelay: `${360 + i * 70}ms` }}
                >
                  {/* Хөвөлтийг ДОТООД элемент дээр өгсөн нь санаатай: гадна нь
                      орж ирэх анимацтай тул нэг элементэд хоёр `animation`
                      өгвөл сүүлийнх нь эхнийхийг дардаг. Мөн карт бүр өөр
                      сааталтай тул дөрвүүлээ нэг зэрэг биш, долгион мэт хөдөлнө. */}
                  <div className="animate-float" style={{ animationDelay: `${i * 900}ms` }}>
                    <StatCounter
                      value={stat.value}
                      className="block text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400 mb-1"
                    />
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Хоёр эсрэг чиглэлийн зурвас — гүйлгэхгүй зогсож байсан ч хуудас
            хөдөлгөөнтэй хэвээр. Хулгана дээр нь ирэхэд зогсоно.
            `ScrollSkew` нь гүйлгэх хурднаас хамаарч бага зэрэг хазайлгана. */}
        <ScrollSkew className="py-10 border-y border-white/5 bg-white/[0.02] space-y-4">
          <Marquee speed={44}>
            {MARQUEE_ITEMS.map(item => (
              <span
                key={item}
                className="text-lg sm:text-xl font-semibold text-slate-500 whitespace-nowrap"
              >
                {item}
              </span>
            ))}
          </Marquee>

          {/* Хоёр дахь мөр эсрэг тийш — хөндлөн хөдөлгөөн нь илүү мэдрэгдэнэ */}
          <Marquee speed={58} reverse>
            {MARQUEE_ITEMS_ALT.map(item => (
              <span
                key={item}
                className="text-base sm:text-lg font-medium text-slate-600 whitespace-nowrap"
              >
                {item}
              </span>
            ))}
          </Marquee>
        </ScrollSkew>

        {/* Гүйлгэлтээр жолоодогддог түүх — доошоо гүйлгэхэд хэсэг наалдаж,
            алхмууд солигдоно. Дээшээ гүйлгэвэл ухарна. */}
        <Suspense fallback={<div className="h-screen" />}>
          <ScrollStory />
        </Suspense>

        {/* Ангиллууд — доошоо гүйлгэхэд картууд ХАЖУУ тийш гүйнэ.
            `Reveal` энд хэрэггүй: хэвтээ хөдөлгөөн нь өөрөө нээлт болно. */}
        <HorizontalScroller
          id="popular-jobs"
          // Хажуугийн зай нь `.container-page`-тэй ижил томьёотой — эхний
          // карт бусад хэсгийн зүүн ирмэгтэй яг эгнэнэ.
          className="px-[clamp(1rem,3.5vw,3rem)]"
          header={
            <div className="container-page w-full">
              <SplitHeading className="text-4xl sm:text-5xl font-extrabold mb-4">
                Алдартай <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Цагийн Ажил</span>
              </SplitHeading>
              <p className="text-slate-400 max-w-2xl text-lg">
                Монгол дахь хамгийн их хүссэн цагийн ажлуудыг олж мэдээрэй.
                Доошоо гүйлгэхэд ангиллууд хажуу тийш гүйнэ.
              </p>
            </div>
          }
        >
          {categories.map((category, index) => (
            <SpotlightCard
              key={index}
              glow={category.hoverGradient}
              className="w-[19rem] sm:w-[22rem] flex-shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-violet-500/30 cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-3`}>
                {category.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-violet-300 transition-colors">
                {category.title}
              </h3>
              <p className="text-slate-400 mb-6">
                {category.desc}
              </p>
              <div className="flex items-center gap-2 text-violet-400 font-semibold group-hover:text-violet-300 transition-colors">
                Ажлыг Хайх
                <Icons.ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </SpotlightCard>
          ))}
        </HorizontalScroller>

        {/* For Employers Section */}
        <section id="employers" className="container-page py-16">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6 animate-pop-in">
              <span className="text-violet-300 font-medium text-sm">Ажил Олгогчид</span>
            </div>
            <SplitHeading className="text-4xl sm:text-5xl font-extrabold mb-4">
              Ухаалаг Ажил Олгох. <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Хурдан.</span>
            </SplitHeading>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Кофееноос эхлээд Стартап хүртэл, олон Монгол ажил олгогч найдвартай цагийн ажилтан олохдоо MongolJob-ийг итгэдэг. Өөрийн ажлыг зарлаж, өнөөдөрөөс эхлэн хүсэлт хүлээн аваарай.
            </p>
          </Reveal>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { 
                title: "Минутын Дотор Зарлах", 
                desc: "Манай энхрий зааварчилсаны ар ажлын зарлагыг үүсгэн, нийтлэх. Нарийн тохиргоо шаарддаггүй.", 
                icon: <Icons.Zap size={28} />,
                hoverGradient: "rgba(139, 92, 246, 0.3)"
              },
              { 
                title: "Эрчимтэй Ажилтанд Хүрэх", 
                desc: "Эргэлзээгүй оюутан, цагийн ажилчдын сонгосон бүлэгт нэвтрэх. Эдгээр нь ажлаа хайж байгаа.", 
                icon: <Icons.Users size={28} />,
                hoverGradient: "rgba(6, 182, 212, 0.3)"
              },
              { 
                title: "Ухаалаг Тохиргоо", 
                desc: "Манай алгоритм таны шаардлагад нийцсэн урлаг, цагтай ажилтанд холбосон.", 
                icon: <Icons.Target size={28} />,
                hoverGradient: "rgba(236, 72, 153, 0.3)"
              },
              { 
                title: "Эргэлзээгүй Профайл", 
                desc: "Бүх ажил хайгч баталгаажсан, та найдвартай, жинхэнэ ажилтантай холбогдох боломжтой.", 
                icon: <Icons.CheckCircle size={28} />,
                hoverGradient: "rgba(16, 185, 129, 0.3)"
              },
            ].map((feature, index) => (
              <Reveal key={index} delay={index * 70}>
                <SpotlightCard
                  glow={feature.hoverGradient}
                  className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-violet-500/30"
                >
                  {/* Дүрс аажим хөвнө. Карт бүрд өөр саатал өгснөөр дөрвүүлээ
                      нэг зэрэг биш, долгион мэт хөдөлнө. */}
                  <div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-6 text-violet-400 transition-transform duration-300 ease-spring group-hover:scale-110 animate-float"
                    style={{ animationDelay: `${index * 800}ms` }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-violet-300 transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>

          {/* CTA Block */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 grid md:grid-cols-2 gap-10 items-center">
            <Reveal>
              <h3 className="text-2xl font-bold mb-4 text-white">Дараагийн сайн ажилтан олох бэлэн байна уу?</h3>
              <p className="text-slate-400 mb-6">Аль хэт 850-аас олон ажил олгогч MongolJob-ийг ашиглаж байгаа. Хязгааргүй ажлыг зарлах, хүсэлтийг удирдах, ажилтантай холбоо барих — бүгдийг нэг дор.</p>

              {/* Давуу талууд нэг нэгээр нь «тэмдэглэгдэнэ» */}
              <ul className="space-y-3 mb-8">
                {CTA_BENEFITS.map((item, i) => (
                  <Reveal
                    key={item}
                    as="li"
                    delay={120 + i * 90}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Icons.Check size={14} className="text-cyan-400" />
                    </span>
                    <span className="text-sm">{item}</span>
                  </Reveal>
                ))}
              </ul>

              <button
                onClick={() => navigate('/register')}
                className="shine px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <Icons.Briefcase size={22} />
                Ажил Зарлах — Үнэгүй
              </button>
            </Reveal>

            {/* Жишээ зарууд */}
            <div className="relative">
              {/* Чимэглэлийн гэрэл — аажим хөвнө */}
              <div className="absolute -top-4 -right-4 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl animate-float" />

              <Reveal
                animation="animate-slide-in-right"
                className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative z-10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500" />
                  <div>
                    <h4 className="font-bold text-white">TechStart Mongolia</h4>
                    <p className="text-xs text-slate-500">2 цагийн өмнө зарлагдсан</p>
                  </div>
                </div>

                {/* Гурван зар өмнө нь ГУРВАН УДАА хуулж бичсэн байсныг өгөгдөл
                    болгож нэгтгэв — нэмэх, засахад нэг л газар хүрэхэд болно. */}
                {SAMPLE_JOBS.map((job, i) => (
                  <div
                    key={job.title}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover-lift animate-fade-up"
                    style={{ animationDelay: `${260 + i * 110}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="font-semibold text-sm text-white">{job.title}</h5>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${job.tone}`}>
                        <StatCounter value={String(job.applicants)} duration={900} /> хүсэлт
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{job.location}</div>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section id="stats" className="container-page py-16">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6 animate-pop-in">
              <span className="text-violet-300 font-medium text-sm">Мэдээлэл ба Үзүүлэлт</span>
            </div>
            <SplitHeading className="text-4xl sm:text-5xl font-extrabold mb-4">
              Монголын <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Оюутны Ажлын Зах</span>
            </SplitHeading>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Манай платформын бодит тоо нь Монгол оюутан, залуу мэргэжилтнуудын хязгааргүй ажилд эрчимтэй хүрэлцэх үүдийг харуулж байна.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, i) => (
              <Reveal key={i} delay={i * 70}>
                <SpotlightCard
                  glow={stat.hoverGradient}
                  className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:border-violet-500/30"
                >
                  <StatCounter
                    value={stat.value}
                    className={`block text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r ${stat.color} transition-transform duration-300 ease-spring group-hover:scale-105`}
                  />
                  <div className="text-lg font-bold text-white mb-2">{stat.label}</div>
                  <div className="text-slate-500 text-sm">{stat.desc}</div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-3">Хамгийн Их Хүссэн Ажлын Ангилал</h3>
                <p className="text-slate-400 mb-8">2025 онд ангиллаар цагийн ажлын зарлалын түгээлт</p>
                
                <div className="space-y-5">
                  {demandData.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-slate-200">{item.category}</span>
                        <StatCounter value={`${item.percent}%`} className="font-bold text-white" />
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        {/* Зурвас нь гүйлгэж ирэхэд зүүнээс баруун тийш ургана.
                            `origin-left` байхгүй бол голоосоо тэлж, буруу
                            харагдана. */}
                        <Reveal
                          animation="animate-grow-x"
                          delay={i * 80}
                          className={`h-full origin-left ${item.color} rounded-full`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Icons.TrendingUp className="text-cyan-400" size={24} />
                  <h4 className="text-xl font-bold">Өсөлтийн Урсгал: Ажлын Зарлал</h4>
                </div>
                <div className="flex items-end justify-between gap-3 h-48 pt-8">
                  {[60, 75, 65, 85, 78, 90, 100].map((height, i) => (
                    <div key={i} className="flex-1 h-full flex flex-col items-center gap-2">
                      {/* Хувиар өгсөн өндөр нь ЭЦЭГ элементийн өндрөөс
                          тооцогддог тул баганад зориулж тодорхой өндөртэй
                          талбай (`flex-1`) заавал хэрэгтэй — эс бөгөөс
                          `height: 60%` нь auto өндрөөс тооцогдож 0 болно. */}
                      <div className="flex-1 w-full flex items-end">
                        {/* `origin-bottom` нь баганыг доороос дээш ургуулна */}
                        <Reveal
                          animation="animate-grow-y"
                          delay={i * 70}
                          className="w-full origin-bottom bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-slate-400">Нийт өсөлт</span>
                  {/* «+» нь урд байгаа тул тусад нь бичив — `StatCounter` нь
                      зөвхөн ард байх дагаварыг таньдаг. */}
                  <span className="text-xl font-bold text-cyan-400">
                    +<StatCounter value="73%" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="container-page py-16 pb-24">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 animate-pop-in">
              <span className="text-cyan-300 font-medium text-sm">Холбоо барих</span>
            </div>
            <SplitHeading className="text-4xl sm:text-5xl font-extrabold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Мантай</span> Холбогдоорой
            </SplitHeading>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Ажил зарлах эсвэл ажил олох талаар асуулт байна уу? Манай баг тусламж хийхийн тулд энд байна.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Reveal className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6">Холбоо барих мэдээлэл</h3>

                {/* Гурван мөр өмнө нь бараг ижилхэн хуулагдсан байсныг өгөгдөл
                    болгож нэгтгэв. Мөр бүр дараалан орж ирнэ. */}
                <div className="space-y-6">
                  {CONTACT_ROWS.map((row, i) => {
                    const Icon = Icons[row.icon]
                    return (
                      <Reveal
                        key={row.label}
                        delay={140 + i * 110}
                        className="group flex items-start gap-4"
                      >
                        <span className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0 transition-transform duration-200 ease-spring group-hover:scale-110">
                          <Icon className="text-violet-400" size={24} />
                        </span>
                        <div>
                          <div className="font-medium mb-1">{row.label}</div>
                          <div className="text-slate-400">{row.value}</div>
                        </div>
                      </Reveal>
                    )
                  })}
                </div>
              </Reveal>

              <Reveal delay={160} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6">Дагах</h3>
                <div className="flex gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer hover-lift press animate-pop-in"
                      style={{ animationDelay: `${260 + i * 80}ms` }}
                    >
                      <Icons.Globe className="text-slate-400" size={20} />
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="md:col-span-3">
              <Reveal delay={120} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
                {/* Талбарууд дараалан гарч ирнэ — `stagger` класс нь хүүхэд
                    бүрд nth-child-ээр саатал өгнө (index.css). */}
                <form className="space-y-6 stagger">
                  <div className="grid md:grid-cols-2 gap-6 animate-fade-up">
                    <div>
                      <label className="block text-slate-300 font-medium mb-2">Бүтэн Нэр</label>
                      <input 
                        type="text" 
                        placeholder="Таны нэр" 
                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-2">И-мэйл</label>
                      <input 
                        type="email" 
                        placeholder="ta@example.com" 
                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="animate-fade-up">
                    <label className="block text-slate-300 font-medium mb-2">Мессеж</label>
                    <textarea 
                      placeholder="Бид таныг хэрхэн тусалж вэ?" 
                      rows={5}
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="shine group animate-fade-up w-full md:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {/* Илгээх сум нь хүрэхэд урагш хөдөлнө */}
                    <Icons.Send size={22} className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                    Мессеж Илгээх
                  </button>
                </form>
              </Reveal>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
