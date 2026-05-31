import React from 'react'
import {
  useTweaks, TweaksPanel, TweakSection, TweakRow, TweakToggle, TweakRadio, TweakSlider,
  I, StrataLogo,
  Card, Stat, SectionHeader, Avatar,
  TopBar, Sidebar,
} from './components'
import {
  ITOverview, ITDevelopment, ITInfrastructure, ITWorkloads, ITTickets, ITSubscribers,
  HROverview, HRDirectory, HRRecruitment, HRLeave, HRPayroll, HRExpenses, HRDocuments,
  BizOverview, BizCustomers, BizBilling, BizInvoices, BizRevenue, BizPipeline,
  MailPage, AnnouncementsPage, HelpdeskPage, SelfServicePage, FilesPage, DeptDocumentsPage,
  SettingsPage, LoginPage, AdminPanel,
} from './pages'
import { authApi } from './api/auth.js'
import { selfServiceApi } from './api/index.js'

const ADMIN_ROLES  = ['superadmin', 'it_admin'] // can access admin panel
const SUPER_ROLES  = ['superadmin']             // land on admin panel + can switch dept

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true,
  "accent": "indigo",
  "sidebar": "labeled",
  "radius": 16,
  "glass": 24,
  "logo": "stack",
  "density": "spacious"
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  indigo:    { accent: "oklch(0.72 0.14 270)", accent2: "oklch(0.78 0.12 200)" },
  cyan:      { accent: "oklch(0.74 0.13 210)", accent2: "oklch(0.78 0.13 240)" },
  violet:    { accent: "oklch(0.7  0.18 290)", accent2: "oklch(0.78 0.13 310)" },
  mint:      { accent: "oklch(0.78 0.13 165)", accent2: "oklch(0.78 0.12 210)" },
  amber:     { accent: "oklch(0.79 0.14 75)",  accent2: "oklch(0.78 0.13 35)"  },
  rose:      { accent: "oklch(0.72 0.16 350)", accent2: "oklch(0.78 0.13 30)"  },
};

function App() {
  const [auth, setAuth] = React.useState(() => {
    try {
      const u = localStorage.getItem('strata_user')
      const t = localStorage.getItem('strata_token')
      return (u && t) ? JSON.parse(u) : null
    } catch { return null }
  })
  const [adminOpen, setAdminOpen] = React.useState(false)

  // Verify token on mount — evict stale sessions
  React.useEffect(() => {
    if (!auth) return
    authApi.me().catch(() => {
      localStorage.removeItem('strata_token')
      localStorage.removeItem('strata_user')
      setAuth(null)
    })
  }, [])

  function handleLogin(user) {
    setAuth(user)
    if (SUPER_ROLES.includes(user.role)) setAdminOpen(true)
  }
  function handleLogout() { authApi.logout(); setAuth(null); setAdminOpen(false) }

  if (!auth)     return <LoginPage onLogin={handleLogin}/>
  if (adminOpen) return <AdminPanel user={auth} onBack={() => setAdminOpen(false)}/>

  return (
    <PortalApp
      auth={auth}
      isAdmin={ADMIN_ROLES.includes(auth.role)}
      canSwitchDept={SUPER_ROLES.includes(auth.role)}
      onLogout={handleLogout}
      onAdmin={() => setAdminOpen(true)}
    />
  )
}

function PortalApp({ auth, isAdmin, canSwitchDept, onLogout, onAdmin }) {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [dept,   setDept]  = React.useState(auth.dept || "it");
  const [route,  setRoute] = React.useState("overview");
  const [shared, setShared] = React.useState(null);

  // non-superadmin: always stay on their assigned dept
  const effectiveDept    = canSwitchDept ? dept : (auth.dept || "it");
  const handleDeptChange = canSwitchDept ? setDept : () => {};
  const [mailComposeTo, setMailComposeTo] = React.useState(null);
  const [profileOpen,   setProfileOpen]   = React.useState(false);

  function openComposeMail(email) {
    setMailComposeTo(email);
    setShared('mail');
  }

  // apply theme + tweaks
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = t.dark ? "dark" : "light";
    let ac;
    if (ACCENT_PRESETS[t.accent]) {
      ac = ACCENT_PRESETS[t.accent];
    } else if (typeof t.accent === "string" && (t.accent.startsWith("#") || t.accent.startsWith("oklch"))) {
      // custom color — derive a complementary accent-2 by lightening
      ac = { accent: t.accent, accent2: `color-mix(in oklab, ${t.accent} 60%, white 20%)` };
    } else {
      ac = ACCENT_PRESETS.indigo;
    }
    root.style.setProperty("--accent", ac.accent);
    root.style.setProperty("--accent-2", ac.accent2);
    root.style.setProperty("--r-card", `${t.radius}px`);
    root.style.setProperty("--r-soft", `${Math.max(8, t.radius - 4)}px`);
    root.style.setProperty("--glass-blur", `${t.glass}px`);
    if (t.density === "compact") {
      root.style.setProperty("--pad-card", "16px");
      root.style.setProperty("--gap-grid", "12px");
    } else if (t.density === "dense") {
      root.style.setProperty("--pad-card", "14px");
      root.style.setProperty("--gap-grid", "10px");
    } else {
      root.style.setProperty("--pad-card", "22px");
      root.style.setProperty("--gap-grid", "18px");
    }
  }, [t]);

  React.useEffect(() => { setRoute("overview"); }, [effectiveDept]);

  const goto = (r) => setRoute(r);

  return (
    <div data-dept={effectiveDept} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar
        dept={effectiveDept}
        onDeptChange={handleDeptChange}
        canSwitchDept={canSwitchDept}
        theme={t.dark ? "dark" : "light"}
        onThemeToggle={() => setTweak("dark", !t.dark)}
        onOpenShared={(id) => setShared(id)}
        onProfile={() => setProfileOpen(true)}
        sharedActive={shared}
        logoVariant={t.logo}
        user={auth}
        isAdmin={isAdmin}
        onAdmin={onAdmin}
        onLogout={onLogout}
      />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar dept={effectiveDept} current={route} onNav={setRoute} mode={t.sidebar} logoVariant={t.logo}/>
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "26px 30px 60px", position: "relative" }}>
          <div key={`${dept}-${route}`}>
            <RouteView dept={effectiveDept} route={route} goto={goto} user={auth} t={t} setTweak={setTweak} onOpenShared={(id) => setShared(id)} onComposeMailTo={openComposeMail}/>
          </div>
        </main>
      </div>

      {shared && (
        <SharedOverlay
          which={shared}
          onClose={() => { setShared(null); setMailComposeTo(null); }}
          user={auth}
          mailComposeTo={mailComposeTo}
        />
      )}

      {profileOpen && (
        <ProfileOverlay user={auth} onClose={() => setProfileOpen(false)}/>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme"/>
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)}/>
        <TweakRow label="Accent">
          <AccentSwatches value={t.accent} onChange={(v) => setTweak("accent", v)}/>
        </TweakRow>
        <TweakSection label="Layout"/>
        <TweakRadio label="Sidebar" value={t.sidebar} options={["labeled", "icon"]} onChange={(v) => setTweak("sidebar", v)}/>
        <TweakRadio label="Density" value={t.density} options={["spacious", "compact", "dense"]} onChange={(v) => setTweak("density", v)}/>
        <TweakSlider label="Card radius" value={t.radius} min={8} max={28} unit="px" onChange={(v) => setTweak("radius", v)}/>
        <TweakSlider label="Glass blur"  value={t.glass}  min={0} max={48} unit="px" onChange={(v) => setTweak("glass", v)}/>
        <TweakSection label="Brand"/>
        <TweakRadio label="Logo" value={t.logo} options={["stack", "prism", "pulse"]} onChange={(v) => setTweak("logo", v)}/>
      </TweaksPanel>
    </div>
  );
}

// Accent color tweak — pass options as objects so we can render hue swatches
// Patch TweakColor's swatch rendering would be ideal; the starter accepts simple strings/arrays too.
// We pass {value, color} but the starter only knows strings; so override via inline buttons.
function AccentSwatches({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Object.entries(ACCENT_PRESETS).map(([name, p]) => (
        <button key={name} onClick={() => onChange(name)} title={name} style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})`,
          border: value === name ? "2px solid var(--text)" : "1px solid var(--hairline)",
          cursor: "pointer", padding: 0,
        }}/>
      ))}
    </div>
  );
}

function RouteView({ dept, route, goto, user, t, setTweak, onOpenShared, onComposeMailTo }) {
  if (route === "settings") return <SettingsPage dept={dept} t={t} setTweak={setTweak}/>;
  if (dept === "it") {
    switch (route) {
      case "overview":      return <ITOverview goto={goto}/>;
      case "development":   return <ITDevelopment/>;
      case "infrastructure":return <ITInfrastructure/>;
      case "workloads":     return <ITWorkloads/>;
      case "tickets":       return <ITTickets/>;
      case "subscribers":   return <ITSubscribers/>;
      case "documents":     return <DeptDocumentsPage user={user}/>;
    }
  }
  if (dept === "hr") {
    const hrProps = { goto, onOpenShared, onComposeMailTo }
    switch (route) {
      case "overview":     return <HROverview     {...hrProps}/>;
      case "directory":    return <HRDirectory    {...hrProps}/>;
      case "recruitment":  return <HRRecruitment  {...hrProps}/>;
      case "leave":        return <HRLeave        {...hrProps}/>;
      case "payroll":      return <HRPayroll       goto={goto}/>;
      case "expenses":     return <HRExpenses/>;
      case "documents":    return <HRDocuments     goto={goto}/>;
    }
  }
  if (dept === "biz") {
    switch (route) {
      case "overview":     return <BizOverview goto={goto}/>;
      case "customers":    return <BizCustomers/>;
      case "billing":      return <BizBilling/>;
      case "invoices":     return <BizInvoices/>;
      case "revenue":      return <BizRevenue/>;
      case "pipeline":     return <BizPipeline/>;
      case "documents":    return <DeptDocumentsPage user={user}/>;
    }
  }
  return <PlaceholderPage title="Page not found"/>;
}

function PlaceholderPage({ title, subtitle, dept }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title={title} subtitle={subtitle || "This area is under construction."}/>
      <Card style={{ padding: 60, textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 18px",
          background: "color-mix(in oklab, var(--accent) 15%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)",
        }}><I.cog size={26}/></div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Coming soon</div>
        <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 6 }}>The {dept || ""} {title.toLowerCase()} module is on the next iteration.</div>
      </Card>
    </div>
  );
}

// Shared service overlay — opens as a centered, large sheet
function SharedOverlay({ which, onClose, user, mailComposeTo }) {
  const pages = {
    mail:        { node: <MailPage user={user} composeTo={mailComposeTo}/>, label: "Mail" },
    announce:    { node: <AnnouncementsPage user={user}/>,  label: "Announcement Board" },
    files:       { node: <FilesPage user={user}/>,          label: "File Sharing" },
    helpdesk:    { node: <HelpdeskPage user={user}/>,       label: "IT Helpdesk" },
    selfservice: { node: <SelfServicePage user={user}/>,    label: "HR Self-Service" },
  };
  const page = pages[which];
  if (!page) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 90,
      background: "rgba(7, 9, 15, 0.55)",
      WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "60px 30px 30px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(1320px, 100%)", maxHeight: "100%", overflowY: "auto",
        background: "var(--bg-1)", border: "0.5px solid var(--hairline-2)",
        borderRadius: 20, boxShadow: "var(--shadow-pop)",
        padding: "26px 30px 60px", position: "relative",
      }}>
        <button onClick={onClose} className="btn ghost icon" style={{
          position: "absolute", right: 18, top: 18, width: 32, height: 32, zIndex: 10,
        }}><I.x size={16}/></button>
        {page.node}
      </div>
    </div>
  );
}

function ProfileOverlay({ user, onClose }) {
  const [profile,    setProfile]    = React.useState(null)
  const [form,       setForm]       = React.useState({ phone: '', address: '', emergency_name: '', emergency_phone: '', iban: '', personal_email: '' })
  const [submitting, setSubmitting] = React.useState(false)
  const [saved,      setSaved]      = React.useState(false)

  React.useEffect(() => {
    selfServiceApi.getProfile()
      .then(d => {
        setProfile(d)
        if (d.profile) setForm(f => ({ ...f, ...d.profile }))
      })
      .catch(() => {})
  }, [])

  function handleSave() {
    setSubmitting(true)
    selfServiceApi.updateProfile(form)
      .then(() => { setSaved(true); setTimeout(() => setSaved(false), 2000) })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'rgba(7,9,15,0.55)',
      WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 30px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(560px, 100%)', background: 'var(--bg-1)',
        border: '0.5px solid var(--hairline-2)', borderRadius: 20,
        boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '0.5px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user.name} size={52}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>
              {user.dept?.toUpperCase()} · {user.role?.replace('_', ' ')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{user.email}</div>
          </div>
          <button className="btn ghost icon" onClick={onClose} style={{ width: 32, height: 32 }}><I.x size={16}/></button>
        </div>

        {/* Editable fields */}
        <div style={{ padding: '22px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ProfileField label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+213 …"/>
            <ProfileField label="Personal email" value={form.personal_email} onChange={v => setForm(f => ({ ...f, personal_email: v }))} type="email"/>
          </div>
          <ProfileField label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} multiline/>

          <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>Payroll</div>
          <ProfileField label="IBAN" value={form.iban} onChange={v => setForm(f => ({ ...f, iban: v }))} placeholder="DZ…" mono/>

          <div style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>Emergency contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ProfileField label="Name"  value={form.emergency_name}  onChange={v => setForm(f => ({ ...f, emergency_name: v }))}/>
            <ProfileField label="Phone" value={form.emergency_phone} onChange={v => setForm(f => ({ ...f, emergency_phone: v }))}/>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn primary" onClick={handleSave} disabled={submitting}>
              {saved ? '✓ Saved' : submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileField({ label, value, onChange, type = 'text', placeholder, multiline, mono }) {
  const style = { width: '100%', ...(mono ? { fontFamily: 'var(--f-mono)', fontSize: 12 } : {}) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>{label}</label>
      {multiline
        ? <textarea className="input" style={{ ...style, height: 64, resize: 'none', padding: '8px 12px' }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
        : <input className="input" type={type} style={style} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
      }
    </div>
  )
}

export default App
