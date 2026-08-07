import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import NotificationBell from './NotificationBell'

// ------------------------------
// Эвхэгддэг хажуугийн цэс
// ------------------------------
// Хэвийн үед нарийн зурвас (зөвхөн дүрс), баруун ирмэг нь бөөрөнхий —
// зүүн хүрээнд наалдсан хагас дугуй хэлбэртэй. Хулгана хүрэхэд өргөсч
// бүх цэсний нэр гарч ирнэ.
//
// Өргөсөх үед хуудасны агуулга үсрэхээс сэргийлж: нарийн зурвас нь урсгалд
// байр эзэлж (w-20), дэлгэгдсэн хэсэг нь агуулгын ДЭЭГҮҮР хөвж гарна.
// ------------------------------

const THEMES = {
  emp: {
    surface: 'bg-emp-card border-emp-border',
    idle: 'text-white hover:bg-emp-card-hover',
    active: 'bg-emp-accent/20 text-white border border-emp-accent/35',
    logoBox: 'bg-white/10 text-white',
    logoIcon: 'text-white',
    caption: 'text-emp-muted',
  },
  wrk: {
    surface: 'bg-wrk-card border-wrk-border',
    idle: 'text-white hover:bg-wrk-card-hover',
    active: 'bg-wrk-accent/20 text-white border border-wrk-accent/35',
    logoBox: 'bg-white/10 text-white',
    logoIcon: 'text-white',
    caption: 'text-wrk-muted',
  },
  adm: {
    surface: 'bg-adm-card border-adm-border',
    idle: 'text-white hover:bg-adm-card-hover',
    active: 'bg-adm-accent/20 text-white border border-adm-accent/35',
    logoBox: 'bg-white/10 text-white',
    logoIcon: 'text-white',
    caption: 'text-adm-muted',
  },
}

// Дүрсний багана — эвхэгдсэн зурвасны өргөнтэй яг таарна (w-20 = 5rem)
const ICON_COL = 'w-20 flex-shrink-0 flex items-center justify-center'

export default function RailSidebar({ theme = 'emp', items, brand, caption, logoIcon: LogoIcon, onLogout }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Дэлгэгдсэн эсэхийг CSS :hover-т бус state-д найдаж хянана.
  // Ингэснээр гарын Tab товчоор шилжихэд ч цэс нээгдэнэ (hover-only бол
  // хулганагүй хэрэглэгч цэсний нэрийг хэзээ ч харахгүй).
  const [expanded, setExpanded] = useState(false)
  const t = THEMES[theme] || THEMES.emp

  /**
   * Нэрийн харагдац.
   * rail = true үед анхдагчаар нуугдаж, эцэг .group дээр хулгана хүрэхэд гарна.
   */
  // `inline-block` нь transform ажиллуулахад ЗААВАЛ хэрэгтэй — жирийн inline
  // элементэд `translate-x` огт нөлөөлдөггүй.
  const labelClass = rail =>
    `inline-block whitespace-nowrap transition-all duration-300 ease-smooth ${
      !rail || expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
    }`

  const Body = ({ rail }) => (
    <>
      {/* Лого */}
      <Link
        to="/"
        onClick={() => setMobileOpen(false)}
        className="flex items-center h-20 flex-shrink-0"
      >
        <span className={ICON_COL}>
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.logoBox}`}>
            <LogoIcon className="w-5 h-5" />
          </span>
        </span>
        <span className={labelClass(rail)}>
          <span className="block text-base font-bold text-white leading-tight">{brand}</span>
          <span className={`block text-xs ${t.caption}`}>{caption}</span>
        </span>
      </Link>

      {/* Цэс */}
      <nav className="flex-1 pr-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {items.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={rail ? item.label : undefined}
              className={`group relative flex items-center h-12 rounded-r-xl text-sm font-medium
                          transition-colors duration-200
                          ${isActive ? t.active : t.idle}`}
            >
              {/* Идэвхтэй хуудсыг зүүн ирмэг дэх зурвасаар тэмдэглэнэ. Өндөр нь
                  0-ээс ургаж гардаг тул нүд шинэ байрлал руу дагаж шилжинэ. */}
              <span
                className={`absolute left-0 w-1 rounded-r-full bg-current
                            transition-all duration-300 ease-smooth
                            ${isActive ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}
              />
              <span className={ICON_COL}>
                {/* Дүрс нь хулгана хүрэхэд бага зэрэг томорно — эвхэгдсэн
                    зурвасанд нэр харагдахгүй үед ганц эргэх холбоо болно. */}
                <Icon className="w-5 h-5 transition-transform duration-200 ease-spring group-hover:scale-110" />
              </span>
              <span className={labelClass(rail)}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Мэдэгдэл + Гарах */}
      <div className="pr-3 pb-4 pt-2 flex-shrink-0 border-t border-white/5">
        <NotificationBell
          rail={rail}
          iconCol={ICON_COL}
          labelClass={labelClass(rail)}
          idleClass={t.idle}
        />
        <button
          onClick={onLogout}
          title={rail ? 'Гарах' : undefined}
          className={`group flex items-center h-12 w-full rounded-r-xl text-sm font-medium transition-colors ${t.idle}`}
        >
          <span className={ICON_COL}>
            {/* Гарах сум нь хаалганаас гарах чиглэлд бага зэрэг хөдөлнө */}
            <LogOut className="w-5 h-5 transition-transform duration-200 ease-spring group-hover:translate-x-0.5" />
          </span>
          <span className={labelClass(rail)}>Гарах</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ---------- Дэлгэц том: хулганаар дэлгэгддэг зурвас ---------- */}
      {/* Урсгалд 80px зай эзэлнэ — доорх зурвас нь fixed тул агуулга үсрэхгүй */}
      <div className="hidden lg:block w-20 flex-shrink-0" aria-hidden="true" />

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocusCapture={() => setExpanded(true)}
        onBlurCapture={e => {
          // Фокус зурвасны ГАДНА гарсан үед л хумина
          if (!e.currentTarget.contains(e.relatedTarget)) setExpanded(false)
        }}
        style={{ width: expanded ? '16rem' : '5rem' }}
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col
                    border-r ${t.surface}
                    overflow-hidden
                    transition-all duration-300 ease-out
                    ${expanded
                      ? 'rounded-r-3xl shadow-2xl shadow-black/60'
                      : 'rounded-r-[2.75rem]'}`}
      >
        <Body rail />
      </aside>

      {/* ---------- Гар утас: дарж нээнэ ---------- */}
      <div className={`lg:hidden border-b ${t.surface}`}>
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon className={`w-5 h-5 ${t.logoIcon}`} />
            <span className="font-bold text-white">{brand}</span>
          </Link>
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Цэс хаах' : 'Цэс нээх'}
            aria-expanded={mobileOpen}
            className={`p-2 rounded-lg press transition-colors ${t.idle}`}
          >
            {/* Хоёр дүрсийг сольж, эргүүлэн гарган ирснээр «нээх ↔ хаах» нь
                нэг товч гэдэг нь мэдрэгдэнэ. */}
            {mobileOpen
              ? <X className="w-5 h-5 animate-scale-in" />
              : <Menu className="w-5 h-5 animate-scale-in" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="pb-3 flex flex-col animate-slide-up">
            <Body rail={false} />
          </div>
        )}
      </div>
    </>
  )
}
