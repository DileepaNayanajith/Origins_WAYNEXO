import { useEffect } from 'react'
import { AuthProvider, useAuth, ROLE_HOME } from './lib/auth'
import { useRoute, match, navigate } from './lib/router'
import Login from './screens/Login'
import Dashboard from './screens/dispatcher/Dashboard'
import Orders from './screens/dispatcher/Orders'
import Planning from './screens/dispatcher/Planning'
import Fleet from './screens/dispatcher/Fleet'
import Tracking from './screens/dispatcher/Tracking'
import Deferrals from './screens/dispatcher/Deferrals'
import PlaceOrder from './screens/store/PlaceOrder'
import History from './screens/store/History'
import Schedule from './screens/store/Schedule'
import Receive from './screens/store/Receive'
import DeferralAlert from './screens/store/DeferralAlert'
import DriverHome from './screens/driver/Home'
import DriverRoute from './screens/driver/Route'
import DriverStop from './screens/driver/Stop'
import DriverPod from './screens/driver/Pod'
import DriverOffline from './screens/driver/Offline'
import DriverReport from './screens/driver/Report'
import LoaderQueue from './screens/loader/Queue'
import LoaderManifest from './screens/loader/Manifest'
import LoaderVerify from './screens/loader/Verify'
import LoaderDispatch from './screens/loader/Dispatch'

// Role -> its own interface. A user can never open another role's screens.
const ROUTES = [
  ['DISPATCHER', '/dispatcher', Dashboard], ['DISPATCHER', '/dispatcher/orders', Orders], ['DISPATCHER', '/dispatcher/planning', Planning],
  ['DISPATCHER', '/dispatcher/fleet', Fleet], ['DISPATCHER', '/dispatcher/tracking', Tracking], ['DISPATCHER', '/dispatcher/deferrals', Deferrals],
  ['STORE_MANAGER', '/store', PlaceOrder], ['STORE_MANAGER', '/store/history', History], ['STORE_MANAGER', '/store/schedule', Schedule],
  ['STORE_MANAGER', '/store/receive', Receive], ['STORE_MANAGER', '/store/deferral', DeferralAlert], ['STORE_MANAGER', '/store/deferral/:id', DeferralAlert],
  ['DRIVER', '/driver', DriverHome], ['DRIVER', '/driver/trip/:id', DriverRoute], ['DRIVER', '/driver/stop/:id', DriverStop],
  ['DRIVER', '/driver/pod/:id', DriverPod], ['DRIVER', '/driver/offline', DriverOffline], ['DRIVER', '/driver/report', DriverReport],
  ['LOADER', '/loader', LoaderQueue], ['LOADER', '/loader/manifest/:id', LoaderManifest], ['LOADER', '/loader/verify/:id', LoaderVerify],
  ['LOADER', '/loader/dispatch/:id', LoaderDispatch],
]

function Router() {
  const path = useRoute()
  const { user, ready } = useAuth()

  const loginMatch = path === '/' || path === '/login' || path.startsWith('/login/')
  useEffect(() => {
    if (!ready) return
    if (!user && !loginMatch) navigate('/login', { replace: true })
    if (user && (loginMatch || !path.startsWith(ROLE_HOME[user.role]))) navigate(ROLE_HOME[user.role], { replace: true })
  }, [ready, user, path, loginMatch])

  if (!ready) return null
  if (!user) return loginMatch ? <Login portal={path.split('/')[2]} /> : null
  for (const [role, pattern, Comp] of ROUTES) {
    if (role !== user.role) continue
    const params = match(pattern, path)
    if (params) return <Comp {...params} key={path} />
  }
  return null
}

export default function App() {
  return <AuthProvider><Router /></AuthProvider>
}
