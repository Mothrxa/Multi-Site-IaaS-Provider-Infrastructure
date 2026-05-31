import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, SectionHeader } from '../components/ui.jsx'
import { StrataLogo } from '../components/brand.jsx'

// pages-settings.jsx — Settings page with appearance / tweaks controls

const SETTINGS_ACCENT_PRESETS = [
  { id: "indigo", color: "oklch(0.72 0.14 270)" },
  { id: "cyan",   color: "oklch(0.74 0.13 210)" },
  { id: "violet", color: "oklch(0.7  0.18 290)" },
  { id: "mint",   color: "oklch(0.78 0.13 165)" },
  { id: "amber",  color: "oklch(0.79 0.14 75)"  },
  { id: "rose",   color: "oklch(0.72 0.16 350)" },
];

const PALETTE_BANK = [
  "#7c8dff", "#5a8dff", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6",
  "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#fb923c", "#ef4444",
  "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1", "#1f2937",
];

function SettingsPage({ dept, t, setTweak }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 920 }}>
      <SectionHeader
        title="Settings"
        subtitle="Personalize how STRATA looks and feels on this device."
        breadcrumbs={[`${dept.toUpperCase()} Workspace`, "Settings"]}
      />

      <SettingsGroup
        title="Appearance"
        subtitle="Theme, accent color, and density"
      >
        <SettingsRow
          label="Color theme"
          hint="Switch between light and dark"
        >
          <ThemeSwitch dark={t.dark} onChange={(v) => setTweak("dark", v)}/>
        </SettingsRow>

        <SettingsRow
          label="Accent color"
          hint="Used for highlights, active states, and graphs"
        >
          <AccentPicker value={t.accent} onChange={(v) => setTweak("accent", v)}/>
        </SettingsRow>

        <SettingsRow
          label="Information density"
          hint="Balance breathing room versus how much fits on screen"
        >
          <SegmentedControl
            value={t.density}
            options={["spacious", "compact", "dense"]}
            onChange={(v) => setTweak("density", v)}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Navigation & layout" subtitle="Sidebar style, geometry, glass intensity">
        <SettingsRow label="Sidebar" hint="Show full labels or icons only">
          <SegmentedControl
            value={t.sidebar}
            options={[{id: "labeled", label: "Labeled"}, {id: "icon", label: "Icon only"}]}
            onChange={(v) => setTweak("sidebar", v)}
          />
        </SettingsRow>

        <SettingsRow label="Card radius" hint="Corner rounding for cards & surfaces">
          <SliderControl
            value={t.radius} min={8} max={28} unit="px"
            onChange={(v) => setTweak("radius", v)}
          />
        </SettingsRow>

        <SettingsRow label="Glass intensity" hint="Backdrop blur on overlays & translucent panels">
          <SliderControl
            value={t.glass} min={0} max={48} unit="px"
            onChange={(v) => setTweak("glass", v)}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Brand" subtitle="Logo treatment for the menu bar">
        <SettingsRow label="Logo variant" hint="Three different geometric marks">
          <div style={{ display: "flex", gap: 10 }}>
            {["stack", "prism", "pulse"].map(v => (
              <button key={v} onClick={() => setTweak("logo", v)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "14px 18px", borderRadius: 12,
                background: t.logo === v
                  ? "color-mix(in oklab, var(--accent) 18%, transparent)"
                  : "var(--surface-3)",
                border: t.logo === v
                  ? "0.5px solid color-mix(in oklab, var(--accent) 50%, transparent)"
                  : "0.5px solid var(--hairline-2)",
                color: "var(--text)", cursor: "pointer", minWidth: 86,
              }}>
                <StrataLogo size={32} variant={v}/>
                <span style={{ fontSize: 11, textTransform: "capitalize", color: "var(--text-dim)" }}>{v}</span>
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Account" subtitle="Profile, security, and notifications">
        <SettingsRow label="Email">
          <input className="input" defaultValue={`${dept === "it" ? "sarah.b" : dept === "hr" ? "amira.o" : "pierre.s"}@strata.io`} style={{ width: 260 }}/>
        </SettingsRow>
        <SettingsRow label="Language">
          <select className="input" defaultValue="en">
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Time zone">
          <select className="input" defaultValue="alg">
            <option value="alg">Algiers · UTC+1</option>
            <option value="par">Paris · UTC+2</option>
            <option value="lon">London · UTC+1</option>
            <option value="utc">UTC</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Notifications" hint="Where you'd like to be reached">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "email", l: "Email digest",         d: true  },
              { id: "push",  l: "Browser notifications",d: true  },
              { id: "sms",   l: "Critical SMS alerts",  d: false },
              { id: "slack", l: "Slack DM",             d: true  },
            ].map(o => (
              <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked={o.d} style={{ accentColor: "var(--accent)" }}/>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{o.l}</span>
              </label>
            ))}
          </div>
        </SettingsRow>
      </SettingsGroup>

      <Card style={{ padding: 22, background: "color-mix(in oklab, var(--accent) 8%, var(--surface))", border: "0.5px solid color-mix(in oklab, var(--accent) 30%, transparent)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "color-mix(in oklab, var(--accent) 22%, transparent)",
            color: "var(--accent)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flex: "0 0 auto",
          }}>
            <I.cog size={20}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Preview mode</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
              This Appearance area is a sandbox so reviewers can try different colors and layouts. Choices stay only on this device — they don't sync to other STRATA users.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SettingsGroup({ title, subtitle, children }) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4 }}>{subtitle}</div>}
      </div>
      <Card padding={0}>
        {children}
      </Card>
    </div>
  );
}

function SettingsRow({ label, hint, children }) {
  return (
    <div style={{
      display: "flex", gap: 24, padding: "18px 22px",
      borderBottom: "0.5px solid var(--hairline)",
      alignItems: "center",
    }}>
      <div style={{ flex: "0 0 240px" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
        {children}
      </div>
    </div>
  );
}

// === Controls ===
function ThemeSwitch({ dark, onChange }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {[
        { v: false, l: "Light", icon: <I.sun size={16}/> },
        { v: true,  l: "Dark",  icon: <I.moon size={16}/> },
      ].map(opt => {
        const active = dark === opt.v;
        return (
          <button key={opt.l} onClick={() => onChange(opt.v)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            padding: "12px 22px", borderRadius: 12, minWidth: 110,
            background: active
              ? "color-mix(in oklab, var(--accent) 16%, transparent)"
              : "var(--surface-3)",
            border: active
              ? "0.5px solid color-mix(in oklab, var(--accent) 50%, transparent)"
              : "0.5px solid var(--hairline-2)",
            color: "var(--text)", cursor: "pointer",
            transition: "all 0.15s ease",
          }}>
            <span style={{ color: active ? "var(--accent)" : "var(--text-dim)" }}>{opt.icon}</span>
            <span style={{ fontSize: 12, fontWeight: active ? 500 : 400 }}>{opt.l}</span>
          </button>
        );
      })}
    </div>
  );
}

function AccentPicker({ value, onChange }) {
  const [customOpen, setCustomOpen] = React.useState(false);
  const [hex, setHex] = React.useState(typeof value === "string" && value.startsWith("#") ? value : "#7c8dff");
  const isCustom = typeof value === "string" && (value.startsWith("#") || value.startsWith("oklch"));
  const isPresetCustom = isCustom && !SETTINGS_ACCENT_PRESETS.find(p => p.id === value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Preset swatches */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {SETTINGS_ACCENT_PRESETS.map(p => (
          <button key={p.id} title={p.id} onClick={() => onChange(p.id)} style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${p.color}, color-mix(in oklab, ${p.color} 70%, white 20%))`,
            border: value === p.id ? "2px solid var(--text)" : "1px solid var(--hairline-2)",
            cursor: "pointer", padding: 0,
            boxShadow: value === p.id ? `0 0 0 3px color-mix(in oklab, ${p.color} 25%, transparent)` : "none",
            transition: "all 0.15s ease",
          }}/>
        ))}

        {/* + add custom */}
        <button onClick={() => setCustomOpen(o => !o)} style={{
          width: 38, height: 38, borderRadius: 10,
          background: isPresetCustom
            ? `linear-gradient(135deg, ${value}, color-mix(in oklab, ${value} 70%, white 20%))`
            : "var(--surface-3)",
          border: isPresetCustom
            ? "2px solid var(--text)"
            : "1px dashed var(--hairline-2)",
          cursor: "pointer", padding: 0,
          color: "var(--text-dim)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }} title="Add custom color">
          {isPresetCustom ? null : <I.plus size={16}/>}
        </button>
      </div>

      {/* Custom hex input */}
      {customOpen && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 12,
          padding: 14, borderRadius: 12,
          background: "var(--surface-3)",
          border: "0.5px solid var(--hairline-2)",
          width: "fit-content", maxWidth: 460,
        }}>
          <div style={{ fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>Pick or paste a custom hex</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 6 }}>
            {PALETTE_BANK.map(c => (
              <button key={c} onClick={() => { setHex(c); onChange(c); }} style={{
                aspectRatio: "1", width: "100%",
                background: c, border: value === c ? "2px solid var(--text)" : "1px solid var(--hairline-2)",
                borderRadius: 7, cursor: "pointer", padding: 0,
              }}/>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              width: 34, height: 34, borderRadius: 8,
              background: hex, border: "0.5px solid var(--hairline-2)",
              flex: "0 0 auto",
            }}/>
            <input
              type="color"
              value={hex}
              onChange={(e) => { setHex(e.target.value); onChange(e.target.value); }}
              style={{
                width: 34, height: 34, padding: 0, border: "0.5px solid var(--hairline-2)",
                borderRadius: 8, cursor: "pointer", background: "transparent",
              }}
            />
            <input
              className="input"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              onBlur={() => { if (/^#[0-9a-fA-F]{3,8}$/.test(hex)) onChange(hex); }}
              onKeyDown={(e) => { if (e.key === "Enter" && /^#[0-9a-fA-F]{3,8}$/.test(hex)) onChange(hex); }}
              placeholder="#7c8dff"
              style={{ width: 130, fontFamily: "var(--f-mono)" }}
            />
            <button className="btn" onClick={() => {
              if (/^#[0-9a-fA-F]{3,8}$/.test(hex)) onChange(hex);
            }}>Apply</button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
            Tip: any valid CSS color works — hex, oklch(), rgb(), or a named color.
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div style={{
      display: "inline-flex", gap: 2, padding: 3,
      background: "var(--surface-3)", borderRadius: 10,
      border: "0.5px solid var(--hairline-2)",
    }}>
      {options.map(opt => {
        const id = typeof opt === "string" ? opt : opt.id;
        const label = typeof opt === "string" ? opt : opt.label;
        const isActive = value === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            height: 30, padding: "0 16px",
            background: isActive ? "var(--bg-2)" : "transparent",
            border: isActive ? "0.5px solid var(--hairline-2)" : "0.5px solid transparent",
            borderRadius: 8,
            color: isActive ? "var(--text)" : "var(--text-dim)",
            fontSize: 12.5, fontWeight: isActive ? 500 : 400,
            boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
            cursor: "pointer", textTransform: "capitalize",
            fontFamily: "var(--f-sans)",
          }}>{label}</button>
        );
      })}
    </div>
  );
}

function SliderControl({ value, min, max, unit, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, width: 320 }}>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          flex: 1, accentColor: "var(--accent)",
        }}
      />
      <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 50, textAlign: "right" }}>
        {value}{unit}
      </span>
    </div>
  );
}

export { SettingsPage };
