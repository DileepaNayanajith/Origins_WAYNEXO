import { useState } from 'react'
import Shell, { LToast } from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { navigate } from '../../lib/router'

// Figma: "Loader iPad Pro 11\" - 4" (1194 x 896) — Item Verification Station
const TEMP = { FROZEN: '#8a5cf5', CHILLED: '#1d89e8', AMBIENT: '#56616d', AMBIENT_FRAGILE: '#56616d' }
const COND = { GOOD: ['#eaf9f1', '#2ec170'], DAMAGED: ['#fef3c7', '#f59e0b'], SHORT: ['#fdf0ef', '#e8453c'], MISSING: ['#fdf0ef', '#e8453c'] }

export default function Verify({ id }) {
  const [v, , { setData }] = useApi('/loader/stops/' + id + '/verification')
  const [toast, setToast] = useState(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600) }
  const upd = async (item, patch) => setData(await api.put('/loader/items/' + item.id, patch))
  const flag = async () => { try { setData(await api.post(`/loader/stops/${id}/flag-shortfall`)); flash('Shortfall sent to dispatch') } catch (e) { flash(e.message, 'error') } }
  const verify = async () => {
    const r = await api.post(`/loader/stops/${id}/verify`); setData(r)
    flash('Stop verified ✓')
    setTimeout(() => navigate(r.nextStopId ? '/loader/verify/' + r.nextStopId : '/loader/dispatch/' + r.tripId), 700)
  }
  return (
    <Shell title="Item Verification Station" height={896}>
      {v && <>
        <div className="absolute left-[28px] top-[18px] w-[1138px] h-[82px] rounded-[12px] bg-[#1e2229] px-[19px] pt-[19px]">
          <p className="font-semibold text-[#a5acb3] text-[13px] uppercase">Loading Target</p>
          <p className="font-bold text-white text-[18px] mt-[3px]">{v.title}</p>
          <p className="absolute right-[19px] top-[19px] font-semibold text-[#a5acb3] text-[13px] uppercase">Vehicle ID</p>
          <p className="absolute right-[19px] top-[42px] font-bold text-[#e8453c] text-[19px]">{v.plate}</p>
        </div>
        <div className="absolute left-[28px] top-[120px] w-[1138px] h-[362px] flex flex-col gap-[10px] overflow-y-auto no-scrollbar">
          {v.items.map((i) => (
            <div key={i.id} className="relative h-[83px] shrink-0 bg-white rounded-[12px] border-[#e4e8ee] border-[0.889px] border-solid">
              <p className="absolute left-[18px] top-[19px] font-bold text-[#1e2229] text-[17px] whitespace-nowrap">{i.name}</p>
              <p className="absolute left-[18px] top-[47px] text-[14px] whitespace-nowrap"><span className="text-[#8d9aab]">{i.sku}</span> <span className="text-[#8d9aab]">•</span> <b style={{ color: TEMP[i.tempClass] }}>{i.temp}</b></p>
              <p className="absolute left-[368px] top-[33px] w-[92px] text-right text-[#56616d] text-[15px]">Expected: {i.expected}</p>
              <div className="absolute left-[475px] top-[18px] w-[142px] h-[46px] rounded-[10px] border-[#e4e8ee] border-[0.889px] border-solid bg-[#f5f7fa] flex items-center justify-between px-[4px]">
                <button onClick={() => upd(i, { loaded: i.loaded - 1 })} className="size-[36px] rounded-[7px] bg-white font-bold text-[#1e2229] text-[18px] cursor-pointer">-</button>
                <span className="font-bold text-[#1e2229] text-[19px] tabular-nums">{i.loaded}</span>
                <button onClick={() => upd(i, { loaded: i.loaded + 1 })} className="size-[36px] rounded-[7px] bg-white font-bold text-[#1e2229] text-[18px] cursor-pointer">+</button>
              </div>
              <div className="absolute left-[639px] top-[24px] flex gap-[5px]">
                {['GOOD', 'DAMAGED', 'SHORT', 'MISSING'].map((c) => {
                  const on = i.condition === c
                  return (
                    <button key={c} onClick={() => upd(i, { condition: c, ...(c === 'MISSING' ? { loaded: 0 } : {}) })}
                      className="h-[34px] px-[11px] rounded-[6px] font-semibold text-[14px] cursor-pointer border-solid"
                      style={on ? { background: COND[c][0], color: COND[c][1], borderColor: COND[c][1], borderWidth: 1.2 } : { background: '#f5f7fa', color: '#56616d', borderColor: 'transparent', borderWidth: 1.2 }}>{c}</button>
                  )
                })}
              </div>
            </div>
          ))}
          {!v.items.length && <p className="text-[#8d9aab] text-[15px] mt-[8px]">No itemised packing list for this stop — confirm crate count and verify.</p>}
        </div>
        <div className="absolute left-[839px] top-[493px] w-[327px] h-[130px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid px-[23px] pt-[23px]">
          <p className="font-bold text-[#1e2229] text-[16px]">Stop Verification Status</p>
          <div className="flex justify-between mt-[16px] text-[15px]"><span className="text-[#56616d]">Verified Items</span><b className="text-[#1e2229]">{v.loadedTotal} / {v.expectedTotal} loaded</b></div>
          <div className="flex justify-between mt-[10px] text-[15px]"><span className="text-[#56616d]">Flagged Exceptions</span><b className={v.shortfalls ? 'text-[#e8453c]' : 'text-[#2ec170]'}>{v.shortfalls} Shortfall{v.shortfalls === 1 ? '' : 's'}</b></div>
        </div>
        <button onClick={flag} disabled={!v.shortfalls} className="absolute left-[839px] top-[648px] w-[327px] h-[65px] rounded-[12px] bg-white border-[#e4e8ee] border-[0.889px] border-solid flex items-center justify-center gap-[12px] font-bold text-[#1e2229] text-[18px] cursor-pointer disabled:opacity-50">
          <Icon name={v.flagged ? 'checkCheck' : 'alertTriangle'} size={20} color={v.flagged ? '#2ec170' : '#1e2229'} /> {v.flagged ? 'Shortfall Flagged' : 'Flag Shortfall to Dispatch'}
        </button>
        <button onClick={verify} className="absolute left-[839px] top-[723px] w-[327px] h-[65px] rounded-[12px] bg-[#e8453c] flex items-center justify-center gap-[12px] font-bold text-white text-[18px] cursor-pointer">
          <Icon name="check" size={20} color="#fff" stroke={2.5} /> {v.verified ? 'Stop Verified — Next' : 'Verify Stop Complete'}
        </button>
      </>}
      <LToast toast={toast} />
    </Shell>
  )
}
