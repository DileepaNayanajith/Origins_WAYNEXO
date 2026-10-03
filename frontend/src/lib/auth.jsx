import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api, tokenStore } from './api'
import { navigate } from './router'
import { setOfflineAccount } from './offline'
import { ROLE_HOME } from './roles'
export { ROLE_HOME } from './roles'
const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [setup, setSetup] = useState(null)
  const [setupError, setSetupError] = useState('')
  const generation = useRef(0)
  const loadSetup = useCallback(async () => {
    const current = generation.current
    setSetupError('')
    try {
      const result = await api.get('/auth/setup')
      if (current === generation.current) setSetup(result)
    } catch (e) { if (current === generation.current) setSetupError(e.message) }
  }, [])
  const restore = useCallback(async () => {
    const current = generation.current
    setSessionError(''); setReady(false)
    try {
      if (tokenStore.get()) {
        const result = await api.get('/auth/me')
        if (!ROLE_HOME[result?.role]) throw new Error('This account has an unsupported role. Contact your administrator.')
        if (current === generation.current) { setOfflineAccount(result.id); setUser(result); await loadSetup() }
      }
    } catch (e) {
      // A server/network failure must not erase a valid persisted session.
      if (e.status !== 401 && current === generation.current) setSessionError(e.message)
    } finally { setReady(true) }
  }, [loadSetup])
  useEffect(() => { restore() }, [restore])
  useEffect(() => {
    const out = () => { generation.current++; setOfflineAccount(null); setUser(null); setSetup(null); setSetupError(''); setSessionError(''); setReady(true); navigate('/login', { replace: true }) }
    window.addEventListener('waynexo:logout', out)
    return () => window.removeEventListener('waynexo:logout', out)
  }, [])
  const login = useCallback(async payload => {
    const current = generation.current
    const res = await api.post('/auth/login', payload)
    if (current !== generation.current) return
    if (!res?.token || !ROLE_HOME[res.user?.role]) throw new Error('Invalid sign-in response. Contact your administrator.')
    tokenStore.set(res.token)
    if (tokenStore.get() !== res.token) throw new Error('Allow browser storage to keep your session signed in.')
    generation.current++; setSetup(null); setSetupError(''); setOfflineAccount(res.user.id); setUser(res.user)
    navigate(ROLE_HOME[res.user.role], { replace: true })
    await loadSetup()
    return res.user
  }, [loadSetup])
  const logout = useCallback(() => {
    tokenStore.set(null); window.dispatchEvent(new Event('waynexo:logout'))
  }, [])
  const completeSetup = useCallback(async values => {
    const current = generation.current
    const updated = await api.put('/auth/setup', values)
    if (current !== generation.current) return
    setUser(updated)
    await loadSetup()
    if (current !== generation.current) return
    navigate(ROLE_HOME[updated.role], { replace: true })
  }, [loadSetup])
  return <AuthCtx.Provider value={{ user, ready, login, logout, setUser, setup, setupError, loadSetup, completeSetup, sessionError, restore }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)
