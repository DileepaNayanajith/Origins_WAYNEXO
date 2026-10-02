import { useEffect, useState, useCallback } from 'react'

// Tiny hash router (no extra dependency). Routes look like "#/driver/route/1".
const read = () => (window.location.hash.replace(/^#/, '') || '/')

export function useRoute() {
  const [path, setPath] = useState(read)
  useEffect(() => {
    const on = () => setPath(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}

export function navigate(path, { replace = false } = {}) {
  if (replace) window.location.replace('#' + path)
  else window.location.hash = path
}

/** Match "/driver/stop/:id" against a path; returns params or null. */
export function match(pattern, path) {
  const p = pattern.split('/').filter(Boolean)
  const s = path.split('?')[0].split('/').filter(Boolean)
  if (p.length !== s.length) return null
  const params = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i])
    else if (p[i] !== s[i]) return null
  }
  return params
}

export function Link({ to, className, children, ...rest }) {
  const onClick = useCallback((e) => { e.preventDefault(); navigate(to) }, [to])
  return <a href={'#' + to} onClick={onClick} className={className} {...rest}>{children}</a>
}
