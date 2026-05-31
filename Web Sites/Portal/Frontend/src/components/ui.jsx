import React from 'react'

// ui.jsx — shared UI primitives: Card, Stat, Pill, SectionHeader, Avatar, TabBar

function Card({ children, style, className = "", title, action, padding, glow = false, ...p }) {
  return (
    <div
      className={`card ${className}`}
      style={{ ...(padding !== undefined ? { padding } : {}), ...style, ...(glow ? { boxShadow: "var(--shadow-card), 0 0 0 1px color-mix(in oklab, var(--accent) 30%, transparent)" } : {}) }}
      {...p}
    >
      {title && (
        <div className="card-h">
          <div>
            <div className="card-title">{title}</div>
            {p.subtitle && <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>{p.subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, delta, deltaTone = "good", suffix, hint, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: 0.02, display: "flex", alignItems: "center", gap: 8 }}>
        {accent && <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent }}></span>}
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", fontFamily: "var(--f-sans)" }}>
          {value}
        </span>
        {suffix && <span style={{ fontSize: 13, color: "var(--text-mute)" }}>{suffix}</span>}
        {delta && (
          <span style={{
            fontSize: 11, fontWeight: 500, padding: "2px 7px", borderRadius: 6,
            color: `var(--${deltaTone})`,
            background: `color-mix(in oklab, var(--${deltaTone}) 14%, transparent)`,
          }}>
            {delta}
          </span>
        )}
      </div>
      {hint && <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{hint}</div>}
    </div>
  );
}

function Pill({ children, tone, dot = true, style }) {
  return (
    <span className={`pill${tone ? " " + tone : ""}`} style={style}>
      {dot && tone && <span className="dot" />}
      {children}
    </span>
  );
}

function SectionHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <div className="section-h" style={{ flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
      <div style={{ minWidth: 0 }}>
        {breadcrumbs && (
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 8, display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ opacity: 0.5 }}>›</span>}
                <span style={{ color: i === breadcrumbs.length - 1 ? "var(--text-dim)" : "var(--text-mute)" }}>{b}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h2>{title}</h2>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

function Avatar({ name, src, size = 32, tone }) {
  const initials = (name || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const hue = ((name || "").charCodeAt(0) * 17 + (name || "").length * 11) % 360;
  const bg = tone || `linear-gradient(135deg, oklch(0.72 0.14 ${hue}), oklch(0.78 0.12 ${(hue + 50) % 360}))`;
  return (
    <div className="avatar" style={{ width: size, height: size, background: bg, fontSize: Math.max(10, size * 0.4) }}>
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}/> : initials}
    </div>
  );
}

function TabBar({ tabs, active, onChange, dense = false }) {
  return (
    <div style={{
      display: "inline-flex", gap: 2, padding: 3,
      background: "var(--surface-3)", borderRadius: 10,
      border: "0.5px solid var(--hairline)",
    }}>
      {tabs.map(t => {
        const isActive = (typeof t === "string" ? t : t.id) === active;
        const id = typeof t === "string" ? t : t.id;
        const label = typeof t === "string" ? t : t.label;
        return (
          <button key={id} onClick={() => onChange(id)} className="btn" style={{
            height: dense ? 26 : 30, padding: dense ? "0 9px" : "0 12px",
            background: isActive ? "var(--bg)" : "transparent",
            border: isActive ? "0.5px solid var(--hairline-2)" : "0.5px solid transparent",
            color: isActive ? "var(--text)" : "var(--text-dim)",
            fontSize: dense ? 12 : 13, fontWeight: isActive ? 500 : 400,
            boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.18)" : "none",
          }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Progress({ value, max = 100, tone = "accent", height = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width: "100%", height, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: tone === "accent" ? "linear-gradient(90deg, var(--accent), var(--accent-2))" : `var(--${tone})`,
        transition: "width 0.6s ease",
        boxShadow: `0 0 12px color-mix(in oklab, var(--${tone === "accent" ? "accent" : tone}) 40%, transparent)`,
      }}/>
    </div>
  );
}

function KeyValue({ k, v, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13 }}>
      <span style={{ color: "var(--text-mute)" }}>{k}</span>
      <span className={mono ? "mono" : ""} style={{ color: "var(--text)" }}>{v}</span>
    </div>
  );
}

function EmptyHint({ children, icon }) {
  return (
    <div style={{
      padding: 32, textAlign: "center", color: "var(--text-mute)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    }}>
      {icon}
      <div style={{ fontSize: 13 }}>{children}</div>
    </div>
  );
}

// Sparkline (live)
function Sparkline({ data, color = "var(--accent)", height = 36, fill = true }) {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = (max - min) || 1;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * 100,
    100 - ((d - min) / range) * 90 - 5,
  ]);
  const pathD = "M " + pts.map(p => p.join(" ")).join(" L ");
  const fillD = pathD + ` L 100 100 L 0 100 Z`;
  const gid = "sp-" + Math.random().toString(36).slice(2, 8);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={fillD} fill={`url(#${gid})`}/>}
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

// Live time hook
function useLiveTime() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  return now;
}

// Live updating series
function useLiveSeries(initial, opts = {}) {
  const { interval = 1800, step = 0.18, min = 0, max = 100 } = opts;
  const [data, setData] = React.useState(initial);
  React.useEffect(() => {
    const t = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const next = Math.max(min, Math.min(max, last + (Math.random() - 0.5) * (max - min) * step));
        return [...prev.slice(1), next];
      });
    }, interval);
    return () => clearInterval(t);
  }, [interval, step, min, max]);
  return data;
}

export { Card, Stat, Pill, SectionHeader, Avatar, TabBar, Progress, KeyValue, EmptyHint, Sparkline, useLiveTime, useLiveSeries };
