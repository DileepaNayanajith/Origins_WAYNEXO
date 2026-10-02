// Figma-exported assets live in /public/figma (downloaded by `npm run assets`).
export const fig = (file) => `/figma/${file}`

export const fmtNum = (n, d = 0) =>
  n == null ? '-' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

export const fmtDate = (iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  iso ? new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', opts) : ''

export const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

export const timeAgo = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} mins ago`
  const h = Math.round(s / 3600)
  return `${h} hr${h > 1 ? 's' : ''} ago`
}
