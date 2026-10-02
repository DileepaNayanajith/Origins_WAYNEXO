import { useState } from 'react'
import Shell, { LToast } from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { navigate } from '../../lib/router'
import { fmtNum } from '../../lib/fig'

// Figma: "Loader iPad Pro 11\" - 5" — Ready for Dock Dispatch
export default function Dispatch({ id }) {
  const [d, , { setData }] = useApi('/loader/trips/' + id + '/dispatch')
  const [toast, setToast] = useState(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600) }
  const go = async () => {
    try { setData(await api.post(`/loader/trips/${id}/dispatch`)); flash('Vehicle released — driver can start the trip'); setTimeout(() => navigate('/loader'), 1500) }
    catch (e) { flash(e.message, 'error') }
  }
  const ok = d?.allVerified
  return (
    <Shell title="Ready for Dock Dispatch">
      {d && <>
        <div className={`absolute left-[28px] top-[28px] w-[1138px] h-[111px] rounded-[14px] border-[1.5px] border-solid ${ok ? 'bg-[#eaf9f1] border-[#2ec170]' : 'bg-[#fef3c7] border-[#f59e0b]'}`}>
          <span className={`absolute left-[27px] top-[27px] size-[57px] rounded-full flex items-center justify-center ${ok ? 'bg-[#2ec170]' : 'bg-[#f59e0b]'}`}><Icon name={ok ? 'check' : 'alertTriangle'} size={26} color="#fff" stroke={2.5} /></span>
          <p className="absolute left-[103px] top-[29px] font-bold text-[#1e2229] text-[23px]">{d.plate} {ok ? 'Fully Verified' : 'Verification Pending'}</p>
          <p className="absolute left-[103px] top-[63px] text-[#56616d] text-[16px]">{d.stopsLoaded} of {d.totalStops} Stops Loaded • {ok ? 'All Ambient & Reefer Cargo Secured' : 'Finish verifying every stop before dispatch'}</p>
          <span className={`absolute right-[28px] top-[40px] h-[31px] px-[14px] rounded-[6px] text-white font-bold text-[14px] flex items-center ${ok ? 'bg-[#2ec170]' : 'bg-[#f59e0b]'}`}>{d.dispatched ? 'DISPATCHED' : ok ? 'LOAD READY' : 'IN PROGRESS'}</span>
        </div>
        <div className="absolute left-[28px] top-[163px] w-[671px] flex flex-col gap-[22px]">
        <div className="w-[671px] min-h-[149px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid px-[23px] pt-[23px] pb-[23px]">
          <p className="font-bold text-[#1e2229] text-[16px]">Flagged Shortfalls &amp; Discrepancies</p>
          {d.shortfalls.map((s, k) => (
            <div key={k} className="mt-[14px] rounded-[8px] bg-[#f5f7fa] px-[18px] py-[12px] flex gap-[14px]">
              <Icon name="checkCheck" size={18} color="#2ec170" />
              <p className="text-[#1e2229] text-[15px] leading-[19px]"><b>{s.split(':')[0]}:</b>{s.slice(s.indexOf(':') + 1)}</p>
            </div>
          ))}
          {!d.shortfalls.length && <p className="text-[#2ec170] font-semibold text-[15px] mt-[14px]">No discrepancies — every item loaded as planned.</p>}
        </div>
        <div>
        <p className="font-bold text-[#56616d] text-[15.5px] uppercase">Secure Dispatch Vehicle Seal</p>
        <div className="mt-[12px] w-[671px] h-[65px] rounded-[12px] bg-white border-[#e8453c] border-[1.5px] border-solid flex items-center px-[20px] gap-[22px]">
          <Icon name="lock" size={24} color="#e8453c" />
          <span className="flex-1 font-bold text-[#1e2229] text-[19px] tracking-[0.2px]">{d.seal}</span>
          <span className="h-[25px] px-[10px] rounded-[5px] bg-[#fdf0ef] text-[#e8453c] font-bold text-[13px] flex items-center">LOCKED</span>
        </div>
        </div>
        </div>
        <div className="absolute left-[723px] top-[163px] w-[443px] h-[149px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid px-[23px] pt-[23px]">
          <p className="font-bold text-[#1e2229] text-[16px]">Final Load Weight Metrics</p>
          <div className="flex justify-between mt-[16px]"><span className="text-[#56616d] text-[15px]">Total Gross Weight</span><b className="text-[#1e2229] text-[16px]">{fmtNum(d.grossKg)} kg</b></div>
          {d.adjustmentKg > 0 && <p className="text-[#8d9aab] text-[9.5px]">({fmtNum(d.adjustmentKg)} kg shortfall adjustment applied)</p>}
          <div className="flex justify-between mt-[8px]"><span className="text-[#56616d] text-[15px]">Total Volume Loaded</span><b className="text-[#1e2229] text-[16px]">{fmtNum(d.volumeM3, 1)} m³</b></div>
        </div>
        <button onClick={() => window.print()} className="absolute left-[723px] top-[336px] w-[443px] h-[65px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid flex items-center justify-center gap-[12px] font-bold text-[#1e2229] text-[19px] cursor-pointer">
          <Icon name="printer" size={22} color="#1e2229" /> Print Loading Summary (Dock Receipt)
        </button>
        <button onClick={go} disabled={!ok || d.dispatched} className="absolute left-[723px] top-[411px] w-[443px] h-[65px] rounded-[12px] bg-[#e8453c] flex items-center justify-center gap-[12px] font-bold text-white text-[19px] cursor-pointer disabled:opacity-60">
          <Icon name="truck" size={22} color="#fff" /> {d.dispatched ? 'Vehicle Dispatched' : 'Dispatch Vehicle'}
        </button>
        {!ok && <button onClick={() => navigate('/loader/manifest/' + id)} className="absolute left-[723px] top-[486px] w-[443px] text-[#e8453c] font-semibold text-[15px] cursor-pointer">← Back to manifest to finish verification</button>}
      </>}
      <LToast toast={toast} />
    </Shell>
  )
}
