import React from 'react'
import { I } from './icons.jsx'
import { useLiveTime, Avatar } from './ui.jsx'
import { StrataLogo } from './brand.jsx'
import { mailApi } from '../api/mail.js'
import { announcementsApi } from '../api/index.js'

// topbar.jsx — macOS menu-bar style shared services bar + global search + user

const ANNOUNCE_SEEN_KEY = 'strata_announce_seen'

function TopBar({ dept, onDeptChange, canSwitchDept, theme, onThemeToggle, onOpenShared, sharedActive, sidebarMode, logoVariant, user, isAdmin, onAdmin, onLogout, onProfile }) {
  const time = useLiveTime();
  const [userOpen,     setUserOpen]     = React.useState(false);
  const [mailUnread,   setMailUnread]   = React.useState(0);
  const [announceNew,  setAnnounceNew]  = React.useState(0);

  React.useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") { setUserOpen(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Fetch live badge counts, refresh every 5 min
  React.useEffect(() => {
    function fetchCounts() {
      mailApi.list('inbox')
        .then(d => setMailUnread(d.unread ?? 0))
        .catch(() => {})

      const lastSeen = localStorage.getItem(ANNOUNCE_SEEN_KEY) || '1970-01-01T00:00:00Z'
      announcementsApi.list()
        .then(items => setAnnounceNew(items.filter(a => a.created_at > lastSeen).length))
        .catch(() => {})
    }
    fetchCounts()
    const t = setInterval(fetchCounts, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  // When user opens the announcements overlay, mark all as seen
  function handleOpenShared(id) {
    if (id === 'announce') {
      localStorage.setItem(ANNOUNCE_SEEN_KEY, new Date().toISOString())
      setAnnounceNew(0)
    }
    onOpenShared(id)
  }

  const depts = [
    { id: "it",   label: "IT",     accent: "var(--it-accent)"   },
    { id: "hr",   label: "HR",     accent: "var(--hr-accent)"   },
    { id: "biz",  label: "BizOps", accent: "var(--biz-accent)"  },
  ];
  const cur = depts.find(d => d.id === dept) || depts[0];

  const sharedItems = [
    { id: "mail",        icon: <I.envelope size={16}/>,  label: "Mail",          badge: mailUnread  || null },
    { id: "announce",    icon: <I.megaphone size={16}/>, label: "Announcements", badge: announceNew || null },
    { id: "files",       icon: <I.archive size={16}/>,   label: "Files" },
    { id: "helpdesk",    icon: <I.ticket size={16}/>,    label: "Helpdesk" },
    { id: "selfservice", icon: <I.user size={16}/>,      label: "Self-Service" },
  ];

  const fmtTime = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtDate = time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <header style={{
      position: "relative", zIndex: 20,
      height: 46, flex: "0 0 auto",
      display: "flex", alignItems: "center",
      padding: "0 14px 0 16px", gap: 12,
      borderBottom: "0.5px solid var(--hairline)",
      background: "color-mix(in oklab, var(--bg-1) 60%, transparent)",
      WebkitBackdropFilter: "blur(28px) saturate(180%)",
      backdropFilter: "blur(28px) saturate(180%)",
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 14, marginRight: 4, borderRight: "0.5px solid var(--hairline)", height: 28 }}>
        <StrataLogo size={22} variant={logoVariant || "stack"}/>
        <span style={{ fontWeight: 600, letterSpacing: "0.16em", fontSize: 12 }}>STRATA</span>
      </div>

      {/* Dept switcher — superadmin only; everyone else sees a static badge */}
      {canSwitchDept
        ? <DeptSwitcher depts={depts} value={dept} onChange={onDeptChange} cur={cur}/>
        : <div style={{
            display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 10px 0 8px",
            borderRadius: 8, border: "0.5px solid var(--hairline)",
            background: "var(--surface-3)", fontSize: 12, fontWeight: 500, color: "var(--text)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cur.accent, boxShadow: `0 0 8px ${cur.accent}` }}/>
            <span>{cur.label}</span>
          </div>
      }

      {/* Shared services (always-visible menu items) */}
      <nav style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
        {sharedItems.map(s => (
          <SharedMenuButton key={s.id} item={s} active={sharedActive === s.id} onClick={() => handleOpenShared(s.id)}/>
        ))}
      </nav>

      <div style={{ flex: 1 }}/>

      {/* Notifications */}
      {/* Time/Date */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, marginLeft: 4, marginRight: 2 }}>
        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }} className="mono">{fmtTime}</span>
        <span style={{ fontSize: 10, color: "var(--text-mute)" }}>{fmtDate}</span>
      </div>

      {/* User */}
      <button onClick={() => setUserOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "3px 4px 3px 8px",
        background: "var(--surface-3)", border: "0.5px solid var(--hairline)",
        borderRadius: 999, cursor: "pointer", color: "var(--text)",
      }}>
        <span style={{ fontSize: 12 }}>{user.name.split(" ")[0]}</span>
        <Avatar name={user.name} size={24}/>
      </button>

      {/* Modals */}
      {userOpen && <UserMenu user={user} theme={theme} onThemeToggle={onThemeToggle} isAdmin={isAdmin} onAdmin={onAdmin} onLogout={onLogout} onProfile={onProfile} onClose={() => setUserOpen(false)}/>}
    </header>
  );
}

function DeptSwitcher({ depts, value, onChange, cur }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 10px 0 8px",
        borderRadius: 8, border: "0.5px solid var(--hairline)",
        background: "var(--surface-3)", color: "var(--text)", cursor: "pointer",
        fontSize: 12, fontWeight: 500, fontFamily: "var(--f-sans)", whiteSpace: "nowrap",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cur.accent, boxShadow: `0 0 8px ${cur.accent}` }}/>
        <span>{cur.label}</span>
        <I.chevD size={12}/>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          width: 240, padding: 6, zIndex: 30,
          background: "var(--bg-2)", border: "0.5px solid var(--hairline-2)",
          borderRadius: 12, boxShadow: "var(--shadow-pop)",
        }} className="fadein">
          <div style={{ fontSize: 10, color: "var(--text-mute)", padding: "8px 10px 6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Switch workspace
          </div>
          {depts.map(d => (
            <button key={d.id} onClick={() => { onChange(d.id); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "8px 10px", borderRadius: 8, border: "none",
              background: value === d.id ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "transparent",
              color: "var(--text)", cursor: "pointer", textAlign: "left", fontSize: 13,
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: 7,
                background: `linear-gradient(135deg, ${d.accent}, color-mix(in oklab, ${d.accent} 50%, black))`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600, color: "white",
              }}>
                {d.label[0]}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{d.label} Dashboard</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>
                  {d.id === "it" ? "Cloud Platform · Helpdesk"
                    : d.id === "hr" ? "People · Administration · Management"
                    : "Customers · Billing · Revenue"}
                </div>
              </div>
              {value === d.id && <I.check size={14}/>}
            </button>
          ))}
          <div style={{ borderTop: "0.5px solid var(--hairline)", marginTop: 6, paddingTop: 6, padding: "10px 10px 4px", fontSize: 11, color: "var(--text-mute)" }}>
            Departments are isolated. Switching here is for prototype demo only.
          </div>
        </div>
      )}
    </div>
  );
}

function SharedMenuButton({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "0 10px",
      height: 28, borderRadius: 7, border: "0.5px solid transparent",
      background: active ? "var(--surface-3)" : "transparent",
      borderColor: active ? "var(--hairline)" : "transparent",
      color: active ? "var(--text)" : "var(--text-dim)",
      cursor: "pointer", fontSize: 12, fontFamily: "var(--f-sans)",
      position: "relative", whiteSpace: "nowrap",
    }}>
      {item.icon}
      <span>{item.label}</span>
      {item.badge && (
        <span style={{
          minWidth: 14, height: 14, borderRadius: 7, padding: "0 4px",
          background: "var(--bad)", color: "white",
          fontSize: 9, fontWeight: 600, display: "inline-flex",
          alignItems: "center", justifyContent: "center", marginLeft: 2,
        }}>{item.badge}</span>
      )}
    </button>
  );
}

function CommandPalette({ onClose, onNav }) {
  const [q, setQ] = React.useState("");
  const items = [
    { id: "mail",        icon: <I.envelope size={14}/>,   label: "Open Mail",            kind: "shared" },
    { id: "announce",    icon: <I.megaphone size={14}/>,  label: "Announcements",        kind: "shared" },
    { id: "helpdesk",    icon: <I.ticket size={14}/>,     label: "Submit a helpdesk ticket", kind: "shared" },
    { id: "selfservice", icon: <I.user size={14}/>,       label: "HR Self-Service",      kind: "shared" },
    { id: "leave-new",   icon: <I.cal size={14}/>,        label: "Request leave",        kind: "action" },
    { id: "payslip",     icon: <I.cash size={14}/>,       label: "Download last payslip",kind: "action" },
    { id: "vpn-status",  icon: <I.shield size={14}/>,     label: "VPN status",           kind: "nav" },
    { id: "incidents",   icon: <I.bolt size={14}/>,       label: "Active incidents",     kind: "nav" },
  ];
  const filtered = q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(8, 10, 14, 0.55)",
      WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 130, zIndex: 200,
    }} className="fadein">
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, padding: 8,
        background: "var(--bg-2)", border: "0.5px solid var(--hairline-2)",
        borderRadius: 16, boxShadow: "var(--shadow-pop)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
          <I.search size={16}/>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Type a command or search…" style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "var(--text)", fontSize: 15, fontFamily: "var(--f-sans)",
          }}/>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>ESC</span>
        </div>
        <div style={{ borderTop: "0.5px solid var(--hairline)", padding: 6, maxHeight: 420, overflowY: "auto" }}>
          {filtered.map((it, i) => (
            <button key={it.id} onClick={() => { if (it.kind === "shared") onNav(it.id); onClose(); }} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "10px 12px", borderRadius: 8, border: "none",
              background: i === 0 ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "transparent",
              color: "var(--text)", cursor: "pointer", textAlign: "left", fontSize: 13,
            }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface-3)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {it.icon}
              </span>
              <span style={{ flex: 1 }}>{it.label}</span>
              <span style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{it.kind}</span>
            </button>
          ))}
          {!filtered.length && (
            <div style={{ padding: 30, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>No results.</div>
          )}
        </div>
      </div>
    </div>
  );
}


function UserMenu({ user, theme, onThemeToggle, isAdmin, onAdmin, onLogout, onProfile, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} className="fadein" style={{
        position: "absolute", right: 14, top: 50, width: 260, padding: 6,
        background: "var(--bg-2)", border: "0.5px solid var(--hairline-2)",
        borderRadius: 14, boxShadow: "var(--shadow-pop)",
      }}>
        <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <Avatar name={user.name} size={40}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{user.role} · {user.email}</div>
          </div>
        </div>
        <div style={{ borderTop: "0.5px solid var(--hairline)", paddingTop: 6 }}>
          <UserMenuItem icon={theme === "dark" ? <I.sun size={14}/> : <I.moon size={14}/>}
                        label={theme === "dark" ? "Switch to Light" : "Switch to Dark"} onClick={onThemeToggle}/>
          <UserMenuItem icon={<I.user size={14}/>} label="View profile"
                        onClick={() => { onProfile?.(); onClose(); }}/>
          {isAdmin && (
            <UserMenuItem icon={<I.shield size={14}/>} label="Admin Panel" onClick={() => { onAdmin?.(); onClose(); }}/>
          )}
          <div style={{ borderTop: "0.5px solid var(--hairline)", marginTop: 4, paddingTop: 4 }}>
            <UserMenuItem icon={<I.exit size={14}/>} label="Sign out" tone="bad" onClick={() => { onLogout?.(); onClose(); }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserMenuItem({ icon, label, right, tone, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%",
      padding: "8px 10px", borderRadius: 8, border: "none",
      background: "transparent", color: tone === "bad" ? "var(--bad)" : "var(--text)",
      cursor: "pointer", fontSize: 13, fontFamily: "var(--f-sans)",
    }} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-3)"}
       onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span style={{ color: tone === "bad" ? "var(--bad)" : "var(--text-dim)" }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {right && <span style={{ fontSize: 10, color: "var(--text-mute)" }} className="mono">{right}</span>}
    </button>
  );
}

export { TopBar };
