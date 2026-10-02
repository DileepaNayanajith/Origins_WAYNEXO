import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

/** Load data from the API; returns [data, reload, {loading, error, setData}]. */
export function useApi(path, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState(null)
  const load = useCallback(async () => {
    if (!path) return
    setLoading(true)
    try { setData(await api.get(path)); setError(null) }
    catch (e) { setError(e) }
    finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps])
  useEffect(() => { load() }, [load])
  return [data, load, { loading, error, setData }]
}

/** Live countdown to today's 4 PM order cutoff (Asia/Colombo local time on the device). */
export function useCutoff(hour = 16) {
  const calc = () => {
    const now = new Date()
    const cut = new Date(now); cut.setHours(hour, 0, 0, 0)
    if (cut <= now) cut.setDate(cut.getDate() + 1)
    const ms = cut - now
    const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4), s = Math.floor((ms % 6e4) / 1000)
    return { h, m, s, ms }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) }, [])
  return t
}

export const pad = (n) => String(n).padStart(2, '0')
