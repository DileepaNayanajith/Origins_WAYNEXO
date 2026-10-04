import { describe, it, expect } from 'vitest'
import { displayLayout } from '../src/lib/display'

describe('role displays', () => {
  it('fits the complete dispatcher overview on HD and 4K TVs', () => {
    for (const [w,h] of [[1920,1080],[3840,2160],[1366,768]]) {
      const l=displayLayout(1280,720,w,h,'tv')
      expect(l.canvasWidth).toBeLessThanOrEqual(w)
      expect(l.canvasHeight).toBeLessThanOrEqual(h)
      expect(l.scroll).toBe(false)
    }
  })
  it('keeps a laptop legible and lets content scroll below browser chrome', () => {
    const l=displayLayout(1280,832,1366,650,'pc')
    expect(l.scale).toBeGreaterThan(1)
    expect(l.canvasHeight).toBeGreaterThan(650)
    expect(l.top).toBe(0)
    expect(l.scroll).toBe(true)
  })
  it('keeps tablet controls at least 44px in portrait and landscape', () => {
    for (const [w,h] of [[1024,768],[1194,750],[768,1024]]) {
      const l=displayLayout(1194,834,w,h,'tablet')
      expect(56*l.scale).toBeGreaterThanOrEqual(44)
      expect(l.left).toBeGreaterThanOrEqual(0)
      expect(l.scroll).toBe(true)
    }
  })
})
