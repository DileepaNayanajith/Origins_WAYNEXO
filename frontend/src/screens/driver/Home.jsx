import { useState } from 'react'
import Shell, { DToast } from './Shell'
import Icon from '../../components/Icon'
import { useCachedApi } from '../../lib/offline'
import { api } from '../../lib/api'
import { navigate } from '../../lib/router'
import { useAuth } from '../../lib/auth'

// Figma: "Driver Iphone 13 pro - 2" — driver home / today's runs
export default function Home() {
  const { logout } = useAuth()
  const [d] = useCachedApi('/driver/home')
  const [toast, setToast] = useState(null)
  const [menu, setMenu] = useState(false)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  const active = d?.trips.find((t) => t.id === d.activeTripId)

  const start = async () => {
    if (!active) return
    if (active.status === 'ACTIVE') return navigate('/driver/trip/' + active.id)
    try { await api.post(`/driver/trips/${active.id}/start`); navigate('/driver/trip/' + active.id) }
    catch (e) { flash(e.status === 0 ? 'No connection — the trip will start once you are back online' : e.message, 'error') }
  }

  return (
    <Shell active="home" footer={active && (
      <button onClick={start} className="ml-[16px] h-[52px] px-[22px] rounded-[12px] bg-[#e8453c] flex items-center gap-[10px] cursor-pointer shadow-[0_6px_16px_-6px_rgba(232,69,60,0.6)]">
        <span className="w-[2px] h-[20px] bg-white/80 rounded" />
        <span className="font-bold text-white text-[16px] whitespace-nowrap">{active.status === 'ACTIVE' ? 'Continue' : 'Start'} Trip {active.number} ({active.name})</span>
      </button>
    )}>
      <p className="absolute left-[20px] top-[72px] text-[#56616d] text-[14px] leading-[17px]">Ayubowan,</p>
      <p className="absolute left-[20px] top-[93px] font-bold text-[#1e2229] text-[22px] leading-[27px]">{d?.driverName}</p>
      <button onClick={() => setMenu(!menu)} className="absolute left-[326px] top-[74px] size-[44px] rounded-full bg-[#fdf0ef] flex items-center justify-center font-bold text-[#e8453c] text-[16px] cursor-pointer">{d?.initials}</button>
      {menu && <button onClick={logout} className="absolute right-[20px] top-[124px] z-20 bg-white rounded-[10px] shadow-lg px-[14px] py-[10px] flex items-center gap-[8px] text-[#e8453c] font-semibold text-[14px]"><Icon name="logOut" size={16} color="#e8453c" />Sign out</button>}

      <div className="absolute left-[16px] top-[148px] w-[358px] h-[110px] bg-white rounded-[16px] border-[#eef1f4] border-[0.889px] border-solid">
        <div className="absolute left-[16px] top-[16px] flex items-center gap-[8px]">
          <Icon name="truck" size={20} color="#e8453c" />
          <span className="font-bold text-[#1e2229] text-[15px]">{d?.vehicle?.plate}</span>
        </div>
        <span className="absolute right-[16px] top-[16px] h-[21px] px-[8px] rounded-[6px] bg-[#eaf9f1] text-[#2ec170] font-bold text-[11px] flex items-center uppercase">{d?.vehicle?.fleetLabel}</span>
        <span className="absolute left-[16px] top-[49px] w-[326px] h-[0.889px] bg-[#e4e8ee]" />
        <p className="absolute left-[16px] top-[61px] text-[#8d9aab] text-[11px] uppercase">Depot</p>
        <p className="absolute left-[16px] top-[78px] font-semibold text-[#1e2229] text-[13.5px]">{d?.vehicle?.depot}</p>
        <p className="absolute right-[16px] top-[61px] text-[#8d9aab] text-[11px] uppercase text-right">Max Payload</p>
        <p className="absolute right-[16px] top-[78px] font-semibold text-[#1e2229] text-[13.5px] text-right">{d?.vehicle?.maxPayload}</p>
      </div>

      <div className="absolute left-[16px] top-[274px] w-[358px] bg-white rounded-[16px] border-[#eef1f4] border-[0.889px] border-solid px-[16px] pt-[16px] pb-[16px]">
        <p className="font-bold text-[#1e2229] text-[15px] leading-[18px]">Today's Runs ({d?.weekday})</p>
        <div className="flex flex-col gap-[14px] mt-[14px]">
          {(d?.trips || []).map((t) => {
            const on = t.label === 'ACTIVE'
            return (
              <button key={t.id} onClick={() => navigate('/driver/trip/' + t.id)} className={`flex items-center gap-[12px] rounded-[12px] px-[12px] py-[12px] text-left cursor-pointer ${on ? 'bg-[#fdf0ef]' : 'bg-[#f5f7fa]'}`}>
                <span className={`size-[32px] rounded-full flex items-center justify-center font-bold text-white text-[14px] shrink-0 ${on ? 'bg-[#e8453c]' : t.label === 'DONE' ? 'bg-[#10b981]' : 'bg-[#56616d]'}`}>{t.number}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-[#1e2229] text-[14px] leading-[17px]">Trip {t.number}: {t.name}</span>
                  <span className="block text-[#56616d] text-[12px] leading-[15px] mt-[2px]">{t.outlets} outlets • Departs {t.departs} • {t.km} km</span>
                </span>
                <span className={`h-[21px] px-[8px] rounded-[6px] font-bold text-[11px] flex items-center ${on ? 'text-[#e8453c]' : t.label === 'DONE' ? 'bg-[#eaf9f1] text-[#10b981]' : 'bg-[#e4e8ee] text-[#56616d]'}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {d?.advisory && (
        <div className="absolute left-[16px] top-[499px] w-[358px] min-h-[75px] rounded-[12px] bg-[#fffbeb] border-[#f5c26b] border-[0.889px] border-solid flex items-center gap-[10px] px-[12px] py-[12px]">
          <Icon name="alertTriangle" size={20} color="#d97706" />
          <p className="text-[#78350f] text-[12.4px] leading-[17px]"><b>{d.advisory.title}</b> {d.advisory.message}</p>
        </div>
      )}
      <DToast toast={toast} />
    </Shell>
  )
}
