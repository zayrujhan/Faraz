import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, getToken, setToken as saveToken, clearToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    try {
      const me = await api('/me')
      setUser(me)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password })
    const result = await api('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    saveToken(result.access_token)
    const me = await api('/me')
    setUser(me)
    return me
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  const isSeller = user?.role === 'seller'
  const isAdmin = user?.role === 'admin'
  const isSellerOrAdmin = isSeller || isAdmin

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser, isSeller, isAdmin, isSellerOrAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
