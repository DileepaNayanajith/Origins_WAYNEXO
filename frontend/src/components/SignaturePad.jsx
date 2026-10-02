import { useEffect, useRef, useState } from 'react'

/**
 * Finger/mouse signature canvas. Starts with the signer's typed name (as in the Figma)
 * and can be cleared and drawn by hand. onChange receives a PNG data URL (or null when empty).
 */
export default function SignaturePad({ width, height, name, onChange, className = '', ink = '#1e2229', footer }) {
  const ref = useRef(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(!name)

  const ctx = () => ref.current.getContext('2d')
  const scale = 2

  useEffect(() => {
    const c = ref.current
    c.width = width * scale; c.height = height * scale
    const g = ctx(); g.scale(scale, scale)
    if (name) {
      g.fillStyle = '#56616d'; g.font = 'italic 16px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText(name, width / 2, height / 2)
      onChange?.(c.toDataURL('image/png'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pos = (e) => {
    const r = ref.current.getBoundingClientRect()
    const p = e.touches ? e.touches[0] : e
    return [((p.clientX - r.left) / r.width) * width, ((p.clientY - r.top) / r.height) * height]
  }
  const start = (e) => {
    e.preventDefault()
    if (!empty && !drawing.current && name && ref.current.dataset.typed !== 'no') { clear(); ref.current.dataset.typed = 'no' }
    drawing.current = true
    const g = ctx(); const [x, y] = pos(e); g.beginPath(); g.moveTo(x, y)
  }
  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const g = ctx(); const [x, y] = pos(e)
    g.lineTo(x, y); g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke()
    setEmpty(false)
  }
  const end = () => { if (drawing.current) { drawing.current = false; onChange?.(ref.current.toDataURL('image/png')) } }
  const clear = () => { ctx().clearRect(0, 0, width, height); setEmpty(true); onChange?.(null) }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <canvas ref={ref} style={{ width, height, touchAction: 'none', cursor: 'crosshair' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      {empty && <p className="absolute inset-0 flex items-center justify-center text-[#8d9aab] text-[11px] pointer-events-none">Sign here</p>}
      <button type="button" onClick={clear} className="absolute right-[6px] top-[4px] text-[9px] font-semibold text-[#8d9aab] hover:text-[#e8453c] cursor-pointer">Clear</button>
      {footer}
    </div>
  )
}

/** Reads an image file, downsizes it (max 800px) and returns a JPEG data URL. */
export function readPhoto(file, max = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
