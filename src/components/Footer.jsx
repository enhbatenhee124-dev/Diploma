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

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">МонголАжил</span>
            </Link>
            <p className="text-sm text-gray-400">
              Цагийн ажил хайгчдыг ажил олгогчтой холбоно. Хичээлийнхээ
              хуваарьт тохирсон ээлжээ олоорой.
            </p>
          </div>

          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2 text-sm">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 МонголАжил. Бүх эрх хуулиар хамгаалагдсан.</p>
          <a
            href="mailto:support@mongoljob.mn"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@mongoljob.mn
          </a>
        </div>
      </div>
    </footer>
  )
}
