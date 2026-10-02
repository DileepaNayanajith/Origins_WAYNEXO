import { useEffect } from 'react'
import Shell from './Shell'
import { useApi } from '../../lib/useApi'
import { timeAgo } from '../../lib/fig'
import { BrandPill, Card } from './ui'

// Figma: "Dispatcher TV - 5" — Delivery Live Tracking (polls every 15 s)
const DOT = { COMPLETED: '#10b981', CURRENT: '#10b981', UPCOMING: '#8d9aab' }

export default function Tracking() {
  const [d, reload] = useApi('/dispatcher/tracking')
  useEffect(() => { const id = setInterval(reload, 15000); return () => clearInterval(id) }, [reload])
  return (
    <Shell active="tracking" title="Delivery Live Tracking" subtitle="Track dispatcher progress across Sri Lankan provinces with stop-by-stop validation" counts={d?.counts}
      bodyClass="flex-row gap-[17.778px]">
      <div className="flex flex-col gap-[14.222px] h-full items-start w-[654px] shrink-0">
        <p className="font-bold leading-[normal] text-[#1e2229] text-[14.222px] whitespace-nowrap">Active Route Channels</p>
        <div className="flex flex-[1_0_0] flex-col gap-[14.222px] min-h-px w-full overflow-y-auto no-scrollbar">
          {(d?.routes || []).map((r) => (
            <Card key={r.id} className="flex flex-col gap-[10.667px] items-start p-[17.778px] shrink-0 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-[7.111px] items-center">
                  <p className="font-bold leading-[normal] text-[#1e2229] text-[12.444px] whitespace-nowrap">Route #{r.label}</p>
                  <BrandPill brand={r.brand} />
                </div>
                <p className="font-semibold leading-[normal] text-[#10b981] text-[11.556px] whitespace-nowrap">{r.percent}% Completed</p>
              </div>
              <div className="flex items-center justify-between w-full py-[10.667px]">
                {r.nodes.map((n, i) => (
                  <div key={n.label} className="contents">
                    {i > 0 && <div className="h-[1.778px] w-[71px] rounded-[1px]" style={{ background: n.status === 'UPCOMING' ? '#e4e8ee' : '#10b981' }} />}
                    <div className="flex flex-col gap-[3.556px] items-center w-[32px]">
                      <span className="block rounded-full size-[10.667px]" style={{ background: DOT[n.status], boxShadow: n.status === 'CURRENT' ? '0 0 0 3px #d1fae5' : 'none' }} />
                      <p className={`font-semibold leading-[normal] text-[8.889px] whitespace-nowrap ${n.status === 'UPCOMING' ? 'text-[#8d9aab]' : 'text-[#56616d]'}`}>{n.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-[#e4e8ee] border-solid border-t-[0.889px] flex items-start justify-between leading-[normal] pt-[7.111px] text-[10.667px] w-full whitespace-nowrap">
                <p className="font-normal text-[#56616d]">Current: {r.current}</p>
                <p className={`font-bold ${r.windowMissed ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>ETA: {r.eta}{r.windowMissed ? ' · WINDOW MISSED' : ' · ON TIME'}</p>
              </div>
            </Card>
          ))}
          {d && d.routes.length === 0 && <p className="text-[11.556px] text-[#8d9aab]">No vehicles are on the road right now.</p>}
        </div>
      </div>
      <div className="flex flex-[1_0_0] flex-col gap-[14.222px] h-full items-start min-w-px">
        <p className="font-bold leading-[normal] text-[#1e2229] text-[14.222px] whitespace-nowrap">Live Driver Feeds</p>
        <Card className="flex flex-[1_0_0] flex-col gap-[10.667px] min-h-px p-[14.222px] w-full overflow-y-auto no-scrollbar">
          {(d?.feeds || []).map((f) => {
            const crit = f.severity === 'CRITICAL'
            return (
              <div key={f.id} className="flex flex-col gap-[7.111px] p-[10.667px] rounded-[7.111px] shrink-0 w-full" style={{ background: crit ? '#fee2e2' : f.severity === 'WARNING' ? '#fef3c7' : '#f5f7fa' }}>
                <div className="flex items-start justify-between leading-[normal] w-full whitespace-nowrap">
                  <p className={`font-bold text-[10.667px] ${crit ? 'text-[#ef4444]' : 'text-[#56616d]'}`}>{f.actor} ({f.vehicleCode})</p>
                  <p className="font-normal text-[#8d9aab] text-[9.778px]">{timeAgo(f.createdAt)}</p>
                </div>
                <p className="font-normal leading-[normal] text-[#1e2229] text-[10.667px]">{f.message}</p>
              </div>
            )
          })}
        </Card>
      </div>
    </Shell>
  )
}
