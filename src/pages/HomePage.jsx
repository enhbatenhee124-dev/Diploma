import { lazy, Suspense, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Marquee, Reveal, SpotlightCard, StatCounter } from '../components/Motion';
import SplitHeading from '../components/SplitHeading';
import Footer from '../components/Footer';

// anime.js ~43KB (gzip) нэмдэг ба энэ хэсэг ЗӨВХӨН нүүр хуудсанд байдаг.
// Шууд импортловол ажилтан, ажил олгогч, админ хэн ч түүнийг харахгүй
// мөртлөө эхний ачаалалтад татна. JobMap-ийг Leaflet-ийн улмаас салгасантай
// ижил шалтгаан (NFR-1).
const ScrollStory = lazy(() => import('../components/ScrollStory'));

// Загварын хоёр mascot. Claude Design-ийн "Дизайн импорт арга" төслөөс
// татсан — хоёулаа RGBA (тунгалаг дэвсгэртэй) тул цайвар картан дээр
// шууд суух ба цагаан хайрцаг үүсгэхгүй.
const mascotSeeker = new URL('../assets/mascot-rabbit.png', import.meta.url).href;
const mascotEmployer = new URL('../assets/mascot-capybara.png', import.meta.url).href;

// ============================================================
// Chadal сэдэв
// ============================================================
// Claude Design-ийн "Chadal Landing" загварыг энэ хуудсанд буулгав.
// Өмнөх Halo (цайвар) сэдвийг БҮРЭН орлосон. Гол зарчмууд:
//
//   • Дэвсгэр нь БАРААН (#070C15), текст нь цагаан. Хуучин `text-halo-*`
//     классууд энд ажиллахгүй — `text-chadal-*` хэрэглэнэ.
//   • Акцент нь цайвар цэнхэр #8ECBFB. Үндсэн товч нь ТЭР дүүргэлттэй,
//     дотор нь бараан текст.
//   • Загварын цорын ганц ЦАЙВАР хэсэг нь хоёр mascot карт — тэдгээр нь
//     санаатай, хуудсын дунд амьсгал өгнө.
//   • Загварт `min-width: 1180px` байсныг (зөвхөн desktop) АВЧ, бүх
//     хэсгийг responsive болгов.
//
// ⚠ Загварын эх текст нь AI-ийн ажлын зах зээлийн тухай байсан бөгөөд
//   энэ платформын бодит үйлчилгээтэй (оюутны цагийн ажил) таарахгүй.
//   Тиймээс ЗӨВХӨН харагдах систем (layout, өнгө, хэмнэл) авч, агуулгыг
//   нь платформын бодит мэдээллээр бөглөв. Үнийн хэсэг нь `/terms#payments`
//   дээрх нөхцөлтэй тохирно.
// ============================================================

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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
  Check: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ------------------------------
// Дээд цэс
// ------------------------------
// Нүүр хуудас нэг урт хуудас тул цэс нь тухайн хэсэг рүү гүйлгэнэ.
// `id` нь доорх <section>-уудтай таарна.
const NAV_SECTIONS = [
  { label: 'Нүүр', id: null },              // хамгийн дээш
  { label: 'Алдартай ажил', id: 'popular-jobs' },
  { label: 'Статистик', id: 'stats' },
  { label: 'Холбоо барих', id: 'contact' },
]

// Hero-гийн доорх шуурхай шүүлтүүр. Бүгд `/jobs` руу хайлтын үгтэйгээ
// очно — `JobListings` нь `?q=` -ийг уншиж эхний утга болгоно.
const HERO_CHIPS = ['Оройн ээлж', 'Долоо хоногийн эцэст', 'Алсаас', 'Туршлага шаардахгүй']

// Загварын хоёр mascot карт. Зүүн нь ажил хайгч (туулай), баруун нь
// ажил олгогч (бавуу).
const ROLE_CARDS = [
  {
    tag: 'АЖИЛ ХАЙГЧ',
    title: 'Хичээлийнхээ хуваарьт тохирсон ээлжээ ол',
    desc: 'Дүүрэг, цагийн хуваарь, ур чадвараараа шүүж хүсэлтээ илгээ.',
    cta: 'Профайл үүсгэх',
    to: '/register',
    img: mascotSeeker,
    bg: 'bg-chadal-lilac',
    eyebrow: 'text-chadal-lilac-eyebrow',
    ink: 'text-chadal-lilac-ink',
    body: 'text-chadal-lilac-body',
    btn: 'bg-chadal-lilac-btn hover:bg-[#6A43AD]',
  },
  {
    tag: 'АЖИЛ ОЛГОГЧ',
    title: 'Ээлжиндээ таарах ажилтнаа хурдан ол',
    desc: 'Зар нийтэлж, ирсэн хүсэлтийг нэг самбараас удирд.',
    cta: 'Зар нийтлэх',
    to: '/register',
    img: mascotEmployer,
    bg: 'bg-chadal-mint',
    eyebrow: 'text-chadal-mint-eyebrow',
    ink: 'text-chadal-mint-ink',
    body: 'text-chadal-mint-body',
    btn: 'bg-chadal-mint-btn hover:bg-[#246661]',
  },
]

// Загварын «backers» зурвасын байрд — платформыг ашигладаг салбарууд.
// Үсгийн загвар нь санаатайгаар өөр өөр: жинхэнэ лого зурваст ажиглагддаг
// «олон брэнд» мэдрэмжийг өнгөгүйгээр гаргана.
const PARTNER_SECTORS = [
  { label: 'Кафе & Ресторан', font: "'Times New Roman', serif", weight: 400, spacing: '0.02em', size: '15px' },
  { label: 'ЖИЖИГЛЭН ХУДАЛДАА', font: "'Arial Black', Arial, sans-serif", weight: 900, spacing: '0.08em', size: '15px' },
  { label: 'Логистик', font: 'Impact, sans-serif', weight: 700, spacing: '0.05em', size: '18px' },
  { label: 'Сургалт', font: 'Georgia, serif', weight: 600, spacing: '-0.02em', size: '17px' },
  { label: 'Мэдээллийн технологи', font: 'Helvetica, Arial, sans-serif', weight: 700, spacing: '-0.01em', size: '15px' },
  { label: 'ҮЙЛ ЯВДАЛ', font: 'Verdana, sans-serif', weight: 700, spacing: '0.06em', size: '14px' },
  { label: 'Агуулах', font: "'Courier New', monospace", weight: 700, spacing: '0.18em', size: '14px' },
  { label: 'Маркетинг', font: "Palatino, 'Book Antiqua', serif", weight: 500, spacing: '0.03em', size: '16px' },
]

// Үнийн хэсэг. Тоо бодохгүй — `/terms#payments` дээрх нөхцөлийг ЯГ
// давтана: ажил хайгчид үнэгүй, ажил олгогч сарын багц авна (үнийг
// захиалгын хуудсанд харуулна).
const PRICING = [
  {
    tag: 'АЖИЛ ХАЙГЧ',
    price: '0₮',
    unit: 'үргэлж',
    note: 'Профайл, хайлт, хүсэлт — бүгд үнэгүй.',
    features: ['Хязгааргүй хүсэлт', 'Дүүрэг, цагийн хуваарийн шүүлтүүр', 'Ажлын саналын мэдэгдэл', 'Платформ доторх чат'],
    cta: 'Бүртгүүлэх',
    to: '/register',
    featured: false,
  },
  {
    tag: 'АЖИЛ ОЛГОГЧ',
    price: 'Сарын багц',
    unit: '',
    note: 'Багцын үнэ, хугацааг захиалгын хуудсанд харуулна.',
    features: ['Зар нийтлэх', 'Хүсэлтийн нэгдсэн самбар', 'Нэр дэвшигчийн профайл харах', 'Платформ доторх чат'],
    cta: 'Нөхцөлийг харах',
    to: '/terms#payments',
    featured: true,
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
  const [query, setQuery] = useState('');

  // Hero-гийн хайлт. Хоосон бол шүүлтгүйгээр жагсаалт руу оруулна.
  const handleSearch = e => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs')
  }

  const categories = [
    {
      title: "Кафе ба Ресторан",
      desc: "Бариста, үйлчлэгч, хоолны өрөөний ажилтан",
      level: "Туршлага шаардахгүй · Оройн ээлж",
      glow: "rgba(249, 115, 22, 0.35)",
      icon: <Icons.Coffee className="text-orange-300" size={22} />,
    },
    {
      title: "Багш ба Номлогч",
      desc: "Хувийн багш, хэлний багш, STEM зөвлөгч",
      level: "Оюутан · Бакалавр",
      glow: "rgba(139, 92, 246, 0.35)",
      icon: <Icons.GraduationCap className="text-violet-300" size={22} />,
    },
    {
      title: "Хүргэлт ба Логистик",
      desc: "Хоолны хүргэлт, курьер, агуулахын тусламж",
      level: "Уян хатан цаг · Өдрийн ажил",
      glow: "rgba(16, 185, 129, 0.35)",
      icon: <Icons.Truck className="text-emerald-300" size={22} />,
    },
    {
      title: "Борлуулалт ба Захиалга",
      desc: "Дэлгүүрийн туслах, кассир, брэндийн дэмжигч",
      level: "Долоо хоногийн эцэст",
      glow: "rgba(236, 72, 153, 0.35)",
      icon: <Icons.ShoppingBag className="text-pink-300" size={22} />,
    },
    {
      title: "Фриланс ба Алсаас",
      desc: "Дизайн, бичих, кодлогч, виртуал туслах",
      level: "Алсаас · Богино хугацаа",
      glow: "rgba(59, 130, 246, 0.35)",
      icon: <Icons.Laptop className="text-blue-300" size={22} />,
    },
    {
      title: "Үзэсгэлэнт Ажил",
      desc: "Дэмжигч, удирдагч, брэндийн төлөөлөгч",
      level: "Улирлын ажил",
      glow: "rgba(6, 182, 212, 0.35)",
      icon: <Icons.Calendar className="text-cyan-300" size={22} />,
    },
  ];

  const stats = [
    {
      value: "45,200+",
      label: "Идэвхтэй оюутан ажил хайгч",
      desc: "Одоогоор Монгол дахь цагийн ажил хайж байгаа",
      glow: "rgba(139, 92, 246, 0.35)",
    },
    {
      value: "68%",
      label: "Цагийн ажилд орсон оюутан",
      desc: "Их сургуулийн оюутнууд ажил, сургалтаа хослуулж байна",
      glow: "rgba(236, 72, 153, 0.35)",
    },
    {
      value: "32%",
      label: "Жилийн өсөлт",
      desc: "2025 онд цагийн ажлын зарлалын нэмэгдэл",
      glow: "rgba(6, 182, 212, 0.35)",
    },
    {
      value: "4.2K",
      label: "Сарын тохиролт",
      desc: "Ажил олгогч, ажилтан амжилттай холбогдсон тоо",
      glow: "rgba(99, 102, 241, 0.35)",
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
    <div className="chadal-page relative overflow-x-clip">
      {/* Уншилтын явцын зурвас. Өргөн нь JS-гүйгээр, гүйлгэлтийн байрлалаас
          шууд тооцогдоно (index.css → `.scroll-progress`). */}
      <div className="scroll-progress" aria-hidden="true" />

      {/* ==================== ЦЭС ====================
          Загварынхтай ижил: наалддаг, хагас тунгалаг бараан зурвас.
          `MainLayout`-ийн `Navbar` энд ХЭРЭГЛЭГДЭХГҮЙ — нүүр хуудас нь
          зөвхөн өөр дээрээ гүйлгэдэг тусдаа цэстэй (`NAV_SECTIONS`). */}
      <nav className="sticky top-0 z-50 border-b border-chadal-line bg-chadal-bg/80 backdrop-blur-xl">
        <div className="container-page">
          <div className="flex h-[4.5rem] items-center justify-between gap-6">
            <button
              onClick={() => scrollToSection(null)}
              className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-chadal-accent">
                <Icons.Briefcase size={17} className="text-chadal-ink" />
              </span>
              Mongol<span className="font-bold text-chadal-dim">Job</span>
            </button>

            <div className="hidden items-center gap-8 lg:flex">
              {NAV_SECTIONS.map(item => (
                <button key={item.label} onClick={() => scrollToSection(item.id)} className="chadal-nav-link">
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="chadal-nav-link hidden sm:block">
                Нэвтрэх
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-chadal-accent px-6 py-2.5 text-sm font-bold text-chadal-ink transition-colors hover:bg-white"
              >
                Эхлэх
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ====================
          Загварын нээлт: асар том том үсгээр бичсэн гарчиг, доор нь
          нэг мөрийн хайлт, доогуур нь шуурхай шүүлтүүрүүд. Ард нь
          цэнхэр туяа (`chadal-glow`). */}
      <header className="relative overflow-hidden px-4 pb-24 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
        {/* Туяа нь агуулгаас ӨРГӨН байх ёстой — эс бөгөөс ирмэг нь
            гарчгийн доор тод зураас болж харагдана. `max-w-[150vw]` нь
            жижиг дэлгэцэнд хэвтээ халилт үүсгэхээс сэргийлнэ. */}
        <div
          className="chadal-glow left-1/2 top-[-9rem] h-[56rem] w-[94rem] max-w-[160vw] -translate-x-1/2"
          aria-hidden="true"
        />

        <h1 className="relative m-0 mx-auto max-w-5xl text-[clamp(2.6rem,8.6vw,7.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em] text-white animate-fade-up">
          Дараагийн ажлаа олъё
        </h1>

        <p
          className="relative mx-auto mt-8 max-w-xl text-base font-medium leading-relaxed text-[#A9C8E8] animate-fade-up sm:text-[1.07rem]"
          style={{ animationDelay: '80ms' }}
        >
          Монгол дахь цагийн ажилчид, оюутнуудыг ажил олгогчтой холбоно.
          Цагтаа тохирсон ээлжээ ол, эсвэл минутын дотор ажилтнаа ол.
        </p>

        <form
          onSubmit={handleSearch}
          className="relative mx-auto mt-11 flex w-full max-w-[54rem] items-center gap-3 rounded-[1.35rem] border border-chadal-field bg-chadal-card/90 p-3 pl-5 backdrop-blur animate-fade-up sm:pl-6"
          style={{ animationDelay: '160ms' }}
        >
          <Icons.Search size={19} className="hidden flex-none text-chadal-dim sm:block" />
          <label htmlFor="hero-search" className="sr-only">Ажлын хайлт</label>
          <input
            id="hero-search"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Бариста, хүргэлт, хувийн багш…"
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-white outline-none placeholder:text-chadal-dim"
          />
          <button
            type="submit"
            aria-label="Ажил хайх"
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-chadal-accent text-chadal-ink transition-colors hover:bg-white"
          >
            <Icons.ArrowRight size={20} />
          </button>
        </form>

        <div
          className="relative mt-7 flex flex-wrap justify-center gap-3 animate-fade-up"
          style={{ animationDelay: '240ms' }}
        >
          {HERO_CHIPS.map(chip => (
            <Link
              key={chip}
              to={`/jobs?q=${encodeURIComponent(chip)}`}
              className="rounded-full border border-[#2F4A70] bg-[#142034]/60 px-5 py-2.5 text-sm font-semibold text-[#CFE4F9] transition-colors hover:border-chadal-accent hover:text-white"
            >
              {chip}
            </Link>
          ))}
        </div>
      </header>

      {/* ==================== ХОЁР ДҮРИЙН КАРТ ====================
          Загварын цорын ганц цайвар хэсэг. Mascot нь картын ЁРООЛД
          наалдана — тиймээс эцэг нь `items-end`, доод padding нь 0. */}
      <section className="container-page pb-24 sm:pb-28">
        <div className="grid gap-6 lg:grid-cols-2">
          {ROLE_CARDS.map((card, i) => (
            <Reveal key={card.tag} delay={i * 90}>
              <div className={`flex h-full min-h-[16rem] items-end gap-3 overflow-hidden rounded-[1.75rem] p-7 pb-0 sm:gap-4 sm:p-11 sm:pb-0 ${card.bg}`}>
                <div className="min-w-0 flex-1 pb-8 sm:pb-10">
                  <div className={`text-xs font-bold tracking-[0.14em] ${card.eyebrow}`}>{card.tag}</div>
                  <h3 className={`m-0 mt-4 text-[1.4rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[1.85rem] ${card.ink}`}>
                    {card.title}
                  </h3>
                  <p className={`m-0 mt-3.5 text-sm font-medium ${card.body}`}>{card.desc}</p>
                  <Link
                    to={card.to}
                    className={`mt-6 inline-block whitespace-nowrap rounded-full px-6 py-3 text-sm font-bold text-white transition-colors ${card.btn}`}
                  >
                    {card.cta}
                  </Link>
                </div>
                {/* Тунгалаг PNG тул цайвар картан дээр цагаан хайрцаг
                    үүсгэхгүй. Мэдээллийн ачаалалгүй чимэглэл учир
                    `alt=""` — дэлгэц уншигч алгасана. */}
                <img
                  src={card.img}
                  alt=""
                  className="w-24 flex-none self-end object-contain object-bottom sm:w-36 lg:w-44"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ==================== АНГИЛЛУУД ==================== */}
      <section id="popular-jobs" className="container-page scroll-mt-24 pb-24 text-center sm:pb-28">
        <Reveal>
          <div className="chadal-eyebrow">АНГИЛЛААР</div>
          <SplitHeading className="mx-auto mt-4 max-w-3xl text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-white">
            Алдартай цагийн ажил
          </SplitHeading>
          <p className="mx-auto mt-5 max-w-2xl text-[0.95rem] font-medium leading-relaxed text-chadal-muted">
            Монгол дахь хамгийн эрэлттэй цагийн ажлуудыг ангиллаар нь үзээрэй.
            Ангилал дээр дарвал шүүсэн жагсаалт руу шилжинэ.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => (
            <Reveal key={category.title} delay={i * 60} className="h-full">
              <SpotlightCard
                glow={category.glow}
                className="flex h-full min-h-[13rem] cursor-pointer flex-col justify-between rounded-[1.25rem] border border-chadal-border bg-chadal-card p-7 transition-colors hover:border-[#33507A]"
                onClick={() => navigate(`/jobs?q=${encodeURIComponent(category.title)}`)}
              >
                <div>
                  <div className="mb-5 flex h-[2.6rem] w-[2.6rem] items-center justify-center rounded-xl border border-chadal-accent/25 bg-chadal-accent/10 transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                    {category.icon}
                  </div>
                  <div className="text-[1.18rem] font-bold leading-snug tracking-tight text-white">{category.title}</div>
                  <div className="mt-2 text-sm font-semibold text-[#7FB4E4]">{category.desc}</div>
                </div>
                <div className="mt-6 text-[0.82rem] font-medium text-chadal-dim">{category.level}</div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        <Link to="/jobs" className="chadal-btn chadal-btn-accent mt-12">
          Бүх ажлыг үзэх
        </Link>
      </section>

      {/* ==================== САЛБАРУУДЫН ЗУРВАС ====================
          Загварын компанийн логоны зурвасын байрд. Жинхэнэ лого байхгүй
          тул салбаруудыг өөр өөр үсгийн загвараар — «олон брэнд»
          мэдрэмжийг өнгөгүйгээр гаргана. */}
      <section className="pb-24 sm:pb-28">
        <div className="container-page mb-7 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-chadal-accent" />
          <span className="text-xs font-bold text-white">MongolJob дээр ажилтан хайж буй салбарууд</span>
        </div>
        <Marquee speed={38}>
          {PARTNER_SECTORS.map(sector => (
            <div
              key={sector.label}
              className="flex h-[8.9rem] w-[13.25rem] items-center justify-center rounded-[1.15rem] border border-chadal-border bg-chadal-card px-5 text-center text-chadal-muted transition-all duration-300 hover:border-chadal-accent/55 hover:bg-chadal-card-hover hover:text-[#DCEEFF] hover:shadow-[0_0_0_1px_rgba(142,203,251,.25),0_0_34px_rgba(80,160,240,.35),inset_0_0_30px_rgba(90,170,245,.12)]"
              style={{
                fontFamily: sector.font,
                fontWeight: sector.weight,
                letterSpacing: sector.spacing,
                fontSize: sector.size,
              }}
            >
              {sector.label}
            </div>
          ))}
        </Marquee>
      </section>

      {/* ==================== ТОМ МЭДЭГДЭЛ ====================
          Загварын дундах ганц өгүүлбэрийн хэсэг — хэмнэл тасалж,
          дараагийн блокт бэлддэг. */}
      <section className="container-page pb-24 text-center sm:pb-28">
        <Reveal>
          <h2 className="m-0 mx-auto max-w-3xl text-[clamp(1.75rem,3.7vw,2.65rem)] font-extrabold leading-[1.22] tracking-[-0.03em] text-balance text-white">
            Оюутны цагийн ажлын Монгол дахь хамгийн энгийн зам
          </h2>
        </Reveal>
      </section>

      {/* ==================== ХЭРХЭН АЖИЛЛАДАГ ВЭ ====================
          Гүйлгэлтээр жолоодогддог түүх — доошоо гүйлгэхэд хэсэг наалдаж,
          алхмууд солигдоно.

          ⚠ Энд `overflow` (hidden/clip/auto) ОГТ өгч болохгүй — доторх
            `sticky top-0` шууд унаж, наалдалт ажиллахаа болино. Тиймээс
            булангийн бөөрөнхийлөлтийг `overflow-hidden`-гүйгээр хийв
            (хүүхэд нь өөрийн дэвсгэргүй тул булангаас халихгүй).

          ⚠ `backdrop-blur` мөн ЗОРИУДААР ашиглаагүй: filter төрлийн
            шинжүүд агуулагч блок үүсгэдэг тул наалдалтад эрсдэл нэмнэ. */}
      <div className="px-4 pb-24 sm:px-6 sm:pb-28">
        <div className="chadal-panel">
          <Suspense fallback={<div className="h-screen" />}>
            <ScrollStory />
          </Suspense>
        </div>
      </div>

      {/* ==================== СТАТИСТИК ==================== */}
      <section id="stats" className="container-page scroll-mt-24 pb-24 sm:pb-28">
        <Reveal className="mb-12 max-w-2xl">
          <div className="chadal-eyebrow">МЭДЭЭЛЭЛ БА ҮЗҮҮЛЭЛТ</div>
          <SplitHeading className="mt-4 text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-white">
            Монголын оюутны ажлын зах зээл
          </SplitHeading>
          <p className="mt-5 text-[0.95rem] font-medium leading-relaxed text-chadal-muted">
            Платформын тоо нь Монгол оюутан, залуу мэргэжилтнүүдийн цагийн ажилд
            хэр идэвхтэй хүрч байгааг харуулна.
          </p>
        </Reveal>

        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 70} className="h-full">
              <SpotlightCard
                glow={stat.glow}
                className="h-full rounded-[1.25rem] border border-chadal-border bg-chadal-card p-7"
              >
                <StatCounter
                  value={stat.value}
                  className="mb-3 block text-[2.5rem] font-extrabold leading-none tracking-[-0.03em] text-white transition-transform duration-300 ease-spring group-hover:scale-105"
                />
                <div className="mb-2 font-bold text-white">{stat.label}</div>
                <div className="text-sm font-medium text-chadal-muted">{stat.desc}</div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* Графикууд. Загварын «цагаан карт градиент хүрээнд» гэсэн
            хэлбэрийг дагав — гадна нь цэнхэр градиент, дотор нь агуулга. */}
        <div className="rounded-[1.9rem] bg-[linear-gradient(150deg,#12457F,#7CC2F9)] p-1.5 sm:p-2">
          <div className="grid gap-10 rounded-[1.55rem] bg-chadal-card p-7 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="m-0 mb-2 text-xl font-bold tracking-tight text-white">
                Хамгийн эрэлттэй ажлын ангилал
              </h3>
              <p className="m-0 mb-8 text-sm font-medium text-chadal-muted">
                2025 онд ангиллаар цагийн ажлын зарлалын түгээлт
              </p>

              <div className="space-y-5">
                {demandData.map((item, i) => (
                  <div key={item.category}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold text-chadal-fg">{item.category}</span>
                      <StatCounter value={`${item.percent}%`} className="font-bold text-chadal-accent" />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      {/* Зурвас нь гүйлгэж ирэхэд зүүнээс баруун тийш ургана.
                          `origin-left` байхгүй бол голоосоо тэлж, буруу
                          харагдана. */}
                      <Reveal
                        animation="animate-grow-x"
                        delay={i * 80}
                        className={`h-full origin-left rounded-full ${item.color}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chadal-inset p-6">
              <div className="mb-6 flex items-center gap-2">
                <Icons.TrendingUp className="text-chadal-accent" size={20} />
                <h4 className="m-0 text-base font-bold text-white">Өсөлтийн урсгал: ажлын зарлал</h4>
              </div>
              <div className="flex h-48 items-end justify-between gap-3 pt-8">
                {[60, 75, 65, 85, 78, 90, 100].map((height, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
                    {/* Хувиар өгсөн өндөр нь ЭЦЭГ элементийн өндрөөс
                        тооцогддог тул баганад зориулж тодорхой өндөртэй
                        талбай (`flex-1`) заавал хэрэгтэй — эс бөгөөс
                        `height: 60%` нь auto өндрөөс тооцогдож 0 болно. */}
                    <div className="flex w-full flex-1 items-end">
                      {/* `origin-bottom` нь баганыг доороос дээш ургуулна */}
                      <Reveal
                        animation="animate-grow-y"
                        delay={i * 70}
                        className="w-full origin-bottom rounded-t-lg bg-gradient-to-t from-chadal-accent/25 to-chadal-accent"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-chadal-dim">
                      {['1-р', '2-р', '3-р', '4-р', '5-р', '6-р', '7-р'][i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm font-medium text-chadal-muted">Нийт өсөлт</span>
                {/* «+» нь урд байгаа тул тусад нь бичив — `StatCounter` нь
                    зөвхөн ард байх дагаварыг таньдаг. */}
                <span className="text-lg font-bold text-white">
                  +<StatCounter value="73%" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ҮНЭ ==================== */}
      <section className="container-page pb-24 sm:pb-28">
        <Reveal className="flex flex-wrap items-start justify-between gap-8">
          <h2 className="m-0 max-w-lg text-[clamp(1.75rem,3.7vw,2.4rem)] font-extrabold leading-[1.18] tracking-[-0.03em] text-white">
            Ажил хайгчдад үргэлж үнэгүй
          </h2>
          <p className="m-0 max-w-xs text-sm font-medium leading-relaxed text-chadal-muted">
            Цалин платформоор дамжихгүй — ажил олгогч ажилтандаа ШУУД төлнө.
            Дэлгэрэнгүйг үйлчилгээний нөхцөлөөс уншина уу.
          </p>
        </Reveal>

        <div className="mt-11 grid gap-5 md:grid-cols-2">
          {PRICING.map((plan, i) => (
            <Reveal key={plan.tag} delay={i * 90} className="h-full">
              <div
                className={`flex h-full flex-col rounded-[1.4rem] p-8 ${
                  plan.featured
                    ? 'bg-chadal-pink text-white'
                    : 'border border-chadal-border bg-chadal-card'
                }`}
              >
                <div className={`text-xs font-bold tracking-[0.14em] ${plan.featured ? 'text-chadal-pink-soft' : 'text-chadal-muted'}`}>
                  {plan.tag}
                </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-2">
                  <span className="text-[2.4rem] font-extrabold leading-none tracking-[-0.03em] text-white">
                    {plan.price}
                  </span>
                  {plan.unit && (
                    <span className={`text-sm font-medium ${plan.featured ? 'text-chadal-pink-soft' : 'text-chadal-muted'}`}>
                      {plan.unit}
                    </span>
                  )}
                </div>
                <p className={`m-0 mt-4 text-sm font-medium ${plan.featured ? 'text-chadal-pink-soft' : 'text-chadal-muted'}`}>
                  {plan.note}
                </p>

                <ul className="m-0 mt-7 flex list-none flex-col gap-3 p-0 text-sm font-medium">
                  {plan.features.map(feature => (
                    <li key={feature} className={`flex items-start gap-2.5 ${plan.featured ? 'text-white' : 'text-chadal-fg'}`}>
                      <Icons.Check size={16} className="mt-0.5 flex-none" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* `mt-auto` нь товчийг картын ЁРООЛД түлхэнэ — жагсаалтын
                    урт нь хоёр картад ялгаатай байсан ч товчнууд эгнэнэ. */}
                <Link
                  to={plan.to}
                  className={`mt-auto block rounded-xl px-6 py-3.5 text-center text-sm font-bold transition-colors ${
                    plan.featured
                      ? 'bg-[#FDEEF5] text-[#8D1F57] hover:bg-white'
                      : 'bg-chadal-accent text-chadal-ink hover:bg-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ==================== ТОМ УРИАЛГА ==================== */}
      <section className="container-page pb-24 sm:pb-28">
        <Reveal className="flex flex-wrap items-center justify-between gap-8 rounded-[1.6rem] bg-chadal-accent px-8 py-12 sm:px-14 sm:py-14">
          <h2 className="m-0 max-w-lg text-[clamp(1.7rem,3.4vw,2.5rem)] font-bold leading-[1.2] tracking-[-0.03em] text-chadal-ink">
            Профайлаа үүсгээд өнөөдрөөс ээлжээ хай.
          </h2>
          <Link
            to="/register"
            className="rounded-xl bg-chadal-ink px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-[#1B2534]"
          >
            Үнэгүй профайл үүсгэх
          </Link>
        </Reveal>
      </section>

      {/* ==================== ХОЛБОО БАРИХ ==================== */}
      <section id="contact" className="container-page scroll-mt-24 pb-24 sm:pb-28">
        <Reveal className="mb-12 max-w-2xl">
          <div className="chadal-eyebrow">ХОЛБОО БАРИХ</div>
          <SplitHeading className="mt-4 text-[clamp(1.9rem,4.4vw,2.9rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-white">
            Бидэнтэй холбогдоорой
          </SplitHeading>
          <p className="mt-5 text-[0.95rem] font-medium leading-relaxed text-chadal-muted">
            Ажил зарлах эсвэл ажил олох талаар асуулт байна уу? Манай баг тусламж үзүүлэхэд бэлэн.
          </p>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <Reveal className="chadal-card">
              <h3 className="m-0 mb-6 text-lg font-bold text-white">Холбоо барих мэдээлэл</h3>

              <div className="space-y-6">
                {CONTACT_ROWS.map((row, i) => {
                  const Icon = Icons[row.icon]
                  return (
                    <Reveal key={row.label} delay={140 + i * 110} className="group flex items-start gap-4">
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-chadal-accent text-chadal-ink transition-transform duration-200 ease-spring group-hover:scale-110">
                        <Icon size={20} />
                      </span>
                      <div>
                        <div className="mb-1 text-sm font-bold text-white">{row.label}</div>
                        <div className="text-sm font-medium text-chadal-muted">{row.value}</div>
                      </div>
                    </Reveal>
                  )
                })}
              </div>
            </Reveal>

            <Reveal delay={160} className="chadal-card">
              <h3 className="m-0 mb-6 text-lg font-bold text-white">Дагах</h3>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="animate-pop-in press flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-chadal-border bg-white/[0.04] text-chadal-muted transition-all hover-lift hover:border-chadal-accent/55 hover:text-white"
                    style={{ animationDelay: `${260 + i * 80}ms` }}
                  >
                    <Icons.Globe size={18} />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-3">
            <Reveal delay={120} className="chadal-card p-7 sm:p-9">
              {/* Талбарууд дараалан гарч ирнэ — `stagger` класс нь хүүхэд
                  бүрд nth-child-ээр саатал өгнө (index.css). */}
              <form className="stagger space-y-6">
                <div className="grid animate-fade-up gap-6 sm:grid-cols-2">
                  <div>
                    <label className="chadal-label" htmlFor="contact-name">Бүтэн нэр</label>
                    <input id="contact-name" type="text" placeholder="Таны нэр" className="chadal-input" />
                  </div>
                  <div>
                    <label className="chadal-label" htmlFor="contact-email">И-мэйл</label>
                    <input id="contact-email" type="email" placeholder="ta@example.com" className="chadal-input" />
                  </div>
                </div>

                <div className="animate-fade-up">
                  <label className="chadal-label" htmlFor="contact-message">Мессеж</label>
                  <textarea
                    id="contact-message"
                    placeholder="Бид танд хэрхэн туслах вэ?"
                    rows={5}
                    className="chadal-input resize-none"
                  />
                </div>

                <button type="button" className="chadal-btn chadal-btn-accent animate-fade-up">
                  <Icons.Send size={18} />
                  Мессеж илгээх
                </button>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
