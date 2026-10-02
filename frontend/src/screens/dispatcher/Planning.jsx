import { useState } from 'react'
import Shell from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { fmtNum } from '../../lib/fig'
import { BrandPill, Card, Pill, Toast } from './ui'

// Figma: "Dispatcher TV - 3" — Daily Workspace (drag-and-assign + constraint checks)
function Bar({ label, value, max, suffix = '', maxSuffix = suffix, fmt = (v) => fmtNum(v) }) {
  const pct = Math.min(100, max ? (value / max) * 100 : 0)
  return (
    <div className="flex flex-[1_0_0] flex-col gap-[3.556px] items-start min-w-px">
      <div className="flex items-start justify-between leading-[normal] text-[9.778px] w-full whitespace-nowrap">
        <p className="font-normal text-[#56616d]">{label}</p>
        <p className="font-bold text-[#1e2229]">{fmt(value)}{suffix} / {fmt(max)}{maxSuffix}</p>
      </div>
      <div className="bg-[#f5f7fa] flex h-[5.333px] items-start overflow-clip rounded-[2.667px] w-full">
        <div className="bg-[#e8453c] h-full" style={{ width: `${pct}%`, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

function VehicleCard({ v, onDrop, armed }) {
  const [over, setOver] = useState(false)
  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(Number(e.dataTransfer.getData('text/plain'))) }}
      onClick={() => armed && onDrop(armed)}
      className={`bg-white border-[0.889px] border-solid flex flex-col gap-[14.222px] items-start p-[17.778px] min-h-[179.556px] rounded-[10.667px] shrink-0 w-full transition-colors
        ${over || armed ? 'border-[#e8453c] bg-[#fffafa] cursor-copy' : 'border-[#e4e8ee]'}`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-[7.111px] items-center">
          <Icon name="box" size={17.778} color="#e8453c" />
          <p className="font-bold leading-[normal] text-[#1e2229] text-[12.444px] whitespace-nowrap">{v.plate} ({v.typeLabel})</p>
        </div>
        <Pill bg="#d1fae5" fg="#10b981">Available</Pill>
      </div>
      <div className="flex gap-[17.778px] items-start w-full mt-[2px]">
        <Bar label="Volume Limit" value={v.loadM3} max={v.capacityM3} suffix="m³" fmt={(x) => fmtNum(x, 1)} />
        <Bar label="Weight Limit" value={v.loadKg} max={v.capacityKg} suffix="kg" />
      </div>
      <div className="flex gap-[17.778px] items-start w-full">
        <Bar label="Fuel Quota" value={v.fuelUsed} max={v.fuelQuota} suffix="" maxSuffix="L" />
        <div className="flex flex-[1_0_0] items-start justify-between leading-[normal] min-w-px text-[9.778px] whitespace-nowrap">
          <p className="font-normal text-[#56616d]">Trips Today</p>
          <p className="font-bold text-[#1e2229]">{v.tripsToday} / {v.maxTrips}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-[7.111px] items-center pt-[7.111px] w-full">
        <div className="bg-[#f5f7fa] flex items-start px-[8.889px] py-[5.333px] rounded-[5.333px]">
          <p className="font-semibold leading-[normal] text-[#1e2229] text-[10.667px] whitespace-nowrap">{v.depot}</p>
        </div>
        {v.assigned.length === 0 && <p className="font-normal leading-[normal] text-[#8d9aab] text-[10.667px]">→ Drop an order here</p>}
        {v.assigned.map((a) => (
          <span key={a.orderId} className="contents">
            <p className="font-normal leading-[normal] text-[#8d9aab] text-[10.667px]">→</p>
            <button title="Click to remove from this vehicle" onClick={(e) => { e.stopPropagation(); onDrop(-a.orderId) }}
              className="bg-[#eaf9f1] flex items-start px-[8.889px] py-[5.333px] rounded-[5.333px] cursor-pointer hover:line-through">
              <p className="font-semibold leading-[normal] text-[#2ec170] text-[10.667px] whitespace-nowrap">{a.code} ({a.outletShort})</p>
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function ConflictCard({ c, onDismiss }) {
  return (
    <div className="bg-white border-[#ef4444] border-[0.889px] border-solid flex flex-col gap-[10.667px] items-start p-[17.778px] rounded-[10.667px] shrink-0 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-[7.111px] items-center">
          <Icon name="box" size={17.778} color="#e8453c" />
          <p className="font-bold leading-[normal] text-[#1e2229] text-[12.444px] whitespace-nowrap">{c.vehicleLabel}</p>
        </div>
        <button onClick={onDismiss} title="Dismiss" className="cursor-pointer"><Pill bg="#fee2e2" fg="#ef4444">CONSTRAINT ERROR</Pill></button>
      </div>
      <p className="font-normal leading-[normal] text-[#ef4444] text-[10.667px]">{c.message}</p>
    </div>
  )
}

export default function Planning() {
  const [d, reload] = useApi('/dispatcher/planning')
  const [armed, setArmed] = useState(null)
  const [toast, setToast] = useState(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200) }

  const drop = (vehicleId) => async (orderId) => {
    setArmed(null)
    if (!orderId) return
    try {
      if (orderId < 0) { await api.post('/dispatcher/planning/unassign', { orderId: -orderId }); flash('Order returned to pending assignments') }
      else { await api.post('/dispatcher/planning/assign', { orderId, vehicleId }); flash('Order allocated — all constraints satisfied') }
    } catch (e) { flash(e.message, 'error') }
    reload()
  }
  const dismiss = async (id) => { await api.del('/dispatcher/planning/conflicts/' + id); reload() }

  const vehicles = d?.vehicles || []
  const conflicts = d?.conflicts || []
  return (
    <Shell active="planning" title="Daily Workspace" subtitle="Drag-and-assign outlet shipments, verify vehicle limits, and balance fuel quota" counts={d?.counts}
      bodyClass="flex-row gap-[17.778px]">
      <div className="flex flex-col gap-[14.222px] h-full items-start shrink-0 w-[373.333px]">
        <p className="font-bold leading-[normal] text-[#1e2229] text-[14.222px] whitespace-nowrap">Pending Route Assignments</p>
        <div className="flex flex-[1_0_0] flex-col gap-[10.667px] items-start min-h-px w-full overflow-y-auto no-scrollbar">
          {(d?.groups || []).map((g) => (
            <Card key={g.district} className="flex flex-col gap-[10.667px] items-start p-[14.222px] shrink-0 w-full">
              <div className="flex items-center justify-between leading-[normal] w-full whitespace-nowrap">
                <p className="font-bold text-[#1e2229] text-[12.444px]">{g.district} District</p>
                <p className="font-semibold text-[#8d9aab] text-[9.778px]">{g.orders.length} OUTLET{g.orders.length === 1 ? '' : 'S'}</p>
              </div>
              <div className="flex flex-col gap-[7.111px] items-start w-full">
                {g.orders.map((o) => (
                  <div key={o.id} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(o.id)); setArmed(null) }}
                    onClick={() => setArmed(armed === o.id ? null : o.id)}
                    className={`bg-[#f5f7fa] flex flex-col gap-[7.111px] items-start p-[10.667px] rounded-[7.111px] shrink-0 w-full cursor-grab active:cursor-grabbing
                      ${armed === o.id ? 'outline outline-[1.5px] outline-[#e8453c]' : ''}`}>
                    <div className="flex items-start justify-between w-full">
                      <p className="font-bold leading-[normal] text-[#1e2229] text-[11.556px] whitespace-nowrap">{o.code} ({o.brandTitle})</p>
                      <BrandPill brand={o.brand} />
                    </div>
                    <p className="font-normal leading-[normal] text-[#56616d] text-[9.778px] whitespace-nowrap">{o.outlet} • {fmtNum(o.weightKg)}kg • {fmtNum(o.volumeM3, 1).replace(/\.0$/, '')}m³</p>
                    {o.requiresReefer && (
                      <div className="flex gap-[3.556px] items-center">
                        <span className="block rounded-full size-[7.111px] bg-[#ef4444]" />
                        <p className="font-semibold leading-[normal] text-[#ef4444] text-[9.778px] whitespace-nowrap">Reefer Truck Required</p>
                      </div>
                    )}
                    {o.vanOnly && <div className="bg-[#fef3c7] px-[5.333px] py-[1.778px] rounded-[3.556px]"><p className="font-bold leading-[normal] text-[#f59e0b] text-[8.889px] whitespace-nowrap">VAN ONLY ACCESS</p></div>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {d && d.groups.length === 0 && <p className="text-[11.556px] text-[#8d9aab]">All confirmed orders are allocated.</p>}
        </div>
      </div>
      <div className="flex flex-[1_0_0] flex-col gap-[14.222px] h-full items-start min-w-px">
        <p className="font-bold leading-[normal] text-[#1e2229] text-[14.222px] whitespace-nowrap">
          Active Route &amp; Vehicle Builder {armed && <span className="font-medium text-[#e8453c] text-[11.556px] ml-[8px]">Select a vehicle for the highlighted order…</span>}
        </p>
        <div className="flex flex-[1_0_0] flex-col gap-[14.222px] items-start min-h-px w-full overflow-y-auto no-scrollbar">
          {vehicles.slice(0, 1).map((v) => <VehicleCard key={v.id} v={v} onDrop={drop(v.id)} armed={armed} />)}
          {conflicts.map((c) => <ConflictCard key={c.id} c={c} onDismiss={() => dismiss(c.id)} />)}
          {vehicles.slice(1).map((v) => <VehicleCard key={v.id} v={v} onDrop={drop(v.id)} armed={armed} />)}
        </div>
      </div>
      <Toast toast={toast} />
    </Shell>
  )
}
