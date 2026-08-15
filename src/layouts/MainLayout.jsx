import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Loading } from '../components/States'
import { PageTransition } from '../components/Motion'

// ============================================================
// Нийтийн хуудсуудын хүрээ (Mufi сэдэв)
// ============================================================
// Гадна нь нүүр хуудастай ижил бараан суурь (`.mufi-page`).
//
// Энэ хүрээгээр гарч ирдэг `/jobs`, `/jobs/:id` хуудсууд нь ажилтны
// хянах самбартай ХУВААЛЦАГДДАГ компонент бөгөөд `emp-*` классуудыг
// (цагаан текст, бараан карт) хэрэглэдэг. Нийтийн сэдэв нь БАРААН тул
// тэдгээрийг тусгайлан ороох ШААРДЛАГАГҮЙ — `emp-*` картууд (#1A1433)
// нь Mufi-гийн #0A0611 суурин дээр шууд суух бөгөөд давхар карт
// үүсэхгүй. (Энэ нь Chadal-аас шилжихэд ч хэвээр үлдсэн: хоёулаа
// бараан ягаан/цэнхэр суурьтай.)
// ============================================================

export default function MainLayout() {
  return (
    <div className="mufi-page flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="container-page">
          {/* Хуудсын чанк татагдах зуур ЗӨВХӨН энэ хэсэг хий үзэгдэл
              болно — Navbar, Footer байрандаа үлдэнэ. Үүнгүй бол App-ийн
              дээд түвшний Suspense барьж, бүтэн дэлгэц эргэлдэх дугуй
              болдог байв. */}
          <Suspense fallback={<Loading />}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
