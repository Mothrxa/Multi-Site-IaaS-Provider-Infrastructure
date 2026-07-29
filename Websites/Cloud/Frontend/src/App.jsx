import React from 'react'
import { useRouter } from './router.js'
import { useTweaks } from './components/tweaks-panel.jsx'
import { TweaksPanel, TweakSection, TweakRadio, TweakColor } from './components/tweaks-panel.jsx'
import { Toaster } from './components/feedback.jsx'
import { PortalShell } from './components/portal-shell.jsx'
import { Login, Signup } from './pages/auth.jsx'
import { PageDashboard } from './pages/page-dashboard.jsx'
import { PageCatalog } from './pages/page-catalog.jsx'
import { PageVpsList, PageVpsDetail, PageContainerDetail } from './pages/page-vps-detail.jsx'
import { PageCreateVps } from './pages/page-create-vps.jsx'
import { PageCreateContainer } from './pages/page-create-container.jsx'
import { PageBilling } from './pages/page-billing.jsx'
import { PageSettings } from './pages/page-settings.jsx'
import { PageSupport } from './pages/page-support.jsx'
import { authApi, logoutApi } from './api/index.js'
import { LANDING_URL } from './domains.js'

const DEFAULT_TWEAKS = {
  theme: 'auto',
  accent: 'indigo',
  wizardLayout: 'stepper',
  logoVariant: 'prism',
}

function accentFromHex(hex) {
  const map = { '#7B7BE8': 'indigo', '#54C8E0': 'cyan', '#A8D854': 'lime', '#E8B547': 'amber' }
  return map[hex] || 'indigo'
}
function accentHexFromName(name) {
  const map = { indigo: '#7B7BE8', cyan: '#54C8E0', lime: '#A8D854', amber: '#E8B547' }
  return map[name] || '#7B7BE8'
}

export default function App() {
  const [route, navigate] = useRouter('login')
  const [t, setTweak] = useTweaks(DEFAULT_TWEAKS)
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('strata_cloud_user')) } catch { return null }
  })
  const [checking, setChecking] = React.useState(true)

  // Validate session on load
  React.useEffect(() => {
    const token = localStorage.getItem('strata_cloud_token')
    if (!token) { setChecking(false); return }
    authApi.me()
      .then((user) => {
        setUser(user)
        localStorage.setItem('strata_cloud_user', JSON.stringify(user))
      })
      .catch(() => {
        localStorage.removeItem('strata_cloud_token')
        localStorage.removeItem('strata_cloud_user')
        setUser(null)
      })
      .finally(() => setChecking(false))
  }, [])

  // React to session expiry from api layer
  React.useEffect(() => {
    const onLogout = () => { setUser(null); onGo('login') }
    window.addEventListener('strata-logout', onLogout)
    return () => window.removeEventListener('strata-logout', onLogout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onGo = (r, opts) => {
    if (r === 'landing') { window.location.href = LANDING_URL; return }
    navigate(r, opts)
  }

  const onLogin = (u) => { setUser(u); onGo('portal-dashboard', { replace: true }) }
  const onLogout = async () => {
    await logoutApi()
    localStorage.removeItem('strata_cloud_token')
    localStorage.removeItem('strata_cloud_user')
    setUser(null)
    onGo('login', { replace: true })
  }

  const isAuthRoute = route === 'login' || route === 'signup'

  const resolvedTheme = 'light'

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    document.documentElement.setAttribute('data-route', route)
    document.documentElement.setAttribute('data-accent', t.accent || 'indigo')
  }, [resolvedTheme, route, t.accent])

  // Logged in but sitting on an auth route → go straight to the dashboard
  React.useEffect(() => {
    if (!checking && user && isAuthRoute) onGo('portal-dashboard', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, user, isAuthRoute])

  if (checking) return null

  // Not logged in → always show auth pages
  if (!user) {
    if (route === 'signup') return <><Signup onGo={onGo} onLogin={onLogin}/><Toaster/></>
    return <><Login onGo={onGo} onLogin={onLogin}/><Toaster/></>
  }

  if (isAuthRoute) return null

  // Portal routes
  let body = null
  if (route === 'portal-dashboard') body = <PageDashboard onGo={onGo} user={user}/>
  else if (route === 'portal-marketplace') body = <PageCatalog onGo={onGo}/>
  else if (route === 'portal-vps-list') body = <PageVpsList onGo={onGo} filter="vm"/>
  else if (route === 'portal-container-list') body = <PageVpsList onGo={onGo} filter="cnt"/>
  else if (route === 'portal-create-vps') body = <PageCreateVps onGo={onGo} layout={t.wizardLayout}/>
  else if (route === 'portal-create-container') body = <PageCreateContainer onGo={onGo}/>
  else if (route.startsWith('portal-vps-detail-')) {
    const id = route.replace('portal-vps-detail-', '')
    body = <PageVpsDetail id={id} onGo={onGo}/>
  } else if (route.startsWith('portal-cnt-detail-')) {
    const id = route.replace('portal-cnt-detail-', '')
    body = <PageContainerDetail id={id} onGo={onGo}/>
  } else if (route === 'portal-billing') body = <PageBilling onGo={onGo}/>
  else if (route === 'portal-settings') body = <PageSettings onGo={onGo} user={user} setUser={setUser}/>
  else if (route === 'portal-support') body = <PageSupport onGo={onGo}/>
  else body = <div className="page">Unknown route: {route}</div>

  return (
    <>
      <PortalShell route={route} onGo={onGo} user={user} onLogout={onLogout}>
        {body}
      </PortalShell>
      <Toaster/>
      <TweaksUI t={t} setTweak={setTweak}/>
    </>
  )
}

function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme">
        <TweakRadio
          label="Portal theme"
          value={t.theme === 'auto' ? 'dark' : t.theme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
          onChange={v => setTweak('theme', v)}
        />
      </TweakSection>

      <TweakSection label="Accent">
        <TweakColor
          label="Brand accent"
          value={accentHexFromName(t.accent)}
          options={['#7B7BE8', '#54C8E0', '#A8D854', '#E8B547']}
          onChange={v => setTweak('accent', accentFromHex(v))}
        />
      </TweakSection>

      <TweakSection label="Wizard layout">
        <TweakRadio
          label="Create-VPS form"
          value={t.wizardLayout}
          options={[
            { value: 'stepper', label: 'Stepper' },
            { value: 'single', label: 'Single' },
            { value: 'preview', label: 'Preview' },
          ]}
          onChange={v => setTweak('wizardLayout', v)}
        />
      </TweakSection>
    </TweaksPanel>
  )
}
