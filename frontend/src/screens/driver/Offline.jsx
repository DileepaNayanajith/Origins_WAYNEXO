import { useEffect, useState } from 'react'
import Shell, { MobileHeader } from './Shell'
import { outbox, lastSync, flush, useConnectivity, useCachedApi } from '../../lib/offline'
import { lastTrip } from '../../lib/offline'

// Figma: "Driver Iphone 13 pro - 6" — Offline Operations Cache
const CHIP = { COMPLETED: 'COMPLETED', CURRENT: 'CURRENT', UPCOMING: 'UPCOMING' }
const ago = (t) => { if (!t) return 'never'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago` }

export default function Offline() {
  const { online, queued } = useConnectivity()
  const [home] = useCachedApi('/driver/home')
  const [trip] = useCachedApi((home?.activeTripId || lastTrip.get()) ? '/driver/trips/' + (home?.activeTripId || lastTrip.get()) : null)
  const [, tick] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(id) }, [])
  const sync = async () => { setSyncing(true); try { const ok = await flush(); setMessage(ok ? 'All queued outcomes synced.' : 'Some outcomes could not sync. They remain saved on this device; retry when connected.') } finally { setSyncing(false); tick(x => x + 1) } }
  const ls = lastSync()
  const delivered = outbox.all().filter((i) => i.type === 'pod').length

  return (
    <Shell active="offline" header={<MobileHeader title="Offline Operations Cache" subtitle={online ? 'Connected. Cached data refreshes automatically.' : 'Safe mode active. All inputs preserved locally.'} back="/driver" />}
      footer={
        <button onClick={sync} disabled={!online || syncing} className={`ml-[16px] h-[52px] px-[16px] rounded-[12px] flex items-center gap-[10px] font-bold text-[16px] ${online ? 'bg-[#e8453c] text-white cursor-pointer' : 'bg-[#e4e8ee] text-[#a8b0ba]'}`}>
          <span className="w-[2px] h-[20px] rounded bg-current opacity-50" />
          {!online ? 'Waiting for Connection...' : syncing ? 'Syncing…' : queued ? `Sync ${queued} Queued Item${queued > 1 ? 's' : ''} Now` : 'All Synced ✓'}
        </button>}>
      <section className="driver-stack">
        <div className="driver-stat-grid">
          <article className="driver-panel"><p>Queued deliveries</p><strong>{delivered}</strong></article>
          <article className="driver-panel"><p>Last sync attempt</p><strong>{ago(ls?.at)}</strong></article>
        </div>
        {message && <p role="status" className="driver-panel">{message}</p>}
        <h2>Cached route plan</h2>
        {(trip?.stops || []).map(s => <article key={s.id} className="driver-route-card"><span className="driver-stop-number">{s.seq}</span><div><strong>{s.outletName}</strong><p>ETA {s.eta || 'Not available'}</p></div><span className="driver-route-status">{CHIP[s.status]}</span></article>)}
        {!trip && <p>No route cached yet — open your trip once while online.</p>}
        <article className="driver-panel driver-offline-note"><h2>Continue when offline</h2><p>Recorded outcomes and signatures remain queued on this device until the server acknowledges them. Keep this browser's data until sync finishes.</p></article>
      </section>
    </Shell>
  )
}
