import { useEffect, useState } from 'react'
import Shell, { MobileHeader, DToast } from './Shell'
import Icon from '../../components/Icon'
import { useCachedApi } from '../../lib/offline'
import { api } from '../../lib/api'
import { navigate } from '../../lib/router'

// Figma: "Driver Iphone 13 pro - 4" — current delivery stop
export default function Stop({ id }) {
  const [s, , , setS] = useCachedApi('/driver/stops/' + id)
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState(null)
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t) }, [])
  const mins = s?.windowEnd ? Math.round((new Date(s.windowEnd) - now) / 60000) : null

  const arrive = async () => {
    if (s.status === 'COMPLETED') return
    try { if (!s.arrived) setS(await api.post(`/driver/stops/${id}/arrive`)) } catch { /* offline: continue anyway */ }
    navigate('/driver/pod/' + id)
  }
  const maps = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`, '_blank')

  return (
    <Shell active="routes" header={<MobileHeader title={`Stop #${s?.seq ?? ''}: ${s?.status === 'COMPLETED' ? 'Delivered' : s?.status === 'CURRENT' ? 'Current Delivery' : 'Upcoming'}`} height={56} />}
      footer={s && (
        <div className="flex gap-[12px] px-[16px]">
          <button onClick={maps} className="w-[174px] h-[46px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid flex items-center justify-center gap-[8px] font-bold text-[#56616d] text-[14px] cursor-pointer">
            <Icon name="navigation" size={18} color="#56616d" /> Navigate (Maps)
          </button>
          <button onClick={arrive} disabled={s.status === 'COMPLETED'} className="w-[172px] h-[46px] rounded-[12px] bg-[#e8453c] flex items-center justify-center gap-[8px] font-bold text-white text-[14px] cursor-pointer disabled:bg-[#10b981]">
            <Icon name="check" size={18} color="#fff" stroke={2.5} /> {s.status === 'COMPLETED' ? 'Delivered' : s.arrived ? 'Proof of Delivery' : 'Confirm Arrival'}
          </button>
        </div>
      )}>
      {s && (
        <div className="absolute left-[16px] top-[116px] w-[358px] bottom-[190px] overflow-y-auto no-scrollbar flex flex-col gap-[16px]">
          <div className="bg-white rounded-[12px] px-[16px] pt-[16px] pb-[16px] shrink-0">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[#1e2229] text-[18px] leading-[22px]">{s.outletName}</p>
              <span className="h-[21px] px-[8px] rounded-[6px] bg-[#f3efff] text-[#8a5cf5] font-bold text-[11px] flex items-center uppercase whitespace-nowrap">{s.brandLabel}</span>
            </div>
            <p className="text-[#56616d] text-[13.5px] leading-[18px] mt-[12px]">{s.address} (Dist: {s.distanceKm}km away)</p>
            <div className="flex gap-[16px] mt-[20px]">
              <div><p className="text-[#8d9aab] text-[11px] uppercase">Window</p><p className="font-bold text-[#1e2229] text-[13.5px] mt-[2px]">{s.window}</p></div>
              {mins != null && s.status !== 'COMPLETED' && (
                <div><p className="text-[#8d9aab] text-[11px] uppercase">Countdown</p>
                  <p className="font-bold text-[#e8453c] text-[13.5px] mt-[2px]">{mins >= 0 ? `${mins} mins left` : `${-mins} mins late`}</p></div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-[12px] px-[16px] pt-[16px] pb-[16px] shrink-0">
            <div className="flex items-center gap-[8px]"><Icon name="truck" size={18} color="#e8453c" /><p className="font-bold text-[#1e2229] text-[14px]">Unloading Instructions</p></div>
            <div className="inline-flex mt-[12px] rounded-[8px] bg-[#f5f7fa] px-[8px] py-[8px] font-semibold text-[#1e2229] text-[13px]">Bay: {s.bay}</div>
            <p className="text-[#56616d] text-[12.4px] leading-[15px] mt-[12px]"><b className="text-[#56616d]">Note from Dispatcher:</b> {s.note}</p>
          </div>
          <div className="bg-white rounded-[12px] px-[16px] pt-[16px] pb-[16px] shrink-0">
            <p className="font-bold text-[#1e2229] text-[14px]">Delivery Items ({s.items.length})</p>
            {s.items.map((i) => (
              <div key={i.id} className="flex justify-between items-center mt-[16px]">
                <div><p className="font-semibold text-[#1e2229] text-[13.5px] leading-[16px]">{i.name}</p><p className="text-[#8d9aab] text-[11px] mt-[2px]">{i.temp}</p></div>
                <p className="font-bold text-[#1e2229] text-[14.5px] whitespace-nowrap">{i.qty} {i.unit}</p>
              </div>
            ))}
            {!s.items.length && <p className="text-[#8d9aab] text-[12.4px] mt-[10px]">Packing list will be shared by the dock.</p>}
          </div>
        </div>
      )}
      <DToast toast={toast} />
    </Shell>
  )
}
