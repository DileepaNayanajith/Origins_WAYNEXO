import { useEffect, useState, useCallback } from 'react'
import { api } from './api'

// Driver offline-first support: cached reads + a durable outbox replayed by POST /api/driver/sync.
const QKEY = 'waynexo.driver.outbox'
const CKEY = 'waynexo.driver.cache:'
const SKEY = 'waynexo.driver.lastSync'
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage full/blocked */ } }

export const outbox = {
  all: () => read(QKEY, []),
  push: (item) => { write(QKEY, [...outbox.all(), { ...item, clientId: crypto.randomUUID?.() || String(Date.now() + Math.random()), at: Date.now() }]); notify() },
  clear: () => { write(QKEY, []); notify() },
}
export const lastSync = () => read(SKEY, null)
const notify = () => window.dispatchEvent(new Event('waynexo:outbox'))

/** Sends everything queued while offline. Returns true when the outbox is empty afterwards. */
export async function flush() {
  const items = outbox.all()
  write(SKEY, { at: Date.now() })
  if (!items.length) return true
  try {
    await api.post('/driver/sync', {
      pods: items.filter((i) => i.type === 'pod').map((i) => ({ stopId: i.stopId, pod: { ...i.payload, clientId: i.clientId } })),
      exceptions: items.filter((i) => i.type === 'exception').map((i) => ({ ...i.payload, clientId: i.clientId })),
    })
    outbox.clear()
    return true
  } catch { return false } finally { notify() }
}

/** Online status that also turns false when the API itself is unreachable. */
export function useConnectivity() {
  const [online, setOnline] = useState(navigator.onLine)
  const [queued, setQueued] = useState(outbox.all().length)
  useEffect(() => {
    const up = () => { setOnline(true); flush() }
    const down = () => setOnline(false)
    const q = () => setQueued(outbox.all().length)
    const unreachable = () => setOnline(false)
    window.addEventListener('online', up); window.addEventListener('offline', down)
    window.addEventListener('waynexo:outbox', q); window.addEventListener('waynexo:unreachable', unreachable)
    const id = setInterval(async () => {
      if (!navigator.onLine) return
      try { await api.get('/auth/me'); setOnline(true); if (outbox.all().length) flush() } catch (e) { if (e.status === 0) setOnline(false) }
    }, 15000)
    return () => {
      window.removeEventListener('online', up); window.removeEventListener('offline', down)
      window.removeEventListener('waynexo:outbox', q); window.removeEventListener('waynexo:unreachable', unreachable); clearInterval(id)
    }
  }, [])
  return { online, queued }
}

/** Like useApi but falls back to the last cached copy when there is no connection. */
export function useCachedApi(path) {
  const [data, setData] = useState(() => (path ? read(CKEY + path, null) : null))
  const [offline, setOffline] = useState(false)
  const load = useCallback(async () => {
    if (!path) return
    try { const d = await api.get(path); setData(d); write(CKEY + path, d); setOffline(false) }
    catch (e) { if (e.status === 0) { setOffline(true); window.dispatchEvent(new Event('waynexo:unreachable')) } else throw e }
  }, [path])
  useEffect(() => { load().catch(() => {}) }, [load])
  return [data, load, offline, setData]
}

/** Optimistically mark a stop as delivered in the cached trip/stop data. */
export function patchCache(path, fn) { const d = read(CKEY + path, null); if (d) write(CKEY + path, fn(d)) }

/** Remembers the trip the driver last opened so it is available offline. */
export const lastTrip = {
  get: () => read('waynexo.driver.lastTrip', null),
  set: (id) => write('waynexo.driver.lastTrip', id),
}
