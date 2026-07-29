import { createContext, useState, useCallback, useRef } from 'react'
import NotificationContainer from '../components/Notification'
import { pushNotification } from '../utils/storage'

export const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  /**
   * Дэлгэц дээр toast гаргаж, мэдэгдлийн түүхэд бичнэ.
   * @param {{message: string, description?: string, type?: 'success'|'error'|'info', duration?: number, userId?: string}} input
   */
  const notify = useCallback(({ message, description, type = 'info', duration = 5000, userId }) => {
    const id = ++nextId.current
    setToasts(prev => [...prev, { id, message, description, type, duration }])

    // Түүхэнд үлдээх — хэрэглэгч дараа нь буцаж харах боломжтой.
    pushNotification({
      id: `n-${Date.now()}-${id}`,
      userId: userId ?? null,
      message,
      description,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
    })

    return id
  }, [])

  return (
    <NotificationContext.Provider value={{ notify, dismiss, toasts }}>
      {children}
      <NotificationContainer toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  )
}
