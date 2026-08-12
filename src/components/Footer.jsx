import { Link } from 'react-router-dom'
import { Briefcase, Mail } from 'lucide-react'

// ============================================================
// Хөл хэсэг
// ============================================================
// Өмнө нь 13 холбоос `href="#"` байсан — дарахад юу ч болдоггүй байв.
// Одоо ЗӨВХӨН бодит хаягтай холбоосыг үлдээв.
//
// Байхгүй хуудас руу заасан холбоос харуулахаас огт харуулахгүй нь дээр:
// хэрэглэгч дарж үзээд хоосон гарвал платформд итгэхээ болино. Нийгмийн
// сүлжээний дүрсүүдийг мөн авав — данс байхгүй байсан.
// ============================================================

const SECTIONS = [
  {
    title: 'Ажил хайгчдад',
    links: [
      { to: '/jobs', label: 'Ажлуудыг үзэх' },
      { to: '/register', label: 'Бүртгэл үүсгэх' },
      { to: '/login', label: 'Нэвтрэх' },
    ],
  },
  {
    title: 'Ажил олгогчдод',
    links: [
      { to: '/register', label: 'Ажил олгогчоор бүртгүүлэх' },
      { to: '/login', label: 'Зар нийтлэх' },
      { to: '/terms#payments', label: 'Үнийн мэдээлэл' },
    ],
  },
  // Загварын гурав дахь багана «Legal». Урьд нь «Компани» нэртэй байсан ба
  // холбоо барихыг агуулдаг байв — тэрийг брэндийн блок дахь товч руу
  // зөөж, энэ баганыг зөвхөн эрх зүйн баримтад үлдээв.
  //
  // ⚠ Загварын хоёр дахь багана «Social Media» (Instagram / Facebook /
  //   Twitter) байсныг ОРУУЛААГҮЙ: платформд эдгээр данс байхгүй тул
  //   гурван холбоос нь дарахад хоосон гарна. Данс нээгдвэл энд нэмнэ.
  {
    title: 'Хууль эрх зүй',
    links: [
      { to: '/terms', label: 'Үйлчилгээний нөхцөл' },
      { to: '/terms#privacy', label: 'Нууцлалын бодлого' },
      { to: '/terms#payments', label: 'Төлбөрийн нөхцөл' },
    ],
  },
]

// Mufi сэдэв: хөл нь хуудасны суурин дээр шууд суух бөгөөд зөвхөн
// НИМГЭН дээд зураасаар тусгаарлагдана — загварын хөлтэй ижил.

export default function Footer() {
  return (
    <footer className="border-t border-mufi-line pb-8 pt-16">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-mufi-accent to-mufi-accent-deep shadow-[0_0_20px_rgba(150,80,240,0.45)]">
                <Briefcase className="h-4 w-4 text-white" />
              </span>
              <span className="text-xl font-semibold tracking-tight text-white">MongolJob</span>
            </Link>
            {/* Загварын хөл дээр логоны доор нимгэн зураас байдаг. */}
            <div className="mufi-rule mufi-rule-left mb-4" aria-hidden="true" />
            <p className="text-sm font-normal leading-relaxed text-mufi-muted">
              Цагийн ажил хайгчдыг ажил олгогчтой холбоно. Хичээлийнхээ
              хуваарьт тохирсон ээлжээ олоорой.
            </p>

            {/* ⚠ Загварт энд «Enter your email» + «Talk to Us» гэсэн и-мэйл
                цуглуулах талбар байсан. Репод и-мэйл илгээх backend БАЙХГҮЙ
                (server дээр mail модуль ч, EmailJS ч алга) тул тэр талбар
                бөглөөд дарахад юу ч болохгүй хоосон форм болно. Оронд нь
                доор аль хэдийн байгаа БОДИТ хаяг руу шууд заасан товч
                тавив. Backend нэмэгдвэл энд формоор солиж болно. */}
            {/* `py-3` нь санаатай: `py-2.5` үед товчны өндөр 42px болж,
                хүрэлтийн доод хэмжээ 44px-ээс дутдаг. */}
            <a
              href="mailto:support@mongoljob.mn"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-mufi-fg transition-colors hover:border-mufi-accent/45 hover:bg-white/10 hover:text-white"
            >
              <Mail className="h-4 w-4" />
              Бидэнтэй холбогдох
            </a>
          </div>

          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-mufi-dim">{section.title}</h3>
              <ul className="space-y-3 text-sm font-normal">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-mufi-fg transition-colors hover:text-mufi-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-mufi-line pt-8 md:flex-row">
          <p className="text-xs font-semibold text-mufi-dim">© 2026 MongolJob. Бүх эрх хуулиар хамгаалагдсан.</p>
          <a
            href="mailto:support@mongoljob.mn"
            className="flex items-center gap-2 text-xs font-semibold text-mufi-dim transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4" />
            support@mongoljob.mn
          </a>
        </div>
      </div>
    </footer>
  )
}
