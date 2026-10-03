import { it, expect, vi } from 'vitest'
import { outbox, lastTrip, setOfflineAccount, flush } from '../src/lib/offline'
vi.mock('../src/lib/api', () => ({ api: {post: vi.fn()} }))
it('keeps driver offline queues and cached trip identity isolated between users', async () => {
  localStorage.clear()
  setOfflineAccount(1); outbox.push({type:'pod',stopId:9,payload:{}}); lastTrip.set(20)
  setOfflineAccount(2); expect(outbox.all()).toEqual([]); expect(lastTrip.get()).toBeNull()
  lastTrip.set(30)
  setOfflineAccount(1); expect(outbox.all()).toHaveLength(1); expect(lastTrip.get()).toBe(20)
  setOfflineAccount(null); expect(outbox.all()).toEqual([]); expect(await flush()).toBe(false)
})
