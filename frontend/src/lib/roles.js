export const ROLE_HOME = Object.freeze({ DISPATCHER: '/dispatcher', STORE_MANAGER: '/store', DRIVER: '/driver', LOADER: '/loader' })
export function ownsPath(role, path) {
  const home = ROLE_HOME[role]
  return Boolean(home && (path === home || path.startsWith(home + '/')))
}
