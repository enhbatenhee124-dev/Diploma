import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Хадгалсан хайлтын дүрслэл нь `components/SavedSearches.jsx`-ийн ЯГ тэр
// дүрсүүдийг хэрэглэнэ — inline SVG-ээр дуурайвал бодит UI-аас салж эхэлнэ.
import { BellOff, BellRing, BookmarkPlus, MessageSquare, Trash2 } from 'lucide-react';
import { Reveal, SpotlightCard, StatCounter } from '../components/Motion';
import SplitHeading from '../components/SplitHeading';
import Footer from '../components/Footer';

// Загварын хоёр mascot. Claude Design-ийн "Дизайн импорт арга" төслөөс
// татсан — хоёулаа RGBA (тунгалаг дэвсгэртэй) тул цайвар картан дээр
// шууд суух ба цагаан хайрцаг үүсгэхгүй.
const mascotSeeker = new URL('../assets/mascot-rabbit.png', import.meta.url).href;
const mascotEmployer = new URL('../assets/mascot-capybara.png', import.meta.url).href;

// ============================================================
// Mufi сэдэв
// ============================================================
// Claude Design-ийн "Mufi Landing v2" загварыг энэ хуудсанд буулгав.
// Өмнөх Chadal (бараан цэнхэр) сэдвийг БҮРЭН орлосон. Гол зарчмууд:
//
//   • Дэвсгэр нь БАРААН ЯГААН (#0A0611), текст нь цагаан. Хуучин
//     `text-chadal-*` классууд энд ажиллахгүй — `text-mufi-*` хэрэглэнэ.
//   • Акцент нь ХОС: ягаан #B884FF (үндсэн) ба улбар шар #FF9D4A
//     (хоёрдогч). Загварын hero нь зүүнээс улбар шар, баруунаас ягаан
//     туяа тулгаж нээдэг — доорх `mufi-glow-*` тэрийг давтана.
//   • Үндсэн товч нь ЦАЙВАР шахмал (#F6F2FA) дээр бараан текст —
//     загварын «Book a Demo». Ягаан дүүргэлт нь дэд үйлдэлд.
//   • Гарчгууд нь НИМГЭН (500-600), жижиг үсгээр, маш нягт tracking-тэй.
//     Chadal-ын `font-extrabold uppercase` хэлбэр АРИЛСАН.
//   • Загварын цорын ганц ЦАЙВАР хэсэг нь хоёр mascot карт — тэдгээр нь
//     санаатай, хуудсын дунд амьсгал өгнө. Хос акцентийг дагаж ажил
//     хайгч нь ягаан, ажил олгогч нь улбар шар болов.
//   • Загварт `width: 1440px` тогтмол байсныг (зөвхөн desktop) АВЧ, бүх
//     хэсгийг responsive болгов.
//
// ⚠ Загварын эх текст нь эмнэлгийн цаг товлох SaaS-ын тухай байсан бөгөөд
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
//
// Урьд нь эдгээр нь хуудасны ЦОРЫН ГАНЦ цайвар (lilac / peach) хэсэг
// байсан тул бараан загвараас хэт тодорч байлаа. Одоо дэвсгэр нь бусад
// карттай ижил бараан суурьтай ба дүр бүр ЗӨВХӨН акцентээр ялгарна:
// ажил хайгч → ягаан, ажил олгогч → улбар шар.
//
// Тэр акцентийг hero-гийн туяанаас ЯГ авав (`mufi-glow-purple` нь
// rgb(158,68,226), `mufi-glow-warm` нь rgb(255,116,38)) — ингэснээр
// нээлтийн хэсэг доод карт руу үргэлжилсэн мэт унших ба шинэ өнгө
// нэмэгдэхгүй. Дүрслэлийг `.mufi-role-card` (index.css) хийнэ; энд
// зөвхөн дүр тус бүрийн өнгийг хувьсагчаар дамжуулна.
const ROLE_CARDS = [
  {
    tag: 'АЖИЛ ХАЙГЧ',
    title: 'Хичээлийнхээ хуваарьт тохирсон ээлжээ ол',
    desc: 'Дүүрэг, цагийн хуваарь, ур чадвараараа шүүж хүсэлтээ илгээ.',
    cta: 'Профайл үүсгэх',
    to: '/register',
    img: mascotSeeker,
    eyebrow: 'text-mufi-accent',            // картан дээр 6.97:1
    btn: 'bg-mufi-accent-deep hover:bg-[#5E2AB0]', // цагаан текст 7.08:1
    spot: 'rgba(184, 132, 255, 0.20)',      // курсорыг дагах гэрэл
    vars: {
      '--role-glow': 'rgba(158, 68, 226, 0.30)',
      '--role-edge': 'rgba(184, 132, 255, 0.22)',
      '--role-edge-hover': 'rgba(184, 132, 255, 0.45)',
      '--role-ring': 'rgba(158, 68, 226, 0.75)',
    },
  },
  {
    tag: 'АЖИЛ ОЛГОГЧ',
    title: 'Ээлжиндээ таарах ажилтнаа хурдан ол',
    desc: 'Зар нийтэлж, ирсэн хүсэлтийг нэг самбараас удирд.',
    cta: 'Зар нийтлэх',
    to: '/register',
    img: mascotEmployer,
    eyebrow: 'text-mufi-warm',              // картан дээр 9.11:1
    btn: 'bg-mufi-warm-deep hover:bg-[#8F3708]',   // цагаан текст 6.13:1
    spot: 'rgba(255, 157, 74, 0.18)',
    vars: {
      '--role-glow': 'rgba(255, 116, 38, 0.26)',
      '--role-edge': 'rgba(255, 157, 74, 0.22)',
      '--role-edge-hover': 'rgba(255, 157, 74, 0.45)',
      '--role-ring': 'rgba(255, 116, 38, 0.70)',
    },
  },
]

// ------------------------------
// Боломжуудын хэсгийн дүрслэлүүд
// ------------------------------
// Загварын Features картууд дээр бүтээгдэхүүний ДЭЛГЭЦИЙН ЗУРАГ байх
// байрлалд эх файл нь зураастай хоосон талбай + `calendar auto-fill screen`
// гэсэн mono бичээс тавьсан (зураг нь дараа орох гэсэн үг).
//
// ⚠ Тэр хоосон талбайг тэр чигээр нь авбал бүтээгдсэн хуудсан дээр
//   «дуусаагүй» мэт харагдана. Бодит дэлгэцийн зураг ч мөн болохгүй:
//   хуурамчаар зурвал байхгүй боломжийг байгаа мэт харуулна. Тиймээс
//   боломж бүрийг сэдвийн ӨӨРИЙН энгийн хэлбэрээр (цэг, зурвас, бөмбөлөг)
//   ХИЙСВЭРЛЭН үзүүлэв — юу болохыг ойлгуулах ч дэлгэц мэт дүр эсгэхгүй.
//
// Бүгд `aria-hidden`: агуулга нь дэргэдэх гарчиг, тайлбарт бүрэн байгаа
// тул дэлгэц уншигчид эдгээр нь зөвхөн давхардал болно.

/** Хийсвэр дүрслэлийн нийтлэг хайрцаг. */
function FeatureArt({ children, tone = 'purple' }) {
  return (
    <div
      className={`relative flex h-[11rem] items-center justify-center overflow-hidden rounded-2xl border border-white/10 sm:h-[12.25rem] ${
        tone === 'warm'
          ? 'bg-[linear-gradient(160deg,#2B1710,#190D12)]'
          : 'bg-[linear-gradient(160deg,#1B1030,#120B1E)]'
      }`}
      aria-hidden="true"
    >
      {/* ⚠ Туяаг ХАГАС хүчээр. Hero-гийн бүтэн хүчээр өгвөл голдоо
          дэвсгэрийг #52267B хүртэл цайруулж, доорх жижиг бичээсүүдийг
          4.5:1-ээс унагана (хэмжсэн: 3.65–4.01). Хагасаар бол дэвсгэр
          #371B55 болж, бүгд 4.9:1-ээс дээш үлдэнэ. */}
      <div
        className={`mufi-glow ${tone === 'warm' ? 'mufi-glow-warm' : 'mufi-glow-purple'} inset-0 opacity-50`}
      />
      {/* ⚠ Энэ боодол `absolute inset-0` байх ЁСТОЙ, `relative w-full` БИШ.
          Сүүлийнх нь өөрөө өндөргүй (доторх зүйлс нь бүгд `absolute`)
          болж хураагддаг тул газрын зургийн сүлжээ алга болж,
          хувиар өгсөн тэмдэглэгээнүүд нэг цэг дээр овоордог. */}
      <div className="absolute inset-0 flex items-center justify-center px-6">{children}</div>
    </div>
  )
}

/**
 * Газрын зураг.
 *
 * ⚠ Тэмдэглэгээ нь ЗОХИОМОЛ дугуй биш — `components/JobMap.jsx`-ийн
 *   `pinIcon()`-ий ЯГ тэр SVG зам, яг тэр өнгө (энгийн `#8b5cf6`, хүсэлт
 *   илгээсэн зар `#f59e0b`), цагаан 1.5px зураас, голдоо цагаан дугуй.
 *   Бөмбөлгийн агуулга нь мөн бодит `<Popup>`-ийн бүтэц: гарчиг, цалин
 *   «/ цаг», дүүрэг, «Дэлгэрэнгүй →».
 *
 *   Зарын өгөгдөл нь `server/scripts/seed.js`-ийн бодит мөрөөс —
 *   «Ахлах бариста», Сүхбаатар, 22,000₮. Цалингийн бичиглэл нь
 *   `utils/helpers.js → formatCurrency()`-ийн гаргадаг «22,000 ₮».
 */
const JOB_PIN = 'M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z'

function MapPin({ applied = false, size = 26 }) {
  return (
    <svg width={size} height={size * (32 / 24)} viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d={JOB_PIN} fill={applied ? '#f59e0b' : '#8b5cf6'} stroke="white" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" fill="white" />
    </svg>
  )
}

function ArtMap() {
  return (
    <FeatureArt>
      {/* Зургийн хавтангийн сүлжээ */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      {/* Хажуугийн тэмдэглэгээнүүд. Байрлал нь ХУВИАР өгөгдсөн тул карт
          нарийсахад хамт агшина — тогтмол px байсан бол ирмэгээс халина. */}
      <span className="absolute left-[12%] top-[24%] -translate-x-1/2 -translate-y-full opacity-70">
        <MapPin size={18} />
      </span>
      <span className="absolute left-[86%] top-[62%] -translate-x-1/2 -translate-y-full opacity-70">
        <MapPin size={18} />
      </span>
      <span className="absolute left-[30%] top-[86%] -translate-x-1/2 -translate-y-full opacity-70">
        <MapPin size={18} applied />
      </span>

      {/* Нээлттэй бөмбөлөг. Leaflet-ийн бөмбөлөг ЦАЙВАР дэвсгэртэй,
          бараан текстэй тул энд ч тэрийг хадгалав — эс бөгөөс бодит
          газрын зурагтай огт төстэй биш болно. */}
      <div className="relative mx-auto w-full max-w-[15rem]">
        <div className="rounded-lg bg-white px-3 py-2.5 text-left shadow-[0_6px_20px_rgba(0,0,0,0.45)]">
          <strong className="block text-[0.78rem] leading-tight text-[#0f172a]">Ахлах бариста</strong>
          <div className="mt-1 text-[0.7rem] leading-snug text-[#475569]">
            <div>22,000 ₮ / цаг</div>
            <div>Сүхбаатар</div>
          </div>
          <span className="mt-1.5 inline-block text-[0.7rem] font-semibold text-[#7c3aed]">
            Дэлгэрэнгүй →
          </span>
        </div>
        {/* Бөмбөлгийн үзүүр, доор нь тэмдэглэгээ */}
        <span className="mx-auto block h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-white" />
        <span className="mx-auto mt-0.5 block w-fit">
          <MapPin size={22} />
        </span>
      </div>
    </FeatureArt>
  )
}

/**
 * Хадгалсан хайлт.
 *
 * ⚠ Энэ нь ЗОХИОМОЛ хэлбэр биш — `components/SavedSearches.jsx`-ийн бодит
 *   бүтцийг давтана: «Хайлтаа хадгалах» товч, дараа нь хадгалсан хайлт бүр
 *   нь ЧИП болж, чип дээр нь мэдэгдлийн хонх (`BellRing`/`BellOff`) ба
 *   устгах сав байрлана. Дүрсүүд нь ч тэр компонентын хэрэглэдэг ЯГ тэр
 *   lucide дүрсүүд.
 *
 *   Бичвэр нь мөн бодит: дүүргүүд `data/constants.js → DISTRICTS`-ээс,
 *   ангиллын нэр `admin/AdminAnalytics.jsx → categoryLabels`-ээс, цалингийн
 *   бичиглэл нь `SavedSearches.jsx → describe()`-ийн гаргадаг
 *   «15,000₮/цаг-с дээш» хэлбэрээр.
 *
 *   Өнгө нь л сэдэвт тохирсон: бодит компонент дээр `emp-accent` (хянах
 *   самбарын ягаан), энд нийтийн хуудасны `mufi-accent`.
 */
function ArtSavedSearch() {
  const chips = [
    { label: 'Сүхбаатар · Хоол · 15,000₮/цаг-с дээш', notify: true },
    { label: 'Хан-Уул · Хүргэлт', notify: false },
  ]
  return (
    <FeatureArt>
      <div className="flex w-full max-w-[20rem] flex-col items-start gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.07] px-3 py-1.5 text-[0.7rem] font-medium text-mufi-fg">
          <BookmarkPlus className="h-3.5 w-3.5" />
          Хайлтаа хадгалах
        </span>

        {chips.map(chip => (
          <span
            key={chip.label}
            className="inline-flex max-w-full items-center gap-1 rounded-lg border border-mufi-accent/25 bg-mufi-accent/15 py-1 pl-3 pr-1 text-[0.7rem]"
          >
            <span className="truncate text-mufi-fg">{chip.label}</span>
            <span className="p-1 text-mufi-fg/60">
              {chip.notify ? <BellRing className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
            </span>
            <span className="p-1 text-mufi-fg/50">
              <Trash2 className="h-3 w-3" />
            </span>
          </span>
        ))}
      </div>
    </FeatureArt>
  )
}

/**
 * Платформ доторх чат.
 *
 * ⚠ `components/ChatPanel.jsx`-ийн бодит бүтэц: `MessageSquare` дүрстэй
 *   толгой (гарчиг + дэд гарчиг), доор нь бөмбөлгүүд. Бөмбөлгийн хэлбэр
 *   яг тэндхийнх — өөрийн мессеж БАРУУН талд `bg-white/15` ба
 *   `rounded-2xl rounded-br-sm`, нөгөө талынх ЗҮҮН талд `bg-white/[0.06]`
 *   + `border-white/10` ба `rounded-bl-sm`. Доод баруун буланд нь
 *   `text-[10px] text-white/45` цагийн тэмдэг.
 *
 *   Өмнө нь буруу булан (`rounded-tl-md`/`rounded-tr-md`) дээр хийчихсэн
 *   байсан ба өөрийн мессежийг ягаанаар будсан нь бодит чаттай таарахгүй
 *   байв — жинхэнэ чат ХОЁУЛАНГ нь саарлаар харуулж, зөвхөн тунгалаг
 *   байдлаар нь ялгадаг.
 *
 * ⚠ ГАНЦ ЗӨРҮҮ: цагийн тэмдэг. Бодит компонент `text-white/45` хэрэглэдэг
 *   боловч тэр нь тодролын шалгуурыг ДАВДАГГҮЙ (өөрийн бөмбөлөг дээр
 *   3.69:1, нөгөөгийнх дээр 4.26:1 — хоёулаа 4.5:1-ээс доош). Энд
 *   `white/65` болгож 4.97:1 болгов. Бодит компонентыг мөн засах
 *   шаардлагатай — тусад нь тэмдэглэсэн.
 */
function ArtChat() {
  return (
    <FeatureArt>
      <div className="flex w-full max-w-[17.5rem] flex-col gap-2.5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <MessageSquare className="h-3.5 w-3.5 flex-none text-white" />
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.72rem] font-medium text-white">Ахлах бариста</p>
            <p className="m-0 truncate text-[0.62rem] text-white/55">Кофе Ланд</p>
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[78%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-3 py-1.5">
            <p className="m-0 text-[0.7rem] leading-snug text-white">Маргаашийн ээлж хүчинтэй юу?</p>
            <p className="m-0 mt-0.5 text-right text-[0.58rem] text-white/65">14:02</p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-white/15 px-3 py-1.5">
            <p className="m-0 text-[0.7rem] leading-snug text-white">Тийм, 08:00-д ирээрэй.</p>
            <p className="m-0 mt-0.5 text-right text-[0.58rem] text-white/65">14:05</p>
          </div>
        </div>
      </div>
    </FeatureArt>
  )
}

/**
 * Түвшин ба XP.
 *
 * ⚠ `components/Gamification.jsx`-ийн `LevelProgress`-ийн бодит бүтэц:
 *   «Түвшин N» + «{intoLevel} / {span} XP», доор нь зурвас, доор нь
 *   «Дараагийн түвшин хүртэл … XP · Нийт … XP». Зурвасын өнгө нь
 *   `THEMES[0]` буюу анхдагч «Нил ягаан» (`from-violet-500 to-fuchsia-500`).
 *
 *   Тоонууд нь ЗОХИОМОЛ биш, бүгд ХООРОНДОО НИЙЦНЭ. Migration
 *   `20260727000400_gamification.sql`-ийн `exp_for_level` босго нь
 *   Lv.4 = 560, Lv.5 = 900. Нийт XP 772 гэвэл `user_progress` view нь:
 *     level          = 4        (560 ≤ 772 < 900)
 *     into_level     = 772−560  = 212
 *     needed_for_next= 900−772  = 128
 *     progress_pct   = round(100 × 212 ÷ 340) = 62
 *
 *   Доод мөр нь `nextWageTier(4)` = { level: 5, minWage: 20000 } —
 *   `RankingPage`-ийн харуулдагтай ижил зөвлөмж.
 */
function ArtLevel() {
  return (
    <FeatureArt tone="warm">
      <div className="w-full max-w-[19rem]">
        <div className="mb-1.5 flex items-end justify-between gap-3">
          <span className="text-[0.78rem] font-bold text-white">Түвшин 4</span>
          <span className="text-[0.66rem] text-white/80">212 / 340 XP</span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        </div>

        <p className="m-0 mt-1.5 text-[0.64rem] leading-snug text-white/80">
          Дараагийн түвшин хүртэл 128 XP · Нийт 772 XP
        </p>
        <p className="m-0 mt-2 text-[0.64rem] leading-snug text-mufi-warm">
          Lv.5-д хүрвэл цагийн 20,000 ₮-с дээш ажил санал болгоно
        </p>
      </div>
    </FeatureArt>
  )
}

// Боломжууд. Тус бүр нь БОДИТ, аль хэдийн ажиллаж буй чиг үүрэг —
// хажууд нь хэрэгжүүлсэн файлыг зааж өгөв.
const FEATURES = [
  {
    art: ArtMap,
    title: 'Газрын зураг дээрээс ээлжээ ол',
    body: 'Зарыг жагсаалтаар биш газрын зураг дээр хараад хичээлийн байр, гэрээсээ ойрхон ажлыг нь шууд сонго.',
    // `components/JobMap.jsx` → `pages/employee/JobListings.jsx`
  },
  {
    art: ArtSavedSearch,
    title: 'Хадгалсан хайлт мэдэгдэл болно',
    body: 'Шүүлтээ хадгалахад тохирох зар гармагц мэдэгдэл ирнэ. Мэдэгдлийг өгөгдлийн сан өөрөө үүсгэдэг тул апп нээлттэй байх шаардлагагүй.',
    // `components/SavedSearches.jsx` (FR-5.4)
  },
  {
    art: ArtChat,
    title: 'Платформ доторх чат',
    body: 'Утасны дугаараа солилцолгүйгээр ажил олгогчтой шууд ярилц.',
    // `components/ChatDock.jsx` → Employee/Employer layout
  },
  {
    art: ArtLevel,
    title: 'Түвшин нь зөвлөмж, хаалт биш',
    body: 'Ажил хийж XP цуглуулна. Түвшин нь өндөр цалинтай ажилд ямар туршлага санал болгож байгааг харуулах ч хэнийг ч хаахгүй — хүссэн ажилдаа хүсэлт илгээнэ.',
    // `utils/gamification.js` → `levelAdvice` (ЗӨВЛӨМЖ, хориг БИШ)
  },
]

/** Боломжийн нэг карт: дүрслэл + гарчиг + тайлбар. */
function FeatureCard({ feature, delay }) {
  const Art = feature.art
  return (
    <Reveal delay={delay} className="h-full">
      <div className="mufi-card flex h-full flex-col gap-6">
        <Art />
        <div className="flex flex-col gap-2.5">
          <h3 className="m-0 text-[1.3rem] font-semibold leading-snug tracking-tight text-mufi-fg">
            {feature.title}
          </h3>
          <p className="m-0 text-[0.9rem] font-normal leading-relaxed text-balance text-mufi-muted">
            {feature.body}
          </p>
        </div>
      </div>
    </Reveal>
  )
}

/**
 * Уриалгын самбарын дүрслэл: боломжит цагийн хүснэгт.
 *
 * Загварын CTA дээр «weekly schedule shot» гэсэн зурагны байр байсан.
 *
 * ⚠ Энэ нь зохиомол баганан диаграм БИШ — `pages/employee/EmployeeProfile.jsx`
 *   дээрх бодит «Боломжит цаг» хүснэгтийн бүтэц: мөр нь 7 өдөр
 *   (`days` жагсаалт), багана нь 3 цагийн интервал (`timeSlots`), нүд бүр
 *   нь 6×6 дөрвөлжин унтраалт. Дүүрэн нүд = боломжтой, хоосон нь =
 *   боломжгүй. Интервалын утга нь `utils/matching.js → slotIndex()`-тэй
 *   таарна: 0 = өглөө (<12), 1 = өдөр (<18), 2 = орой.
 *
 *   Энэ хүснэгт нь тохирлын оноонд ХАМГИЙН ЖИНТЭЙ хэсэг (40/100 оноо)
 *   учраас CTA-гийн «хичээлийнхээ хуваарийг оруулмагц» гэсэн үгтэй
 *   шууд нийцнэ.
 */
function ArtWeek() {
  const days = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням']
  const timeSlots = ['Өглөө', 'Өдөр', 'Орой']
  // Оюутны ердийн долоо хоног: өдрийн цагаар хичээлтэй тул орой ба амралтын
  // өдөр нь чөлөөтэй. `availability` объектын бодит хэлбэр — { өдөр: [цаг] }.
  const availability = { 0: [2], 1: [2], 2: [1, 2], 3: [2], 4: [1, 2], 5: [0, 1, 2], 6: [0, 1] }

  return (
    <div
      className="relative flex h-[13rem] items-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#1B1030,#120B1E)] px-4 sm:h-[14.5rem] sm:px-5"
      aria-hidden="true"
    >
      <div className="mufi-glow mufi-glow-purple inset-0 opacity-50" />
      <table className="relative w-full border-collapse text-[0.6rem] sm:text-[0.66rem]">
        <thead>
          <tr>
            <th />
            {timeSlots.map(slot => (
              <th key={slot} className="px-1 pb-1.5 text-center font-normal text-mufi-muted">
                {slot}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, dayIdx) => (
            <tr key={day} className="border-t border-white/10">
              <td className="py-[3px] pr-2 text-mufi-muted">{day}</td>
              {timeSlots.map((slot, slotIdx) => (
                <td key={slot} className="px-1 py-[3px] text-center">
                  <span
                    className={`mx-auto block h-3.5 w-3.5 rounded border sm:h-4 sm:w-4 ${
                      availability[dayIdx]?.includes(slotIdx)
                        ? 'border-mufi-accent bg-mufi-accent'
                        : 'border-white/10 bg-white/5'
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ------------------------------
// Түгээмэл асуулт
// ------------------------------
// ⚠ Хариулт бүр нь ЗОХИОСОН биш — `/terms` эсвэл кодын бодит зан төлөвөөс
//   гаралтай. Хажууд нь эх сурвалжийг зааж өгөв. Хариултыг өөрчлөх бол
//   эх сурвалжийг нь ЗААВАЛ хамт шалга, эс бөгөөс хуудас нөхцөлтэйгээ
//   зөрчилдөнө.
const FAQS = [
  {
    q: 'Ажил хайгчид ямар нэг төлбөр төлөх үү?',
    a: 'Үгүй. Профайл үүсгэх, ажил хайх, хүсэлт илгээх, чатлах бүгд үнэгүй. Зөвхөн ажил олгогч зар нийтлэхийн тулд сарын багц авна.',
    // /terms#payments — «Ажил хайгчид платформ ҮНЭГҮЙ»
  },
  {
    q: 'Цалин платформоор дамжих уу?',
    a: 'Үгүй. Ажил олгогч ажилтандаа ШУУД төлнө. Тиймээс цалин төлөгдөөгүй тохиолдолд бид шууд хариуцлага хүлээхгүй ч маргааныг шийдвэрлэхэд туслах, зөрчсөн ажил олгогчийг хаана.',
    // /terms#payments — 3 дахь догол мөр, ҮГ ҮСГЭЭР нь
  },
  {
    q: 'Түвшин бага бол өндөр цалинтай ажилд орж болох уу?',
    a: 'Болно. Түвшин нь ЗӨВЛӨМЖ болохоос хориг биш — хэн ч ямар ч ажилд хүсэлт илгээж чадна. Ажил олгогч хүсэлтийг харахдаа тухайн ажилд ямар туршлага санал болгож байгааг нэмэлт мэдээлэл болгон харна.',
    // utils/gamification.js → `levelAdvice` дээрх тайлбар
  },
  {
    q: 'Мэдэгдэл авахын тулд апп нээлттэй байх шаардлагатай юу?',
    a: 'Үгүй. Хадгалсан хайлтад тохирох зар гармагц мэдэгдлийг өгөгдлийн сан өөрөө үүсгэдэг тул дараа орохдоо хонхон дээрээ харна.',
    // components/SavedSearches.jsx (FR-5.4) дээрх тайлбар
  },
]

/**
 * FAQ-ийн нэг мөр.
 *
 * ⚠ Эх загварт энэ нь `onClick`-тэй `<div>` байсан. Тэр нь хулганаар л
 *   ажиллана — гараас Tab-аар хүрэхгүй, Enter-ээр нээгдэхгүй. Энд
 *   жинхэнэ `<button>` болгож, `aria-expanded`/`aria-controls`-оор
 *   төлвийг нь дэлгэц уншигчид мэдэгдэв.
 */
function FaqRow({ item, index, open, onToggle }) {
  const panelId = `faq-panel-${index}`
  const buttonId = `faq-button-${index}`
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        open ? 'border-mufi-accent/40' : 'border-mufi-border hover:border-mufi-accent/25'
      }`}
      style={{ background: 'linear-gradient(158deg, #191027, #110b1b)' }}
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left sm:px-6"
      >
        <span className="text-[0.98rem] font-medium text-mufi-fg">{item.q}</span>
        {/* Загварын тэмдэг: хэвтээ зураас үргэлж, босоо нь ЗӨВХӨН хаалттай
            үед — нээхэд «+» нь «−» болж хувирна. */}
        <span
          className="relative flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]"
          aria-hidden="true"
        >
          <span className="h-[1.5px] w-3 rounded-full bg-white/70" />
          {!open && <span className="absolute h-3 w-[1.5px] rounded-full bg-white/70" />}
        </span>
      </button>
      {open && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-5 sm:px-6">
          <p className="m-0 max-w-2xl text-[0.9rem] font-normal leading-relaxed text-balance text-mufi-muted">
            {item.a}
          </p>
        </div>
      )}
    </div>
  )
}

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
  // Нэг л асуулт задарна (загварынхтай ижил): шинийг дарахад өмнөх нь хаагдана.
  // `null` = бүгд хаалттай. Дарсан асуултаа дахин дарвал хаана.
  const [openFaq, setOpenFaq] = useState(null);

  // Hero-гийн хайлт. Хоосон бол шүүлтгүйгээр жагсаалт руу оруулна.
  const handleSearch = e => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs')
  }

  // Ангиллууд. `tone` нь загварын ХОС акцентийн аль нэгийг сонгоно:
  // `purple` (үндсэн) эсвэл `warm` (улбар шар). Chadal үед ангилал бүр
  // өөрийн өнгөтэй (ногоон, цэнхэр, цайвар ягаан…) байсныг АВСАН —
  // Mufi нь зөвхөн хоёр өнгө хэрэглэдэг тул тэр нь загвартай зөрчилдөнө.
  const categories = [
    {
      title: "Кафе ба Ресторан",
      desc: "Бариста, үйлчлэгч, хоолны өрөөний ажилтан",
      level: "Туршлага шаардахгүй · Оройн ээлж",
      tone: "warm",
      icon: <Icons.Coffee size={22} />,
    },
    {
      title: "Багш ба Номлогч",
      desc: "Хувийн багш, хэлний багш, STEM зөвлөгч",
      level: "Оюутан · Бакалавр",
      tone: "purple",
      icon: <Icons.GraduationCap size={22} />,
    },
    {
      title: "Хүргэлт ба Логистик",
      desc: "Хоолны хүргэлт, курьер, агуулахын тусламж",
      level: "Уян хатан цаг · Өдрийн ажил",
      tone: "purple",
      icon: <Icons.Truck size={22} />,
    },
    {
      title: "Борлуулалт ба Захиалга",
      desc: "Дэлгүүрийн туслах, кассир, брэндийн дэмжигч",
      level: "Долоо хоногийн эцэст",
      tone: "warm",
      icon: <Icons.ShoppingBag size={22} />,
    },
    {
      title: "Фриланс ба Алсаас",
      desc: "Дизайн, бичих, кодлогч, виртуал туслах",
      level: "Алсаас · Богино хугацаа",
      tone: "purple",
      icon: <Icons.Laptop size={22} />,
    },
    {
      title: "Үзэсгэлэнт Ажил",
      desc: "Дэмжигч, удирдагч, брэндийн төлөөлөгч",
      level: "Улирлын ажил",
      tone: "warm",
      icon: <Icons.Calendar size={22} />,
    },
  ];

  const stats = [
    {
      value: "10,000+",
      label: "Идэвхтэй оюутан ажил хайгч",
      desc: "Одоогоор Монгол дахь цагийн ажил хайж байгаа",
      tone: "purple",
    },
    {
      value: "43%",
      label: "Цагийн ажилд орсон оюутан",
      desc: "Их сургуулийн оюутнууд ажил, сургалтаа хослуулж байна",
      tone: "purple",
    },
    {
      value: "32%",
      label: "Жилийн өсөлт",
      desc: "2025 онд цагийн ажлын зарлалын нэмэгдэл",
      tone: "warm",
    },
    {
      value: "4.2K",
      label: "Сарын тохиролт",
      desc: "Ажил олгогч, ажилтан амжилттай холбогдсон тоо",
      tone: "warm",
    },
  ];

  // Диаграмын зурвасууд. Ягаанаас улбар шар руу шилжих ХЭЛХЭЭ — зөвхөн
  // хоёр акцентийн хооронд байх тул хуудасны бусад хэсэгтэй нийцнэ.
  const demandData = [
    { category: "Кафе ба Ресторан", percent: 28, color: "bg-[#B884FF]" },
    { category: "Багш", percent: 22, color: "bg-[#A06AF0]" },
    { category: "Хүргэлт", percent: 18, color: "bg-[#9A6BE8]" },
    { category: "Борлуулалт", percent: 15, color: "bg-[#C96FA0]" },
    { category: "Фриланс", percent: 12, color: "bg-[#F0803F]" },
    { category: "Үзэсгэлэн", percent: 5, color: "bg-[#FF9D4A]" },
  ];

  // Хоёр акцентийн ангиллын өнгө. `SpotlightCard`-ийн туяа, дүрсний
  // хайрцаг хоёулаа эндээс уншина.
  const TONES = {
    purple: {
      glow: "rgba(184, 132, 255, 0.30)",
      tile: "border-mufi-accent/35 bg-gradient-to-br from-mufi-accent/25 to-mufi-accent-deep/15 text-mufi-accent",
      hover: "hover:border-mufi-accent/45",
    },
    warm: {
      glow: "rgba(255, 157, 74, 0.28)",
      tile: "border-mufi-warm/35 bg-gradient-to-br from-mufi-warm/25 to-mufi-warm-deep/15 text-mufi-warm",
      hover: "hover:border-mufi-warm/45",
    },
  };

  return (
    // Hero-гийн туяанууд дэлгэцээс өргөн тул хэвтээ халилтыг таслах ёстой.
    //
    // ⚠ Гэхдээ `overflow-hidden` байж БОЛОХГҮЙ: `overflow: hidden` бүхий эцэг
    //   элемент доторх `position: sticky`-г идэвхгүй болгодог (гүйлгэлтийн
    //   контейнер болж хувирдаг тул) — доорх наалддаг цэс унана.
    //   `overflow-x: clip` нь халилтыг ижилхэн таслах ч гүйлгэлтийн
    //   контейнер ҮҮСГЭДЭГГҮЙ тул sticky хэвээр ажиллана.
    <div className="mufi-page relative overflow-x-clip">
      {/* Уншилтын явцын зурвас. Өргөн нь JS-гүйгээр, гүйлгэлтийн байрлалаас
          шууд тооцогдоно (index.css → `.scroll-progress`). */}
      <div className="scroll-progress" aria-hidden="true" />

      {/* ==================== ЦЭС ====================
          Загварын цэс нь хуудасны холбоосуудыг нэг тунгалаг ШАХМАЛ дотор
          цуглуулж, гурван хэсэгт хуваана: лого | шахмал | үйлдэл.
          `MainLayout`-ийн `Navbar` энд ХЭРЭГЛЭГДЭХГҮЙ — нүүр хуудас нь
          зөвхөн өөр дээрээ гүйлгэдэг тусдаа цэстэй (`NAV_SECTIONS`). */}
      <nav className="sticky top-0 z-50 border-b border-mufi-line bg-mufi-bg/80 backdrop-blur-xl">
        <div className="container-page">
          <div className="flex h-[4.5rem] items-center justify-between gap-6">
            <button
              onClick={() => scrollToSection(null)}
              className="flex items-center gap-3 text-xl font-semibold tracking-tight text-white"
            >
              {/* Загварын жижиг тэмдгүүд нь ягаан градиент дээр цайвар
                  дүрстэй — цул дүүргэлт биш. */}
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-mufi-accent to-mufi-accent-deep shadow-[0_0_20px_rgba(150,80,240,0.45)]">
                <Icons.Briefcase size={17} className="text-white" />
              </span>
              Mongol<span className="font-normal text-mufi-dim">Job</span>
            </button>

            <div className="mufi-pill-nav hidden lg:flex">
              {NAV_SECTIONS.map(item => (
                <button key={item.label} onClick={() => scrollToSection(item.id)} className="mufi-pill-link">
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="mufi-nav-link hidden sm:block">
                Нэвтрэх
              </Link>
              {/* Загварын үндсэн товч: ЦАЙВАР шахмал дээр бараан текст. */}
              <Link
                to="/register"
                className="rounded-full bg-mufi-light px-6 py-2.5 text-sm font-bold text-mufi-ink shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-colors hover:bg-white"
              >
                Эхлэх
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ====================
          Загварын нээлт: дээр нь тэмдэглэгээ-шахмал, доор нь хоёр өнгөөр
          хуваасан нимгэн гарчиг, доор нь нэг мөрийн хайлт ба шуурхай
          шүүлтүүрүүд. Ард нь ХОЁР эсрэг талын туяа — зүүнээс улбар шар,
          баруунаас ягаан (`mufi-glow-warm` / `mufi-glow-purple`). */}
      <header className="relative overflow-hidden px-4 pb-24 pt-14 text-center sm:px-6 sm:pb-28 sm:pt-20">
        {/* Туяанууд агуулгаас ӨРГӨН байх ёстой — эс бөгөөс ирмэг нь
            гарчгийн доор тод зураас болж харагдана. `max-w-*vw` нь
            жижиг дэлгэцэнд хэвтээ халилт үүсгэхээс сэргийлнэ. */}
        <div
          className="mufi-glow mufi-glow-purple left-1/2 top-[-14rem] h-[46rem] w-[70rem] max-w-[150vw] -translate-x-1/2"
          aria-hidden="true"
        />
        <div
          className="mufi-glow mufi-glow-warm left-[-22rem] top-[-4rem] h-[42rem] w-[42rem] max-w-[110vw]"
          aria-hidden="true"
        />
        <div
          className="mufi-glow mufi-glow-purple right-[-22rem] top-[-6rem] h-[44rem] w-[44rem] max-w-[110vw]"
          aria-hidden="true"
        />
        {/* Загварын цэгэн торлол — гарчгийн дээгүүр сүүдэрлэнэ. */}
        <div
          className="mufi-dots left-1/2 top-2 h-24 w-[32rem] max-w-[90vw] -translate-x-1/2 opacity-50"
          aria-hidden="true"
        />

        {/* Загварын тэмдэглэгээ-шахмал: жижиг ромб + нэг үг. */}
        <div className="relative inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-[#1C102A]/70 px-4 py-2 shadow-[0_0_40px_rgba(150,80,230,0.25)] animate-fade-up">
          <span className="h-2 w-2 rotate-45 rounded-[1px] bg-gradient-to-br from-white to-mufi-accent" />
          <span className="text-xs font-semibold tracking-wide text-mufi-fg">Оюутны цагийн ажил</span>
        </div>

        {/* Загварын гарчиг нь нэг өгүүлбэрийг ХОЁР ТОДРОЛООР хуваадаг:
            гол үг нь тод цагаан, үлдсэн нь бүдэг. Ингэснээр том хэмжээтэй
            мөртлөө чанга биш харагдана. */}
        <h1
          className="relative m-0 mx-auto mt-8 max-w-4xl text-[clamp(2.5rem,7.4vw,5.2rem)] font-medium leading-[1.06] tracking-[-0.035em] animate-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          <span className="text-mufi-fg/40">Дараагийн</span>
          <span className="text-white"> ажлаа өнөөдөр</span>
          <br />
          <span className="text-mufi-fg/60">олъё</span>
        </h1>

        <p
          className="relative mx-auto mt-7 max-w-xl text-[0.95rem] font-normal leading-relaxed text-mufi-muted animate-fade-up sm:text-base"
          style={{ animationDelay: '120ms' }}
        >
          Монгол дахь цагийн ажилчид, оюутнуудыг ажил олгогчтой холбоно.
          Цагтаа тохирсон ээлжээ ол, эсвэл минутын дотор ажилтнаа ол.
        </p>

        <form
          onSubmit={handleSearch}
          className="relative mx-auto mt-10 flex w-full max-w-[54rem] items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] p-2.5 pl-5 backdrop-blur-xl animate-fade-up sm:pl-7"
          style={{ animationDelay: '180ms' }}
        >
          <Icons.Search size={19} className="hidden flex-none text-mufi-dim sm:block" />
          <label htmlFor="hero-search" className="sr-only">Ажлын хайлт</label>
          <input
            id="hero-search"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Бариста, хүргэлт, хувийн багш…"
            className="min-w-0 flex-1 bg-transparent text-base font-normal text-white outline-none placeholder:text-mufi-dim"
          />
          {/* Загварын hero товч: ягаан туяатай бараан шахмал. */}
          <button
            type="submit"
            aria-label="Ажил хайх"
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/20 bg-gradient-to-b from-[#2E1A44] to-[#160C22] text-white shadow-[0_0_50px_rgba(160,74,255,0.55),inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors hover:from-mufi-accent-deep hover:to-mufi-accent-deep"
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
              className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-mufi-muted transition-colors hover:border-mufi-accent/60 hover:text-white"
            >
              {chip}
            </Link>
          ))}
        </div>
      </header>

      {/* ==================== ХОЁР ДҮРИЙН КАРТ ====================
          Бараан суурь + hero-гийн туяа, гэрэлтэх хүрээ, курсорыг дагах
          гэрэл (`SpotlightCard`). Mascot нь картын ЁРООЛД наалдана —
          тиймээс агуулгын бүрхүүл нь `items-end`, доод padding нь 0. */}
      <section className="container-page pb-24 pt-8 sm:pb-28 sm:pt-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {ROLE_CARDS.map((card, i) => (
            <Reveal key={card.tag} delay={i * 90} className="h-full">
              <SpotlightCard
                glow={card.spot}
                // Ангиллын жижиг карт (14°) шиг налгавал энэ өргөн карт
                // хэт «эргэлдэж» харагдана — хагасаар нь багасгав.
                tilt={7}
                style={card.vars}
                className="mufi-role-card h-full rounded-[1.75rem]"
                contentClassName="flex h-full min-h-[16rem] items-end gap-3 p-7 pb-0 sm:gap-4 sm:p-11 sm:pb-0"
              >
                <div className="min-w-0 flex-1 pb-8 sm:pb-10">
                  <div className={`text-xs font-bold tracking-[0.14em] ${card.eyebrow}`}>{card.tag}</div>
                  <h3 className="m-0 mt-4 text-[1.4rem] font-bold leading-[1.15] tracking-[-0.02em] text-mufi-fg sm:text-[1.85rem]">
                    {card.title}
                  </h3>
                  <p className="m-0 mt-3.5 text-sm font-normal leading-relaxed text-mufi-muted">{card.desc}</p>
                  <Link
                    to={card.to}
                    className={`mt-6 inline-block whitespace-nowrap rounded-full px-6 py-3 text-sm font-bold text-white transition-colors ${card.btn}`}
                  >
                    {card.cta}
                  </Link>
                </div>
                {/* Тунгалаг PNG тул бараан картан дээр цагаан хайрцаг
                    үүсгэхгүй. Мэдээллийн ачаалалгүй чимэглэл учир
                    `alt=""` — дэлгэц уншигч алгасана. */}
                <img
                  src={card.img}
                  alt=""
                  className="w-24 flex-none self-end object-contain object-bottom sm:w-36 lg:w-44"
                />
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ==================== АНГИЛЛУУД ==================== */}
      <section id="popular-jobs" className="container-page scroll-mt-24 pb-24 text-center sm:pb-28">
        <Reveal className="flex flex-col items-center gap-4">
          <div className="mufi-eyebrow">Ангиллаар</div>
          <SplitHeading className="mx-auto max-w-3xl text-[clamp(1.9rem,4.4vw,2.9rem)] font-medium leading-[1.14] tracking-[-0.03em] text-mufi-fg">
            Алдартай цагийн ажил
          </SplitHeading>
          <div className="mufi-rule" aria-hidden="true" />
          <p className="mx-auto max-w-2xl text-[0.95rem] font-normal leading-relaxed text-mufi-muted">
            Монгол дахь хамгийн эрэлттэй цагийн ажлуудыг ангиллаар нь үзээрэй.
            Ангилал дээр дарвал шүүсэн жагсаалт руу шилжинэ.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => (
            <Reveal key={category.title} delay={i * 60} className="h-full">
              <SpotlightCard
                glow={TONES[category.tone].glow}
                className={`mufi-card flex h-full min-h-[13rem] cursor-pointer flex-col justify-between transition-colors ${TONES[category.tone].hover}`}
                onClick={() => navigate(`/jobs?q=${encodeURIComponent(category.title)}`)}
              >
                <div>
                  <div className={`mb-5 flex h-[2.6rem] w-[2.6rem] items-center justify-center rounded-xl border transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-3 ${TONES[category.tone].tile}`}>
                    {category.icon}
                  </div>
                  <div className="text-[1.18rem] font-semibold leading-snug tracking-tight text-mufi-fg">{category.title}</div>
                  <div className="mt-2 text-sm font-normal text-mufi-muted">{category.desc}</div>
                </div>
                <div className="mt-6 text-[0.82rem] font-normal text-mufi-dim">{category.level}</div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        <Link to="/jobs" className="mufi-btn mufi-btn-accent mt-12">
          Бүх ажлыг үзэх
        </Link>
      </section>

      {/* ==================== ТОМ МЭДЭГДЭЛ ====================
          Загварын дундах ганц өгүүлбэрийн хэсэг — хэмнэл тасалж,
          дараагийн блокт бэлддэг. */}
      <section className="container-page pb-24 text-center sm:pb-28">
        <Reveal>
          <h2 className="m-0 mx-auto max-w-3xl text-[clamp(1.75rem,3.7vw,2.65rem)] font-medium leading-[1.22] tracking-[-0.03em] text-balance text-mufi-fg">
            Оюутны цагийн ажлын Монгол дахь хамгийн энгийн зам
          </h2>
        </Reveal>
      </section>

      {/* ==================== БОЛОМЖУУД ====================
          Загварын Features хэсэг. Тор нь ЗОРИУД тэгш бус: эхний мөрөнд
          зүүн карт өргөн, хоёрдугаар мөрөнд баруун нь өргөн. Ингэснээр
          дөрвөн ижил хайрцаг байхаас илүү хэмнэлтэй болж, өргөн карт
          бүр нь тухайн мөрийн гол мессежийг үүрнэ.

          Жижиг дэлгэцэнд нэг багана болж, тэгш бус байдал арилна. */}
      <section className="container-page pb-24 sm:pb-28">
        <Reveal className="flex flex-col items-center gap-4 text-center">
          <div className="mufi-eyebrow">Боломжууд</div>
          <SplitHeading className="mx-auto max-w-3xl text-[clamp(1.9rem,4.4vw,2.9rem)] font-medium leading-[1.14] tracking-[-0.03em] text-mufi-fg">
            Ажил хайхыг хөнгөвчлөх зүйлс
          </SplitHeading>
          <div className="mufi-rule" aria-hidden="true" />
          <p className="mx-auto max-w-xl text-[0.95rem] font-normal leading-relaxed text-mufi-muted">
            Зар үзэхээс цалингаа авах хүртэлх зам дээрх жижиг сааднуудыг
            платформ өөрөө үүрнэ.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {FEATURES.slice(0, 2).map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} delay={i * 90} />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          {FEATURES.slice(2).map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} delay={i * 90} />
          ))}
        </div>
      </section>

      {/* ==================== СТАТИСТИК ==================== */}
      <section id="stats" className="container-page scroll-mt-24 pb-24 sm:pb-28">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
          <div className="mufi-eyebrow">Мэдээлэл ба үзүүлэлт</div>
          <SplitHeading className="text-[clamp(1.9rem,4.4vw,2.9rem)] font-medium leading-[1.14] tracking-[-0.03em] text-mufi-fg">
            Монголын оюутны ажлын зах зээл
          </SplitHeading>
          <div className="mufi-rule mufi-rule-left" aria-hidden="true" />
          <p className="text-[0.95rem] font-normal leading-relaxed text-mufi-muted">
            Платформын тоо нь Монгол оюутан, залуу мэргэжилтнүүдийн цагийн ажилд
            хэр идэвхтэй хүрч байгааг харуулна.
          </p>
        </Reveal>

        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 70} className="h-full">
              <SpotlightCard glow={TONES[stat.tone].glow} className="mufi-card h-full">
                <StatCounter
                  value={stat.value}
                  className={`mb-3 block text-[2.5rem] font-semibold leading-none tracking-[-0.03em] transition-transform duration-300 ease-spring group-hover:scale-105 ${
                    stat.tone === 'warm' ? 'text-mufi-warm' : 'text-mufi-accent'
                  }`}
                />
                <div className="mb-2 font-semibold text-mufi-fg">{stat.label}</div>
                <div className="text-sm font-normal text-mufi-muted">{stat.desc}</div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* Графикууд. Загварын hero доорх «бүтээгдэхүүний карт» нь ГАДНА
            ирмэгээрээ өнгө ялгаруулж, доогуураа туяа тавьдаг — тэр хэлбэрийг
            дагав: ягаанаас улбар шар руу шилжих хүрээ, дотор нь агуулга. */}
        <div className="rounded-[2rem] bg-[linear-gradient(150deg,#6D33C9,#A8410A)] p-1.5 shadow-[0_0_90px_rgba(150,70,235,0.20)] sm:p-2">
          <div className="grid gap-10 rounded-[1.65rem] bg-mufi-card p-7 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="m-0 mb-2 text-xl font-semibold tracking-tight text-mufi-fg">
                Хамгийн эрэлттэй ажлын ангилал
              </h3>
              <p className="m-0 mb-8 text-sm font-normal text-mufi-muted">
                2025 онд ангиллаар цагийн ажлын зарлалын түгээлт
              </p>

              <div className="space-y-5">
                {demandData.map((item, i) => (
                  <div key={item.category}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold text-mufi-fg">{item.category}</span>
                      <StatCounter value={`${item.percent}%`} className="font-bold text-mufi-accent" />
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

            <div className="mufi-inset p-6">
              <div className="mb-6 flex items-center gap-2">
                <Icons.TrendingUp className="text-mufi-warm" size={20} />
                <h4 className="m-0 text-base font-semibold text-mufi-fg">Өсөлтийн урсгал: ажлын зарлал</h4>
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
                        className="w-full origin-bottom rounded-t-lg bg-gradient-to-t from-mufi-accent-deep/30 via-mufi-accent/80 to-mufi-warm"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-mufi-dim">
                      {['1-р', '2-р', '3-р', '4-р', '5-р', '6-р', '7-р'][i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm font-medium text-mufi-muted">Нийт өсөлт</span>
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
          <h2 className="m-0 max-w-lg text-[clamp(1.75rem,3.7vw,2.4rem)] font-medium leading-[1.18] tracking-[-0.03em] text-mufi-fg">
            Ажил хайгчдад үргэлж үнэгүй
          </h2>
          <p className="m-0 max-w-xs text-sm font-normal leading-relaxed text-mufi-muted">
            Цалин платформоор дамжихгүй — ажил олгогч ажилтандаа ШУУД төлнө.
            Дэлгэрэнгүйг үйлчилгээний нөхцөлөөс уншина уу.
          </p>
        </Reveal>

        <div className="mt-11 grid gap-5 md:grid-cols-2">
          {PRICING.map((plan, i) => (
            <Reveal key={plan.tag} delay={i * 90} className="h-full">
              {/* Онцлох карт нь загварын УЛБАР ШАР картын дүр — цул
                  дүүргэлт биш, доошоо бараандах градиент + туяа. */}
              <div
                className={`flex h-full flex-col rounded-3xl p-8 ${
                  plan.featured
                    ? 'border border-mufi-warm/40 bg-[linear-gradient(158deg,#3A1A08,#1F1310)] text-white shadow-[0_0_70px_rgba(255,110,30,0.16)]'
                    : 'mufi-card'
                }`}
              >
                <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${plan.featured ? 'text-mufi-warm' : 'text-mufi-dim'}`}>
                  {plan.tag}
                </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-2">
                  <span className="text-[2.4rem] font-semibold leading-none tracking-[-0.03em] text-mufi-fg">
                    {plan.price}
                  </span>
                  {plan.unit && (
                    <span className={`text-sm font-normal ${plan.featured ? 'text-mufi-flame-soft' : 'text-mufi-muted'}`}>
                      {plan.unit}
                    </span>
                  )}
                </div>
                <p className={`m-0 mt-4 text-sm font-normal ${plan.featured ? 'text-mufi-flame-soft' : 'text-mufi-muted'}`}>
                  {plan.note}
                </p>

                <ul className="m-0 mt-7 flex list-none flex-col gap-3 p-0 text-sm font-normal">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2.5 text-mufi-fg">
                      <Icons.Check size={16} className={`mt-0.5 flex-none ${plan.featured ? 'text-mufi-warm' : 'text-mufi-accent'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* `mt-auto` нь товчийг картын ЁРООЛД түлхэнэ — жагсаалтын
                    урт нь хоёр картад ялгаатай байсан ч товчнууд эгнэнэ. */}
                <Link
                  to={plan.to}
                  className={`mt-auto block rounded-full px-6 py-3.5 text-center text-sm font-bold transition-colors ${
                    plan.featured
                      ? 'bg-gradient-to-r from-[#FF9D4A] to-[#EF5F16] text-mufi-warm-ink hover:from-white hover:to-white hover:text-mufi-ink'
                      : 'bg-mufi-light text-mufi-ink hover:bg-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ==================== ТҮГЭЭМЭЛ АСУУЛТ ====================
          Загварын FAQ: зүүн талд гарчиг, баруун талд задардаг жагсаалт.
          Харьцаа нь ЗОРИУД тэнцүү биш (0.85 : 1.15) — асуултууд илүү
          өргөн зайтай байх ёстой. */}
      <section className="container-page pb-24 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal className="flex flex-col gap-5">
            <div className="mufi-eyebrow">Түгээмэл асуулт</div>
            <h2 className="m-0 text-[clamp(1.75rem,3.7vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.03em] text-mufi-fg">
              Асуухаас өмнөх хариултууд
            </h2>
            <div className="mufi-rule mufi-rule-left" aria-hidden="true" />
            <p className="m-0 text-[0.95rem] font-normal leading-relaxed text-mufi-muted">
              Хариултаа олсонгүй юу? Доорх холбоо барих хэсгээр бичвэл манай
              баг тодруулж өгнө.
            </p>
          </Reveal>

          <div className="flex flex-col gap-3">
            {FAQS.map((item, i) => (
              <Reveal key={item.q} delay={i * 70}>
                <FaqRow
                  item={item}
                  index={i}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(prev => (prev === i ? null : i))}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ТОМ УРИАЛГА ====================
          Загварын хаалтын самбар: ягаанаас улбар шар руу шилжих бараан
          градиент, дотор нь хоёр өнцөгт нуугдсан туяа. */}
      <section className="container-page pb-24 sm:pb-28">
        <Reveal className="relative grid items-center gap-10 overflow-hidden rounded-[2rem] border border-mufi-accent/40 bg-[linear-gradient(120deg,#2A1450_0%,#1B1030_55%,#2B1610_100%)] px-8 py-12 shadow-[0_0_120px_rgba(150,70,235,0.22)] sm:px-14 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
          {/* ⚠ Боломжийн картуудын адил ХАГАС хүчээр. Бүтэн хүчээр өгвөл
              зүүн доод туяа тайлбар текстийн ард орж, дэвсгэрийг #5B288D
              хүртэл цайруулж 3.61:1 болгоно. Хагасаар бол 4.68:1 үлдэнэ —
              ингэснээр тайлбарыг тодруулж, гарчигтай нэг жин болгохоос
              зайлсхийв. */}
          <div
            className="mufi-glow mufi-glow-purple bottom-[-14rem] left-[-8rem] h-[32rem] w-[32rem] opacity-50"
            aria-hidden="true"
          />
          <div
            className="mufi-glow mufi-glow-warm right-[-6rem] top-[-12rem] h-[28rem] w-[28rem] opacity-50"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-5">
            <h2 className="m-0 max-w-lg text-[clamp(1.7rem,3.4vw,2.5rem)] font-medium leading-[1.2] tracking-[-0.03em] text-mufi-fg">
              Профайлаа үүсгээд өнөөдрөөс ээлжээ хай.
            </h2>
            <p className="m-0 max-w-md text-[0.95rem] font-normal leading-relaxed text-balance text-mufi-muted">
              Бүртгэл үүсгэхэд хэдхэн минут. Хичээлийнхээ хуваарийг оруулмагц
              түүнд тохирох ээлжүүд шүүгдэж эхэлнэ.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3.5">
              <Link
                to="/register"
                className="rounded-full bg-mufi-light px-8 py-4 text-sm font-bold text-mufi-ink shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-colors hover:bg-white"
              >
                Үнэгүй профайл үүсгэх
              </Link>
              {/* Загварын хоёр дахь товч «Talk to sales» байсан — энд
                  борлуулалтын баг байхгүй тул бодит зарын жагсаалт руу
                  заалаа. */}
              <Link
                to="/jobs"
                className="rounded-full border border-white/20 px-7 py-4 text-sm font-medium text-mufi-fg transition-colors hover:bg-white hover:text-mufi-ink"
              >
                Эхлээд ажлуудыг үзэх
              </Link>
            </div>
          </div>

          <div className="relative">
            <ArtWeek />
          </div>
        </Reveal>
      </section>

      {/* ==================== ХОЛБОО БАРИХ ==================== */}
      <section id="contact" className="container-page scroll-mt-24 pb-24 sm:pb-28">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
          <div className="mufi-eyebrow">Холбоо барих</div>
          <SplitHeading className="text-[clamp(1.9rem,4.4vw,2.9rem)] font-medium leading-[1.14] tracking-[-0.03em] text-mufi-fg">
            Бидэнтэй холбогдоорой
          </SplitHeading>
          <div className="mufi-rule mufi-rule-left" aria-hidden="true" />
          <p className="text-[0.95rem] font-normal leading-relaxed text-mufi-muted">
            Ажил зарлах эсвэл ажил олох талаар асуулт байна уу? Манай баг тусламж үзүүлэхэд бэлэн.
          </p>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <Reveal className="mufi-card">
              <h3 className="m-0 mb-6 text-lg font-semibold text-mufi-fg">Холбоо барих мэдээлэл</h3>

              <div className="space-y-6">
                {CONTACT_ROWS.map((row, i) => {
                  const Icon = Icons[row.icon]
                  return (
                    <Reveal key={row.label} delay={140 + i * 110} className="group flex items-start gap-4">
                      {/* Загварын дүрсний хайрцаг: ягаан градиент + туяа. */}
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mufi-accent to-mufi-accent-deep text-white shadow-[0_0_20px_rgba(150,80,240,0.45)] transition-transform duration-200 ease-spring group-hover:scale-110">
                        <Icon size={20} />
                      </span>
                      <div>
                        <div className="mb-1 text-sm font-semibold text-mufi-fg">{row.label}</div>
                        <div className="text-sm font-normal text-mufi-muted">{row.value}</div>
                      </div>
                    </Reveal>
                  )
                })}
              </div>
            </Reveal>

            <Reveal delay={160} className="mufi-card">
              <h3 className="m-0 mb-6 text-lg font-semibold text-mufi-fg">Дагах</h3>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="animate-pop-in press flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-mufi-muted transition-all hover-lift hover:border-mufi-accent/45 hover:text-white"
                    style={{ animationDelay: `${260 + i * 80}ms` }}
                  >
                    <Icons.Globe size={18} />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-3">
            <Reveal delay={120} className="mufi-card p-7 sm:p-9">
              {/* Талбарууд дараалан гарч ирнэ — `stagger` класс нь хүүхэд
                  бүрд nth-child-ээр саатал өгнө (index.css). */}
              <form className="stagger space-y-6">
                <div className="grid animate-fade-up gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mufi-label" htmlFor="contact-name">Бүтэн нэр</label>
                    <input id="contact-name" type="text" placeholder="Таны нэр" className="mufi-input" />
                  </div>
                  <div>
                    <label className="mufi-label" htmlFor="contact-email">И-мэйл</label>
                    <input id="contact-email" type="email" placeholder="ta@example.com" className="mufi-input" />
                  </div>
                </div>

                <div className="animate-fade-up">
                  <label className="mufi-label" htmlFor="contact-message">Мессеж</label>
                  <textarea
                    id="contact-message"
                    placeholder="Бид танд хэрхэн туслах вэ?"
                    rows={5}
                    className="mufi-input resize-none"
                  />
                </div>

                <button type="button" className="mufi-btn mufi-btn-accent animate-fade-up">
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
