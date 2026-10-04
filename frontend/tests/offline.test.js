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

it('rejects invalid cached trip identifiers',()=>{
 setOfflineAccount(3); lastTrip.set('undefined');expect(lastTrip.get()).toBeNull()
 lastTrip.set('current');expect(lastTrip.get()).toBeNull();lastTrip.set(12);expect(lastTrip.get()).toBe(12)
})
it('retains rejected and newly queued offline work while removing acknowledged records',async()=>{
 const {api}=await import('../src/lib/api')
 localStorage.clear();setOfflineAccount(4)
 outbox.push({type:'pod',stopId:1,payload:{}});outbox.push({type:'pod',stopId:2,payload:{}})
 const [accepted,rejected]=outbox.all()
 api.post.mockImplementation(async()=>{outbox.push({type:'exception',payload:{details:'new work'}});return {applied:1,skipped:1,acceptedClientIds:[accepted.clientId],rejectedClientIds:[rejected.clientId]}})
 expect(await flush()).toBe(false)
 expect(outbox.all()).toHaveLength(2);expect(outbox.all().map(x=>x.clientId)).not.toContain(accepted.clientId)
 expect(outbox.all().map(x=>x.clientId)).toContain(rejected.clientId)
})
