import { useState } from 'react'
import Stage from '../../components/Stage'
import Icon from '../../components/Icon'
import { Link } from '../../lib/router'
import { useAuth } from '../../lib/auth'

// Figma: "Dispatcher TV - 1..6" (1280 x 720). Sidebar + header are shared by every dispatcher screen.
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'gauge', to: '/dispatcher' },
  { key: 'orders', label: 'Orders', icon: 'package', to: '/dispatcher/orders', count: 'orders' },
  { key: 'planning', label: 'Planning', icon: 'chartGantt', to: '/dispatcher/planning' },
  { key: 'fleet', label: 'Fleet', icon: 'truck', to: '/dispatcher/fleet', count: 'vehicles' },
  { key: 'tracking', label: 'Tracking', icon: 'crosshair', to: '/dispatcher/tracking' },
  { key: 'deferrals', label: 'Deferrals', icon: 'calendarClock', to: '/dispatcher/deferrals', count: 'deferrals' },
]

export const todayLabel = () =>
  'Today: ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function DispatcherShell({ active, title, subtitle, counts, alerts = 1, children, bodyClass = '' }) {
  const { user, logout } = useAuth()
  const [menu, setMenu] = useState(false)
  return (
    <Stage width={1280} height={720} bg="#f5f7fa">
      <div className="absolute bg-[#f5f7fa] flex h-[720px] items-start left-0 top-0 w-[1280px]">
        {/* sidebar */}
        <div className="bg-white border-[#e4e8ee] border-r-[0.889px] border-solid flex flex-col h-full items-start justify-between p-[14.222px] relative shrink-0 w-[213.333px]">
          <div className="flex flex-col gap-[21.333px] items-start relative shrink-0 w-full">
            <div className="h-[36px] relative shrink-0 w-[185px]">
              <div className="absolute bg-[#e8453c] flex items-center justify-center left-[22.78px] rounded-[7.111px] size-[35.556px] top-[-0.22px] overflow-hidden">
                <img alt="WAYNEXO" className="size-full object-cover" src="/img/logo.png" />
              </div>
              <div className="absolute flex flex-col gap-[1.778px] items-start leading-[normal] left-[68.56px] top-[1.39px] whitespace-nowrap">
                <p className="font-bold text-[#1e2229] text-[16px]">WAYNEXO</p>
                <p className="font-semibold text-[#8d9aab] text-[9.778px] uppercase">{user?.depot?.name || 'Peliyagoda HQ'}</p>
              </div>
            </div>
            <nav className="flex flex-col gap-[3.556px] items-start relative shrink-0 w-full">
              {NAV.map((n) => {
                const on = n.key === active
                const count = n.count && counts ? counts[n.count] : null
                return (
                  <Link key={n.key} to={n.to}
                    className={`flex gap-[10.667px] items-center px-[14.222px] py-[10.667px] relative rounded-[7.111px] shrink-0 w-full ${on ? 'bg-[#fdf0ef]' : 'hover:bg-[#f5f7fa]'}`}>
                    <Icon name={n.icon} size={17.778} color={on ? '#e8453c' : '#56616d'} />
                    <p className={`flex-[1_0_0] leading-[normal] min-w-px text-[12.444px] ${on ? 'font-semibold text-[#e8453c]' : 'font-medium text-[#1e2229]'}`}>{n.label}</p>
                    {count != null && (
                      <div className={`flex items-start px-[7.111px] py-[1.778px] rounded-[88px] shrink-0 ${on ? 'bg-[#e8453c]' : 'bg-[#e4e8ee]'}`}>
                        <p className={`font-semibold leading-[normal] text-[9.778px] whitespace-nowrap ${on ? 'text-black' : 'text-[#56616d]'}`}>{count}</p>
                      </div>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="relative w-full">
            {menu && (
              <button onClick={logout} className="absolute bottom-[60px] left-0 right-0 bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[7.111px] shadow-lg flex gap-[8px] items-center px-[12px] py-[10px] text-[11.556px] font-semibold text-[#e8453c] cursor-pointer">
                <Icon name="logOut" size={14.222} color="#e8453c" /> Sign out
              </button>
            )}
            <button onClick={() => setMenu((m) => !m)} className="bg-[#f5f7fa] flex gap-[10.667px] items-center p-[10.667px] relative rounded-[10.667px] shrink-0 w-full cursor-pointer text-left">
              <img alt="" className="block rounded-full shrink-0 size-[32px] object-cover" src={`/img/avatar-${user?.avatar || 'harsha'}.png`} />
              <div className="flex flex-[1_0_0] flex-col gap-[1.778px] items-start leading-[normal] min-w-px whitespace-nowrap">
                <p className="font-semibold overflow-hidden text-[#1e2229] text-[11.556px] text-ellipsis">{user?.fullName}</p>
                <p className="font-normal text-[#56616d] text-[9.778px]">{user?.title}</p>
              </div>
              <Icon name="settings" size={14.222} color="#56616d" />
            </button>
          </div>
        </div>

        {/* main */}
        <div className="flex flex-[1_0_0] flex-col h-full items-start min-w-px relative">
          <div className="bg-white border-[#e4e8ee] border-b-[0.889px] border-solid flex items-center justify-between px-[28.444px] py-[14.222px] relative shrink-0 w-full">
            <div className="flex flex-col gap-[3.556px] items-start leading-[normal] relative shrink-0 whitespace-nowrap">
              <p className="font-bold text-[#1e2229] text-[21.333px]">{title}</p>
              <p className="font-normal text-[#56616d] text-[12.444px]">{subtitle}</p>
            </div>
            <div className="flex gap-[14.222px] items-center relative shrink-0">
              <div className="bg-[#f5f7fa] flex gap-[7.111px] items-center px-[10.667px] py-[7.111px] relative rounded-[7.111px] shrink-0">
                <Icon name="calendar" size={14.222} color="#56616d" />
                <p className="font-semibold leading-[normal] text-[#56616d] text-[11.556px] whitespace-nowrap">{todayLabel()}</p>
              </div>
              <Link to="/dispatcher" title={`${alerts} live alerts`} className="bg-[#f5f7fa] flex items-center justify-center relative rounded-[7.111px] shrink-0 size-[35.556px]">
                <Icon name="bellDot" size={17.778} color="#1e2229" />
                {alerts > 0 && <span className="absolute bg-[#e8453c] rounded-full size-[7.111px] left-[20.44px] top-[9.33px]" />}
              </Link>
            </div>
          </div>
          <div className={`flex flex-[1_0_0] ${bodyClass.includes('flex-row') ? '' : 'flex-col'} items-start min-h-px p-[28.444px] relative w-full ${bodyClass}`}>
            {children}
          </div>
        </div>
      </div>
    </Stage>
  )
}
