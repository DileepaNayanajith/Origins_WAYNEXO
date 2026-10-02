import { useState } from 'react'
import Shell, { LToast } from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { navigate } from '../../lib/router'
import { fmtNum } from '../../lib/fig'

// Figma: "Loader iPad Pro 11\" - 3" — reverse-sequence trip manifest
export default function Manifest({ id }) {
  const [m, reload] = useApi('/loader/trips/' + id + '/manifest')
  const [toast, setToast] = useState(null)
  const precool = async () => { await api.post(`/loader/trips/${id}/precool`); reload(); setToast({ msg: 'All reefer compartments marked pre-cooled' }); setTimeout(() => setToast(null), 2200) }
  const bar = (v, max, color) => <div className="mt-[6px] h-[8px] rounded-full bg-[#f5f7fa] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / max) * 100)}%`, background: color }} /></div>
  return (
    <Shell title={`${m?.plate ?? ''} Trip Manifest`}>
      {m && <>
        <div className="absolute left-[28px] top-[28px] w-[396px] h-[145px] rounded-[12px] bg-[#fdf0ef] border-[#e8453c] border-[1.2px] border-solid px-[23px] pt-[23px]">
          <div className="flex items-center gap-[12px]"><Icon name="alertTriangle" size={19} color="#e8453c" /><span className="font-bold text-[#e8453c] text-[16px] uppercase">Reverse Loading Order</span></div>
          <p className="text-[#1e2229] text-[15px] leading-[21px] mt-[10px]">Load stops in reverse order of deliveries.<br />First stop on the route is loaded <b>last</b> to ensure swift roadside unloading.</p>
        </div>
        <div className="absolute left-[28px] top-[196px] w-[283px] h-[161px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid px-[23px] pt-[23px]">
          <p className="font-bold text-[#1e2229] text-[16px]">Trip Capacity Health</p>
          <div className="flex justify-between mt-[14px] text-[14px]"><span className="text-[#56616d]">Allocated Weight</span><b className="text-[#1e2229]">{fmtNum(m.allocatedKg)} / {fmtNum(m.capacityKg)} kg</b></div>
          {bar(m.allocatedKg, m.capacityKg, '#2ec170')}
          <div className="flex justify-between mt-[14px] text-[14px]"><span className="text-[#56616d]">Allocated Volume</span><b className="text-[#1e2229]">{fmtNum(m.allocatedM3, 1)} / {fmtNum(m.capacityM3, 1)} m³</b></div>
          {bar(m.allocatedM3, m.capacityM3, '#1d89e8')}
        </div>
        <button onClick={precool} className={`absolute left-[28px] top-[380px] w-[396px] h-[65px] rounded-[12px] border-solid flex items-center justify-center gap-[12px] font-bold text-[18px] cursor-pointer ${m.precooled ? 'bg-[#eaf9f1] border-[#2ec170] border-[1.2px] text-[#2ec170]' : 'bg-white border-[#e4e8ee] border-[0.889px] text-[#1e2229]'}`}>
          <Icon name={m.precooled ? 'check' : 'snowflake'} size={20} color={m.precooled ? '#2ec170' : '#1e2229'} /> {m.precooled ? 'All Compartments Pre-Cooled' : 'Mark All Pre-Cooled'}
        </button>
        <div className="absolute left-[448px] top-[28px] w-[718px] flex justify-between">
          <span className="font-semibold text-[#8d9aab] text-[15.5px] uppercase">Sequence Plan (Last Out, First In)</span>
          <span className="font-bold text-[#e8453c] text-[16px]">{m.tripLabel}</span>
        </div>
        <div className="absolute left-[448px] top-[67px] w-[718px] bottom-[20px] flex flex-col gap-[13px] overflow-y-auto no-scrollbar">
          {m.stops.map((s) => (
            <div key={s.id} onClick={() => navigate('/loader/verify/' + s.id)} className={`relative h-[86px] shrink-0 bg-white rounded-[12px] border-solid cursor-pointer ${s.last ? 'border-[#e8453c] border-[1.2px]' : 'border-[#e4e8ee] border-[0.889px]'}`}>
              <p className="absolute left-[18px] top-[25px] font-bold text-[#e8453c] text-[12.5px]">{s.loadLabel}</p>
              <p className="absolute left-[18px] top-[43px] text-[#8d9aab] text-[14px]">Pos: #{s.seq}</p>
              <div className="absolute left-[135px] top-[18px] flex items-center gap-[10px]">
                <span className="font-bold text-[#1e2229] text-[18px] whitespace-nowrap">{s.title}</span>
                <span className="h-[20px] px-[7px] rounded-[4px] bg-[#eaf9f1] text-[#2ec170] font-bold text-[11.5px] flex items-center">{s.brand}</span>
              </div>
              <p className="absolute left-[135px] top-[49px] text-[#56616d] text-[15px] whitespace-nowrap">{s.cargo} • <b className="text-[#56616d]">{s.itemsLabel}</b></p>
              {s.verified
                ? <span className="absolute right-[72px] top-[47px] font-bold text-[#2ec170] text-[14px]">✓ VERIFIED</span>
                : <span className="absolute right-[72px] top-[47px] font-bold text-[#1d89e8] text-[14px] uppercase">{s.loadMode}</span>}
              <span className={`absolute right-[18px] top-[23px] size-[40px] rounded-[8px] flex items-center justify-center ${s.last ? 'border-[#e8453c] border-[1.2px] border-solid bg-white' : 'bg-[#f5f7fa]'}`}><Icon name="chevronRight" size={18} color="#1e2229" /></span>
            </div>
          ))}
        </div>
        {m.allVerified && (
          <button onClick={() => navigate('/loader/dispatch/' + id)} className="absolute left-[28px] top-[468px] w-[396px] h-[65px] rounded-[12px] bg-[#e8453c] text-white font-bold text-[18px] cursor-pointer">All stops verified → Dispatch</button>
        )}
      </>}
      <LToast toast={toast} />
    </Shell>
  )
}
