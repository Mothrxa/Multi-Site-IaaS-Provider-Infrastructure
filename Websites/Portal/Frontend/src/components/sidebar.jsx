import React from 'react'
import { I } from './icons.jsx'
import { hrApi, helpdeskApi } from '../api/index.js'

// sidebar.jsx — per-department sidebar nav

const SIDEBAR_W = 400;
const SIDEBAR_W_ICON = 72;

const NAV_IT = [
  { id: "overview",       label: "Overview",       icon: <I.grid size={19}/> },
  { kind: "section",      label: "Engineering" },
  { id: "development",    label: "Development",    icon: <I.branch size={19}/> },
  { id: "infrastructure", label: "Infrastructure", icon: <I.server size={19}/> },
  { kind: "section",      label: "Cloud Platform" },
  { id: "workloads",      label: "Workloads",      icon: <I.cpu size={19}/> },
  { kind: "section",      label: "Support" },
  { id: "tickets",        label: "Tickets",        icon: <I.ticket size={19}/>, liveKey: "tickets" },
  { id: "subscribers",    label: "Customers",      icon: <I.users size={19}/> },
  { kind: "section",      label: "Resources" },
  { id: "documents",      label: "Documents",      icon: <I.doc size={19}/> },
];

const NAV_HR = [
  { id: "overview",    label: "Overview",       icon: <I.grid size={19}/> },
  { kind: "section",   label: "People" },
  { id: "directory",   label: "Directory",      icon: <I.users size={19}/> },
  { id: "recruitment", label: "Recruitment",    icon: <I.briefcase size={19}/>, liveKey: "recruitment" },
  { id: "leave",       label: "Leave Requests", icon: <I.cal size={19}/>,       liveKey: "leave" },
  { kind: "section",   label: "Administration" },
  { id: "payroll",     label: "Payroll",        icon: <I.cash size={19}/> },
  { id: "expenses",    label: "Expenses",       icon: <I.cash size={19}/>,      liveKey: "expenses" },
  { id: "documents",   label: "Documents",      icon: <I.doc size={19}/> },
];

const NAV_BIZ = [
  { id: "overview",  label: "Overview",       icon: <I.grid size={19}/> },
  { kind: "section", label: "Customers" },
  { id: "customers", label: "Customers",      icon: <I.users size={19}/> },
  { id: "billing",   label: "Billing & Usage",icon: <I.cash size={19}/> },
  { id: "invoices",  label: "Invoices",       icon: <I.doc size={19}/> },
  { kind: "section", label: "Commercial" },
  { id: "revenue",   label: "Revenue",        icon: <I.chart size={19}/> },
  { id: "pipeline",  label: "Pipeline",       icon: <I.target size={19}/> },
  { kind: "section", label: "Resources" },
  { id: "documents", label: "Documents",      icon: <I.doc size={19}/> },
];

const DEPT_NAV = { it: NAV_IT, hr: NAV_HR, biz: NAV_BIZ };
const DEPT_INFO = {
  it:  { name: "IT Operations",   tagline: "Cloud Platform · Helpdesk",     icon: <I.cloud size={18}/>,     color: "var(--it-accent)"  },
  hr:  { name: "HR & Management", tagline: "People · Administration",       icon: <I.users size={18}/>,     color: "var(--hr-accent)"  },
  biz: { name: "BizOps",          tagline: "Customers · Billing · Revenue", icon: <I.briefcase size={18}/>, color: "var(--biz-accent)" },
};

function Sidebar({ dept, current, onNav, mode = "labeled", logoVariant }) {
  const nav      = DEPT_NAV[dept];
  const info     = DEPT_INFO[dept];
  const iconOnly = mode === "icon";
  const w        = iconOnly ? SIDEBAR_W_ICON : SIDEBAR_W;

  // Live badge counts — refreshed on dept change
  const [liveBadges, setLiveBadges] = React.useState({});
  React.useEffect(() => {
    setLiveBadges({});
    if (dept === 'hr') {
      hrApi.stats().then(s => setLiveBadges(b => ({
        ...b,
        leave:       s.pending_leave || null,
      }))).catch(() => {});
      hrApi.expenses().then(list => setLiveBadges(b => ({
        ...b,
        expenses:    list.filter(e => e.status === 'pending').length || null,
        recruitment: null,
      }))).catch(() => {});
      hrApi.referrals().then(list => setLiveBadges(b => ({
        ...b,
        recruitment: list.filter(r => r.status === 'submitted').length || null,
      }))).catch(() => {});
    }
    if (dept === 'it') {
      helpdeskApi.list().then(list => setLiveBadges({
        tickets: list.filter(t => t.status === 'open').length || null,
      })).catch(() => {});
    }
  }, [dept]);

  return (
    <aside style={{
      width: w, flex: `0 0 ${w}px`, height: "100%",
      padding: "18px 12px 18px 16px",
      display: "flex", flexDirection: "column", gap: 10,
      borderRight: "0.5px solid var(--hairline)",
      background: "color-mix(in oklab, var(--bg-1) 70%, transparent)",
      WebkitBackdropFilter: "blur(22px) saturate(160%)",
      backdropFilter: "blur(22px) saturate(160%)",
      transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
      overflow: "hidden",
    }}>
      {/* Department header card */}
      <div className="glass" style={{
        padding: iconOnly ? 8 : "12px 12px 13px",
        display: "flex", alignItems: "center", gap: 10,
        background: `linear-gradient(135deg, color-mix(in oklab, ${info.color} 22%, transparent), color-mix(in oklab, ${info.color} 6%, transparent))`,
        border: `0.5px solid color-mix(in oklab, ${info.color} 28%, var(--hairline))`,
      }}>
        <div style={{
          width: iconOnly ? 32 : 36, height: iconOnly ? 32 : 36,
          flex: "0 0 auto",
          borderRadius: 9,
          background: `linear-gradient(135deg, ${info.color}, color-mix(in oklab, ${info.color} 50%, black))`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "white", boxShadow: `0 4px 14px color-mix(in oklab, ${info.color} 40%, transparent)`,
        }}>
          {info.icon}
        </div>
        {!iconOnly && (
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{info.name}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-mute)", marginTop: 2, letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.tagline}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto", marginTop: 4, paddingRight: 4 }}>
        {nav.map((item, i) => {
          if (item.kind === "section") {
            return iconOnly ? <div key={i} style={{ height: 14 }}/> : (
              <div key={i} style={{
                fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.08em",
                textTransform: "uppercase", padding: "16px 12px 6px", fontWeight: 600,
              }}>{item.label}</div>
            );
          }
          const active = current === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: iconOnly ? "13px" : "13px 16px",
              justifyContent: iconOnly ? "center" : "flex-start",
              borderRadius: 10, border: "none",
              background: active
                ? `linear-gradient(180deg, color-mix(in oklab, var(--accent) 22%, transparent), color-mix(in oklab, var(--accent) 12%, transparent))`
                : "transparent",
              color: active ? "var(--text)" : "var(--text-dim)",
              cursor: "pointer", fontSize: 15, fontFamily: "var(--f-sans)",
              fontWeight: active ? 500 : 400,
              boxShadow: active ? `inset 0 0 0 0.5px color-mix(in oklab, var(--accent) 40%, transparent)` : "none",
              position: "relative",
              transition: "all 0.15s ease",
            }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-3)"; }}
               onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
               title={iconOnly ? item.label : undefined}>
              {active && <span style={{
                position: "absolute", left: -14, top: "50%", transform: "translateY(-50%)",
                width: 3, height: 18, background: "var(--accent)", borderRadius: "0 2px 2px 0",
                boxShadow: "0 0 10px var(--accent)",
              }}/>}
              <span style={{ color: active ? "var(--accent)" : "var(--text-dim)", flex: "0 0 auto", display: "inline-flex" }}>{item.icon}</span>
              {!iconOnly && <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", color: active ? "var(--text)" : "inherit" }}>{item.label}</span>}
              {!iconOnly && (() => {
                const badge = (item.liveKey ? liveBadges[item.liveKey] : item.badge) || null;
                return badge ? (
                  <span style={{
                    minWidth: 18, height: 16, padding: "0 5px", borderRadius: 8,
                    background: active ? "var(--accent)" : "var(--surface-3)",
                    color: active ? "white" : "var(--text-dim)",
                    fontSize: 10, fontWeight: 600,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    border: active ? "none" : "0.5px solid var(--hairline)",
                  }}>{badge}</span>
                ) : null;
              })()}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}



export { Sidebar, DEPT_NAV, DEPT_INFO };
