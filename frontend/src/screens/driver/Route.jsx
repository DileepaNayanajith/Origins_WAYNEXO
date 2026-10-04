import { useEffect, useState } from 'react'
import Shell, { MobileHeader } from './Shell'
import { useCachedApi, lastTrip } from '../../lib/offline'
import { navigate } from '../../lib/router'
import { api } from '../../lib/api'

// Figma: "Driver Iphone 13 pro - 3" — stop sequence for a trip
const CHIP = { COMPLETED: ['#eaf9f1', '#2ec170', 'COMPLETED'], CURRENT: ['#fdf0ef', '#e8453c', 'CURRENT'], UPCOMING: ['#e4e8ee', '#56616d', 'UPCOMING'] }

export default function Route({ id }) {
  const [empty, setEmpty] = useState(false)
  // "/driver/trip/current" resolves to today's active trip
  useEffect(() => {
    if (id !== 'current') return
    api.get('/driver/home').then((h) => { const next = h.activeTripId || h.trips[0]?.id; if (next) navigate('/driver/trip/' + next, { replace: true }); else setEmpty(true) }).catch(() => { if (/^\d+$/.test(lastTrip.get() || '')) navigate('/driver/trip/' + lastTrip.get(), { replace: true }); else setEmpty(true) })
  }, [id])
  const [t, , , , error] = useCachedApi(id === 'current' ? null : '/driver/trips/' + id)
  useEffect(() => { if (t?.id && String(t.id) === String(id)) lastTrip.set(id) }, [id,t])
  if (id === 'current') return <Shell active="routes" responsive><div className="driver-empty"><h1>{empty ? 'No trips assigned yet' : 'Loading your routes…'}</h1><p>Your dispatcher will release your delivery runs to the dock.</p><button onClick={()=>navigate('/driver')}>Back to Home</button></div></Shell>
  if (error && !t) return <Shell active="routes" responsive><div className="driver-empty"><h1>Route unavailable</h1><p>{error.message}</p><button onClick={()=>navigate('/driver')}>Back to Home</button></div></Shell>
  return (
    <Shell active="routes" header={<MobileHeader title={`Trip ${t?.number ?? ''}: ${t?.name ?? ''}`} subtitle={t && `Progress: ${t.completed} of ${t.total} stops completed`} back="/driver" />}>
      <section className="driver-stack" aria-label="Route stops">
        {!t && <p>Loading route…</p>}
        {t && !t.stops.length && <p>No stops in this route.</p>}
        {(t?.stops || []).map(s => {
          const [bg, fg, label] = CHIP[s.status]
          return <button key={s.id} onClick={() => navigate('/driver/stop/' + s.id)} className="driver-route-card">
            <span className="driver-stop-number">{s.seq}</span>
            <div><strong>{s.outletName}</strong><p>{s.brand} · {s.window}</p><p>ETA: {s.eta || 'Not available'}</p></div>
            <span className="driver-route-status" style={{ background: bg, color: fg }}>{label}</span>
          </button>
        })}
      </section>
    </Shell>
  )
}
