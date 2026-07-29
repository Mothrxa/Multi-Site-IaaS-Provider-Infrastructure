import React from 'react'
import { I } from '../components/icons.jsx'
import { Btn, Card, Field, Pill } from '../components/ui.jsx'
import { StrataLogo, StrataWordmark, CloudLogo } from '../components/brand.jsx'
import { authApi } from '../api/index.js'

// auth.jsx — login + signup pages (light, friendly, conversion-focused)

function AuthShell({ children, onGo, mode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left: form */}
      <div style={{ padding: "32px 56px", display: "flex", flexDirection: "column" }}>
        <div onClick={() => onGo("landing")} style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <CloudLogo size={44}/>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.18em", color: "var(--text-mute)", textTransform: "uppercase" }}>STRATA</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 420, maxWidth: "100%" }}>
            {children}
          </div>
        </div>
        <div className="mute" style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between" }}>
          <span>© 2026 STRATA Cloud</span>
          <span className="row" style={{ gap: 16 }}>
            <a>Terms</a>
            <a>Privacy</a>
            <a>Status</a>
          </span>
        </div>
      </div>

      {/* Right: marketing panel */}
      <div style={{
        background: "linear-gradient(135deg, #1a2240 0%, #1e2d5a 50%, #18233d 100%)",
        padding: 56, display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative", overflow: "hidden",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
      }}>
        {/* Orbs */}
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
          <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", top:-80, right:-80, background:"radial-gradient(circle, oklch(0.72 0.10 254 / 0.30), transparent 70%)", filter:"blur(60px)" }}/>
          <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", bottom:-60, left:-60, background:"radial-gradient(circle, oklch(0.78 0.09 198 / 0.25), transparent 70%)", filter:"blur(50px)" }}/>
        </div>
        <div style={{ position:"relative", zIndex:1, maxWidth:400 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 12px 5px 5px", borderRadius:999, border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.07)", fontSize:12.5, color:"rgba(240,238,233,0.65)", marginBottom:28 }}>
            <span style={{ background:"linear-gradient(120deg, oklch(0.60 0.10 254), oklch(0.65 0.09 198))", color:"#fff", fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"3px 10px", borderRadius:999 }}>Free</span>
            $200 credit, no card required
          </div>
          <h2 style={{ fontSize:38, lineHeight:1.1, letterSpacing:"-0.03em", color:"#f0eee9", fontWeight:800 }}>
            {mode === "login"
              ? <>Welcome back.<br/><span style={{ background:"linear-gradient(115deg, oklch(0.78 0.10 254), oklch(0.82 0.09 198))", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>Your fleet awaits.</span></>
              : <>Ship to production<br/><span style={{ background:"linear-gradient(115deg, oklch(0.78 0.10 254), oklch(0.82 0.09 198))", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>in 55 seconds.</span></>}
          </h2>
          <p style={{ fontSize:15.5, color:"rgba(240,238,233,0.50)", marginTop:16, lineHeight:1.6 }}>
            {mode === "login"
              ? "Access your VMs, containers, billing and support — all in one place."
              : "Spin up your first VM or container with $200 in credit. No card required."}
          </p>
          <div style={{ marginTop:32, display:"flex", flexDirection:"column", gap:12 }}>
            {[
              "Algiers datacenter · enterprise-grade hardware",
              "Per-second billing — no rounding, ever",
              "Bring your own ISO or container image",
              "SOC 2 Type II + ISO 27001 compliant",
            ].map(s => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(100,180,120,0.18)", border:"1px solid rgba(100,180,120,0.35)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <I.check size={12} stroke="oklch(0.75 0.14 148)"/>
                </div>
                <span style={{ fontSize:13.5, color:"rgba(240,238,233,0.58)" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Login({ onGo, onLogin }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { token, user } = await authApi.login(email, pw);
      localStorage.setItem('strata_cloud_token', token);
      localStorage.setItem('strata_cloud_user', JSON.stringify(user));
      onLogin(user);
    } catch (ex) { setErr(ex.message); }
    finally { setLoading(false); }
  };
  return (
    <AuthShell onGo={onGo} mode="login">
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Sign in</h1>
      <p className="dim" style={{ fontSize: 14, marginBottom: 32 }}>
        New to STRATA? <a onClick={() => onGo("signup")} style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 500 }}>Create an account</a>
      </p>

      <form onSubmit={handleLogin} className="col" style={{ gap: 14 }}>
        <Field label="Email">
          <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required/>
        </Field>
        <Field label={
          <span style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Password</span>
            <a style={{ color: "var(--accent)", fontWeight: 500, fontSize: 12 }}>Forgot?</a>
          </span>
        }>
          <input className="input" type="password" placeholder="••••••••••••" value={pw} onChange={e => setPw(e.target.value)} required/>
        </Field>
        <label className="row" style={{ gap: 8, fontSize: 13, color: "var(--text-dim)", cursor: "pointer", marginTop: 4 }}>
          <input type="checkbox" defaultChecked/> Remember me on this device
        </label>
        {err && <div style={{ padding:"10px 14px", borderRadius:10, fontSize:13, color:"var(--bad)", background:"color-mix(in oklab, var(--bad) 12%, transparent)", border:"1px solid color-mix(in oklab, var(--bad) 25%, transparent)" }}>{err}</div>}
        <Btn kind="primary" type="submit" style={{ height:44, marginTop:4, justifyContent:"center", fontSize:14 }} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Btn>
      </form>

    </AuthShell>
  );
}

function Signup({ onGo, onLogin }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [team, setTeam] = React.useState("");
  const [useCase, setUseCase] = React.useState("");
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (step === 0) {
    return (
      <AuthShell onGo={onGo} mode="signup">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Create your account</h1>
        <p className="dim" style={{ fontSize: 14, marginBottom: 32 }}>
          Already have one? <a onClick={() => onGo("login")} style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 500 }}>Sign in</a>
        </p>

        <form onSubmit={e => { e.preventDefault(); setStep(1); }} className="col" style={{ gap: 14 }}>
          <Field label="Full name">
            <input className="input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required/>
          </Field>
          <Field label="Work email">
            <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required/>
          </Field>
          <Field label="Password" hint="Minimum 8 characters.">
            <input className="input" type="password" placeholder="••••••••••••" value={pw} onChange={e => setPw(e.target.value)} required minLength={8}/>
          </Field>
          <label className="row" style={{ gap: 8, fontSize: 12.5, color: "var(--text-dim)", marginTop: 4, alignItems: "flex-start" }}>
            <input type="checkbox" defaultChecked style={{ marginTop: 3 }}/>
            <span>I agree to the <a style={{ color: "var(--accent)" }}>Terms of Service</a> and <a style={{ color: "var(--accent)" }}>Privacy Policy</a>.</span>
          </label>
        {err && <div style={{ fontSize:13, color:"var(--bad)", background:"color-mix(in oklab, var(--bad) 12%, transparent)", padding:"10px 14px", borderRadius:10, border:"1px solid color-mix(in oklab, var(--bad) 25%, transparent)" }}>{err}</div>}
          <Btn kind="primary" type="submit" style={{ height:44, marginTop:8, justifyContent:"center", fontSize:14 }}>Continue</Btn>
        </form>
      </AuthShell>
    );
  }

  // Step 1: brief onboarding
  return (
    <AuthShell onGo={onGo} mode="signup">
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Tell us a bit about you</h1>
      <p className="dim" style={{ fontSize: 14, marginBottom: 28 }}>
        Two quick questions so we can tailor your dashboard. Skip anytime.
      </p>

      <form onSubmit={async (e) => {
          e.preventDefault(); setErr(''); setLoading(true);
          try {
            const { token, user } = await authApi.signup(name, email, pw);
            localStorage.setItem('strata_cloud_token', token);
            localStorage.setItem('strata_cloud_user', JSON.stringify(user));
            onLogin(user);
          } catch (ex) { setErr(ex.message); setStep(0); }
          finally { setLoading(false); }
        }} className="col" style={{ gap: 20 }}>
        <Field label="Team or company (optional)">
          <input className="input" placeholder="Acme Inc." value={team} onChange={e => setTeam(e.target.value)}/>
        </Field>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, marginBottom: 8 }}>What will you build?</div>
          <div className="g cols-2" style={{ gap: 8 }}>
            {["Web app or API", "Side project", "Data pipeline", "ML inference", "Game server", "Just exploring"].map(opt => (
              <div key={opt}
                onClick={() => setUseCase(opt)}
                className="os-tile"
                style={{
                  ...(useCase === opt ? {
                    borderColor: "var(--accent)",
                    background: "color-mix(in oklab, var(--accent) 12%, var(--surface-3))",
                    boxShadow: "0 0 0 2px color-mix(in oklab, var(--accent) 25%, transparent)",
                    color: "var(--text)",
                  } : {}),
                  padding: 12, fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500 }}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
        <Btn kind="primary" type="submit" style={{ height: 44, marginTop: 4, justifyContent: "center", fontSize: 14 }}>
          Take me to the dashboard <I.arrowR size={14}/>
        </Btn>
        <a onClick={() => onGo("portal-dashboard")} className="mute" style={{ fontSize: 12.5, textAlign: "center", cursor: "pointer" }}>Skip for now</a>
      </form>
    </AuthShell>
  );
}


export { Login, Signup }
