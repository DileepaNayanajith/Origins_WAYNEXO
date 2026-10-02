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
      <p className="absolute left-[16px] top-[117px] font-semibold text-[#56616d] text-[12.4px] uppercase">Select Exception Type</p>
      <div className="absolute left-[16px] top-[142px] w-[358px] grid grid-cols-2 gap-[11px]">
        {TYPES.map(([t, ic]) => {
          const on = t === type
          return (
            <button key={t} onClick={() => setType(t)} className={`h-[77px] rounded-[12px] border-solid flex flex-col items-center justify-center gap-[8px] cursor-pointer ${on ? 'bg-[#fdf0ef] border-[#e8453c] border-[1.8px]' : 'bg-white border-[#e4e8ee] border-[0.889px]'}`}>
              <Icon name={ic} size={22} color={on ? '#e8453c' : '#56616d'} stroke={1.8} />
              <span className={`font-bold text-[12.4px] ${on ? 'text-[#e8453c]' : 'text-[#1e2229]'}`}>{t}</span>
            </button>
          )
        })}
      </div>
      <p className="absolute left-[16px] top-[325px] font-semibold text-[#56616d] text-[12.4px] uppercase">Provide Details</p>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. 2 Cases of fresh milk 1L completely leaked due to cardboard compression. Remaining boxes safely separated..."
        className="absolute left-[16px] top-[348px] w-[358px] h-[99px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid p-[12px] text-[13.5px] leading-[18px] text-[#1e2229] resize-none outline-none placeholder:text-[#56616d]" />
      <p className="absolute left-[16px] top-[471px] font-semibold text-[#56616d] text-[12.4px] uppercase">Severity Level</p>
      <div className="absolute right-[16px] top-[465px] flex gap-[8px]">
        {['Low', 'Medium', 'Critical'].map((x) => (
          <button key={x} onClick={() => setSev(x)} className={`h-[25px] px-[10px] rounded-[6px] font-semibold text-[12px] cursor-pointer ${sev === x ? 'bg-[#e8453c] text-white' : 'bg-[#e4e8ee] text-[#56616d]'}`}>{x}</button>
        ))}
      </div>
      <a href="tel:+94112345678" className="absolute left-[16px] top-[507px] w-[358px] h-[41px] rounded-[10px] bg-[#fdf0ef] border-[#e8453c] border-[0.889px] border-solid flex items-center justify-center gap-[8px] font-bold text-[#e8453c] text-[13.5px]">
        <Icon name="phone" size={16} color="#e8453c" /> Urgent: Call Lead Dispatcher (Harsha)
      </a>
      <DToast toast={toast} />
    </Shell>
  )
}
