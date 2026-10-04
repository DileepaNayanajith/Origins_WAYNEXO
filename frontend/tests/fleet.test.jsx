import { beforeEach, it, expect, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Fleet from '../src/screens/dispatcher/Fleet'
import { api } from '../src/lib/api'
vi.mock('../src/screens/dispatcher/Shell', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../src/lib/api', () => ({ api: { get: vi.fn(), put: vi.fn() } }))
beforeEach(() => {
  cleanup(); vi.clearAllMocks()
  api.get.mockResolvedValue({ vehicles: [{ id: 4, code: 'VEH004', state: 'AVAILABLE', kmPerL: 0, fuelQuota: 100 }], summary: { total: 1 } })
})
it('saves vehicle economy and refreshes the fleet', async () => {
  api.put.mockResolvedValue({ ok: true })
  const user = userEvent.setup(); render(<Fleet />)
  await user.click(await screen.findByRole('button', { name: /Configure/ }))
  await user.type(screen.getByRole('spinbutton'), '7.5')
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }))
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/dispatcher/fleet/4/fuel-economy', { kmPerL: 7.5 }))
  await screen.findByText(/Fuel economy saved/)
  expect(api.get).toHaveBeenCalledTimes(2)
})
it('shows server rejection inside the configuration modal', async () => {
  api.put.mockRejectedValue(new Error('Complete released trips before changing fuel economy'))
  const user = userEvent.setup(); render(<Fleet />)
  await user.click(await screen.findByRole('button', { name: /Configure/ }))
  await user.type(screen.getByRole('spinbutton'), '6')
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }))
  expect((await screen.findByRole('alert')).textContent).toContain('Complete released trips')
  expect(screen.getByRole('dialog')).toBeTruthy()
})
