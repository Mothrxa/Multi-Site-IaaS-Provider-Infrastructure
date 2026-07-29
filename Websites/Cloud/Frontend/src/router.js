import React from 'react'

// URL ↔ route name mapping for the portal
const PATH_TO_ROUTE = {
  '/':                   'login',
  '/login':              'login',
  '/signup':             'signup',
  '/dashboard':          'portal-dashboard',
  '/vms':                'portal-vps-list',
  '/containers':         'portal-container-list',
  '/catalog':            'portal-catalog',
  '/create-vm':          'portal-create-vps',
  '/create-container':   'portal-create-container',
  '/billing':            'portal-billing',
  '/settings':           'portal-settings',
  '/support':            'portal-support',
  '/storage':            'portal-storage',
  '/network':            'portal-network',
}

const ROUTE_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_ROUTE).map(([k, v]) => [v, k]).filter(([k]) => k !== 'login')
)
ROUTE_TO_PATH['login']            = '/login'
ROUTE_TO_PATH['signup']           = '/signup'
ROUTE_TO_PATH['portal-dashboard'] = '/dashboard'

export function routeFromPath(pathname) {
  // Detail pages
  const vmMatch  = pathname.match(/^\/vms\/(.+)$/)
  if (vmMatch)  return `portal-vps-detail-${vmMatch[1]}`
  const cntMatch = pathname.match(/^\/containers\/(.+)$/)
  if (cntMatch) return `portal-cnt-detail-${cntMatch[1]}`

  return PATH_TO_ROUTE[pathname] || 'portal-dashboard'
}

export function pathFromRoute(route) {
  if (route.startsWith('portal-vps-detail-'))  return `/vms/${route.replace('portal-vps-detail-', '')}`
  if (route.startsWith('portal-cnt-detail-'))  return `/containers/${route.replace('portal-cnt-detail-', '')}`
  return ROUTE_TO_PATH[route] || '/dashboard'
}

export function useRouter(initialRoute) {
  const [route, setRouteState] = React.useState(() => {
    if (typeof window === 'undefined') return initialRoute
    return routeFromPath(window.location.pathname)
  })

  React.useEffect(() => {
    const onPop = () => setRouteState(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = React.useCallback((newRoute, opts = {}) => {
    const path = pathFromRoute(newRoute)
    if (opts.replace) {
      window.history.replaceState(null, '', path)
    } else {
      window.history.pushState(null, '', path)
    }
    setRouteState(newRoute)
    if (['login'].includes(newRoute)) window.scrollTo(0, 0)
  }, [])

  return [route, navigate]
}
