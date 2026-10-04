import { useEffect, useState, useCallback } from 'react'
import { api } from './api'

// Driver offline-first support: cached reads + a durable outbox replayed by POST /api/driver/sync.
const QKEY = 'waynexo.driver.outbox'
const CKEY = 'waynexo.driver.cache:'
const SKEY = 'waynexo.driver.lastSync'
let accountId = null
export function setOfflineAccount(id) { accountId = id == null ? null : String(id) }
const scoped = k => `waynexo.account:${accountId}:${k}`
const read = (k, d) => { if (!accountId) return d; try { return JSON.parse(localStorage.getItem(scoped(k))) ?? d } catch { return d } }
const write = (k, v) => { if (!accountId) return; try { localStorage.setItem(scoped(k), JSON.stringify(v)) } catch { /* storage full/blocked */ } }

export const outbox = {
  all: () => read(QKEY, []),
  push: (item) => { write(QKEY, [...outbox.all(), { ...item, clientId: crypto.randomUUID?.() || String(Date.now() + Math.random()), at: Date.now() }]); notify() },
  remove: (ids) => { write(QKEY, outbox.all().filter(item => !ids.includes(item.clientId))); notify() },
  clear: () => { write(QKEY, []); notify() },
}
export const lastSync = () => read(SKEY, null)
const notify = () => window.dispatchEvent(new Event('waynexo:outbox'))

/** Sends everything queued while offline. Returns true when the outbox is empty afterwards. */
export async function flush() {
  const owner = accountId
  if (!owner) return false
  const items = outbox.all()
  write(SKEY, { at: Date.now() })
  if (!items.length) return true
  try {
    const result = await api.post('/driver/sync', {
      pods: items.filter((i) => i.type === 'pod').map((i) => ({ stopId: i.stopId, pod: { ...i.payload, clientId: i.clientId } })),
      exceptions: items.filter((i) => i.type === 'exception').map((i) => ({ ...i.payload, clientId: i.clientId })),
    })
    if (accountId !== owner) return false
    const accepted = result.acceptedClientIds || (result.skipped === 0 ? items.map(item => item.clientId) : [])
    outbox.remove(accepted)
    return outbox.all().length === 0
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
  const [error, setError] = useState(null)
  const load = useCallback(async () => {
    if (!path) return
    const owner = accountId
    try { const d = await api.get(path); if (owner !== accountId) return; setData(d); write(CKEY + path, d); setOffline(false); setError(null) }
    catch (e) { setError(e); if (e.status === 0) { setOffline(true); window.dispatchEvent(new Event('waynexo:unreachable')) } else throw e }
  }, [path])
  useEffect(() => { load().catch(() => {}) }, [load])
  return [data, load, offline, setData, error]
}

/** Optimistically mark a stop as delivered in the cached trip/stop data. */
export function patchCache(path, fn) { const d = read(CKEY + path, null); if (d) write(CKEY + path, fn(d)) }

/** Remembers the trip the driver last opened so it is available offline. */
export const lastTrip = {
  get: () => { const id=read('waynexo.driver.lastTrip', null); return /^\d+$/.test(String(id || '')) ? id : null },
  set: (id) => { if (/^\d+$/.test(String(id || ''))) write('waynexo.driver.lastTrip', id) },
}
