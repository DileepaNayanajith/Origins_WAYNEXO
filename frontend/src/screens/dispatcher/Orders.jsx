import { useMemo, useState } from 'react'
import Shell from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { fmtNum } from '../../lib/fig'
import { BrandPill, StatusPill, FilterChip, Toast } from './ui'

// Figma: "Dispatcher TV - 2" — Orders Desk
const COLS = [['ORDER ID', 106.667], ['OUTLET NAME', 195.556], ['BRAND', 106.667], ['VOL (M³)', 88.889], ['WEIGHT (KG)', 88.889],
  ['TEMP COMPLIANCE', 133.333], ['DELIVERY WINDOW', 133.333]]

export default function Orders() {
  const [f, setF] = useState({ brand: 'ALL', district: 'ALL', status: 'ALL' })
  const q = `?brand=${f.brand}&district=${encodeURIComponent(f.district)}&status=${f.status}`
  const [d, reload] = useApi('/dispatcher/orders' + q, [q])
  const [sel, setSel] = useState(new Set())
  const [toast, setToast] = useState(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600) }

  const districts = useMemo(() => [{ value: 'ALL', label: 'All Districts' }, ...(d?.districts || []).map((x) => ({ value: x, label: x }))], [d])
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const bulkConfirm = async () => {
    const pending = (d?.orders || []).filter((o) => o.status === 'PENDING' && (sel.size === 0 || sel.has(o.id))).map((o) => o.id)
    if (!pending.length) return flash(sel.size ? 'Selected orders are already confirmed' : 'No pending orders in this view', 'error')
    const r = await api.post('/dispatcher/orders/confirm', { ids: pending })
    setSel(new Set()); reload(); flash(`${r.updated} order${r.updated === 1 ? '' : 's'} confirmed for planning`)
  }

  return (
    <Shell active="orders" title="Orders Desk" subtitle="Verify incoming order demands, brand constraints, and delivery deadlines" counts={d?.counts}
      bodyClass="gap-[17.778px]">
      <div className="flex items-center justify-between relative shrink-0 w-full">
        <div className="flex gap-[10.667px] items-start">
          <FilterChip label="Brand" value={f.brand} onChange={(v) => setF({ ...f, brand: v })} icon={<Icon name="list" size={12.444} color="#56616d" />}
            options={[{ value: 'ALL', label: 'All Brands' }, { value: 'FRESH', label: 'Fresh' }, { value: 'STYLE', label: 'Style' }, { value: 'TECH', label: 'Tech' }]} />
          <FilterChip label="District" value={f.district} onChange={(v) => setF({ ...f, district: v })} icon={<Icon name="list" size={12.444} color="#56616d" />} options={districts} />
          <FilterChip label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} icon={<Icon name="list" size={12.444} color="#56616d" />}
            options={[{ value: 'ALL', label: 'All' }, { value: 'PENDING', label: 'Pending' }, { value: 'CONFIRMED', label: 'Confirmed' }, { value: 'ASSIGNED', label: 'Assigned' }, { value: 'DEFERRED', label: 'Deferred' }]} />
        </div>
        <div className="flex gap-[10.667px] items-start">
          <button onClick={bulkConfirm} className="bg-[#e8453c] cursor-pointer flex items-start px-[14.222px] py-[7.111px] rounded-[7.111px] hover:brightness-95">
            <p className="font-bold leading-[normal] text-[11.556px] text-black whitespace-nowrap">Bulk Confirm Selection{sel.size ? ` (${sel.size})` : ''}</p>
          </button>
          <button onClick={() => api.download('/dispatcher/orders/export.csv' + q, 'waynexo-orders.csv')} className="bg-white border-[#e4e8ee] border-[0.889px] border-solid cursor-pointer flex items-start px-[14.222px] py-[7.111px] rounded-[7.111px] hover:bg-[#f5f7fa]">
            <p className="font-semibold leading-[normal] text-[#1e2229] text-[11.556px] whitespace-nowrap">Export CSV</p>
          </button>
        </div>
      </div>
      <div className="bg-white border-[#e4e8ee] border-[0.889px] border-solid flex flex-[1_0_0] flex-col items-start min-h-px relative rounded-[10.667px] w-full overflow-hidden">
        <div className="bg-[#f5f7fa] border-[#e4e8ee] border-b-[0.889px] border-solid flex font-bold items-start leading-[normal] px-[21.333px] py-[14.222px] shrink-0 text-[#56616d] text-[10.667px] w-full">
          {COLS.map(([c, w]) => <p key={c} className="shrink-0" style={{ width: w }}>{c}</p>)}
          <p className="flex-[1_0_0] min-w-px">STATUS</p>
        </div>
        <div className="flex flex-[1_0_0] flex-col items-start min-h-px w-full overflow-y-auto no-scrollbar">
          {(d?.orders || []).map((o, i, arr) => (
            <div key={o.id} onClick={() => toggle(o.id)}
              className={`${i < arr.length - 1 ? 'border-b-[0.889px]' : ''} border-[#e4e8ee] border-solid flex items-center px-[21.333px] py-[14.222px] shrink-0 w-full cursor-pointer ${sel.has(o.id) ? 'bg-[#fdf0ef]' : 'hover:bg-[#fafbfc]'}`}>
              <p className="font-bold leading-[normal] shrink-0 text-[#1e2229] text-[11.556px] w-[106.667px]">{o.code}</p>
              <p className="font-semibold leading-[normal] shrink-0 text-[#1e2229] text-[11.556px] w-[195.556px] truncate pr-[8px]">{o.outletName}</p>
              <div className="flex items-start shrink-0 w-[106.667px]"><BrandPill brand={o.brand} /></div>
              <p className="font-normal leading-[normal] shrink-0 text-[#56616d] text-[11.556px] w-[88.889px]">{fmtNum(o.volumeM3, 1)}</p>
              <p className="font-normal leading-[normal] shrink-0 text-[#56616d] text-[11.556px] w-[88.889px]">{fmtNum(o.weightKg)}</p>
              <p className="font-normal leading-[normal] shrink-0 text-[#56616d] text-[11.556px] w-[133.333px]">{o.temp}</p>
              <p className="font-normal leading-[normal] shrink-0 text-[#56616d] text-[11.556px] w-[133.333px]">{o.window}</p>
              <div className="flex flex-[1_0_0] items-start min-w-px"><StatusPill status={o.status} /></div>
            </div>
          ))}
          {d && d.orders.length === 0 && <p className="p-[21.333px] text-[11.556px] text-[#8d9aab]">No orders match these filters.</p>}
        </div>
      </div>
      <Toast toast={toast} />
    </Shell>
  )
}
