import { useState } from 'react'
import Shell, { BrandTag } from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { navigate } from '../../lib/router'

// Figma: "Store Manager MacBook Air - 3" — Stock Orders History
const STATUS = {
  DEFERRED: ['#fee2e2', '#ef4444'], IN_TRANSIT: ['#edf6fd', '#1d89e8'], SCHEDULED: ['#f3efff', '#8a5cf5'],
  PENDING: ['#fef3c7', '#f59e0b'], CONFIRMED: ['#d1fae5', '#10b981'], ASSIGNED: ['#edf6fd', '#1d89e8'], DELIVERED: ['#d1fae5', '#10b981'],
}

function Chip({ label, value, options, onChange, x, w }) {
  return (
    <label className="absolute top-[36px] h-[29px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[7px] flex items-center justify-between px-[14px] cursor-pointer" style={{ left: x, width: w }}>
      <span className="font-semibold text-[#56616d] text-[12.4px] whitespace-nowrap">{label}: {options.find((o) => o[0] === value)?.[1]}</span>
      <Icon name="chevronDown" size={11} color="#56616d" stroke={2.5} />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

export default function History() {
  const [status, setStatus] = useState('ALL')
  const [brand, setBrand] = useState('ALL')
  const [rows] = useApi(`/store/orders?status=${status}&brand=${brand}`, [status, brand])
  const action = (r) => {
    if (r.action === 'DEFERRAL') return <button onClick={() => navigate('/store/deferral/' + r.deferralId)} className="h-[25px] px-[11px] rounded-[6px] bg-[#fee2e2] font-semibold text-[#e8453c] text-[11.6px] cursor-pointer whitespace-nowrap">View Deferral Alert</button>
    if (r.action === 'TRACK') return <button onClick={() => navigate('/store/receive')} className="h-[25px] px-[11px] rounded-[6px] bg-white border-[#e4e8ee] border-[0.889px] border-solid font-semibold text-[#56616d] text-[11.6px] cursor-pointer whitespace-nowrap">Track Delivery</button>
    if (r.action === 'STAFF') return <button onClick={() => navigate('/store/schedule')} className="font-semibold text-[#56616d] text-[11.6px] cursor-pointer whitespace-nowrap hover:text-[#e8453c]">Manage Staff</button>
    return <span className="font-semibold text-[#10b981] text-[11.6px]">Receipt signed</span>
  }
  return (
    <Shell active="history">
      <p className="absolute left-[28px] top-[29px] font-bold text-[#1e2229] text-[21.5px] leading-[26px]">Stock Orders History</p>
      <p className="absolute left-[28px] top-[58px] text-[#56616d] text-[12.4px] leading-[15px]">Track placed orders, statuses, and deferred shipments.</p>
      <Chip label="Status" value={status} onChange={setStatus} x={966} w={152}
        options={[['ALL', 'All Orders'], ['PENDING', 'Pending'], ['DEFERRED', 'Deferred'], ['IN_TRANSIT', 'In Transit'], ['SCHEDULED', 'Scheduled'], ['DELIVERED', 'Delivered']]} />
      <Chip label="Brand" value={brand} onChange={setBrand} x={1129} w={122} options={[['ALL', 'All'], ['FRESH', 'Fresh'], ['STYLE', 'Style'], ['TECH', 'Tech']]} />
      <div className="absolute left-[28px] top-[94px] w-[1223px] max-h-[650px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] px-[21px] pt-[22px] pb-[21px] flex flex-col">
        <div className="flex h-[28px] border-b-[0.889px] border-[#e4e8ee] border-solid font-medium text-[#8d9aab] text-[11.6px] uppercase shrink-0">
          <span className="w-[133px]">Order ID</span><span className="w-[138px]">Date Placed</span><span className="w-[369px]">Items Summary</span>
          <span className="w-[167px]">Delivery Date</span><span className="w-[133px]">Status</span><span className="flex-1 text-right">Actions</span>
        </div>
        <div className="overflow-y-auto no-scrollbar">
          {(rows || []).map((r) => {
            const [sb, sf] = STATUS[r.status] || STATUS.PENDING
            return (
              <div key={r.id} className="flex items-center h-[53px] border-b-[0.889px] border-[#e4e8ee] border-solid">
                <span className="w-[133px] font-bold text-[#1e2229] text-[12.4px]">{r.code}</span>
                <span className="w-[138px] text-[#56616d] text-[12.4px]">{r.placed}</span>
                <span className="w-[369px] flex items-center gap-[8px] min-w-0 pr-[10px]">
                  <BrandTag brand={r.brand} className="!text-[9px] shrink-0" />
                  <span className="text-[#56616d] text-[12.4px] truncate">{r.itemsSummary} ({r.itemCount} items)</span>
                </span>
                <span className={`w-[167px] font-semibold text-[12.4px] ${r.deliveryAlert ? 'text-[#e8453c]' : 'text-[#1e2229]'}`}>{r.deliveryLabel}</span>
                <span className="w-[133px]"><span className="inline-flex h-[19px] items-center px-[7px] rounded-[5px] font-bold text-[9.8px] uppercase" style={{ background: sb, color: sf }}>{r.status.replace('_', ' ')}</span></span>
                <span className="flex-1 flex justify-end">{action(r)}</span>
              </div>
            )
          })}
          {rows && rows.length === 0 && <p className="py-[18px] text-[#8d9aab] text-[12.4px]">No orders for these filters.</p>}
        </div>
      </div>
    </Shell>
  )
}
