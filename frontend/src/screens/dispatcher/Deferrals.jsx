import { useState } from 'react'
import Shell from './Shell'
import Icon from '../../components/Icon'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { BrandPill, Toast } from './ui'

// Figma: "Dispatcher TV - 6" — Deferral Logs (RECOVER)
const COLS = [['ORDER ID', 89], ['OUTLET NAME', 160], ['BRAND', 89], ['DEFERRAL REASON', 160], ['CONSECUTIVE SKIPS', 107], ['DISPATCHER EXPLANATION NOTE', 231]]

export default function Deferrals() {
  const [d, reload] = useApi('/dispatcher/deferrals')
  const [edit, setEdit] = useState(null)
  const [toast, setToast] = useState(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600) }

  const resolve = async (r) => { await api.post(`/dispatcher/deferrals/${r.id}/resolve`); flash(`${r.orderCode} returned to the planning queue`); reload() }
  const save = async () => { await api.put(`/dispatcher/deferrals/${edit.id}/note`, { note: edit.note }); setEdit(null); flash('Explanation note saved'); reload() }

  return (
    <Shell active="deferrals" title="Deferral Logs" subtitle="Explain daily order delay decisions and monitor consecutive skipped outlets" counts={d?.counts}
      bodyClass="gap-[17.778px]">
      {d?.highRisk && (
        <div className="bg-[#fee2e2] flex gap-[10.667px] items-center px-[14.222px] py-[14.222px] rounded-[10.667px] shrink-0 w-full">
          <Icon name="shieldAlert" size={17.778} color="#ef4444" />
          <p className="font-bold leading-[normal] text-[#ef4444] text-[11.556px]">{d.highRisk.text}</p>
        </div>
      )}
      <div className="bg-white border-[#e4e8ee] border-[0.889px] border-solid flex flex-[1_0_0] flex-col min-h-px rounded-[10.667px] w-full overflow-hidden">
        <div className="bg-[#f5f7fa] border-[#e4e8ee] border-b-[0.889px] border-solid flex font-bold items-center leading-[normal] min-h-[54px] px-[21.333px] shrink-0 text-[#56616d] text-[10.667px] w-full">
          {COLS.map(([c, w]) => <p key={c} className="shrink-0 pr-[10px]" style={{ width: w }}>{c}</p>)}
          <p className="flex-[1_0_0]">ACTIONS</p>
        </div>
        <div className="flex flex-[1_0_0] flex-col min-h-px overflow-y-auto no-scrollbar">
          {(d?.deferrals || []).map((r) => (
            <div key={r.id} className="border-[#e4e8ee] border-b-[0.889px] border-solid flex items-center min-h-[54px] px-[21.333px] py-[8px] shrink-0 w-full">
              <p className="font-bold leading-[normal] shrink-0 text-[#1e2229] text-[11.556px] w-[89px]">{r.orderCode}</p>
              <p className="font-semibold leading-[normal] shrink-0 text-[#1e2229] text-[11.556px] w-[160px] truncate pr-[8px]">{r.outletName}</p>
              <div className="shrink-0 w-[89px] flex"><BrandPill brand={r.brand} /></div>
              <p className="font-normal leading-[normal] shrink-0 text-[#56616d] text-[11.556px] w-[160px] pr-[10px]">{r.reason}</p>
              <div className="shrink-0 w-[107px]">
                <span className={`inline-block px-[7.111px] py-[3.556px] rounded-[5.333px] font-bold text-[10.667px] leading-[normal] ${r.skips >= 2 ? 'bg-[#fee2e2] text-[#ef4444]' : 'bg-[#f5f7fa] text-[#56616d]'}`}>
                  {r.skips} time{r.skips === 1 ? '' : 's'}
                </span>
              </div>
              <div className="shrink-0 w-[231px] pr-[10px]">
                {edit?.id === r.id ? (
                  <textarea autoFocus value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() } if (e.key === 'Escape') setEdit(null) }}
                    className="w-full h-[40px] border-[#e8453c] border-[0.889px] rounded-[5.333px] p-[4px] text-[9.778px] text-[#1e2229] resize-none outline-none" />
                ) : (
                  <p className="font-normal leading-[normal] text-[#56616d] text-[9.778px]">{r.note || <span className="text-[#8d9aab] italic">No explanation yet</span>}</p>
                )}
              </div>
              <div className="flex flex-[1_0_0] gap-[7.111px] items-center">
                <button onClick={() => resolve(r)} className="bg-[#e8453c] px-[10.667px] py-[5.333px] rounded-[5.333px] cursor-pointer hover:brightness-95">
                  <p className="font-bold leading-[normal] text-[9.778px] text-black whitespace-nowrap">Resolve</p>
                </button>
                <button onClick={() => (edit?.id === r.id ? save() : setEdit({ id: r.id, note: r.note || '' }))}
                  className="bg-white border-[#e4e8ee] border-[0.889px] border-solid px-[10.667px] py-[5.333px] rounded-[5.333px] cursor-pointer hover:bg-[#f5f7fa]">
                  <p className="font-semibold leading-[normal] text-[#1e2229] text-[9.778px] whitespace-nowrap">{edit?.id === r.id ? 'Save Note' : 'Edit Notes'}</p>
                </button>
              </div>
            </div>
          ))}
          {d && d.deferrals.length === 0 && <p className="p-[21.333px] text-[11.556px] text-[#8d9aab]">No deferred orders — every outlet is served today.</p>}
        </div>
      </div>
      <Toast toast={toast} />
    </Shell>
  )
}
