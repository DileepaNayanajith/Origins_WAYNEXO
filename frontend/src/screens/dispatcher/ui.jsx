// Shared pieces of the Dispatcher TV design system (Figma: "Dispatcher TV - 1..6").
export const BRAND_PILL = {
  FRESH: { bg: '#eaf9f1', fg: '#2ec170' },
  STYLE: { bg: '#f3efff', fg: '#8a5cf5' },
  TECH: { bg: '#edf6fd', fg: '#1d89e8' },
}
export const STATUS_PILL = {
  PENDING: { bg: '#fef3c7', fg: '#f59e0b', label: 'Pending' },
  CONFIRMED: { bg: '#d1fae5', fg: '#10b981', label: 'Confirmed' },
  DEFERRED: { bg: '#fee2e2', fg: '#ef4444', label: 'Deferred' },
  ASSIGNED: { bg: '#edf6fd', fg: '#1d89e8', label: 'Assigned' },
  IN_TRANSIT: { bg: '#edf6fd', fg: '#1d89e8', label: 'In Transit' },
  DELIVERED: { bg: '#d1fae5', fg: '#10b981', label: 'Delivered' },
  SCHEDULED: { bg: '#f3efff', fg: '#8a5cf5', label: 'Scheduled' },
}

export function Pill({ bg, fg, children, className = '' }) {
  return (
    <div className={`flex items-start px-[7.111px] py-[3.556px] rounded-[5.333px] shrink-0 ${className}`} style={{ background: bg }}>
      <p className="font-bold leading-[normal] text-[9.778px] whitespace-nowrap" style={{ color: fg }}>{children}</p>
    </div>
  )
}

export const BrandPill = ({ brand }) => <Pill {...(BRAND_PILL[brand] || BRAND_PILL.FRESH)}>{brand}</Pill>
export const StatusPill = ({ status }) => {
  const s = STATUS_PILL[status] || STATUS_PILL.PENDING
  return <Pill bg={s.bg} fg={s.fg}>{s.label}</Pill>
}

export function Card({ className = '', children, ...rest }) {
  return <div className={`bg-white border-[#e4e8ee] border-[0.889px] border-solid rounded-[10.667px] ${className}`} {...rest}>{children}</div>
}

/** Dropdown styled exactly like the Figma filter chips ("Brand: All Brands ≡"). */
export function FilterChip({ label, value, options, onChange, icon }) {
  return (
    <label className="bg-white border-[#e4e8ee] border-[0.889px] border-solid flex gap-[7.111px] items-start px-[14.222px] py-[7.111px] relative rounded-[7.111px] shrink-0 cursor-pointer">
      <p className="font-normal leading-[normal] text-[#1e2229] text-[11.556px] whitespace-nowrap">
        {label}: {options.find((o) => o.value === value)?.label}
      </p>
      {icon}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function Toast({ toast }) {
  if (!toast) return null
  const err = toast.type === 'error'
  return (
    <div className="absolute bottom-[24px] right-[28px] z-50 px-[16px] py-[10px] rounded-[7.111px] shadow-lg text-[11.556px] font-semibold"
      style={{ background: err ? '#fee2e2' : '#1e2229', color: err ? '#ef4444' : '#fff' }}>
      {toast.msg}
    </div>
  )
}
