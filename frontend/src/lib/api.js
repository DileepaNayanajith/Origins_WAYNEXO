// Thin fetch wrapper around the Spring Boot REST API.
const configured = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '')
const BASE = configured === '/api' || configured.endsWith('/api') ? configured : configured + '/api'
const TOKEN_KEY = 'waynexo.token'

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } },
}

export class ApiError extends Error {
  constructor(status, message, body) { super(message); this.status = status; this.body = body }
}

async function request(method, path, body) {
  const headers = { Accept: 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(BASE + path, { method, headers, signal: AbortSignal.timeout(20000), body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch (e) {
    throw new ApiError(0, e.name === 'TimeoutError' ? 'The server took too long. Please try again.' : 'Cannot reach the WAYNEXO server. Please check your connection.', null)
  }
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') { tokenStore.set(null); window.dispatchEvent(new Event('waynexo:logout')) }
    throw new ApiError(res.status, (data && data.message) || `Request failed (${res.status}). Please try again.`, data)
  }
  if (!res.headers.get('content-type')?.includes('application/json')) throw new ApiError(502, 'The API returned an unexpected response. Check the deployed API URL.', null)
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b = {}) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
  download: async (p, filename) => {
    const res = await fetch(BASE + p, { headers: { Authorization: `Bearer ${tokenStore.get()}` } })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  },
}
