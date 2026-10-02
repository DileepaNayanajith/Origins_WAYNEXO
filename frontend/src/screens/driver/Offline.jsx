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
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(id) }, [])
  const sync = async () => { setSyncing(true); await flush(); setSyncing(false); tick((x) => x + 1) }
  const ls = lastSync()
  const delivered = outbox.all().filter((i) => i.type === 'pod').length

  return (
    <Shell active="offline" header={<MobileHeader title="Offline Operations Cache" subtitle={online ? 'Connected. Cached data refreshes automatically.' : 'Safe mode active. All inputs preserved locally.'} back="/driver" />}
      footer={
        <button onClick={sync} disabled={!online || syncing} className={`ml-[16px] h-[52px] px-[16px] rounded-[12px] flex items-center gap-[10px] font-bold text-[16px] ${online ? 'bg-[#e8453c] text-white cursor-pointer' : 'bg-[#e4e8ee] text-[#a8b0ba]'}`}>
          <span className="w-[2px] h-[20px] rounded bg-current opacity-50" />
          {!online ? 'Waiting for Connection...' : syncing ? 'Syncing…' : queued ? `Sync ${queued} Queued Item${queued > 1 ? 's' : ''} Now` : 'All Synced ✓'}
        </button>}>
      <div className="absolute left-[16px] top-[124px] flex gap-[12px]">
        <div className="w-[173px] h-[66px] bg-white rounded-[12px] px-[12px] pt-[12px]">
          <p className="text-[#8d9aab] text-[11px] uppercase">Queued Receipts</p>
          <p className="font-bold text-[#e8453c] text-[20px] leading-[24px] mt-[4px]">{delivered} Deliver{delivered === 1 ? 'y' : 'ies'}</p>
        </div>
        <div className="w-[173px] h-[66px] bg-white rounded-[12px] px-[12px] pt-[12px]">
          <p className="text-[#8d9aab] text-[11px] uppercase">Last Sync Attempt</p>
          <p className="font-bold text-[#1e2229] text-[14px] mt-[6px]">{ago(ls?.at)} ({home?.vehicle?.depot?.replace(' HQ', '') || 'Peliyagoda'})</p>
        </div>
      </div>
      <p className="absolute left-[16px] top-[208px] font-semibold text-[#56616d] text-[12.4px] uppercase">Cached Route Plan</p>
      <div className="absolute left-[16px] top-[240px] w-[358px] h-[250px] flex flex-col gap-[13px] overflow-y-auto no-scrollbar">
        {(trip?.stops || []).map((s) => (
          <div key={s.id} className="h-[54px] shrink-0 bg-white rounded-[12px] flex items-center px-[12px] gap-[12px]">
            <span className="size-[24px] rounded-full bg-[#f5f7fa] flex items-center justify-center font-bold text-[#1e2229] text-[12px]">{s.seq}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[#1e2229] text-[13.5px] truncate">{s.outletName.replace(' - ', ' — ')}</span>
              <span className="block text-[#8d9aab] text-[11.5px]">Sequence preserved • ETA {s.eta}</span>
            </span>
            <span className="h-[21px] px-[8px] rounded-[6px] bg-[#e4e8ee] text-[#56616d] font-bold text-[11px] flex items-center">{CHIP[s.status]}</span>
          </div>
        ))}
        {!trip && <p className="text-[#8d9aab] text-[12.4px]">No route cached yet — open your trip once while online.</p>}
      </div>
      <div className="absolute left-[16px] top-[511px] w-[358px] rounded-[12px] bg-[#effcf8] border-[#2ec1a4] border-[0.889px] border-solid px-[14px] py-[12px]">
        <p className="font-bold text-[#0f766e] text-[13.5px]">No Connection? Don't worry.</p>
        <p className="text-[#0f766e] text-[12.4px] leading-[17px] mt-[4px]">Continue deliveries offline. Photos, signatures, and outcomes will sync automatically when connected.</p>
      </div>
    </Shell>
  )
}
