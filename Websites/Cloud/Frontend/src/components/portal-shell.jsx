import React from 'react'
import ReactDOM from 'react-dom'
import { I } from './icons.jsx'
import { Btn, Avatar } from './ui.jsx'
import { StrataLogo, StrataWordmark, CloudLogo } from './brand.jsx'

// portal-shell.jsx — sidebar + topbar wrapper for portal routes

const NAV = [
  { id: "portal-dashboard", label: "Dashboard", icon: <I.home size={19}/>, group: "Main" },
  { id: "portal-marketplace", label: "Marketplace", icon: <I.layers size={19}/>, group: "Main" },
  { id: "portal-vps-list", label: "Virtual Machines", icon: <I.server size={19}/>, group: "Compute" },
  { id: "portal-container-list", label: "Containers", icon: <I.cloud size={19}/>, group: "Compute" },
  { id: "portal-billing", label: "Billing", icon: <I.cash size={19}/>, group: "Account" },
  { id: "portal-settings", label: "Account", icon: <I.cog size={19}/>, group: "Account" },
  { id: "portal-support", label: "Support", icon: <I.question size={19}/>, group: "Account" },
];

function Sidebar({ route, onGo }) {
  const baseRoute =
    route.startsWith("portal-vps-") ? "portal-vps-list" :
    route.startsWith("portal-create-vps") ? "portal-vps-list" :
    route.startsWith("portal-create-container") ? "portal-container-list" :
    route.startsWith("portal-cnt-detail-") ? "portal-container-list" :
    route;

  const groups = ["Main", "Compute", "Account"];
  return (
    <aside className="sidebar">
      {/* Header card — matches Portal sidebar dept card style */}
      <div onClick={() => onGo("landing")} style={{
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        padding: "10px 12px 12px", borderRadius: 14, marginBottom: 6,
        background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 18%, transparent), color-mix(in oklab, var(--accent) 6%, transparent))",
        border: "0.5px solid color-mix(in oklab, var(--accent) 26%, var(--hairline))",
      }}>
        <CloudLogo size={34}/>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.01em", color: "var(--text)" }}>STRATA</div>
          <div style={{ fontSize: 10.5, color: "var(--text-mute)", marginTop: 1, letterSpacing: "0.03em" }}>Cloud Platform</div>
        </div>
      </div>

      {groups.map(g => (
        <div key={g} className="nav-group">
          <div className="lbl">{g}</div>
          {NAV.filter(n => n.group === g).map(n => {
            const active = baseRoute === n.id;
            return (
              <button key={n.id} onClick={() => onGo(n.id)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 16px", width: "100%",
                borderRadius: 10, border: "none",
                background: active
                  ? "linear-gradient(180deg, color-mix(in oklab, var(--accent) 22%, transparent), color-mix(in oklab, var(--accent) 12%, transparent))"
                  : "transparent",
                boxShadow: active ? "inset 0 0 0 0.5px color-mix(in oklab, var(--accent) 38%, transparent)" : "none",
                color: active ? "var(--text)" : "var(--text-dim)",
                cursor: "pointer", fontSize: 15, fontFamily: "var(--f-sans)",
                fontWeight: active ? 500 : 400,
                position: "relative",
                transition: "all 0.13s ease",
                textAlign: "left",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-3)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                {active && (
                  <span style={{
                    position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 18, background: "var(--accent)", borderRadius: "0 2px 2px 0",
                    boxShadow: "0 0 8px var(--accent)",
                  }}/>
                )}
                <span style={{ color: active ? "var(--accent)" : "var(--text-dim)", display: "inline-flex", flexShrink: 0 }}>{n.icon}</span>
                <span style={{ flex: 1, whiteSpace: "nowrap" }}>{n.label}</span>
                {n.badge && (
                  <span style={{
                    minWidth: 18, height: 16, padding: "0 5px", borderRadius: 8,
                    background: active ? "var(--accent)" : "var(--surface-3)",
                    color: active ? "#fff" : "var(--text-dim)",
                    fontSize: 10, fontWeight: 600,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    border: active ? "none" : "0.5px solid var(--hairline)",
                  }}>{n.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}

    </aside>
  );
}

function TopbarProfileMenu({ user, onGo, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, right: 0 });
  const triggerRef = React.useRef(null);
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??';

  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 10, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  };

  const menuItem = (label, icon, action, danger) => (
    <div key={label} onClick={() => { action(); setOpen(false); }}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8,
        cursor:"pointer", fontSize:13, color: danger ? "var(--bad)" : "var(--text-dim)",
        transition:"background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = danger
        ? "color-mix(in oklab, var(--bad) 10%, transparent)" : "var(--surface-3)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >{icon}{label}</div>
  );

  return (
    <>
      <div ref={triggerRef} onClick={toggle}
        style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
        <div className="col" style={{ gap:0, alignItems:"flex-end" }}>
          <span style={{ fontSize:14, fontWeight:600 }}>{user?.name || "Account"}</span>
          <span className="mute" style={{ fontSize:12 }}>{user?.plan || "starter"}</span>
        </div>
        <div style={{
          width:38, height:38, borderRadius:"50%", flexShrink:0,
          background:"linear-gradient(135deg, var(--accent), var(--accent-2))",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:700, color:"#fff",
        }}>{initials}</div>
      </div>

      {open && ReactDOM.createPortal(
        <>
          {/* Full-screen backdrop — click anywhere outside closes menu */}
          <div onClick={() => setOpen(false)}
            style={{ position:"fixed", inset:0, zIndex:9998 }}/>
          {/* Menu rendered at document.body — escapes backdrop-filter stacking context */}
          <div style={{
            position:"fixed", top:pos.top, right:pos.right, minWidth:200,
            background:"var(--bg-1)", border:"1px solid var(--hairline-2)",
            borderRadius:12, padding:6, zIndex:9999,
            boxShadow:"0 16px 48px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          }}>
            <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid var(--hairline)", marginBottom:4 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{user?.name}</div>
              <div style={{ fontSize:11, color:"var(--text-mute)", marginTop:2 }}>{user?.email}</div>
            </div>
            {menuItem("Account settings", <I.cog size={14}/>, () => onGo("portal-settings"))}
            <div style={{ height:1, background:"var(--hairline)", margin:"4px 0" }}/>
            {menuItem("Sign out", <I.exit size={14}/>, onLogout, true)}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function Topbar({ route, onGo, user, onLogout }) {
  return (
    <div className="topbar">
      <div className="spacer"/>
      <Btn kind="ghost" size="sm" icon={<I.doc size={16}/>}>Docs</Btn>
      <Btn kind="ghost icon sm" icon={<I.refresh size={17}/>} title="Refresh"/>
      <Btn kind="ghost icon sm" icon={<I.bell size={17}/>} title="Notifications"/>
      <div style={{ paddingLeft:8, borderLeft:"0.5px solid var(--hairline)" }}>
        <TopbarProfileMenu user={user} onGo={onGo} onLogout={onLogout}/>
      </div>
    </div>
  );
}

function PortalShell({ route, onGo, user, onLogout, children }) {
  return (
    <div className="portal">
      <Sidebar route={route} onGo={onGo}/>
      <div className="main-col">
        <Topbar route={route} onGo={onGo} user={user} onLogout={onLogout}/>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}


export { PortalShell }
