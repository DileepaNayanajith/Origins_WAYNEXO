import { useState } from 'react'
import Shell, { BrandTag, Toast } from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'

// Figma: "Store Manager MacBook Air - 4" — Upcoming Delivery Schedule
export default function Schedule() {
  const [d, reload, { loading }] = useApi('/store/schedule')
  const [toast, setToast] = useState(null)
  const sync = async () => { await reload(); setToast({ msg: 'Synced with Peliyagoda dispatch' }); setTimeout(() => setToast(null), 2000) }
  const n = d?.next
  const eta = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60} mins` : `${m} mins`)
  return (
    <Shell active="schedule">
      <p className="absolute left-[28px] top-[29px] font-bold text-[#1e2229] text-[21.5px] leading-[26px]">Upcoming Delivery Schedule</p>
      <p className="absolute left-[28px] top-[58px] text-[#56616d] text-[12.4px] leading-[15px]">Allocate receiving staff based on automated expected arrival windows.</p>
      <button onClick={sync} className="absolute left-[1123px] top-[37px] w-[129px] h-[28px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[7px] flex items-center justify-center gap-[7px] cursor-pointer">
        <Icon name="refresh" size={12} color="#56616d" className={loading ? 'animate-spin' : ''} />
        <span className="font-semibold text-[#56616d] text-[11.6px]">Sync Dispatch</span>
      </button>
      {n ? (
        <div className="absolute left-[28px] top-[94px] w-[1223px] h-[102px] bg-white border-[#e8453c] border-[0.889px] border-solid rounded-[14px]">
          <div className="absolute left-[21px] top-[26px] size-[48px] rounded-[10px] bg-[#fdf0ef] flex items-center justify-center">
            <Icon name="battery" size={21} color="#e8453c" fill="#e8453c" />
          </div>
          <p className="absolute left-[90px] top-[21px] font-bold text-[#e8453c] text-[11.6px] uppercase">Today's {n.brand === 'FRESH' ? 'Chilled' : ''} Dispatch Expected</p>
          <p className="absolute left-[90px] top-[39px] font-bold text-[#1e2229] text-[17.5px] leading-[22px] whitespace-nowrap">
            {n.brand === 'FRESH' ? 'Fresh daily order' : 'Your order'} {n.minutes > 0 ? `arrives in approx ${eta(n.minutes)}` : 'is arriving now'} (ETA:{n.eta})
          </p>
          <p className="absolute left-[90px] top-[65px] text-[#56616d] text-[12.4px] whitespace-nowrap">
            {n.vehicleLabel} • Driver: {n.driver} • Chilled Weight: {n.weightKg} kg • Chilled Volume: {n.volumeM3} m³
          </p>
          <div className="absolute left-[1009px] top-[24px] w-[192px] h-[52px] rounded-[7px] bg-[#eaf9f1] px-[11px] pt-[11px]">
            <p className="font-bold text-[#10b981] text-[10.6px] uppercase leading-[13px]">Staffing Suggestion</p>
            <p className="font-semibold text-[#1e2229] text-[11.6px] mt-[4px] whitespace-nowrap">{n.staffing}</p>
          </div>
        </div>
      ) : (
        <div className="absolute left-[28px] top-[94px] w-[1223px] h-[102px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] flex items-center px-[21px] text-[#56616d] text-[13px]">
          No shipment is on the road to your outlet right now.
        </div>
      )}
      <div className="absolute left-[28px] top-[218px] w-[1223px] grid grid-cols-4 gap-[14.5px]">
        {(d?.days || []).map((c) => (
          <div key={c.date} className="h-[206px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] relative">
            <p className="absolute left-[18px] top-[18px] font-bold text-[#1e2229] text-[13.2px]">{c.dayLabel}</p>
            {c.brand && <BrandTag brand={c.brand} className="absolute right-[18px] top-[17px]" />}
            <p className="absolute left-[18px] top-[50px] text-[#56616d] text-[11.6px]">Expected Window</p>
            <p className={`absolute left-[18px] top-[66px] font-bold text-[15.6px] ${c.hasDelivery ? 'text-[#e8453c]' : 'text-[#56616d]'}`}>{c.windowLabel}</p>
            <span className="absolute left-[18px] top-[99px] w-[260px] h-[0.889px] bg-[#e4e8ee]" />
            <p className="absolute left-[18px] top-[115px] text-[#56616d] text-[11.6px]">Vehicle: {c.vehicle}</p>
            <p className="absolute left-[18px] top-[132px] w-[260px] text-[#56616d] text-[11.6px] truncate">{c.summary}</p>
            <div className="absolute left-[18px] top-[160px] w-[260px] h-[27px] rounded-[5px] bg-[#f5f7fa] flex items-center px-[7px] font-semibold text-[#1e2229] text-[10.6px]">{c.staffing}</div>
          </div>
        ))}
      </div>
      <Toast toast={toast} />
    </Shell>
  )
}
