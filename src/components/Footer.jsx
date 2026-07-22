import { Link } from 'react-router-dom'
import { Briefcase, Github, Twitter, Linkedin, Mail } from 'lucide-react'

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
            <p className="text-sm text-gray-400 mb-4">Чадвартай хүнийг боломжтой холбогдох. Таны мөрөөдлийн ажлыг олоорой эсвэл хамгийн сайн чадвартай ажилтныг тээвэрлээрой.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Ажил хайгчдад</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs" className="hover:text-white transition-colors">Ажлуудыг үзэх</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Бүртгэл үүсгэх</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Ажлын анхааруулга</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Мэргэжлийн нөөц</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Ажил олгогчдод</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Ажил зарлах</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Резюме хайх</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Үнийн цэс</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Энтерпрайз</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Компани</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Бидний тухай</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Холбоо барих</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Нууцлалын Үндэслэл</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Үйлчилгээний Нөхцөл</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 МонголАжил. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            <span>support@mongoljob.mn</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
