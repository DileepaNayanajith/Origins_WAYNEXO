import { beforeEach, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Route from '../src/screens/driver/Route'
import { api } from '../src/lib/api'
import { navigate } from '../src/lib/router'
import { lastTrip } from '../src/lib/offline'
vi.mock('../src/screens/driver/Shell',()=>({default:({children})=><main>{children}</main>,MobileHeader:()=>null}))
vi.mock('../src/lib/api',()=>({api:{get:vi.fn()}}))
vi.mock('../src/lib/router',()=>({navigate:vi.fn()}))
vi.mock('../src/lib/offline',()=>({useCachedApi:()=>[null],lastTrip:{get:vi.fn(),set:vi.fn()}}))
beforeEach(()=>vi.clearAllMocks())
it('shows an empty route message without navigating to an undefined trip',async()=>{
 api.get.mockResolvedValue({trips:[],activeTripId:null})
 render(<Route id="current" />)
 await screen.findByText('No trips assigned yet')
 expect(navigate).not.toHaveBeenCalled();expect(lastTrip.set).not.toHaveBeenCalled()
})
it('does not use a corrupted cached trip after a failed route lookup',async()=>{
 api.get.mockRejectedValue(new Error('Offline'));lastTrip.get.mockReturnValue('undefined')
 render(<Route id="current" />)
 await screen.findByText('No trips assigned yet')
 expect(navigate).not.toHaveBeenCalled()
})
