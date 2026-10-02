import { useEffect, useState } from 'react'
import Stage from '../../components/Stage'
import Icon from '../../components/Icon'
import { useAuth } from '../../lib/auth'

// Figma: "Loader iPad Pro 11\" - 2..5" (1194 x 834) — dock terminal header.
const stamp = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export default function LoaderShell({ title, height = 834, children }) {
  const { user, logout } = useAuth()
  const [now, setNow] = useState(new Date())
  const [menu, setMenu] = useState(false)
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id) }, [])
  return (
    <Stage width={1194} height={height} bg="#f5f7fa">
      <div className="absolute inset-0 bg-[#f5f7fa]">
        <header className="absolute left-0 top-0 w-[1194px] h-[84px] bg-white border-b-[0.889px] border-[#e4e8ee] border-solid">
          <img src="/img/logo.png" alt="WAYNEXO" className="absolute left-[28px] top-[19px] size-[46px] rounded-[9px]" />
          <p className="absolute left-[93px] top-[19px] font-bold text-[#1e2229] text-[21px] leading-[25px] whitespace-nowrap">{title}</p>
          <p className="absolute left-[93px] top-[47px] font-bold text-[#8d9aab] text-[13px] leading-[17px] uppercase whitespace-nowrap">WayNEXO Dock • {user?.depot?.name}</p>
          <div className="absolute left-[747px] top-[23px] w-[224px] h-[39px] rounded-[8px] bg-[#f5f7fa] flex items-center justify-center font-semibold text-[#56616d] text-[16px] tabular-nums">{stamp(now)}</div>
          <button onClick={() => setMenu(!menu)} className="absolute left-[989px] top-[23px] flex items-center gap-[10px] cursor-pointer">
            <img src={`/img/avatar-${user?.avatar || 'kasun'}.png`} alt="" className="size-[37px] rounded-full object-cover" />
            <span className="font-bold text-[#1e2229] text-[16px] whitespace-nowrap">{user?.fullName}</span>
          </button>
          {menu && <button onClick={logout} className="absolute right-[28px] top-[70px] z-30 bg-white rounded-[10px] shadow-lg border-[#e4e8ee] border-[0.889px] border-solid px-[16px] py-[12px] flex items-center gap-[8px] font-semibold text-[#e8453c] text-[15px] cursor-pointer"><Icon name="logOut" size={18} color="#e8453c" />End Shift</button>}
        </header>
        <main className="absolute left-0 top-[84px] w-[1194px]" style={{ height: height - 84 }}>{children}</main>
      </div>
    </Stage>
  )
}

export function LToast({ toast }) {
  if (!toast) return null
  const err = toast.type === 'error'
  return <div className="absolute left-1/2 -translate-x-1/2 bottom-[28px] z-50 px-[20px] py-[13px] rounded-[12px] shadow-lg text-[15px] font-semibold"
    style={{ background: err ? '#fee2e2' : '#1e2229', color: err ? '#b91c1c' : '#fff' }}>{toast.msg}</div>
}

export function Util({ label, pct, color }) {
  return (
    <div className="w-[256px]">
      <div className="flex justify-between text-[13px] leading-[16px]"><span className="text-[#56616d]">{label}</span><span className="font-bold text-[#1e2229]">{pct}%</span></div>
      <div className="mt-[6px] h-[6px] rounded-full bg-[#f5f7fa] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} /></div>
    </div>
  )
}
