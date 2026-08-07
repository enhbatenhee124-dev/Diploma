import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { roleHome } from '../utils/roleHome'

// ============================================================
// Google-ээр нэвтэрсний дараах буцах цэг
// ============================================================
// Өмнө нь Google нь хэрэглэгчийг ШУУД `/` руу буцаадаг байсан. Гэтэл
// нүүр хуудас нь нэвтэрсэн эсэхийг мэддэггүй тул "Нэвтрэх" товч хэвээр
// харагдаж, хэрэглэгч нэвтэрсэн атлаа нэвтрээгүй мэт бодож дахин дарж
// төгсгөлгүй давтдаг байв.
//
// Энэ хуудас нь сешн уншигдаж дуустал хүлээгээд, дараа нь дүрд нь
// тохирсон хянах самбар руу аваачна — энгийн нэвтрэлттэй ЯГ ижил.
// Дүрээ хараахан сонгоогүй бол `/choose-role` руу (`roleHome` шийднэ).
//
// Вэб дээр Supabase энд шууд буцаана. Аппад `NativeBridge` нь deep
// link-ийн `code`-ыг сешн болгосны дараа энд аваачна — хоёр урсгал
// нэг л газарт нийлнэ.
// ============================================================

export default function AuthCallback() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // `loading` үед сешн хараахан уншигдаагүй байна — яарвал нэвтэрсэн
    // хэрэглэгчийг ч /login руу хаяна
    if (loading) return

    navigate(roleHome(user), { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      <p className="text-white/70 text-sm">Нэвтэрч байна...</p>
    </div>
  )
}
