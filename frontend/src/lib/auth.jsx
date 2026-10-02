import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokenStore } from './api'
import { navigate } from './router'

const AuthCtx = createContext(null)

/** Each role lands on its own interface after login. */
export const ROLE_HOME = {
  DISPATCHER: '/dispatcher',
  STORE_MANAGER: '/store',
  DRIVER: '/driver',
  LOADER: '/loader',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!tokenStore.get()) { setReady(true); return }
    api.get('/auth/me').then(setUser).catch(() => tokenStore.set(null)).finally(() => setReady(true))
  }, [])

  useEffect(() => {
    const out = () => { setUser(null); navigate('/login', { replace: true }) }
    window.addEventListener('waynexo:logout', out)
    return () => window.removeEventListener('waynexo:logout', out)
  }, [])

  const login = useCallback(async (payload) => {
    const res = await api.post('/auth/login', payload)
    tokenStore.set(res.token)
    setUser(res.user)
    navigate(ROLE_HOME[res.user.role] || '/', { replace: true })
    return res.user
  }, [])

  const logout = useCallback(() => {
    tokenStore.set(null); setUser(null); navigate('/login', { replace: true })
  }, [])

  return <AuthCtx.Provider value={{ user, ready, login, logout, setUser }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
