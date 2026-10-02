import { useEffect, useRef, useState } from 'react'
import Shell, { Toast } from './Shell'
import Icon from '../../components/Icon'
import SignaturePad, { readPhoto } from '../../components/SignaturePad'
import { useApi } from '../../lib/useApi'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { navigate } from '../../lib/router'

// Figma: "Store Manager MacBook Air - 5" — Shipment Verification Checklist
const COND = { GOOD: ['#eaf9f1', '#10b981', 'Good'], DAMAGED: ['#fee2e2', '#ef4444', 'Damaged'], SHORT: ['#fef3c7', '#f59e0b', 'Short'], MISSING: ['#fee2e2', '#ef4444', 'Missing'] }

export default function Receive() {
  const { user } = useAuth()
  const [d, reload] = useApi('/store/receiving')
  const [lines, setLines] = useState([])
  const [photo, setPhoto] = useState(null)
  const [caption, setCaption] = useState('')
  const [notes, setNotes] = useState('')
  const [sig, setSig] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { if (d?.delivery) setLines(d.delivery.lines) }, [d])
  const del = d?.delivery
  const upd = (id, patch) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const isExc = (l) => l.condition !== 'GOOD' || l.receivedQty < l.expectedQty

  const submit = async () => {
    if (!sig) return flash('Please sign the receipt', 'error')
    setBusy(true)
    try {
      await api.post('/store/receiving/' + del.orderId, {
        lines: lines.map((l) => ({ id: l.id, receivedQty: Number(l.receivedQty), condition: l.condition, verified: l.verified })),
        exceptionNote: caption, notes, photo, signature: sig,
      })
      flash('Delivery receipt submitted — dispatcher notified')
      setTimeout(() => navigate('/store/history'), 1500)
    } catch (e) { flash(e.message, 'error') } finally { setBusy(false) }
  }

  return (
    <Shell active="receive">
      <p className="absolute left-[28px] top-[29px] font-bold text-[#1e2229] text-[21.5px] leading-[26px]">Shipment Verification Checklist</p>
      <p className="absolute left-[28px] top-[58px] text-[#56616d] text-[12.4px] leading-[15px]">Confirm all Chilled/Dry dispatch packages and log exceptions immediately.</p>
      {!del ? (
        <div className="absolute left-[28px] top-[94px] w-[828px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] p-[22px]">
          <p className="font-bold text-[#1e2229] text-[14px]">No shipment to receive right now</p>
          <p className="text-[#56616d] text-[12.4px] mt-[6px]">When a vehicle is on its way to your outlet, its packing list appears here for verification.</p>
          <button onClick={reload} className="mt-[14px] text-[#e8453c] font-semibold text-[12.4px] cursor-pointer">Refresh</button>
        </div>
      ) : (
        <>
          <div className="absolute left-[28px] top-[94px] w-[828px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] px-[21px] pt-[21px] pb-[20px]">
            <p className="font-bold text-[#1e2229] text-[14px] leading-[17px]">Items in Delivery {del.vehicle}</p>
            <div className="flex mt-[18px] h-[20px] border-b-[0.889px] border-[#e4e8ee] border-solid font-medium text-[#8d9aab] text-[10.6px] uppercase">
              <span className="w-[266px]">Item Description</span><span className="w-[125px]">Expected</span><span className="w-[160px] pl-[14px]">Received Qty</span>
              <span className="w-[130px]">Condition</span><span className="flex-1 text-right">Verified</span>
            </div>
            {lines.map((l) => {
              const [cb, cf] = COND[l.condition] || COND.GOOD
              return (
                <div key={l.id} className="flex items-center h-[57px] border-b-[0.889px] border-[#e4e8ee] border-solid">
                  <button onClick={() => upd(l.id, { verified: !l.verified })} className="w-[266px] flex items-center gap-[10px] cursor-pointer text-left">
                    <span className={`size-[18px] rounded-[4px] border-solid flex items-center justify-center ${l.verified ? 'border-[#e8453c] border-[1.5px] bg-[#fdf0ef]' : 'border-[#d5dae1] border-[1.2px] bg-white'}`}>
                      {l.verified && <Icon name="check" size={11} color="#e8453c" stroke={3} />}
                    </span>
                    <span className="font-semibold text-[#1e2229] text-[12.4px]">{l.name}</span>
                  </button>
                  <span className="w-[125px] text-[#56616d] text-[12.4px]">{l.expectedLabel}</span>
                  <span className="w-[160px] pl-[18px]">
                    <input type="number" min="0" value={l.receivedQty} onChange={(e) => upd(l.id, { receivedQty: e.target.value })}
                      className={`w-[107px] h-[22px] rounded-[5px] bg-[#f5f7fa] text-center font-bold text-[12.4px] outline-none ${l.receivedQty < l.expectedQty ? 'text-[#e8453c]' : 'text-[#1e2229]'}`} />
                  </span>
                  <span className="w-[130px] relative">
                    <span className="flex w-[89px] h-[20px] items-center px-[7px] rounded-[4px] font-semibold text-[10.6px]" style={{ background: cb, color: cf }}>{COND[l.condition]?.[2]}</span>
                    <select value={l.condition} onChange={(e) => upd(l.id, { condition: e.target.value })} className="absolute left-0 top-0 w-[89px] h-[20px] opacity-0 cursor-pointer">
                      {Object.entries(COND).map(([k, v]) => <option key={k} value={k}>{v[2]}</option>)}
                    </select>
                  </span>
                  <span className="flex-1 text-right">
                    {isExc(l)
                      ? <button onClick={() => document.getElementById('exc-note')?.focus()} className="font-semibold text-[#e8453c] text-[11.6px] cursor-pointer">Log Exception</button>
                      : <span className={`font-semibold text-[11.6px] ${l.verified ? 'text-[#10b981]' : 'text-[#8d9aab]'}`}>{l.verified ? 'Verified' : 'Pending'}</span>}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="absolute left-[878px] top-[29px] w-[373px] bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[14px] px-[21px] pt-[21px] pb-[21px]">
            <p className="font-bold text-[#1e2229] text-[14px] leading-[17px]">Damaged / Missing Exception Log</p>
            <button onClick={() => fileRef.current.click()} className="mt-[18px] w-[331px] h-[104px] rounded-[8px] border-[#d5dae1] border-[1.2px] border-dashed bg-[#f5f7fa] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
              {photo ? <img src={photo} alt="Damage" className="absolute inset-0 w-full h-full object-cover opacity-90" /> : null}
              <span className={`relative flex flex-col items-center ${photo ? 'bg-white/85 rounded-[6px] px-[10px] py-[4px]' : ''}`}>
                <Icon name="camera" size={21} color="#8d9aab" />
                <span className="font-semibold text-[#e8453c] text-[11.6px] mt-[10px]">{photo ? 'Replace Damage Photo' : 'Upload Damage Photo'}</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={async (e) => { const f = e.target.files[0]; if (f) setPhoto(await readPhoto(f)) }} />
            <input id="exc-note" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Describe the damage (e.g. 1 bottle Milk leaked in transition crate)"
              className="w-[331px] mt-[6px] text-center text-[#56616d] text-[9.8px] bg-transparent outline-none placeholder:text-[#8d9aab]" />
            <p className="font-semibold text-[#56616d] text-[11.6px] mt-[12px]">Dispatcher Notes</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for Peliyagoda HQ…"
              className="mt-[7px] w-[331px] h-[63px] rounded-[7px] bg-[#f5f7fa] border-[#e4e8ee] border-[0.889px] border-solid px-[10px] py-[8px] text-[11.2px] leading-[14px] text-[#56616d] resize-none outline-none" />
            <span className="block mt-[17px] w-[331px] h-[0.889px] bg-[#e4e8ee]" />
            <p className="font-semibold text-[#56616d] text-[11.6px] mt-[17px]">Store Manager Digital Signature</p>
            <SignaturePad width={331} height={71} name={user?.fullName} onChange={setSig}
              className="mt-[7px] rounded-[7px] bg-[#f5f7fa] border-[#e4e8ee] border-[0.889px] border-solid overflow-hidden" />
            <button disabled={busy} onClick={submit} className="mt-[18px] w-[331px] h-[40px] rounded-[7px] bg-[#10b981] text-white font-bold text-[12.4px] cursor-pointer hover:brightness-95 disabled:opacity-70">
              {busy ? 'Submitting…' : 'Submit Delivery Receipt'}
            </button>
          </div>
        </>
      )}
      <Toast toast={toast} />
    </Shell>
  )
}
