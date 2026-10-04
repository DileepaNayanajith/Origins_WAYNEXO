import { useEffect, useState } from 'react'
import { displayLayout } from '../lib/display'

export default function Stage({ width, height, bg = '#f5f7fa', display = 'tv', children }) {
  const readViewport = () => ({ w: window.visualViewport?.width || window.innerWidth, h: window.visualViewport?.height || window.innerHeight })
  const [vp, setVp] = useState(readViewport)
  useEffect(() => {
    const on = () => setVp({ w: window.visualViewport?.width || window.innerWidth, h: window.visualViewport?.height || window.innerHeight })
    window.addEventListener('resize', on)
    window.visualViewport?.addEventListener('resize', on)
    return () => { window.removeEventListener('resize', on); window.visualViewport?.removeEventListener('resize', on) }
  }, [])
  const layout = displayLayout(width, height, vp.w, vp.h, display)
  return <div className={`role-display role-display-${display}`} style={{ position: 'fixed', inset: 0, background: bg, overflow: layout.scroll ? 'auto' : 'hidden' }}>
    <div style={{ position: 'relative', width: Math.max(vp.w, layout.canvasWidth), height: Math.max(vp.h, layout.canvasHeight) }}>
      <div style={{ position: 'absolute', width, height, left: layout.left, top: layout.top, transform: `scale(${layout.scale})`, transformOrigin: '0 0' }}>
        <div className="relative w-full h-full overflow-hidden">{children}</div>
      </div>
    </div>
  </div>
}
