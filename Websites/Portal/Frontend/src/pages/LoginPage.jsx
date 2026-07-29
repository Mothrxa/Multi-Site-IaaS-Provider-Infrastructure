import React from 'react'
import { CloudLogo } from '../components/brand.jsx'
import { authApi } from '../api/auth.js'

export function LoginPage({ onLogin }) {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error,    setError]    = React.useState('')
  const [loading,  setLoading]  = React.useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const { user } = await authApi.login(username, password)
      onLogin(user)
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? 'Incorrect username or password.' : 'Could not connect to server.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 380, padding: '36px 36px 32px',
        background: 'var(--surface)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
        border: '0.5px solid var(--hairline-2)',
        borderRadius: 20, boxShadow: 'var(--shadow-pop)',
        display: 'flex', flexDirection: 'column', gap: 20,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          <CloudLogo size={48}/>
          <span style={{ fontWeight: 700, letterSpacing: '0.18em', fontSize: 13, color: 'var(--text-mute)', textTransform: 'uppercase' }}>STRATA</span>
        </div>

        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>Sign in</div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>Enter your username and password</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="input" type="text" placeholder="Username"
            value={username} onChange={e => setUsername(e.target.value.trim())}
            autoFocus autoComplete="username"
            style={{ width: '100%', height: 40, fontSize: 14 }}
          />
          <input
            className="input" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ width: '100%', height: 40, fontSize: 14 }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: 'color-mix(in oklab, var(--bad) 14%, transparent)',
            border: '0.5px solid color-mix(in oklab, var(--bad) 30%, transparent)',
            color: 'var(--bad)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit" className="btn primary"
          disabled={loading || !username || !password}
          style={{ height: 40, fontSize: 14, fontWeight: 600 }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ borderTop: '0.5px solid var(--hairline)', paddingTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-mute)' }}>
          STRATA Portal · Internal access only
        </div>
      </form>
    </div>
  )
}
