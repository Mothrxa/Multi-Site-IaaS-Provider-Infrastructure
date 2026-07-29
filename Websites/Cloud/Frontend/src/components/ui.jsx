import React from 'react'
import { I, Icon } from './icons.jsx'

// ui.jsx — shared primitive components

function Pill({ kind = "", children, dot = false, style }) {
  return (
    <span className={`pill ${kind}`} style={style}>
      {dot && <span className="dot"/>}
      {children}
    </span>
  );
}

function Btn({ kind = "", size = "", icon, children, onClick, type = "button", style, disabled, title }) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${kind} ${size}`}
      style={style}
    >
      {icon}
      {children}
    </button>
  );
}

function Card({ title, action, children, style, pad, className = "" }) {
  return (
    <div className={`card ${className}`} style={{ ...(pad === false ? { padding: 0 } : {}), ...style }}>
      {(title || action) && (
        <div className="card-h" style={pad === false ? { padding: "16px 18px 12px", marginBottom: 0 } : {}}>
          {title && <div className="card-title">{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function KPI({ label, value, delta, deltaKind = "up", sub, icon }) {
  return (
    <div className="kpi">
      <div className="lbl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
        {label}
      </div>
      <div className="val">{value}</div>
      {delta && (
        <div className={`delta ${deltaKind}`}>
          {deltaKind === "up" ? "▲" : "▼"} {delta}
          {sub && <span className="mute" style={{ marginLeft: 6 }}>· {sub}</span>}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label && <span className="lbl">{label}</span>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <div
          key={t.id}
          className={`tab ${value === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null && (
            <span className="mute" style={{ marginLeft: 6, fontSize: 11 }}>{t.count}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`st ${i < current ? "done" : ""} ${i === current ? "active" : ""}`}>
            <div className="n">{i < current ? "✓" : i + 1}</div>
            <span>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="dash"/>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
      <span
        onClick={() => onChange(!on)}
        style={{
          width: 34, height: 20, borderRadius: 999,
          background: on ? "var(--accent)" : "var(--hairline-2)",
          position: "relative", transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: on ? 16 : 2,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}/>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

function Modal({ open, onClose, title, children, width = 520, footer }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(8, 11, 20, 0.55)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, animation: "fadein 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card slideup"
        style={{ width, maxWidth: "100%", padding: 0 }}
      >
        <div style={{
          padding: "18px 22px", borderBottom: "0.5px solid var(--hairline)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
          <Btn kind="ghost icon sm" icon={<I.x size={16}/>} onClick={onClose}/>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        {footer && (
          <div style={{
            padding: "14px 22px", borderTop: "0.5px solid var(--hairline)",
            display: "flex", justifyContent: "flex-end", gap: 10,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name = "AB", size = 30 }) {
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600,
      }}
    >{initials}</div>
  );
}

function Bar({ pct, kind = "" }) {
  return (
    <div className={`bar ${kind}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}/>
    </div>
  );
}


export { Pill, Btn, Card, KPI, Field, Tabs, Stepper, Toggle, Modal, Avatar, Bar }
