import { useEffect, useRef, useState } from 'react'
import Shell, { MobileHeader, DToast } from './Shell'
import Icon from '../../components/Icon'
import SignaturePad, { readPhoto } from '../../components/SignaturePad'
import { useCachedApi, outbox, patchCache } from '../../lib/offline'
import { api } from '../../lib/api'
import { navigate } from '../../lib/router'

// Figma: "Driver Iphone 13 pro - 5" — Proof of Delivery (works offline: queued and synced later)
export default function Pod({ id }) {
  const [s] = useCachedApi('/driver/stops/' + id)
  const [cond, setCond] = useState({})
  const [photos, setPhotos] = useState([])
  const [name, setName] = useState('')
  const [sig, setSig] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [stamp, setStamp] = useState('')
  const file = useRef(null)
  const flash = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  useEffect(() => { if (s) setCond(Object.fromEntries(s.items.map((i) => [i.id, { condition: 'GOOD', damagedQty: 0 }]))) }, [s])

  const cycle = (i) => {
    const c = cond[i.id] || { condition: 'GOOD', damagedQty: 0 }
    const n = c.condition === 'GOOD' ? { condition: 'DAMAGED', damagedQty: 1 } : c.damagedQty < i.qty ? { condition: 'DAMAGED', damagedQty: c.damagedQty + 1 } : { condition: 'GOOD', damagedQty: 0 }
    setCond({ ...cond, [i.id]: n })
  }

  const submit = async () => {
    if (!name.trim()) return flash('Enter the recipient\'s full name', 'error')
    if (!sig) return flash('Ask the recipient to sign', 'error')
    const payload = { items: Object.entries(cond).map(([k, v]) => ({ id: Number(k), ...v })), recipientName: name, signature: sig, photoCount: photos.length }
    setBusy(true)
    try {
      const r = await api.post(`/driver/stops/${id}/pod`, payload)
      flash('Stop completed ✓')
      setTimeout(() => navigate(r.tripCompleted ? '/driver' : '/driver/trip/' + s.tripId), 900)
    } catch (e) {
      if (e.status === 0) {
        outbox.push({ type: 'pod', stopId: Number(id), payload })
        patchCache('/driver/trips/' + s.tripId, (t) => {
          let next = false
          const stops = t.stops.map((x) => { if (x.id === Number(id)) { next = true; return { ...x, status: 'COMPLETED' } } if (next && x.status === 'UPCOMING') { next = false; return { ...x, status: 'CURRENT' } } return x })
          return { ...t, stops, completed: t.completed + 1 }
        })
        flash('Saved offline — will sync automatically')
        setTimeout(() => navigate('/driver/offline'), 900)
      } else flash(e.message, 'error')
    } finally { setBusy(false) }
  }

  return (
    <Shell active="routes" header={<MobileHeader title="Proof of Delivery" subtitle={s?.outletFull} />}
      footer={<button disabled={busy} onClick={submit} className="ml-[16px] h-[52px] px-[14px] rounded-[12px] bg-[#e8453c] font-bold text-white text-[16px] cursor-pointer disabled:opacity-70">{busy ? 'Saving…' : 'Submit and Complete Stop'}</button>}>
      {s && (
        <div className="absolute left-[16px] top-[123px] w-[358px] bottom-[190px] overflow-y-auto no-scrollbar flex flex-col gap-[16px]">
          <div className="bg-white rounded-[12px] p-[16px] shrink-0">
            <p className="font-bold text-[#1e2229] text-[14px]">Confirm Item Conditions</p>
            {s.items.map((i) => {
              const c = cond[i.id] || { condition: 'GOOD' }
              const good = c.condition === 'GOOD'
              return (
                <button key={i.id} onClick={() => cycle(i)} className="w-full flex items-center justify-between mt-[12px] cursor-pointer text-left">
                  <span className="text-[#1e2229] text-[13.5px]">{i.name}</span>
                  <span className="flex items-center gap-[8px]">
                    <span className={`h-[21px] px-[8px] rounded-[6px] font-bold text-[11px] flex items-center ${good ? 'bg-[#eaf9f1] text-[#2ec170]' : 'bg-[#fee2e2] text-[#e8453c]'}`}>{good ? 'GOOD' : `${c.damagedQty} DAMAGED`}</span>
                    <Icon name={good ? 'circleCheck' : 'alertCircle'} size={20} color={good ? '#2ec170' : '#e8453c'} />
                  </span>
                </button>
              )
            })}
            <p className="text-[#8d9aab] text-[10.5px] mt-[10px]">Tap an item to log damaged units.</p>
          </div>
          <div className="bg-white rounded-[12px] p-[16px] shrink-0">
            <p className="font-bold text-[#1e2229] text-[14px]">Overall Delivery Photo Evidence</p>
            <button onClick={() => file.current.click()} className="mt-[12px] w-full h-[56px] rounded-[8px] border-[#d5dae1] border-[1.5px] border-dashed flex items-center justify-center gap-[10px] text-[#56616d] font-semibold text-[14px] cursor-pointer">
              <Icon name="camera" size={20} color="#56616d" /> Capture Photo ({photos.length} Received)
            </button>
            <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const f = e.target.files[0]; if (f) setPhotos([...photos, await readPhoto(f, 600)]) }} />
            {photos.length > 0 && <div className="flex gap-[6px] mt-[8px]">{photos.map((p, k) => <img key={k} src={p} className="size-[40px] rounded-[6px] object-cover" alt="" />)}</div>}
          </div>
          <div className="bg-white rounded-[12px] p-[16px] shrink-0">
            <p className="font-bold text-[#1e2229] text-[14px]">Recipient Acknowledgment</p>
            <p className="text-[#56616d] text-[12.4px] mt-[10px]">Full Name</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. K. Wijewardene (Store Asst.)"
              className="mt-[6px] w-full h-[36px] rounded-[8px] bg-[#f5f7fa] px-[10px] text-[14px] text-[#1e2229] outline-none placeholder:text-[#8d9aab]" />
            <p className="text-[#56616d] text-[12.4px] mt-[14px]">Draw Signature</p>
            <SignaturePad width={326} height={100} onChange={(v) => { setSig(v); setStamp(v ? new Date().toLocaleTimeString('en-GB') : '') }}
              className="mt-[6px] rounded-[8px] bg-[#f5f7fa] border-[#e4e8ee] border-[0.889px] border-solid overflow-hidden"
              footer={stamp && <p className="absolute right-[8px] bottom-[4px] text-[#8d9aab] text-[10px] pointer-events-none">Auto Timestamped: {stamp}</p>} />
          </div>
        </div>
      )}
      <DToast toast={toast} />
    </Shell>
  )
}
