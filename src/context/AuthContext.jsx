import { createContext, useState, useEffect, useCallback } from 'react'
import * as auth from '../services/authService'
import { isSupabaseConfigured } from '../lib/supabase'
import { useNotification } from '../hooks/useNotification'
import { disablePush } from '../lib/push'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { notify } = useNotification()

  // ------------------------------
  // Эхлэхэд сешн сэргээх + өөрчлөлт сонсох
  // ------------------------------
  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    auth.getCurrentUser().then(result => {
      if (!active) return
      if (result.ok) setUser(result.data)
      setLoading(false)
    })

    // Өөр таб дээр гарах/нэвтрэх, токен сэргээгдэх зэргийг барина
    const unsubscribe = auth.onAuthChange(async (event, session) => {
      if (!active) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        return
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const result = await auth.fetchProfile(session.user.id)
        if (active && result.ok) setUser(result.data)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const roleLabel = role =>
    ({ employee: 'ажил хайгч', employer: 'ажил олгогч', admin: 'админ' }[role] || role)

  /**
   * Нэвтрэх.
   * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
   */
  const login = useCallback(
    async (identifier, password, _role, method = 'phone') => {
      const result = await auth.signIn(identifier, password, method)

      if (!result.ok) {
        notify({ type: 'error', message: 'Нэвтэрч чадсангүй', description: result.error })
        return result
      }

      setUser(result.data)
      notify({
        type: 'success',
        message: `Тавтай морил, ${result.data.name}!`,
        description: `Та ${roleLabel(result.data.role)} эрхээр нэвтэрлээ.`,
        userId: result.data.id,
      })
      return result
    },
    [notify]
  )

  const register = useCallback(
    async ({ name, phone, email, password, role }) => {
      const result = await auth.signUp({ name, phone, email, password, role })

      if (!result.ok) {
        notify({ type: 'error', message: 'Бүртгүүлж чадсангүй', description: result.error })
        return result
      }

      // И-мэйл баталгаажуулалт шаардлагатай үед сешн үүсэхгүй
      if (result.needsConfirmation) {
        notify({ type: 'info', message: 'Бүртгэл үүслээ', description: result.message })
        return result
      }

      setUser(result.data)
      notify({
        type: 'success',
        message: `Тавтай морил, ${result.data.name}!`,
        description: 'Бүртгэл амжилттай үүслээ.',
        userId: result.data.id,
      })
      return result
    },
    [notify]
  )

  const logout = useCallback(async () => {
    // Push токеныг нэвтрэлт тасрахААС ӨМНӨ устгана — устгах хүсэлт нь
    // хэрэглэгчийн токеноор баталгаажих тул дараа нь боломжгүй болно.
    // Үгүй бол энэ утсанд дараа нэвтэрсэн хүн өмнөх эзний мэдэгдлийг авна.
    await disablePush()

    await auth.signOut()
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    async updates => {
      if (!user) return { ok: false, error: 'Нэвтрээгүй байна.' }

      const result = await auth.updateProfile(user.id, updates)
      if (!result.ok) {
        notify({ type: 'error', message: 'Хадгалж чадсангүй', description: result.error })
        return result
      }

      setUser(result.data)
      return result
    },
    [user, notify]
  )

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile, configured: isSupabaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  )
}
