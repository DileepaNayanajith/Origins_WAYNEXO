import { useState } from 'react'
import Stage from '../../components/Stage'
import Icon from '../../components/Icon'
import { Link } from '../../lib/router'
import { useAuth } from '../../lib/auth'

// Figma: "Store Manager MacBook Air - 2..6" (1280 x 832) — shared header.
const TABS = [
  ['order', 'Place Order', '/store'], ['history', 'Order History', '/store/history'],
  ['schedule', 'Delivery Schedule', '/store/schedule'], ['receive', 'Receive Shipment', '/store/receive'],
]

export default function StoreShell({ active, children }) {
  const { user, logout } = useAuth()
  const [menu, setMenu] = useState(false)
  return (
    <Stage width={1280} height={832} bg="#f5f7fa">
      <div className="absolute inset-0 bg-[#f5f7fa]">
        <header className="absolute left-0 top-0 w-[1280px] h-[63px] bg-white border-b-[0.889px] border-[#e4e8ee] border-solid">
          <img src="/img/logo.png" alt="WAYNEXO" className="absolute left-[28px] top-[14px] w-[36px] h-[35px] rounded-[7px]" />
          <p className="absolute left-[75px] top-[16px] font-bold text-[#1e2229] text-[14.5px] leading-[17px] whitespace-nowrap">WAYNEXO Connect</p>
          <p className="absolute left-[75px] top-[34px] font-semibold text-[#8d9aab] text-[9.8px] leading-[12px] uppercase">Store Console</p>
          <nav className="absolute left-[240px] top-[17px] flex gap-[8px]">
            {TABS.map(([k, label, to]) => (
              <Link key={k} to={to} className={`h-[29px] px-[14px] rounded-[7px] flex items-center font-semibold text-[12.5px] whitespace-nowrap ${active === k ? 'bg-[#fdf0ef] text-[#e8453c]' : 'text-[#56616d] hover:bg-[#f5f7fa]'}`}>{label}</Link>
            ))}
          </nav>
          <div className="absolute left-[918px] top-[19px] w-[221px] h-[25px] bg-[#f5f7fa] rounded-[6px] flex items-center gap-[7px] px-[11px]">
            <span className="block size-[7px] rounded-full bg-[#10b981]" />
            <p className="flex-1 font-medium text-[#56616d] text-[11.6px] whitespace-nowrap truncate">{user?.outlet?.consoleLabel}</p>
            <Icon name="chevronDown" size={11} color="#56616d" stroke={2.5} />
          </div>
          <button onClick={() => setMenu((m) => !m)} className="absolute left-[1154px] top-[17px] flex items-center gap-[8px] cursor-pointer">
            <img src={`/img/avatar-${user?.avatar || 'nimal'}.png`} alt="" className="size-[28px] rounded-full object-cover" />
            <p className="font-bold text-[#1e2229] text-[11.6px] whitespace-nowrap">{user?.fullName}</p>
          </button>
          {menu && (
            <button onClick={logout} className="absolute right-[28px] top-[52px] z-30 bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[8px] shadow-lg flex gap-[8px] items-center px-[14px] py-[10px] text-[12px] font-semibold text-[#e8453c] cursor-pointer">
              <Icon name="logOut" size={14} color="#e8453c" /> Sign out
            </button>
          )}
        </header>
        <main className="absolute left-0 top-[63px] w-[1280px] h-[769px]">{children}</main>
      </div>
    </Stage>
  )
}

export const BRAND = { FRESH: ['#eaf9f1', '#10b981'], STYLE: ['#f3efff', '#8a5cf5'], TECH: ['#edf6fd', '#1d89e8'] }
export function BrandTag({ brand, className = '' }) {
  const [bg, fg] = BRAND[brand] || BRAND.FRESH
  return <span className={`inline-flex px-[7px] py-[3px] rounded-[4px] font-bold text-[9px] leading-[11px] uppercase ${className}`} style={{ background: bg, color: fg }}>{brand}</span>
}

export function Toast({ toast }) {
  if (!toast) return null
  const err = toast.type === 'error'
  return (
    <div className="absolute bottom-[28px] left-1/2 -translate-x-1/2 z-50 px-[18px] py-[12px] rounded-[10px] shadow-lg text-[13px] font-semibold"
      style={{ background: err ? '#fee2e2' : '#1e2229', color: err ? '#ef4444' : '#fff' }}>{toast.msg}</div>
  )
}
