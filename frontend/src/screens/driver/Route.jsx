import { useEffect } from 'react'
import Shell, { MobileHeader } from './Shell'
import Icon from '../../components/Icon'
import { useCachedApi, lastTrip } from '../../lib/offline'
import { navigate } from '../../lib/router'
import { api } from '../../lib/api'

// Figma: "Driver Iphone 13 pro - 3" — stop sequence for a trip
const CHIP = { COMPLETED: ['#eaf9f1', '#2ec170', 'COMPLETED'], CURRENT: ['#fdf0ef', '#e8453c', 'CURRENT'], UPCOMING: ['#e4e8ee', '#56616d', 'UPCOMING'] }

export default function Route({ id }) {
  // "/driver/trip/current" resolves to today's active trip
  useEffect(() => {
    if (id !== 'current') return
    api.get('/driver/home').then((h) => navigate('/driver/trip/' + (h.activeTripId || h.trips[0]?.id), { replace: true })).catch(() => { if (lastTrip.get()) navigate('/driver/trip/' + lastTrip.get(), { replace: true }) })
  }, [id])
  const [t] = useCachedApi(id === 'current' ? null : '/driver/trips/' + id)
  useEffect(() => { if (id !== 'current') lastTrip.set(id) }, [id])
  if (id === 'current') return <Shell active="routes" />
  return (
    <Shell active="routes" header={<MobileHeader title={`Trip ${t?.number ?? ''}: ${t?.name ?? ''}`} subtitle={t && `Progress: ${t.completed} of ${t.total} stops completed`} back="/driver" />}>
      <div className="absolute left-[16px] top-[123px] w-[358px] bottom-[130px] flex flex-col gap-[12px] overflow-y-auto no-scrollbar">
        {(t?.stops || []).map((s) => {
          const [cb, cf, cl] = CHIP[s.status]
          const cur = s.status === 'CURRENT'
          return (
            <button key={s.id} onClick={() => navigate('/driver/stop/' + s.id)}
              className={`relative h-[64px] shrink-0 w-full bg-white rounded-[12px] border-solid text-left cursor-pointer ${cur ? 'border-[#e8453c] border-[1.5px]' : 'border-[#e4e8ee] border-[0.889px]'}`}>
              <span className={`absolute left-[12px] top-[18px] size-[28px] rounded-full flex items-center justify-center font-bold text-[13.5px]
                ${s.status === 'COMPLETED' ? 'bg-[#eaf9f1] text-[#2ec170]' : cur ? 'bg-[#e8453c] text-white' : 'bg-[#f5f7fa] text-[#1e2229]'}`}>{s.seq}</span>
              <span className="absolute left-[52px] top-[12px] w-[160px] font-bold text-[#1e2229] text-[14px] leading-[17px] truncate">{s.outletName}</span>
              <span className="absolute left-[212px] top-[11px] h-[21px] px-[8px] rounded-[6px] bg-[#eaf9f1] text-[#2ec170] font-bold text-[11px] flex items-center capitalize">{s.brand.toLowerCase()}</span>
              <span className="absolute left-[52px] top-[37px] flex items-center gap-[8px] text-[#56616d] text-[12.4px] whitespace-nowrap">
                <Icon name="clock" size={14} color="#56616d" />{s.window}<span>•</span><b className="text-[#1e2229]">ETA: {s.eta}</b>
              </span>
              <span className="absolute right-[6px] top-[24px] h-[21px] px-[8px] rounded-[6px] font-bold text-[11px] flex items-center" style={{ background: cb, color: cf }}>{cl}</span>
            </button>
          )
        })}
      </div>
    </Shell>
  )
}
