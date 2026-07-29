import React from 'react'

// URL scheme:
//   /login
//   /admin
//   /:dept/:route        e.g. /it/overview, /hr/directory, /biz/pipeline
//   /:dept               → defaults to overview

const DEPTS = ['it', 'hr', 'biz']
const SHARED = ['mail', 'announcements', 'helpdesk', 'self-service', 'files']

export function stateFromPath(pathname) {
  const parts = pathname.replace(/^\//, '').split('/')
  const [seg0, seg1] = parts

  if (!seg0 || seg0 === 'login') return { page: 'login' }
  if (seg0 === 'admin')          return { page: 'admin' }

  if (DEPTS.includes(seg0)) {
    return { page: 'portal', dept: seg0, route: seg1 || 'overview' }
  }
  // shared overlays as standalone urls
  if (SHARED.includes(seg0)) {
    return { page: 'portal', shared: seg0 }
  }
  return { page: 'login' }
}

export function pathFromState({ dept, route, shared, page }) {
  if (page === 'login')  return '/login'
  if (page === 'admin')  return '/admin'
  if (shared)            return `/${shared}`
  if (dept && route && route !== 'overview') return `/${dept}/${route}`
  if (dept)              return `/${dept}`
  return '/login'
}

export function usePortalRouter() {
  const getState = () =>
    typeof window !== 'undefined' ? stateFromPath(window.location.pathname) : { page: 'login' }

  const [state, setState] = React.useState(getState)

  React.useEffect(() => {
    const onPop = () => setState(getState())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = React.useCallback((newState, opts = {}) => {
    const path = pathFromState(newState)
    if (opts.replace) {
      window.history.replaceState(null, '', path)
    } else {
      window.history.pushState(null, '', path)
    }
    setState(newState)
  }, [])

  return [state, navigate]
}
