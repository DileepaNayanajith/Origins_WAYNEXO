import { useEffect } from 'react'
import Shell, { Util } from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { navigate } from '../../lib/router'

// Figma: "Loader iPad Pro 11\" - 2" — Loading Priority Queue
const STATUS = { LOADING: ['#fef3c7', '#f59e0b'], WAITING: ['#f5f7fa', '#8d9aab'], COMPLETE: ['#eaf9f1', '#2ec170'] }
const volColor = (p, i) => (p >= 85 ? '#e8453c' : i % 2 ? '#2ec170' : '#1d89e8')

export default function Queue() {
  const [d, reload] = useApi('/loader/queue')
  useEffect(() => { const id = setInterval(reload, 20000); return () => clearInterval(id) }, [reload])
  const open = (r) => navigate(r.status === 'COMPLETE' ? '/loader/dispatch/' + r.tripId : '/loader/manifest/' + r.tripId)
  return (
    <Shell title="Loading Priority Queue">
      {d?.alert && (
        <div className="absolute left-[28px] top-[28px] w-[1138px] h-[61px] rounded-[12px] bg-[#fdf0ef] border-[#ef857f] border-[1.2px] border-solid flex items-center px-[19px] gap-[14px]">
          <Icon name="alertCircle" size={22} color="#e8453c" />
          <p className="flex-1 font-semibold text-[#e8453c] text-[16.5px]">{d.alert}</p>
          <p className="font-bold text-[#e8453c] text-[15px] uppercase">Active Alerts</p>
        </div>
      )}
      <div className="absolute left-[28px] top-[108px] w-[1138px] bottom-[20px] flex flex-col gap-[15px] overflow-y-auto no-scrollbar">
        {(d?.rows || []).map((r, i) => {
          const [sb, sf] = STATUS[r.status]
          const hot = r.status === 'LOADING' && i === 0
          return (
            <div key={r.tripId} onClick={() => open(r)} className={`relative h-[110px] shrink-0 bg-white rounded-[12px] border-solid cursor-pointer ${hot ? 'border-[#e8453c] border-[1.5px]' : 'border-[#e4e8ee] border-[0.889px]'}`}>
              <div className="absolute left-[23px] top-[27px] flex items-center gap-[12px]">
                <Icon name="truck" size={22} color="#1e2229" />
                <span className="font-bold text-[#1e2229] text-[21px]">{r.plate}</span>
                {r.reefer && <span className="h-[20px] px-[7px] rounded-[4px] bg-[#edf6fd] text-[#1d89e8] font-bold text-[11.5px] flex items-center">REEFER</span>}
              </div>
              <p className="absolute left-[23px] top-[65px] text-[#56616d] text-[15px] whitespace-nowrap">{r.model} • Driver: {r.driverName}</p>
              <p className="absolute left-[340px] top-[36px] font-semibold text-[#8d9aab] text-[13.5px] uppercase">Stops</p>
              <p className="absolute left-[340px] top-[55px] font-bold text-[#1e2229] text-[17px]">{r.stops} Outlets</p>
              <p className="absolute left-[447px] top-[36px] font-semibold text-[#8d9aab] text-[13.5px] uppercase">Orders</p>
              <p className="absolute left-[447px] top-[55px] font-bold text-[#1e2229] text-[17px]">{r.packages} Packages</p>
              <div className="absolute left-[587px] top-[24px]"><Util label="Volume Util." pct={r.volumePct} color={volColor(r.volumePct, 0)} /></div>
              <div className="absolute left-[587px] top-[61px]"><Util label="Weight Util." pct={r.weightPct} color={r.weightPct >= 95 ? '#e8453c' : '#2ec170'} /></div>
              <span className="absolute right-[84px] top-[40px] h-[31px] px-[13px] rounded-[6px] font-bold text-[14px] flex items-center" style={{ background: sb, color: sf }}>{r.status}</span>
              <span className="absolute right-[23px] top-[34px] size-[42px] rounded-[8px] border-[#e8453c] border-[1.2px] border-solid bg-[#fdf0ef] flex items-center justify-center"><Icon name="arrowRight" size={20} color="#e8453c" /></span>
            </div>
          )
        })}
        {d && !d.rows.length && <p className="text-[#8d9aab] text-[15px]">No vehicles at this dock right now.</p>}
      </div>
    </Shell>
  )
}
