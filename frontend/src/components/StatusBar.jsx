import { useEffect, useState } from 'react'

// iPhone 13 Pro status bar from the Figma frames (live clock). Hidden on real phones,
// where the device's own status bar sits in this area.
export const isRealPhone = () => /iPhone|Android.+Mobile/.test(navigator.userAgent)

export default function StatusBar({ dark = false }) {
  const [t, setT] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 15000); return () => clearInterval(id) }, [])
  if (isRealPhone()) return null
  const c = dark ? '#fff' : '#000'
  return (
    <div className="absolute left-0 top-0 w-[390px] h-[44px] z-20 pointer-events-none">
      <p className="absolute left-[24px] top-[14px] font-semibold text-[15px] leading-[17px]" style={{ color: c }}>
        {t.getHours() % 12 || 12}:{String(t.getMinutes()).padStart(2, '0')}
      </p>
      <svg className="absolute left-[282px] top-[12px]" width="84" height="20" viewBox="0 0 84 20" fill={c}>
        <rect x="2" y="12" width="3" height="5" rx="1" /><rect x="7" y="9.5" width="3" height="7.5" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="4.5" width="3" height="12.5" rx="1" />
        <path d="M38 7.2c2.2 0 4.2.9 5.7 2.3l1.3-1.3A9.9 9.9 0 0 0 38 5.3a9.9 9.9 0 0 0-7 2.9l1.3 1.3A8 8 0 0 1 38 7.2Zm0 3.7c1.2 0 2.3.5 3.1 1.2l1.3-1.3A6.2 6.2 0 0 0 38 9a6.2 6.2 0 0 0-4.4 1.8l1.3 1.3c.8-.7 1.9-1.2 3.1-1.2Zm0 3.6-1.8 1.8L38 18l1.8-1.7-1.8-1.8Z" />
        <rect x="56.5" y="5.5" width="23" height="11" rx="3.2" fill="none" stroke={c} strokeOpacity=".4" />
        <rect x="58.5" y="7.5" width="19" height="7" rx="1.8" /><path d="M81 9v4c.8-.3 1.3-1 1.3-2s-.5-1.7-1.3-2Z" fillOpacity=".5" />
      </svg>
    </div>
  )
}
