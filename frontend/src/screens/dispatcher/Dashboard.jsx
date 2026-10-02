import { useEffect } from 'react'
import Shell from './Shell'
import Icon from '../../components/Icon'
import { useApi, useCutoff, pad } from '../../lib/useApi'
import { navigate } from '../../lib/router'
import { BRAND_PILL, Card } from './ui'

// Figma: "Dispatcher TV - 1" — Operations Control (SEE)
const ALERT_STYLE = {
  CRITICAL: { bg: '#fee2e2', icon: 'alertTriangle', color: '#ef4444' },
  WARNING: { bg: '#fef3c7', icon: 'alertTriangle', color: '#f59e0b' },
  INFO: { bg: '#f5f7fa', icon: 'checkCheck', color: '#56616d' },
}

function Ring({ percent }) {
  const r = 39.5, c = 2 * Math.PI * r
  return (
    <div className="flex items-center justify-center relative shrink-0 size-[106.667px]">
      <svg className="absolute left-0 top-0" width="88.889" height="88.889" viewBox="0 0 88.889 88.889">
        <circle cx="44.444" cy="44.444" r={r} fill="none" stroke="#e4e8ee" strokeWidth="9.5" />
        <circle cx="44.444" cy="44.444" r={r} fill="none" stroke="#e8453c" strokeWidth="9.5" strokeDasharray={`${(c * percent) / 100} ${c}`}
          transform="rotate(-90 44.444 44.444)" style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <p className="absolute font-bold leading-[normal] text-[#1e2229] text-[19.556px] whitespace-nowrap" style={{ left: 44.444, top: 44.444, transform: 'translate(-50%,-50%)' }}>{percent}%</p>
    </div>
  )
}

export default function Dashboard() {
  const [d, reload] = useApi('/dispatcher/overview')
  const cut = useCutoff(d?.cutoffHour ?? 16)
  useEffect(() => { const id = setInterval(reload, 20000); return () => clearInterval(id) }, [reload])

  return (
    <Shell active="dashboard" title="Operations Control" subtitle="Waypoint daily dispatch overview and alerts" counts={d?.counts} alerts={d?.criticalCount}
      bodyClass="gap-[21.333px]">
      {/* KPI row */}
      <div className="flex gap-[17.778px] items-start relative shrink-0 w-full">
        {(d?.brands || []).map((b) => (
          <Card key={b.brand} className="flex flex-[1_0_0] flex-col gap-[10.667px] items-start min-w-px p-[17.778px]">
            <div className="flex items-start justify-between w-full">
              <p className="font-semibold leading-[normal] text-[#8d9aab] text-[10.667px] uppercase whitespace-nowrap">{b.title}</p>
              <div className="flex items-start px-[7.111px] py-[3.556px] rounded-[5.333px]" style={{ background: BRAND_PILL[b.brand].bg }}>
                <p className="font-bold leading-[normal] text-[9.778px] whitespace-nowrap" style={{ color: BRAND_PILL[b.brand].fg }}>{b.brand}</p>
              </div>
            </div>
            <p className="font-bold leading-[0] text-[#1e2229] whitespace-nowrap">
              <span className="leading-[normal] text-[28.444px]">{b.outlets} </span>
              <span className="font-medium leading-[normal] text-[#56616d] text-[12.444px]">{b.cadence}</span>
            </p>
            <p className={`font-normal leading-[normal] text-[10.667px] whitespace-nowrap ${b.highlight ? 'text-[#10b981]' : 'text-[#56616d]'}`}>{b.note}</p>
          </Card>
        ))}
        <div className="bg-[#fdf0ef] border-[#e8453c] border-[0.889px] border-solid flex flex-[1_0_0] flex-col gap-[10.667px] items-start leading-[normal] min-w-px p-[17.778px] rounded-[10.667px] text-[#e8453c] whitespace-nowrap">
          <p className="font-bold text-[10.667px] uppercase">4 PM Daily Cutoff</p>
          <p className="font-bold text-[28.444px] tabular-nums">{pad(cut.h)}h {pad(cut.m)}m</p>
          <p className="font-semibold text-[10.667px]">{d?.uplink || 'Connecting…'}</p>
        </div>
      </div>

      <div className="flex flex-[1_0_0] gap-[17.778px] items-start min-h-px relative w-full">
        <div className="flex flex-col gap-[17.778px] h-full items-start relative shrink-0 w-[400px]">
          <Card className="flex flex-col gap-[17.778px] items-start p-[21.333px] shrink-0 w-full">
            <p className="font-bold leading-[normal] text-[#1e2229] text-[14.222px] whitespace-nowrap">Delivery Dispatch &amp; Completion</p>
            <div className="flex gap-[28.444px] items-center w-full">
              <Ring percent={d?.dispatch.percent ?? 0} />
              <div className="flex flex-[1_0_0] flex-col gap-[10.667px] items-start min-w-px">
                {[['#e8453c', `${d?.dispatch.dispatched ?? '-'} Dispatched`], ['#10b981', `${d?.dispatch.standby ?? '-'} Standby / Ready`], ['#f59e0b', `${d?.dispatch.workshop ?? '-'} In Workshop`]].map(([c, t]) => (
                  <div key={c} className="flex gap-[7.111px] items-center">
                    <span className="block rounded-full size-[8.889px]" style={{ background: c }} />
                    <p className="font-normal leading-[normal] text-[#56616d] text-[11.556px] whitespace-nowrap">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="flex flex-col gap-[17.778px] items-start p-[21.333px] shrink-0 w-full">
            <p className="font-bold leading-[normal] text-[#1e2229] text-[14.222px] whitespace-nowrap">Active Capacity Utilization</p>
            <div className="flex flex-col gap-[10.667px] items-start w-full">
              {[['Refrigerated (Chilled/Frozen)', d?.capacity.reefer ?? 0, '#2ec170'], ['Dry Box Fleet Volume', d?.capacity.dryBox ?? 0, '#1d89e8']].map(([l, v, c]) => (
                <div key={l} className="flex flex-col gap-[10.667px] w-full">
                  <div className="flex items-start justify-between leading-[normal] text-[11.556px] w-full whitespace-nowrap">
                    <p className="font-normal text-[#56616d]">{l}</p>
                    <p className="font-bold text-[#1e2229]">{v}%</p>
                  </div>
                  <div className="bg-[#f5f7fa] flex h-[7.111px] items-start overflow-clip rounded-[3.556px] w-full">
                    <div className="h-full" style={{ width: `${v}%`, background: c, transition: 'width .6s' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-[1_0_0] flex-col h-[443px] items-start min-w-px relative">
          <Card className="flex flex-[1_0_0] flex-col gap-[14.222px] items-start min-h-px p-[21.333px] w-full">
            <div className="flex items-center justify-between w-full">
              <p className="font-bold leading-[normal] text-[#1e2229] text-[14.222px] whitespace-nowrap">Live Alerts &amp; Activities</p>
              <div className="bg-[#fee2e2] flex items-start px-[7.111px] py-[3.556px] rounded-[5.333px]">
                <p className="font-bold leading-[normal] text-[#ef4444] text-[9.778px] whitespace-nowrap">{d?.criticalCount ?? 0} CRITICAL</p>
              </div>
            </div>
            <div className="flex flex-[1_0_0] flex-col gap-[10.667px] items-start min-h-px w-full overflow-y-auto no-scrollbar">
              {(d?.alerts || []).map((a) => {
                const s = ALERT_STYLE[a.severity] || ALERT_STYLE.INFO
                return (
                  <div key={a.id} className="flex gap-[10.667px] items-start p-[10.667px] rounded-[7.111px] shrink-0 w-full" style={{ background: s.bg }}>
                    <Icon name={s.icon} size={16} color={s.color} />
                    <p className="flex-[1_0_0] font-normal min-w-px text-[#1e2229] text-[11.556px] leading-[normal]">
                      <span className="font-bold">{a.title}</span> {a.message}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="border-[#e4e8ee] border-solid border-t-[0.889px] flex gap-[10.667px] items-start pt-[10.667px] w-full">
              <button onClick={() => navigate('/dispatcher/planning')} className="bg-[#e8453c] cursor-pointer flex flex-[1_0_0] items-start justify-center min-w-px px-[14.222px] py-[8.889px] rounded-[7.111px] hover:brightness-95">
                <p className="font-bold leading-[normal] text-[11.556px] text-black whitespace-nowrap">Go to Planning Workspace</p>
              </button>
              <button onClick={() => window.print()} className="border-[#e4e8ee] border-[0.889px] border-solid cursor-pointer flex flex-[1_0_0] items-start justify-center min-w-px px-[14.222px] py-[8.889px] rounded-[7.111px] bg-white hover:bg-[#f5f7fa]">
                <p className="font-bold leading-[normal] text-[#1e2229] text-[11.556px] whitespace-nowrap">Print Daily Report</p>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  )
}
