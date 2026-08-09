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
  {
    title: 'Компани',
    links: [
      { to: '/terms', label: 'Үйлчилгээний нөхцөл' },
      { to: '/terms#privacy', label: 'Нууцлалын бодлого' },
      { to: '/#contact', label: 'Холбоо барих' },
    ],
  },
]

// Chadal сэдэв: хөл нь хуудасны суурин дээр шууд суух бөгөөд зөвхөн
// НИМГЭН дээд зураасаар тусгаарлагдана — загварын хөлтэй ижил.

export default function Footer() {
  return (
    <footer className="border-t border-chadal-line pb-8 pt-16">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-chadal-accent">
                <Briefcase className="h-4 w-4 text-chadal-ink" />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-white">MongolJob</span>
            </Link>
            <p className="text-sm font-medium leading-relaxed text-chadal-muted">
              Цагийн ажил хайгчдыг ажил олгогчтой холбоно. Хичээлийнхээ
              хуваарьт тохирсон ээлжээ олоорой.
            </p>
          </div>

          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-chadal-dim">{section.title}</h3>
              <ul className="space-y-3 text-sm font-medium">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-chadal-fg transition-colors hover:text-chadal-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-chadal-line pt-8 md:flex-row">
          <p className="text-xs font-semibold text-chadal-dim">© 2026 MongolJob. Бүх эрх хуулиар хамгаалагдсан.</p>
          <a
            href="mailto:support@mongoljob.mn"
            className="flex items-center gap-2 text-xs font-semibold text-chadal-dim transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4" />
            support@mongoljob.mn
          </a>
        </div>
      </div>
    </footer>
  )
}
