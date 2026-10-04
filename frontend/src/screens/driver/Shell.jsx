import Stage from '../../components/Stage'
import Icon from '../../components/Icon'
import StatusBar from '../../components/StatusBar'
import { Link, navigate } from '../../lib/router'
import { useConnectivity } from '../../lib/offline'

// Figma: "Driver Iphone 13 pro - 2..7" (390 x 844). Bottom tabs + offline banner.
const TABS = [['home', 'Home', 'house', '/driver'], ['routes', 'My Routes', 'mapPin', '/driver/trip/current'], ['report', 'Report', 'alertCircle', '/driver/report'], ['offline', 'Offline', 'wifiOff', '/driver/offline']]

export default function DriverShell({ active, children, footer, header, banner = true, responsive = true }) {
  const { online, queued } = useConnectivity()
  const showBanner = banner && !online
  if (responsive) return <div className="driver-responsive"><main className="driver-responsive-content">{showBanner && <div role="status" className="driver-offline">You are offline · {queued} outcomes waiting to sync</div>}{header}{children}</main><div className="driver-bottom">{footer && <div className="driver-action">{footer}</div>}<nav aria-label="Driver navigation">{TABS.map(([k,label,icon,to]) => <Link key={k} to={to} aria-current={active === k ? 'page' : undefined}><Icon name={icon} size={24} color={active === k ? '#e8453c' : '#56616d'}/><span>{label}</span></Link>)}</nav></div></div>
  return (
    <Stage width={390} height={844} bg="#f5f7fa">
      <div className="absolute inset-0 bg-[#f5f7fa]">
        <StatusBar />
        {showBanner && (
          <div className="absolute left-0 top-[44px] w-[390px] h-[57px] z-10 bg-[#fee2e2] border-y-[0.889px] border-[#f5a3a3] border-solid flex items-center gap-[10px] px-[12px]">
            <Icon name="wifiOff" size={20} color="#b91c1c" />
            <div>
              <p className="font-bold text-[#b91c1c] text-[14px] leading-[17px]">You are offline</p>
              <p className="text-[#b91c1c] text-[12px] leading-[15px]">{queued} recorded outcome{queued === 1 ? '' : 's'} queued for sync.</p>
            </div>
          </div>
        )}
        <div className="absolute left-0 w-[390px]" style={{ top: showBanner ? 57 : 0, bottom: 0 }}>
          {header}
          {children}
        </div>
        {footer && <div className="absolute left-0 top-[662px] w-[390px]">{footer}</div>}
        <nav className="absolute left-0 top-[726px] w-[390px] h-[72px] bg-white border-y-[0.889px] border-[#e4e8ee] border-solid flex justify-between px-[16px] pt-[16px]">
          {TABS.map(([k, label, icon, to]) => {
            const on = active === k || (k === 'offline' && !online)
            return (
              <Link key={k} to={to} className="w-[70px] flex flex-col items-center gap-[4px]">
                <Icon name={icon} size={24} color={on ? '#e8453c' : '#56616d'} stroke={1.8} />
                <span className={`text-[11px] leading-[13px] font-medium ${on ? 'text-[#e8453c]' : 'text-[#56616d]'}`}>{label}</span>
              </Link>
            )
          })}
        </nav>
        <span className="absolute left-[126px] top-[831px] w-[139px] h-[5px] rounded-full bg-[#1e2229] pointer-events-none" />
      </div>
    </Stage>
  )
}

export function MobileHeader({ title, subtitle, back = -1 }) {
  return <header className="driver-mobile-header">
    <button aria-label="Back" onClick={() => back === -1 ? history.back() : navigate(back)}><Icon name="chevronLeft" size={20} color="#1e2229" /></button>
    <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
  </header>
}

export function DToast({ toast }) {
  if (!toast) return null
  const err = toast.type === 'error'
  return <div role={err ? 'alert' : 'status'} className="driver-toast" style={{ background: err ? '#fee2e2' : '#1e2229', color: err ? '#b91c1c' : '#fff' }}>{toast.msg}</div>
}
