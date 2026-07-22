import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('jobconnect_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem('jobconnect_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password, role) => {
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role,
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString()
    }
    setUser(mockUser)
    localStorage.setItem('jobconnect_user', JSON.stringify(mockUser))
    return mockUser
  }

  const register = (name, email, password, role) => {
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString()
    }
    setUser(mockUser)
    localStorage.setItem('jobconnect_user', JSON.stringify(mockUser))
    return mockUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('jobconnect_user')
  }

  const updateProfile = (updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('jobconnect_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
