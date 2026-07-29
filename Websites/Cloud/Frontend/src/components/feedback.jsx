import React from 'react'
import { I } from './icons.jsx'
import { Btn } from './ui.jsx'

// ── Toaster ──────────────────────────────────────────────────────────────────
export function Toaster() {
  const [toasts, setToasts] = React.useState([])
  React.useEffect(() => {
    const onToast = (e) => {
      const t = e.detail
      setToasts(ts => [...ts, t])
      setTimeout(() => setToasts(ts => ts.filter(x => x.id !== t.id)), 4200)
    }
    window.addEventListener('strata-toast', onToast)
    return () => window.removeEventListener('strata-toast', onToast)
  }, [])
  const icon = { success: <I.check size={15}/>, error: <I.x size={15}/>, info: <I.bolt size={15}/> }
  const col  = { success: 'var(--good)', error: 'var(--bad)', info: 'var(--accent)' }
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:1000, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:12, minWidth:280, maxWidth:380,
          padding:'13px 16px', borderRadius:12,
          background:'var(--bg-1)', border:'1px solid var(--hairline-2)',
          boxShadow:'0 16px 48px -12px rgba(0,0,0,0.55)',
          animation:'toastIn 0.32s cubic-bezier(0.16,1,0.3,1) both', pointerEvents:'auto',
        }}>
          <span style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
            background:`color-mix(in oklab, ${col[t.kind]} 18%, transparent)`, color:col[t.kind] }}>
            {icon[t.kind] || icon.info}
          </span>
          <span style={{ fontSize:13.5, color:'var(--text)', lineHeight:1.4 }}>{t.message}</span>
        </div>
      ))}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(40px) scale(0.96)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, stroke = 2, color = 'var(--accent)' }) {
  return (
    <span style={{
      display:'inline-block', width:size, height:size, borderRadius:'50%',
      border:`${stroke}px solid color-mix(in oklab, ${color} 25%, transparent)`,
      borderTopColor:color, animation:'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )
}

// ── Loading block ────────────────────────────────────────────────────────────
export function Loading({ label = 'Loading…' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:'80px 0', color:'var(--text-mute)' }}>
      <Spinner size={26}/>
      <span style={{ fontSize:13 }}>{label}</span>
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, body, action, onAction }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      textAlign:'center', padding:'72px 32px', borderRadius:18,
      border:'1px dashed var(--hairline-2)', background:'var(--surface)',
    }}>
      <div style={{
        width:64, height:64, borderRadius:16, marginBottom:20,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'color-mix(in oklab, var(--accent) 12%, transparent)', color:'var(--accent)',
        boxShadow:'0 0 40px -8px color-mix(in oklab, var(--accent) 45%, transparent)',
      }}>{icon}</div>
      <h3 style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)' }}>{title}</h3>
      <p style={{ fontSize:14, color:'var(--text-dim)', maxWidth:380, margin:'8px 0 22px', lineHeight:1.55 }}>{body}</p>
      {action && <Btn kind="primary glow" onClick={onAction}>{action}</Btn>}
    </div>
  )
}

// ── Poll hook: refetch while predicate true ──────────────────────────────────
export function usePolledData(fetcher, { interval = 3500, shouldPoll = () => false, deps = [] } = {}) {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher
  const load = React.useCallback(async () => {
    try { const d = await fetcherRef.current(); setData(d); setError(null); return d }
    catch (e) { setError(e.message); return null }
  }, [])
  React.useEffect(() => {
    let alive = true, timer
    const tick = async () => {
      const d = await load()
      if (!alive) return
      if (shouldPoll(d)) timer = setTimeout(tick, interval)
    }
    tick()
    return () => { alive = false; clearTimeout(timer) }
    // eslint-disable-next-line
  }, deps)
  return { data, error, reload: load, setData }
}
