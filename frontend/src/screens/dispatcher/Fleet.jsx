import { useState } from 'react'
import Shell from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { fmtNum } from '../../lib/fig'
import { FilterChip, Pill, Card } from './ui'

// Figma: "Dispatcher TV - 4" — Fleet Management
const STATE = {
  AVAILABLE: { bg: '#d1fae5', fg: '#10b981', label: 'Available' },
  EN_ROUTE: { bg: '#edf6fd', fg: '#1d89e8', label: 'En Route' },
  LOADING: { bg: '#f3efff', fg: '#8a5cf5', label: 'Loading' },
  IN_WORKSHOP: { bg: '#fef3c7', fg: '#f59e0b', label: 'In Workshop' },
}
const fuelColor = (p) => (p >= 0.9 ? '#ef4444' : p >= 0.5 ? '#f59e0b' : '#10b981')

export default function Fleet() {
  const [f, setF] = useState({ type: 'ALL', depot: 'PLG', state: 'ALL' })
  const q = `?type=${f.type}&depot=${f.depot}&state=${f.state}`
  const [d] = useApi('/dispatcher/fleet' + q, [q])
  const s = d?.summary
  const ic = <Icon name="chevronDown" size={12.444} color="#56616d" />
  return (
    <Shell active="fleet" title="Fleet Management" subtitle={`Monitor capacity, fuel quota, and active dispatch states of Weypoint's ${s?.total ?? 60} vehicles`} counts={d?.counts}
      bodyClass="gap-[17.778px]">
      <div className="flex items-center justify-between shrink-0 w-full">
        <div className="flex gap-[10.667px] items-start">
          <FilterChip label="Type" value={f.type} onChange={(v) => setF({ ...f, type: v })} icon={null}
            options={[{ value: 'ALL', label: 'All Types' }, { value: 'REEFER', label: 'Reefers' }, { value: 'DRY_BOX', label: 'Dry Box' }, { value: 'VAN', label: 'Vans' }]} />
          <FilterChip label="Depot" value={f.depot} onChange={(v) => setF({ ...f, depot: v })} icon={null}
            options={[{ value: 'ALL', label: 'All Depots' }, { value: 'PLG', label: 'Peliyagoda' }, { value: 'KDY', label: 'Kandy' }]} />
          <FilterChip label="State" value={f.state} onChange={(v) => setF({ ...f, state: v })} icon={null}
            options={[{ value: 'ALL', label: 'All States' }, { value: 'AVAILABLE', label: 'Available' }, { value: 'EN_ROUTE', label: 'En Route' }, { value: 'LOADING', label: 'Loading' }, { value: 'IN_WORKSHOP', label: 'In Workshop' }]} />
        </div>
        <p className="font-normal leading-[normal] text-[#56616d] text-[11.556px] whitespace-nowrap">
          {s ? `${s.total} Vehicles • ${s.reefers} Reefers • ${s.dryBox} Dry Box • ${s.vans} Vans` : ''}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-[17.778px] content-start flex-[1_0_0] min-h-px w-full overflow-y-auto no-scrollbar pb-[4px]">
        {(d?.vehicles || []).map((v) => {
          const st = STATE[v.state] || STATE.AVAILABLE
          const p = v.fuelQuota ? v.fuelUsed / v.fuelQuota : 0
          return (
            <Card key={v.id} className="flex flex-col gap-[10.667px] items-start p-[17.778px] h-[142px]">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-[7.111px] items-center">
                  <Icon name="truck" size={17.778} color="#e8453c" />
                  <p className="font-bold leading-[normal] text-[#1e2229] text-[12.444px] whitespace-nowrap">{v.code}</p>
                </div>
                <Pill bg={st.bg} fg={st.fg}>{st.label}</Pill>
              </div>
              <p className="font-normal leading-[normal] text-[#56616d] text-[10.667px] whitespace-nowrap">{v.typeLabel} • {v.depot}</p>
              <div className="flex flex-col gap-[5.333px] w-full">
                <div className="flex items-start justify-between leading-[normal] text-[9.778px] w-full whitespace-nowrap">
                  <p className="font-normal text-[#56616d]">Fuel Quota (Weekly)</p>
                  <p className="font-bold text-[#1e2229]">{fmtNum(v.fuelUsed)}L / {fmtNum(v.fuelQuota)}L</p>
                </div>
                <div className="bg-[#f5f7fa] h-[5.333px] overflow-clip rounded-[2.667px] w-full">
                  <div className="h-full rounded-[2.667px]" style={{ width: `${Math.min(100, p * 100)}%`, background: fuelColor(p) }} />
                </div>
              </div>
              <div className="border-[#e4e8ee] border-solid border-t-[0.889px] flex items-start justify-between leading-[normal] pt-[7.111px] text-[10.667px] w-full whitespace-nowrap">
                <p className="font-normal text-[#56616d]">Driver: {v.driverName}</p>
                <p className="font-bold text-[#1e2229]">Trip Count: {v.tripsToday}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </Shell>
  )
}
