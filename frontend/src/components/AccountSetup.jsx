import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'

export default function AccountSetup() {
  const { setup, setupError, loadSetup, completeSetup, logout } = useAuth()
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialog = useRef(null)
  useEffect(() => {
    dialog.current?.showModal()
    return () => dialog.current?.close()
  }, [])
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { await completeSetup(values) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="setup-dialog auth-card" onCancel={e => e.preventDefault()} aria-labelledby="setup-title">
    <h1 id="setup-title">Complete your setup</h1>
    <p>Select your assigned workspace to continue.</p>
    {setupError ? <><p role="alert" className="auth-error">{setupError}</p><button onClick={loadSetup}>Try again</button></>
      : !setup ? <p role="status">Loading your configuration...</p>
      : <form onSubmit={submit} aria-busy={busy}>
        {setup.fields.map(field => <div key={field.name}>
          <label htmlFor={field.name}>{field.label}</label>
          <select id={field.name} required value={values[field.name] || ''} disabled={busy}
            onChange={e => setValues({ ...values, [field.name]: e.target.value })}>
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {field.options.length === 0 && <p className="auth-error">No assignments available. Contact your administrator.</p>}
        </div>)}
        {error && <p role="alert" className="auth-error">{error}</p>}
        <button type="submit" disabled={busy || setup.fields.some(f => !f.options.length)}>{busy ? 'Saving...' : 'Continue'}</button>
      </form>}
    <button className="auth-secondary" type="button" onClick={logout} disabled={busy}>Sign out</button>
  </dialog>
}
