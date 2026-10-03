import { afterEach, it, expect, vi } from 'vitest'
import { api, tokenStore } from '../src/lib/api'
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
it('rejects HTML returned by a wrongly configured API', async () => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<html>SPA</html>',{headers:{'Content-Type':'text/html'}})))
  await expect(api.post('/auth/login',{})).rejects.toThrow('unexpected response')
})
it('sends bearer token and expires invalid persisted sessions', async () => {
  tokenStore.set('saved')
  const fetch = vi.fn().mockResolvedValue(new Response('{"message":"Session expired"}',{status:401,headers:{'Content-Type':'application/json'}}))
  vi.stubGlobal('fetch',fetch)
  await expect(api.get('/auth/me')).rejects.toThrow('Session expired')
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer saved')
  expect(tokenStore.get()).toBeNull()
})
it('does not erase an existing token when credentials are rejected', async () => {
  tokenStore.set('saved')
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{"message":"Incorrect password"}',{status:401,headers:{'Content-Type':'application/json'}})))
  await expect(api.post('/auth/login',{})).rejects.toThrow('Incorrect password')
  expect(tokenStore.get()).toBe('saved')
})
it('explains timeout instead of leaving signing in pending', async () => {
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('Timeout','TimeoutError')))
  await expect(api.post('/auth/login',{})).rejects.toThrow('took too long')
})
