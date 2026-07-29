import React from 'react'
import { Landing } from './pages/landing.jsx'
import { Toaster } from './components/feedback.jsx'
import { PORTAL_URL } from './domains.js'

// Routes the marketing pages link out to live in the Portal app.
const PORTAL_PATHS = {
  login: '/login',
  signup: '/signup',
  'portal-dashboard': '/dashboard',
}

export default function App() {
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.setAttribute('data-route', 'landing')
    document.documentElement.setAttribute('data-accent', 'indigo')
  }, [])

  const onGo = (route) => {
    if (route === 'landing') { window.scrollTo(0, 0); return }
    const path = PORTAL_PATHS[route] || '/'
    window.location.href = PORTAL_URL + path
  }

  return (
    <>
      <Landing onGo={onGo}/>
      <Toaster/>
    </>
  )
}
