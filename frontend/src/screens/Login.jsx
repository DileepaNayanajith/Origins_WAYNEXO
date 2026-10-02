import { useEffect, useState } from 'react'
import Stage from '../components/Stage'
import Icon from '../components/Icon'
import StatusBar from '../components/StatusBar'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { Link } from '../lib/router'

// One login per device type (Figma): Store Manager = MacBook, Driver = iPhone, Loader = iPad, Dispatcher = TV.
// Whoever signs in is routed to *their own role's* interface.
const DEMO = import.meta.env?.VITE_DEMO !== 'false'

export function detectPortal() {
  const w = window.innerWidth, h = window.innerHeight
  const touch = navigator.maxTouchPoints > 0
  if (w < 700 && h > w) return 'driver'
  if (w / h >= 1.7 && w >= 1200) return 'dispatcher'
  if (touch && Math.max(w, h) <= 1400) return 'loader'
  return 'store'
}

function useOptions() {
  const [o, setO] = useState({ vehicles: [], outlets: [], depots: [] })
  useEffect(() => { api.get('/public/login-options').then(setO).catch(() => {}) }, [])
  return o
}

const BRAND = { FRESH: ['#eaf9f1', '#10b981'], STYLE: ['#f3efff', '#8a5cf5'], TECH: ['#edf6fd', '#1d89e8'] }

function Err({ msg, className = '' }) {
  return msg ? <p className={`font-semibold text-[#e8453c] ${className}`}>{msg}</p> : null
}

/* ----------------------------------------------------------- Store Manager (Figma: Store Manager MacBook Air - 1) */
function StoreLogin({ submit, busy, error }) {
  const opts = useOptions()
  const [f, setF] = useState({ identifier: DEMO ? 'nimal.silva@keells.com' : '', password: DEMO ? 'store123' : '', outletCode: 'OUT004' })
  const outlet = opts.outlets.find((o) => o.value === f.outletCode)
  const field = 'bg-[#f5f7fa] border-[#e4e8ee] border-[0.889px] border-solid rounded-[8px] flex items-center gap-[14px] px-[15px] w-full'
  return (
    <Stage width={1280} height={832} bg="#ffffff">
      <form onSubmit={(e) => { e.preventDefault(); submit({ ...f, portal: 'STORE' }) }} className="absolute left-[404px] top-[160px] w-[473px] flex flex-col">
        <p className="font-extrabold text-[#1e2229] text-[36px] leading-[44px] tracking-[-0.5px]">Sign In</p>
        <p className="font-normal text-[#56616d] text-[16px] leading-[19px] mt-[9px]">Access your outlet manager dashboard and catalogs.</p>
        <label className="font-semibold text-[#56616d] text-[14.5px] leading-[18px] mt-[36px]">Work Email Address</label>
        <div className={`${field} h-[52px] mt-[9px]`}>
          <Icon name="mail" size={20} color="#8d9aab" />
          <input value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} autoComplete="username"
            className="flex-1 bg-transparent outline-none font-normal text-[#1e2229] text-[16px]" placeholder="name@company.com" />
        </div>
        <div className="flex justify-between mt-[22px]">
          <label className="font-semibold text-[#56616d] text-[14.5px] leading-[18px]">Password</label>
          <button type="button" onClick={() => alert('Please contact Peliyagoda HQ IT desk to reset your password.')} className="font-semibold text-[#e8453c] text-[14.5px] leading-[18px] cursor-pointer">Forgot Password?</button>
        </div>
        <div className={`${field} h-[52px] mt-[9px]`}>
          <Icon name="lock" size={20} color="#8d9aab" />
          <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password"
            className="flex-1 bg-transparent outline-none text-[#8d9aab] text-[16px] tracking-[2px]" placeholder="••••••••" />
        </div>
        <label className="font-semibold text-[#56616d] text-[14.5px] leading-[18px] mt-[23px]">Select Outlet &amp; Brand</label>
        <div className={`${field} h-[56px] mt-[9px] relative`}>
          {outlet && <span className="px-[9px] py-[4px] rounded-[5px] font-bold text-[12px] leading-[15px]" style={{ background: BRAND[outlet.tag][0], color: BRAND[outlet.tag][1] }}>{outlet.tag}</span>}
          <span className="flex-1 font-semibold text-[#1e2229] text-[16px] truncate">{outlet ? outlet.label : 'Select outlet'}</span>
          <Icon name="chevronDown" size={18} color="#56616d" />
          <select value={f.outletCode} onChange={(e) => setF({ ...f, outletCode: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer">
            {opts.outlets.map((o) => <option key={o.value} value={o.value}>{o.tag} — {o.label}</option>)}
          </select>
        </div>
        <button disabled={busy} className="bg-[#e8453c] h-[52px] rounded-[8px] mt-[35px] font-bold text-white text-[16.5px] cursor-pointer hover:brightness-95 disabled:opacity-70">
          {busy ? 'Signing in…' : 'Log In to WAYNEXO'}
        </button>
        <Err msg={error} className="text-[14px] mt-[14px] text-center" />
      </form>
    </Stage>
  )
}

/* ----------------------------------------------------------- Driver (Figma: Driver Iphone 13 pro - 1) */
function DriverLogin({ submit, busy, error }) {
  const opts = useOptions()
  const [f, setF] = useState({ identifier: DEMO ? 'WP-9042' : '', password: DEMO ? 'driver123' : '', vehicleCode: 'RE-04' })
  const v = opts.vehicles.find((x) => x.value === f.vehicleCode)
  const box = 'bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[10px] h-[48px] flex items-center gap-[10px] px-[14px] mt-[8px]'
  return (
    <Stage width={390} height={844} bg="#f5f7fa">
      <StatusBar />
      <form onSubmit={(e) => { e.preventDefault(); submit({ ...f, portal: 'DRIVER' }) }} className="absolute inset-0">
        <img src="/img/logo.png" alt="WAYNEXO" className="absolute left-[162px] top-[116px] w-[66px] h-[64px] rounded-[12px]" />
        <p className="absolute left-0 right-0 top-[196px] text-center font-extrabold text-[#1e2229] text-[28px] leading-[34px] tracking-[-0.3px]">WAYNEXO</p>
        <p className="absolute left-0 right-0 top-[234px] text-center font-semibold text-[#8d9aab] text-[13.5px] leading-[17px] uppercase tracking-[0.5px]">Driver Portal</p>
        <div className="absolute left-[24px] top-[283px] w-[342px]">
          <p className="font-semibold text-[#56616d] text-[13px] leading-[16px]">Employee ID</p>
          <div className={box}>
            <Icon name="user" size={20} color="#56616d" />
            <input value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} className="flex-1 bg-transparent outline-none text-[15px] text-[#56616d]" placeholder="WP-0000" />
          </div>
          <p className="font-semibold text-[#56616d] text-[13px] leading-[16px] mt-[20px]">Password</p>
          <div className={box}>
            <Icon name="lock" size={20} color="#56616d" />
            <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="flex-1 bg-transparent outline-none text-[15px] text-[#56616d] tracking-[2px]" />
          </div>
          <p className="font-semibold text-[#56616d] text-[13px] leading-[16px] mt-[20px]">Select Vehicle (Peliyagoda Depot)</p>
          <div className={`${box} !border-[#e8453c] relative`} style={{ borderColor: '#e8453c', borderWidth: 1.5 }}>
            <Icon name="truck" size={20} color="#e8453c" />
            <span className="flex-1 font-bold text-[15px] text-[#1e2229] truncate">{v ? v.label : 'Select vehicle'}</span>
            <Icon name="chevronDown" size={16} color="#1e2229" />
            <select value={f.vehicleCode} onChange={(e) => setF({ ...f, vehicleCode: e.target.value })} className="absolute inset-0 opacity-0">
              {opts.vehicles.filter((x) => x.tag === 'Peliyagoda').map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <Err msg={error} className="text-[13px] mt-[12px]" />
        </div>
        <button disabled={busy} className="absolute left-[24px] top-[680px] w-[342px] h-[51px] bg-[#e8453c] rounded-[12px] font-bold text-white text-[16px] cursor-pointer disabled:opacity-70">
          {busy ? 'Initializing…' : 'Sign In & Initialize Vehicle'}
        </button>
        <p className="absolute left-[24px] top-[751px] w-[342px] text-center text-[#8d9aab] text-[12px] leading-[15px]">WAYNEXO • Peliyagoda HQ</p>
      </form>
      <HomeIndicator />
    </Stage>
  )
}

export function HomeIndicator() {
  return <span className="absolute left-[126px] top-[807px] w-[139px] h-[5px] rounded-full bg-[#1e2229] pointer-events-none" />
}

/* ----------------------------------------------------------- Loader (Figma: Loader iPad Pro 11" - 1) */
function LoaderLogin({ submit, busy, error }) {
  const [f, setF] = useState({ identifier: DEMO ? 'WP-042' : '', depotCode: 'PLG' })
  const depot = (code, label, x, w) => {
    const on = f.depotCode === code
    return (
      <button type="button" onClick={() => setF({ ...f, depotCode: code })}
        className={`absolute top-[399px] h-[47px] rounded-[10px] border-solid font-bold text-[15px] cursor-pointer ${on ? 'bg-[#fdf0ef] border-[#e8453c] border-[1.8px] text-[#e8453c]' : 'bg-white border-[#e4e8ee] border-[0.889px] text-[#56616d]'}`}
        style={{ left: x, width: w }}>{label}</button>
    )
  }
  return (
    <Stage width={1194} height={834} bg="#f5f7fa">
      <form onSubmit={(e) => { e.preventDefault(); submit({ ...f, portal: 'LOADER' }) }}
        className="absolute left-[343px] top-[134px] w-[508px] h-[566px] bg-white rounded-[24px] border-[#e4e8ee] border-[0.889px] border-solid shadow-[0_12px_30px_-6px_rgba(16,24,40,0.08)]" />
      <img src="/img/logo.png" alt="WAYNEXO" className="absolute left-[560px] top-[178px] w-[75px] h-[73px] rounded-[12px]" />
      <p className="absolute left-[343px] w-[508px] top-[265px] text-center font-extrabold text-[#1e2229] text-[25.5px] leading-[31px]">WAYNEXO Dock</p>
      <p className="absolute left-[343px] w-[508px] top-[300px] text-center text-[#56616d] text-[12.5px] leading-[15px]">Warehouse Dispatch &amp; Loading Terminal</p>
      <span className="absolute left-[387px] top-[344px] w-[421px] h-[0.889px] bg-[#e4e8ee]" />
      <p className="absolute left-[387px] top-[373px] font-bold text-[#56616d] text-[12.5px] leading-[15px] uppercase">Select Active Depot</p>
      {depot('PLG', 'Peliyagoda HQ', 387, 206)}
      {depot('KDY', 'Kandy Depot', 603, 204)}
      <p className="absolute left-[387px] top-[475px] font-bold text-[#56616d] text-[12.5px] leading-[15px] uppercase">Loader Sign-In</p>
      <div className="absolute left-[387px] top-[501px] w-[421px] h-[72px] bg-[#f5f7fa] border-[#e4e8ee] border-[0.889px] border-solid rounded-[12px] flex items-center gap-[14px] px-[18px]">
        <Icon name="userCheck" size={22} color="#8d9aab" />
        <input value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') submit({ ...f, portal: 'LOADER' }) }}
          placeholder="Scan employee barcode or enter ID (e.g. WP-042)..." className="flex-1 bg-transparent outline-none text-[15px] text-[#1e2229] placeholder:text-[#8d9aab]" />
      </div>
      <button disabled={busy} onClick={() => submit({ ...f, portal: 'LOADER' })}
        className="absolute left-[387px] top-[602px] w-[421px] h-[54px] bg-[#e8453c] rounded-[10px] font-bold text-white text-[15px] cursor-pointer disabled:opacity-70">
        {busy ? 'Starting…' : 'Start Shift'}
      </button>
      <Err msg={error} className="absolute left-[387px] top-[664px] w-[421px] text-center text-[13px]" />
    </Stage>
  )
}

/* ----------------------------------------------------------- Dispatcher (TV control tower, same design language) */
function DispatcherLogin({ submit, busy, error }) {
  const [f, setF] = useState({ identifier: DEMO ? 'harsha.perera@waynexo.lk' : '', password: DEMO ? 'dispatch123' : '' })
  const field = 'bg-[#f5f7fa] border-[#e4e8ee] border-[0.889px] border-solid rounded-[7.111px] h-[42px] flex items-center gap-[10px] px-[12px] mt-[7px]'
  return (
    <Stage width={1280} height={720} bg="#f5f7fa">
      <form onSubmit={(e) => { e.preventDefault(); submit({ ...f, portal: 'DISPATCHER' }) }}
        className="absolute left-[440px] top-[110px] w-[400px] bg-white rounded-[16px] border-[#e4e8ee] border-[0.889px] border-solid shadow-[0_12px_30px_-6px_rgba(16,24,40,0.08)] p-[32px] flex flex-col">
        <div className="flex gap-[12px] items-center">
          <img src="/img/logo.png" alt="" className="size-[44px] rounded-[8px]" />
          <div>
            <p className="font-bold text-[#1e2229] text-[19px] leading-[23px]">WAYNEXO Control Tower</p>
            <p className="font-semibold text-[#8d9aab] text-[10px] uppercase leading-[14px]">Dispatcher • Peliyagoda HQ</p>
          </div>
        </div>
        <span className="h-[0.889px] bg-[#e4e8ee] my-[22px]" />
        <label className="font-semibold text-[#56616d] text-[11.556px]">Email or Employee ID</label>
        <div className={field}><Icon name="user" size={16} color="#8d9aab" />
          <input value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} className="flex-1 bg-transparent outline-none text-[13px] text-[#1e2229]" /></div>
        <label className="font-semibold text-[#56616d] text-[11.556px] mt-[16px]">Password</label>
        <div className={field}><Icon name="lock" size={16} color="#8d9aab" />
          <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="flex-1 bg-transparent outline-none text-[13px] text-[#1e2229]" /></div>
        <button disabled={busy} className="bg-[#e8453c] h-[42px] rounded-[7.111px] mt-[24px] font-bold text-black text-[12.444px] cursor-pointer disabled:opacity-70">
          {busy ? 'Signing in…' : 'Open Operations Control'}
        </button>
        <Err msg={error} className="text-[11.556px] mt-[10px] text-center" />
      </form>
      <div className="absolute left-0 right-0 top-[640px] flex justify-center gap-[18px] text-[11px] text-[#8d9aab]">
        <span>Other portals:</span>
        <Link to="/login/store" className="font-semibold text-[#56616d] hover:text-[#e8453c]">Store Manager</Link>
        <Link to="/login/driver" className="font-semibold text-[#56616d] hover:text-[#e8453c]">Driver</Link>
        <Link to="/login/loader" className="font-semibold text-[#56616d] hover:text-[#e8453c]">Loader Dock</Link>
      </div>
    </Stage>
  )
}

export default function Login({ portal }) {
  const { login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const p = ['store', 'driver', 'loader', 'dispatcher'].includes(portal) ? portal : detectPortal()
  const submit = async (payload) => {
    setBusy(true); setError(null)
    try { await login(payload) } catch (e) { setError(e.status === 0 ? 'Cannot reach the WAYNEXO server. Is the backend running?' : e.message) } finally { setBusy(false) }
  }
  const P = { store: StoreLogin, driver: DriverLogin, loader: LoaderLogin, dispatcher: DispatcherLogin }[p]
  return <P submit={submit} busy={busy} error={error} />
}
