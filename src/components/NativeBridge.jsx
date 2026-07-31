import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { supabase } from '../lib/supabase'
import { enablePush } from '../lib/push'
import { useAuth } from '../hooks/useAuth'
import { isNative, APP_SCHEME } from '../config/runtime'

// ============================================================
// Android бүрхүүлтэй холбогдох давхарга
// ============================================================
// Вэб дээр энэ компонент юу ч хийхгүй (`isNative === false`) — DOM-д ч
// гарахгүй. Зөвхөн апп доторх ЗАН ТӨЛӨВИЙГ нэмнэ:
//
//   1. Утасны БУЦАХ товч → хөтчийн түүхээр ухрах, эхэнд байвал аппаас гарах
//   2. `mn.ajil.app://` deep link → OAuth-ийн `code`-ыг сешн болгож солих
//   3. Splash дэлгэц → апп бэлэн болмогц нуух
//   4. Статус мөрийн өнгө → аппын бараан дэвсгэртэй тааруулах
//   5. Push мэдэгдэл → нэвтэрсэн хэрэглэгчийн токеныг бүртгэх
//
// Бүх listener нь `unmount`-д цэвэрлэгддэг — эс тэгвээс hot reload/StrictMode
// давхар бүртгэл үүсгэж, буцах товч нэг дарахад хоёр алхам ухарна.
// ============================================================

export default function NativeBridge() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!isNative) return

    // `addListener` нь Promise буцаадаг тул handle-уудыг цуглуулж, цэвэрлэхдээ
    // бүгдийг нь хүлээнэ.
    const pending = []
    let cancelled = false

    const register = (event, handler) => {
      pending.push(CapApp.addListener(event, handler))
    }

    // ------------------------------
    // 1. Утасны буцах товч
    // ------------------------------
    register('backButton', ({ canGoBack }) => {
      if (canGoBack) navigate(-1)
      else CapApp.exitApp()
    })

    // ------------------------------
    // 2. Deep link — OAuth-ийн буцах хаяг
    // ------------------------------
    register('appUrlOpen', async ({ url }) => {
      if (!url?.startsWith(`${APP_SCHEME}://`)) return

      // Custom Tab-ыг хааж, хэрэглэгчийг апп руугаа буцаана.
      await Browser.close().catch(() => {})

      // `mn.ajil.app://auth-callback?code=...` — custom scheme-ийг `URL` нь
      // задлаж чаддаг ч `searchParams` нь зарим Android хувилбарт хоосон
      // гардаг тул query хэсгийг гараар салгана.
      const query = url.split('?')[1] || ''
      const params = new URLSearchParams(query)

      const authError = params.get('error_description') || params.get('error')
      if (authError) {
        console.warn('[NativeBridge] OAuth алдаа:', authError)
        navigate('/login', { replace: true })
        return
      }

      const code = params.get('code')
      if (!code) return

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (cancelled) return

      if (error) {
        console.warn('[NativeBridge] Сешн үүсгэж чадсангүй:', error.message)
        navigate('/login', { replace: true })
        return
      }

      // AuthContext нь `onAuthStateChange`-ээр дүрийг уншиж, App.jsx-ийн
      // `*` маршрут хэрэглэгчийг дүрийнх нь нүүр рүү аваачна.
      navigate('/', { replace: true })
    })

    return () => {
      cancelled = true
      pending.forEach(p => p.then(handle => handle.remove()).catch(() => {}))
    }
  }, [navigate])

  // ------------------------------
  // 5. Push мэдэгдэл
  // ------------------------------
  // Хэрэглэгч нэвтэрсний ДАРАА л идэвхжинэ: токен бүртгэх хүсэлт нь
  // хэрэглэгчийн эрхээр явдаг. Гарах үед устгахыг `AuthContext.logout`
  // хариуцна — тэнд нэвтрэлт тасрахаас өмнө хийх боломжтой.
  useEffect(() => {
    if (!isNative || !user) return

    enablePush(() => {
      // Мэдэгдлийн төрөл бүрд тусдаа зам зурахгүй: төрлүүд нь өгөгдлийн
      // сангийн триггерүүдээс ирдэг тул шинэ төрөл нэмэгдэхэд энэ жагсаалт
      // чимээгүй хоцрох болно. Оронд нь хонх байрлах хянах самбар руу
      // аваачна — хэрэглэгч тэндээс бүх мэдэгдлээ хардаг.
      const home = {
        employee: '/employee/dashboard',
        employer: '/employer/dashboard',
        admin: '/admin/dashboard',
      }[user.role]

      if (home) navigate(home)
    })
  }, [user, navigate])

  // ------------------------------
  // 3–4. Splash ба статус мөр — нэг л удаа
  // ------------------------------
  useEffect(() => {
    if (!isNative) return

    // Бараан дэвсгэр дээр цагаан дүрс.
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    StatusBar.setBackgroundColor({ color: '#0f172a' }).catch(() => {})

    // `launchAutoHide: false` (capacitor.config.json) тул гараар нуухгүй бол
    // splash үүрд үлдэнэ. React ачаалагдсаны дараа нуух нь цагаан анивчилтыг
    // арилгана.
    SplashScreen.hide().catch(() => {})
  }, [])

  return null
}
