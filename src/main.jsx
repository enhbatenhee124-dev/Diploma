import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import App from './App'
import NativeBridge from './components/NativeBridge'
import { isNative } from './config/runtime'
import { installCrashScreen, showCrash } from './lib/crashScreen'
import './index.css'

// Утсан дээр консол байхгүй тул алдааг дэлгэцэд гаргана. Бусад бүхнээс
// ӨМНӨ суулгана — эс тэгвээс доорх мөрүүд өөрсдөө унавал барих юм алга.
installCrashScreen()

// Android аппын аюулгүй зайн CSS-ийг идэвхжүүлнэ (index.css → `html.native`).
// Эхний зурагдалтаас ӨМНӨ хийх ёстой — эс тэгвээс контент нэг агшин статус
// мөрийн ард үсэрч харагдана.
if (isNative) document.documentElement.classList.add('native')

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        {/* NotificationProvider нь AuthProvider-с гадна байх ёстой —
            AuthContext нэвтрэх үед мэдэгдэл дуудна. */}
        <NotificationProvider>
          <AuthProvider>
            {/* Android бүрхүүлийн зан төлөв (буцах товч, deep link, splash).
                Вэб дээр юу ч хийхгүй. */}
            <NativeBridge />
            <App />
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    </StrictMode>
  )
} catch (err) {
  // React өөрөө эхлэхдээ унавал `window.onerror` хүртэл хүрэхгүй
  showCrash('Апп эхлүүлэхэд алдаа гарлаа', err)
  throw err
}
