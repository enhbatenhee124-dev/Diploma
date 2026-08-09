import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { PageTransition } from '../components/Motion'

// ============================================================
// Нийтийн хуудсуудын хүрээ (Chadal сэдэв)
// ============================================================
// Гадна нь нүүр хуудастай ижил бараан суурь (`.chadal-page`).
//
// Halo (цайвар) үед агуулгыг тусгайлан БАРААН самбар дотор ороодог
// байсан: энэ хүрээгээр гарч ирдэг `/jobs`, `/jobs/:id` хуудсууд нь
// ажилтны хянах самбартай ХУВААЛЦАГДДАГ компонент бөгөөд `emp-*`
// классуудыг (цагаан текст, бараан карт) хэрэглэдэг тул цайвар дэвсгэр
// дээр шууд тавибал текст нь алга болдог байв.
//
// Одоо хуудас өөрөө бараан тул тэр ороолт ШААРДЛАГАГҮЙ — авсан.
// `emp-*` картууд (#1A1433) нь #070C15 суурин дээр шууд суух бөгөөд
// давхар карт үүсэхгүй.
// ============================================================

export default function MainLayout() {
  return (
    <div className="chadal-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="container-page">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
      <Footer />
    </div>
  )
}
