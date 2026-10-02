import { useEffect, useState } from 'react'

/**
 * Renders a Figma frame at its exact design size (e.g. 1280x720 for the Dispatcher TV)
 * and scales it uniformly to fit any screen. The aspect ratio is always preserved,
 * so the layout never deviates from the Figma design on any device.
 */
export default function Stage({ width, height, bg = '#f5f7fa', children }) {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    window.visualViewport?.addEventListener('resize', on)
    return () => { window.removeEventListener('resize', on); window.visualViewport?.removeEventListener('resize', on) }
  }, [])
  const scale = Math.min(vp.w / width, vp.h / height)
  return (
    <div style={{ position: 'fixed', inset: 0, background: bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', width, height,
          left: (vp.w - width * scale) / 2, top: (vp.h - height * scale) / 2,
          transform: `scale(${scale})`, transformOrigin: '0 0',
        }}
      >
        <div className="relative w-full h-full overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
