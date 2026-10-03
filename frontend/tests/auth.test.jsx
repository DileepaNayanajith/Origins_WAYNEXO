import React from 'react'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('../src/lib/api', () => ({ api: mocks, tokenStore: {get: () => localStorage.getItem('token'),set: t => t ? localStorage.setItem('token', t) : localStorage.removeItem('token')} }))
vi.mock('../src/screens/dispatcher/Dashboard', () => ({default: () => <div>Dashboard Dashboard</div>}))
vi.mock('../src/screens/dispatcher/Orders', () => ({default: () => <div>Dashboard Orders</div>}))
vi.mock('../src/screens/dispatcher/Planning', () => ({default: () => <div>Dashboard Planning</div>}))
vi.mock('../src/screens/dispatcher/Fleet', () => ({default: () => <div>Dashboard Fleet</div>}))
vi.mock('../src/screens/dispatcher/Tracking', () => ({default: () => <div>Dashboard Tracking</div>}))
vi.mock('../src/screens/dispatcher/Deferrals', () => ({default: () => <div>Dashboard Deferrals</div>}))
vi.mock('../src/screens/store/PlaceOrder', () => ({default: () => <div>Dashboard PlaceOrder</div>}))
vi.mock('../src/screens/store/History', () => ({default: () => <div>Dashboard History</div>}))
vi.mock('../src/screens/store/Schedule', () => ({default: () => <div>Dashboard Schedule</div>}))
vi.mock('../src/screens/store/Receive', () => ({default: () => <div>Dashboard Receive</div>}))
vi.mock('../src/screens/store/DeferralAlert', () => ({default: () => <div>Dashboard DeferralAlert</div>}))
vi.mock('../src/screens/driver/Home', () => ({default: () => <div>Dashboard DriverHome</div>}))
vi.mock('../src/screens/driver/Route', () => ({default: () => <div>Dashboard DriverRoute</div>}))
vi.mock('../src/screens/driver/Stop', () => ({default: () => <div>Dashboard DriverStop</div>}))
vi.mock('../src/screens/driver/Pod', () => ({default: () => <div>Dashboard DriverPod</div>}))
vi.mock('../src/screens/driver/Offline', () => ({default: () => <div>Dashboard DriverOffline</div>}))
vi.mock('../src/screens/driver/Report', () => ({default: () => <div>Dashboard DriverReport</div>}))
vi.mock('../src/screens/loader/Queue', () => ({default: () => <div>Dashboard LoaderQueue</div>}))
vi.mock('../src/screens/loader/Manifest', () => ({default: () => <div>Dashboard LoaderManifest</div>}))
vi.mock('../src/screens/loader/Verify', () => ({default: () => <div>Dashboard LoaderVerify</div>}))
vi.mock('../src/screens/loader/Dispatch', () => ({default: () => <div>Dashboard LoaderDispatch</div>}))
const roles = [['DRIVER','driver','DriverHome','vehicleCode'],['LOADER','loader','LoaderQueue','depotCode'],['STORE_MANAGER','store','PlaceOrder','outletCode'],['DISPATCHER','dispatcher','Dashboard',null]]
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); window.location.hash = '/login'
  HTMLDialogElement.prototype.showModal = function() { this.open = true }
  HTMLDialogElement.prototype.close = function() { this.open = false }
})
afterEach(cleanup)
describe('common authentication flow', () => {
  it.each(roles)('%s redirects, configures and blocks other role pages', async (role, home, dashboard, field) => {
    const user = {role,fullName:'Test account'}
    mocks.post.mockResolvedValue({token:'test-token',user})
    mocks.get.mockResolvedValue(field ? {fields:[{name:field,label:'Assignment',options:[{value:'one',label:'Assigned workspace'}]}]} : {fields:[]})
    mocks.put.mockResolvedValue(user)
    render(<App />)
    const action = userEvent.setup()
    expect(screen.getAllByRole('textbox').length).toBe(1)
    expect(screen.queryByRole('combobox')).toBeNull()
    await action.type(screen.getByLabelText('Username'),'test')
    await action.type(screen.getByLabelText('Password'),'secret')
    await action.click(screen.getByRole('button',{name:'Log In'}))
    expect(mocks.post).toHaveBeenCalledWith('/auth/login',{username:'test',password:'secret'})
    await waitFor(() => expect(window.location.hash).toBe('#/'+home))
    if (field) {
      await screen.findByRole('dialog')
      expect(screen.getAllByRole('combobox').length).toBe(1)
      expect(screen.queryByText('Dashboard '+dashboard)).toBeNull()
      await action.selectOptions(screen.getByRole('combobox'),'one')
      mocks.get.mockResolvedValue({fields:[]})
      await action.click(screen.getByRole('button',{name:'Continue'}))
      expect(mocks.put).toHaveBeenCalledWith('/auth/setup',{[field]:'one'})
    }
    await screen.findByText('Dashboard '+dashboard)
    window.location.hash = '/'+(home === 'driver' ? 'dispatcher' : 'driver')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await waitFor(() => expect(window.location.hash).toBe('#/'+home))
    expect(screen.getByText('Dashboard '+dashboard)).toBeTruthy()
  })
  it('shows invalid credentials and allows retry', async () => {
    mocks.post.mockRejectedValue(new Error('Incorrect username or password'))
    render(<App />); const action = userEvent.setup()
    await action.type(screen.getByLabelText('Username'),'wrong'); await action.type(screen.getByLabelText('Password'),'wrong')
    await action.click(screen.getByRole('button',{name:'Log In'}))
    expect((await screen.findByRole('alert')).textContent).toContain('Incorrect username')
    expect(screen.getByRole('button',{name:'Log In'}).disabled).toBe(false)
  })
  it('restores persisted account and skips completed setup', async () => {
    localStorage.setItem('token','persisted')
    mocks.get.mockImplementation(path => Promise.resolve(path === '/auth/me' ? {role:'DRIVER'} : {fields:[]}))
    render(<App />)
    await screen.findByText('Dashboard DriverHome')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('retains persisted token on server failure and offers retry', async () => {
    localStorage.setItem('token','persisted'); mocks.get.mockRejectedValue(new Error('Server unavailable'))
    render(<App />)
    expect((await screen.findByRole('alert')).textContent).toBe('Server unavailable')
    expect(localStorage.getItem('token')).toBe('persisted')
    expect(screen.getByRole('button',{name:'Try again'})).toBeTruthy()
    await userEvent.setup().click(screen.getByRole('button',{name:'Sign out'}))
    await screen.findByLabelText('Username')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
