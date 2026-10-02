import { useEffect, useMemo, useState } from 'react'
import Shell, { Toast } from './Shell'
import Icon from '../../components/Icon'
import { useApi, useCutoff, pad } from '../../lib/useApi'
import { api } from '../../lib/api'
import { fmtNum } from '../../lib/fig'
import { navigate } from '../../lib/router'

// Figma: "Store Manager MacBook Air - 2" — Stock Order Catalog + cart
const CATS = [['ALL', 'All'], ['CHILLED_PRODUCE', 'Chilled Produce'], ['DAIRY_EGGS', 'Dairy & Eggs'], ['DRY_GOODS', 'Dry Goods'], ['BAKERY', 'Bakery']]
const TEMP_TAG = { CHILLED: ['#edf6fd', '#1d89e8', 'CHILLED'], FROZEN: ['#f3efff', '#8a5cf5', 'FROZEN'], AMBIENT: ['#f5f7fa', '#56616d', 'AMBIENT'], AMBIENT_FRAGILE: ['#f5f7fa', '#56616d', 'AMBIENT'] }
const plural = (u, n) => (n === 1 ? u : u === 'box' ? 'boxes' : u === 'kg' ? 'kg' : u + 's')

export default function PlaceOrder() {
  const [d] = useApi('/store/catalog')
  const cut = useCutoff(d?.cutoffHour ?? 16)
  const [cat, setCat] = useState('CHILLED_PRODUCE')
  const [q, setQ] = useState('')
  const [step, setStep] = useState({})
  const [cart, setCart] = useState({})
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!d) return
    const s = {}; d.products.forEach((p, i) => { s[p.id] = i < 3 ? 12 : 0 })
    setStep(s)
    const c = {}; (d.suggested || []).forEach((x) => { c[x.productId] = x.qty })
    setCart(c)
    setDate(d.deliveryOptions[0]?.date || '')
  }, [d])

  const byId = useMemo(() => Object.fromEntries((d?.products || []).map((p) => [p.id, p])), [d])
  const visible = (d?.products || []).filter((p) => (cat === 'ALL' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()))
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ p: byId[id], n })).filter((l) => l.p)
  const totals = lines.reduce((t, { p, n }) => ({ n: t.n + n, kg: t.kg + p.unitWeightKg * n, m3: t.m3 + p.unitVolumeM3 * n, v: t.v + p.price * n }), { n: 0, kg: 0, m3: 0, v: 0 })
  const cats = new Set(lines.map((l) => l.p.category)).size
  const cold = lines.some((l) => l.p.tempClass === 'CHILLED' || l.p.tempClass === 'FROZEN')

  const submit = async () => {
    if (!lines.length) return flash('Add items to the cart first', 'error')
    setBusy(true)
    try {
      const r = await api.post('/store/orders', { deliveryDate: date, items: lines.map((l) => ({ productId: l.p.id, qty: l.n })) })
      setCart({}); flash(`Order #${r.code} submitted for ${r.deliveryLabel} — the dispatcher can see it now`)
      setTimeout(() => navigate('/store/history'), 1600)
    } catch (e) { flash(e.message, 'error') } finally { setBusy(false) }
  }

  return (
    <Shell active="order">
      <p className="absolute left-[28px] top-[29px] font-bold text-[#1e2229] text-[21.5px] leading-[26px]">Stock Order Catalog</p>
      <p className="absolute left-[28px] top-[58px] text-[#56616d] text-[12.4px] leading-[15px]">Dry &amp; chilled compliance orders closes daily at 4:00 PM.</p>
      <div className="absolute left-[629px] top-[37px] w-[264px] h-[28px] bg-[#fee2e2] rounded-[7px] flex items-center gap-[7px] px-[14px]">
        <Icon name="alarmClock" size={14} color="#e8453c" />
        <p className="font-bold text-[#e8453c] text-[11.6px] whitespace-nowrap tabular-nums">4 PM Daily Cutoff: {pad(cut.h)}h {pad(cut.m)}m remaining</p>
      </div>
      <div className="absolute left-[28px] top-[94px] w-[405px] h-[36px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[8px] flex items-center gap-[11px] px-[11px]">
        <Icon name="search" size={14} color="#8d9aab" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Fresh produce, refrigerated items, dairy..."
          className="flex-1 bg-transparent outline-none text-[12.4px] text-[#1e2229] placeholder:text-[#8d9aab]" />
      </div>
      <div className="absolute left-[448px] top-[94px] flex gap-[7.5px]">
        {CATS.map(([k, l]) => (
          <button key={k} onClick={() => setCat(k)} className={`h-[35px] px-[14px] rounded-[7px] text-[11.6px] font-semibold whitespace-nowrap cursor-pointer border-solid border-[0.889px] ${cat === k ? 'bg-[#e8453c] border-[#e8453c] text-white' : 'bg-white border-[#e4e8ee] text-[#56616d] hover:bg-[#fafbfc]'}`}>{l}</button>
        ))}
      </div>
      <div className="absolute left-[28px] top-[152px] w-[864px] h-[600px] grid grid-cols-3 gap-x-[14.6px] gap-y-[15px] content-start overflow-y-auto no-scrollbar">
        {visible.map((p) => {
          const [tb, tf, tl] = TEMP_TAG[p.tempClass]
          const n = step[p.id] ?? 0
          return (
            <div key={p.id} className="h-[126px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[12px] px-[15px] pt-[14px] relative">
              <span className="absolute left-[15px] top-[14px] h-[18px] px-[7px] rounded-[4px] flex items-center font-bold text-[9px]" style={{ background: tb, color: tf }}>{tl}</span>
              {p.frequent && <p className="absolute right-[14px] top-[14px] text-[#8d9aab] text-[10.6px]">Frequent reorder</p>}
              <p className="absolute left-[15px] top-[43px] right-[14px] font-semibold text-[#1e2229] text-[13.2px] leading-[16px] truncate">{p.name}</p>
              <p className="absolute left-[15px] top-[63px] text-[#56616d] text-[11.2px] leading-[14px]">LKR {fmtNum(p.price)} / {p.unit}</p>
              <div className="absolute left-[15px] top-[87px] flex items-center">
                <button onClick={() => setStep({ ...step, [p.id]: Math.max(0, n - 1) })} className="size-[25px] rounded-[5px] bg-[#f5f7fa] text-[#56616d] font-semibold text-[14px] cursor-pointer">-</button>
                <span className="w-[35px] text-center font-semibold text-[#1e2229] text-[12.4px] tabular-nums">{n}</span>
                <button onClick={() => setStep({ ...step, [p.id]: n + 1 })} className="size-[25px] rounded-[5px] bg-[#fdf0ef] text-[#e8453c] font-semibold text-[14px] cursor-pointer">+</button>
              </div>
              <button disabled={!n} onClick={() => { setCart({ ...cart, [p.id]: (cart[p.id] || 0) + n }); flash(`${n} × ${p.name} added to cart`) }}
                className="absolute right-[14px] top-[87px] h-[25px] w-[44px] rounded-[5px] bg-[#e8453c] text-white font-semibold text-[11.6px] cursor-pointer disabled:opacity-50">Add</button>
            </div>
          )
        })}
      </div>

      {/* cart */}
      <div className="absolute left-[914px] top-[29px] w-[338px] h-[712px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px]">
        <p className="absolute left-[21px] top-[21px] font-bold text-[#1e2229] text-[15.6px] leading-[19px]">Order Cart</p>
        <span className="absolute right-[22px] top-[21px] h-[19px] px-[7px] rounded-[4px] bg-[#eaf9f1] text-[#10b981] font-bold text-[9.8px] flex items-center">{d?.brand || 'FRESH'} DAILY</span>
        <p className="absolute left-[21px] top-[58px] font-semibold text-[#56616d] text-[11.6px]">Preferred Delivery Date</p>
        <div className="absolute left-[21px] top-[79px] w-[295px] h-[36px] bg-[#f5f7fa] border-[#e4e8ee] border-[0.889px] border-solid rounded-[7px] flex items-center px-[11px]">
          <p className="flex-1 font-semibold text-[#1e2229] text-[12.4px]">{d?.deliveryOptions.find((o) => o.date === date)?.label}</p>
          <Icon name="calendarDays" size={14} color="#56616d" />
          <select value={date} onChange={(e) => setDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
            {(d?.deliveryOptions || []).map((o) => <option key={o.date} value={o.date}>{o.label}</option>)}
          </select>
        </div>
        <div className="absolute left-[21px] top-[133px] w-[295px] h-[330px] flex flex-col gap-[14px] overflow-y-auto no-scrollbar">
          {lines.map(({ p, n }) => (
            <div key={p.id} className="flex items-center justify-between group">
              <div className="min-w-0">
                <p className="font-semibold text-[#1e2229] text-[12.4px] leading-[15px] truncate">{p.name}</p>
                <p className="text-[#56616d] text-[10.6px] leading-[13px] mt-[2px]">{n} {plural(p.unit, n)} × LKR {fmtNum(p.price)}</p>
              </div>
              <div className="flex items-center gap-[6px]">
                <p className="font-bold text-[#1e2229] text-[12.4px] whitespace-nowrap">LKR {fmtNum(p.price * n)}</p>
                <button onClick={() => { const c = { ...cart }; delete c[p.id]; setCart(c) }} title="Remove" className="opacity-0 group-hover:opacity-100 cursor-pointer"><Icon name="x" size={12} color="#8d9aab" /></button>
              </div>
            </div>
          ))}
          {!lines.length && <p className="text-[#8d9aab] text-[12px]">Your cart is empty. Add items from the catalog.</p>}
        </div>
        <span className="absolute left-[21px] top-[478px] w-[295px] h-[0.889px] bg-[#e4e8ee]" />
        <div className="absolute left-[21px] top-[496px] w-[295px] flex flex-col gap-[7px] text-[11.6px] leading-[14px]">
          {[['Total Items', `${totals.n} items (${cats} categor${cats === 1 ? 'y' : 'ies'})`, '#1e2229'],
            ['Estimated Weight / Volume', `${fmtNum(totals.kg, 1)} kg / ${fmtNum(totals.m3, 2)} m³`, '#1e2229'],
            ['Temperature Requirement', cold ? '2–8°C — Chilled' : 'Ambient', cold ? '#1d89e8' : '#1e2229'],
            ['Vehicle Requirement', cold ? 'Refrigerated' : 'Dry Box', cold ? '#1d89e8' : '#1e2229']].map(([l, v, c]) => (
            <div key={l} className="flex justify-between"><span className="text-[#56616d]">{l}</span><span className="font-bold" style={{ color: c }}>{v}</span></div>
          ))}
        </div>
        <span className="absolute left-[21px] top-[592px] w-[295px] h-[0.889px] bg-[#e4e8ee]" />
        <p className="absolute left-[21px] top-[612px] font-bold text-[#1e2229] text-[14px]">Total Order Value</p>
        <p className="absolute right-[22px] top-[608px] font-bold text-[#e8453c] text-[18px]">LKR {fmtNum(totals.v)}</p>
        <button disabled={busy} onClick={submit} className="absolute left-[21px] top-[649px] w-[295px] h-[41px] rounded-[7px] bg-[#e8453c] text-white font-bold text-[13px] cursor-pointer hover:brightness-95 disabled:opacity-70">
          {busy ? 'Submitting…' : 'Submit Stock Order'}
        </button>
      </div>
      <Toast toast={toast} />
    </Shell>
  )
}
