import { createContext, useState, useCallback, useRef } from 'react'
import NotificationContainer from '../components/Notification'

export const NotificationContext = createContext(null)

// ============================================================
// Toast — түр зуурын дэлгэцийн мэдэгдэл
// ============================================================
// Энэ нь ЗӨВХӨН тухайн үйлдлийн шуурхай хариу ("Хадгаллаа", "Алдаа гарлаа").
// Хэдхэн секундын дараа алга болно.
//
// Тогтмол үлдэх мэдэгдлийг (хүсэлт зөвшөөрөгдсөн, төлбөр орсон г.м.)
// өгөгдлийн сан үүсгэж, хонхны дүрсээр харагдана — `useNotifications`.
//
// Хоёрыг хольж болохгүй: toast нь хуудас сэргээхэд алга болдог тул чухал
// мэдээллийг зөвхөн тэнд үлдээвэл хэрэглэгч хэзээ ч харахгүй (NFR-6).
// ============================================================

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  /**
   * @param {{message: string, description?: string, type?: 'success'|'error'|'info', duration?: number}} input
   */
  const notify = useCallback(({ message, description, type = 'info', duration = 5000 }) => {
    const id = ++nextId.current
    setToasts(prev => [...prev, { id, message, description, type, duration }])
    return id
  }, [])

  return (
    <NotificationContext.Provider value={{ notify, dismiss, toasts }}>
      {children}
      <NotificationContainer toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  )
}
