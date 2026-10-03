import { useState } from 'react'
import { useAuth } from '../lib/auth'

// Retained for the existing driver screens.
export function HomeIndicator() {
  return <span className="absolute left-[126px] top-[807px] w-[139px] h-[5px] rounded-full bg-[#1e2229] pointer-events-none" />
}
export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { await login({ username: username.trim(), password }) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <main className="auth-page">
    <section className="auth-card" aria-labelledby="login-title">
      <img className="auth-logo" src="/img/logo.png" alt="WAYNEXO" />
      <h1 id="login-title">Welcome to WAYNEXO</h1>
      <p>Sign in to your workspace.</p>
      <form onSubmit={submit} aria-busy={busy}>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
          required maxLength={255} value={username} onChange={e => setUsername(e.target.value)} disabled={busy} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024}
          value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button disabled={busy} type="submit">{busy ? 'Signing in...' : 'Log In'}</button>
      </form>
    </section>
  </main>
}
