import { useState } from 'react'
import Shell, { MobileHeader, DToast } from './Shell'
import Icon from '../../components/Icon'
import { api } from '../../lib/api'
import { outbox, useCachedApi } from '../../lib/offline'
import { lastTrip } from '../../lib/offline'
import { navigate } from '../../lib/router'

// Figma: "Driver Iphone 13 pro - 7" — Report Route Exception
const TYPES = [['Damaged Goods', 'alertTriangle'], ['Access Denied', 'lock'], ['Outlet Closed', 'slash'], ['Wrong Items', 'info']]

export default function Report() {
  const [home] = useCachedApi('/driver/home')
  const [trip] = useCachedApi((home?.activeTripId || lastTrip.get()) ? '/driver/trips/' + (home?.activeTripId || lastTrip.get()) : null)
  const [type, setType] = useState('Damaged Goods')
  const [details, setDetails] = useState('')
  const [sev, setSev] = useState('Critical')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const flash = (msg, t) => { setToast({ msg, type: t }); setTimeout(() => setToast(null), 3000) }
  const current = trip?.stops.find((s) => s.status === 'CURRENT')

  const submit = async () => {
    if (!details.trim()) return flash('Describe what happened', 'error')
    const payload = { tripId: home?.activeTripId || Number(lastTrip.get()) || null, stopId: current?.id, type, details, severity: sev }
    setBusy(true)
    try { await api.post('/driver/exceptions', { ...payload, clientId: crypto.randomUUID?.() }); flash('Exception logged — dispatcher alerted'); setTimeout(() => navigate('/driver'), 1200) }
    catch (e) { if (e.status === 0) { outbox.push({ type: 'exception', payload }); flash('Saved offline — will sync automatically') } else flash(e.message, 'error') }
    finally { setBusy(false) }
  }

  return (
    <Shell active="report" header={<MobileHeader title="Report Route Exception" height={56} back="/driver" />}
      footer={<button disabled={busy} onClick={submit} className="ml-[16px] h-[52px] px-[16px] rounded-[12px] bg-[#e8453c] font-bold text-white text-[16px] cursor-pointer disabled:opacity-70">{busy ? 'Submitting…' : 'Submit Exception Log'}</button>}>
      <section className="driver-stack">
        <fieldset className="driver-fieldset"><legend>Select exception type</legend><div className="driver-choice-grid">
          {TYPES.map(([t, icon]) => <button key={t} aria-pressed={t === type} onClick={() => setType(t)} className={type === t ? 'selected' : ''}><Icon name={icon} size={22}/><span>{t}</span></button>)}
        </div></fieldset>
        <label className="driver-field">Provide details<textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe what happened and which items were affected." /></label>
        <fieldset className="driver-fieldset"><legend>Severity level</legend><div className="driver-severity">
          {['Low','Medium','Critical'].map(x => <button key={x} aria-pressed={sev === x} onClick={() => setSev(x)} className={sev === x ? 'selected' : ''}>{x}</button>)}
        </div></fieldset>
        <a href="tel:+94112345678" className="driver-call"><Icon name="phone" size={18}/>Call lead dispatcher</a>
      </section>
      <DToast toast={toast} />
    </Shell>
  )
}
