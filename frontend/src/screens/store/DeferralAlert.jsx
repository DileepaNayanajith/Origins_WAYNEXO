import { useState } from 'react'
import Shell, { Toast } from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { navigate } from '../../lib/router'

// Figma: "Store Manager MacBook Air - 6" — Order Deferred alert
export default function DeferralAlert({ id }) {
  const [d, reload] = useApi('/store/deferral' + (id ? `?id=${id}` : ''))
  const [toast, setToast] = useState(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  const x = d?.deferral

  const ack = async () => {
    await api.post(`/store/deferrals/${x.id}/acknowledge`)
    flash('Acknowledged — receiving staff scheduled for the new window'); reload()
  }

  return (
    <Shell active="history">
      {d && !x && (
        <div className="absolute left-[28px] top-[29px] w-[1223px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] p-[28px]">
          <p className="font-bold text-[#1e2229] text-[17px]">No deferred orders 🎉</p>
          <p className="text-[#56616d] text-[13px] mt-[6px]">All of your stock orders are on schedule.</p>
          <button onClick={() => navigate('/store/history')} className="mt-[14px] text-[#e8453c] font-semibold text-[13px] cursor-pointer">Back to Order History</button>
        </div>
      )}
      {x && (
        <>
          <div className="absolute left-[28px] top-[29px] w-[1223px] h-[311px] bg-white border-[#e8453c] border-[1.5px] border-solid rounded-[14px]">
            <div className="absolute left-[28px] top-[27px] size-[57px] rounded-[11px] bg-[#fee2e2] flex items-center justify-center">
              <Icon name="alertTriangle" size={30} color="#e8453c" stroke={1.8} />
            </div>
            <span className="absolute left-[113px] top-[27px] h-[20px] px-[11px] rounded-[4px] bg-[#fee2e2] flex items-center font-bold text-[#e8453c] text-[10.6px] uppercase">Order Deferred</span>
            <p className="absolute left-[240px] top-[30px] font-semibold text-[#56616d] text-[12.4px] whitespace-nowrap">Waypoint Dispatch Alert • {x.depot}</p>
            <p className="absolute left-[113px] top-[60px] font-bold text-[#1e2229] text-[25px] leading-[30px] whitespace-nowrap">Order #{x.orderCode} has been Deferred</p>
            <p className="absolute left-[113px] top-[97px] w-[1081px] text-[#56616d] text-[14.2px] leading-[21.5px]">
              <b className="text-[#56616d]">Reason:</b> {x.reason} Your grocery order has been moved to the next available early dispatch on {x.rescheduledShort}.
            </p>
            <div className="absolute left-[113px] top-[156px] w-[1081px] h-[75px] rounded-[8px] bg-[#fff8eb] border-[#f5c26b] border-[0.889px] border-solid px-[18px] pt-[17px]">
              <p className="text-[#56616d] text-[11.6px]">Rescheduled Delivery Window</p>
              <p className="font-bold text-[#1e2229] text-[17.8px] leading-[22px] mt-[3px]">{x.rescheduledLabel}</p>
            </div>
            <button onClick={ack} disabled={x.acknowledged}
              className="absolute left-[113px] top-[245px] h-[36px] w-[231px] rounded-[7px] bg-[#e8453c] text-white font-bold text-[12.4px] cursor-pointer disabled:bg-[#10b981]">
              {x.acknowledged ? '✓ Acknowledged & Staff Scheduled' : 'Acknowledge & Schedule Staff'}
            </button>
            <a href="tel:+94112345678" className="absolute left-[358px] top-[245px] h-[36px] w-[183px] rounded-[7px] bg-white border-[#e4e8ee] border-[0.889px] border-solid flex items-center justify-center font-semibold text-[#56616d] text-[12.4px]">Contact Dispatcher HQ</a>
          </div>
          <div className="absolute left-[28px] top-[361px] w-[601px] h-[115px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] px-[22px] pt-[21px]">
            <p className="font-bold text-[#1e2229] text-[14px] leading-[17px]">Urgent Alternative Actions</p>
            {x.alternatives.map((a, i) => (
              <button key={i} onClick={() => flash('Request sent to dispatcher: ' + a)} className="flex items-center gap-[11px] mt-[10px] text-left cursor-pointer group">
                <span className="size-[7px] rounded-full bg-[#e8453c]" />
                <span className="text-[#56616d] text-[12.4px] group-hover:text-[#e8453c]">{a}</span>
              </button>
            ))}
          </div>
          <div className="absolute left-[651px] top-[361px] w-[601px] h-[115px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] px-[21px] pt-[21px]">
            <p className="font-bold text-[#1e2229] text-[14px] leading-[17px]">Past Deferrals Log ({x.depot})</p>
            {x.history.slice(0, 2).map((h) => (
              <div key={h.code} className="flex justify-between mt-[10px]">
                <span className="font-semibold text-[#1e2229] text-[12.4px]">{h.code} • {h.date}</span>
                <span className="text-[#56616d] text-[11.6px]">{h.note}</span>
              </div>
            ))}
            {x.history.length === 0 && <p className="text-[#8d9aab] text-[12px] mt-[10px]">No earlier deferrals.</p>}
          </div>
        </>
      )}
      <Toast toast={toast} />
    </Shell>
  )
}
