// charts.jsx — live SVG widgets for the dashboards

// === Uptime / latency graph (live) ===
function UptimeChart({ height = 200, series = [] }) {
  // series: [{ name, color, data: [..numbers] }]
  if (!series.length) return null;
  const len = series[0].data.length;
  const w = 600, h = 100;
  const pad = 6;
  const all = series.flatMap(s => s.data);
  const min = Math.min(...all), max = Math.max(...all);
  const range = max - min || 1;

  const toPath = (data) => "M " + data.map((d, i) => [
    pad + (i / (len - 1)) * (w - pad * 2),
    pad + (1 - (d - min) / range) * (h - pad * 2),
  ].join(" ")).join(" L ");

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`uptime-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.4"/>
              <stop offset="1" stopColor={s.color} stopOpacity="0"/>
            </linearGradient>
          ))}
          <pattern id="uptime-grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="var(--hairline)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#uptime-grid)" />
        {series.map((s, i) => {
          const d = toPath(s.data);
          const fillD = d + ` L ${w-pad} ${h-pad} L ${pad} ${h-pad} Z`;
          return (
            <g key={i}>
              <path d={fillD} fill={`url(#uptime-grad-${i})`} opacity="0.7"/>
              <path d={d} fill="none" stroke={s.color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 11, color: "var(--text-dim)" }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }}/>
            <span>{s.name}</span>
            <span className="mono" style={{ color: "var(--text)" }}>{s.data[s.data.length - 1].toFixed(1)}{s.unit || "%"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Donut / ring chart ===
function Donut({ value, max = 100, label, size = 110, color, sub }) {
  const r = 42, c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--hairline)" strokeWidth="8"/>
        <circle cx="50" cy="50" r={r} fill="none"
                stroke={color || "var(--accent)"} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${c * pct} ${c}`}
                style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray 0.8s ease" }}/>
        <text x="50" y="48" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--text)" fontFamily="var(--f-sans)">
          {Math.round(pct * 100)}%
        </text>
        {sub && <text x="50" y="64" textAnchor="middle" fontSize="9" fill="var(--text-mute)" letterSpacing="0.1em">{sub}</text>}
      </svg>
      {label && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{label}</div>}
    </div>
  );
}

// === Bar chart ===
function BarChart({ data, color, height = 140, max }) {
  const m = max ?? Math.max(...data.map(d => d.value)) * 1.15;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height, padding: "12px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
          <div style={{
            flex: 1, width: "100%", display: "flex", alignItems: "flex-end",
          }}>
            <div style={{
              width: "100%",
              height: `${(d.value / m) * 100}%`,
              background: d.color || color || "linear-gradient(180deg, var(--accent), color-mix(in oklab, var(--accent) 40%, transparent))",
              borderRadius: "6px 6px 2px 2px",
              transition: "height 0.6s cubic-bezier(0.16,1,0.3,1)",
              minHeight: 4,
              boxShadow: "0 0 12px color-mix(in oklab, var(--accent) 25%, transparent)",
            }}/>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-mute)" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// === Stacked bar with mini legend
function StackedBars({ rows, columns, height = 200 }) {
  // rows: [{label, parts: [{value, color, name}]}]
  const max = Math.max(...rows.map(r => r.parts.reduce((s, p) => s + p.value, 0))) * 1.1;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height }}>
        {rows.map((r, ri) => {
          const total = r.parts.reduce((s, p) => s + p.value, 0);
          const h = (total / max) * 100;
          return (
            <div key={ri} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
              <div style={{ flex: 1, width: 26, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{ width: 26, height: `${h}%`, display: "flex", flexDirection: "column", borderRadius: "6px 6px 3px 3px", overflow: "hidden" }}>
                  {r.parts.map((p, pi) => (
                    <div key={pi} style={{ height: `${(p.value / total) * 100}%`, background: p.color }}/>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-mute)" }}>{r.label}</div>
            </div>
          );
        })}
      </div>
      {columns && <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11, color: "var(--text-dim)", flexWrap: "wrap" }}>
        {columns.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }}/>
            <span>{c.label}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

// === Heatmap (calendar style) ===
function Heatmap({ weeks = 14, days = 7, accent }) {
  const cells = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const r = Math.random();
      cells.push({ w, d, v: r < 0.1 ? 0 : Math.floor(r * 4) + 1 });
    }
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks}, 1fr)`, gap: 4 }}>
      {Array.from({ length: weeks * days }).map((_, i) => {
        const c = cells[i];
        const intensity = c.v / 4;
        return (
          <div key={i} style={{
            aspectRatio: "1", borderRadius: 3,
            background: c.v === 0
              ? "var(--surface-3)"
              : `color-mix(in oklab, ${accent || "var(--accent)"} ${15 + intensity * 60}%, transparent)`,
            border: "0.5px solid var(--hairline)",
          }} title={`${c.v} events`}/>
        );
      })}
    </div>
  );
}

// === Incident timeline (live)  ===
function IncidentTimeline({ events }) {
  return (
    <div style={{ position: "relative", paddingLeft: 14 }}>
      <div style={{
        position: "absolute", left: 3, top: 6, bottom: 6,
        width: 1, background: "var(--hairline-2)",
      }}/>
      {events.map((e, i) => (
        <div key={i} className="fadein" style={{
          position: "relative", padding: "10px 0 10px 16px",
          animationDelay: `${i * 60}ms`,
        }}>
          <span style={{
            position: "absolute", left: -10, top: 13,
            width: 8, height: 8, borderRadius: "50%",
            background: `var(--${e.tone || "info"})`,
            boxShadow: `0 0 12px var(--${e.tone || "info"})`,
            ...(i === 0 ? { animation: "pulse 2.5s infinite" } : {}),
          }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{e.title}</div>
              {e.desc && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{e.desc}</div>}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", whiteSpace: "nowrap" }} className="mono">{e.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// === Tiny world map dots
function MapDots({ height = 180 }) {
  // pseudo-projection: scattered dots representing PoPs
  const dots = [
    { x: 14, y: 38, name: "us-west", load: 0.62 },
    { x: 24, y: 33, name: "us-east", load: 0.78 },
    { x: 22, y: 56, name: "br-sao",  load: 0.41 },
    { x: 47, y: 28, name: "eu-west", load: 0.92 },
    { x: 53, y: 34, name: "eu-cen",  load: 0.55 },
    { x: 56, y: 46, name: "africa",  load: 0.31 },
    { x: 70, y: 36, name: "me-uae",  load: 0.69 },
    { x: 76, y: 30, name: "ap-in",   load: 0.74 },
    { x: 84, y: 38, name: "ap-sg",   load: 0.83 },
    { x: 90, y: 28, name: "ap-jp",   load: 0.51 },
    { x: 92, y: 60, name: "ap-syd",  load: 0.39 },
  ];
  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: 12 }}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <pattern id="map-dots" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.35" fill="var(--text-mute)" opacity="0.35"/>
          </pattern>
        </defs>
        <rect width="100" height="60" fill="url(#map-dots)"/>
        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r="2.3" fill="var(--accent)" opacity={0.18}>
              <animate attributeName="r" values="2.3;3.8;2.3" dur={`${2 + d.load}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.35;0;0.35" dur={`${2 + d.load}s`} repeatCount="indefinite"/>
            </circle>
            <circle cx={d.x} cy={d.y} r="1.2" fill="var(--accent)"/>
          </g>
        ))}
      </svg>
    </div>
  );
}

// === Site map — two sites + IPsec tunnel
function SiteMap({ height = 180 }) {
  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: 12, background: "color-mix(in oklab, var(--accent) 4%, transparent)" }}>
      <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="tunnel-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.7"/>
            <stop offset="0.5" stopColor="var(--accent-2)" stopOpacity="0.9"/>
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.7"/>
          </linearGradient>
          <pattern id="dotgrid" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.4" fill="var(--text-mute)" opacity="0.18"/>
          </pattern>
        </defs>
        <rect x="0" y="0" width="320" height="160" fill="url(#dotgrid)"/>

        {/* IPsec tunnel */}
        <path d="M 95 80 Q 160 30 225 80" fill="none" stroke="url(#tunnel-grad)" strokeWidth="2" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.4s" repeatCount="indefinite"/>
        </path>
        <text x="160" y="32" textAnchor="middle" fontSize="8" fill="var(--accent)" letterSpacing="2" fontFamily="var(--f-mono)">IPsec · ENCRYPTED</text>

        {/* HQ */}
        <g transform="translate(60 80)">
          <rect x="-38" y="-30" width="76" height="60" rx="10" fill="color-mix(in oklab, var(--accent) 14%, transparent)" stroke="color-mix(in oklab, var(--accent) 40%, transparent)" strokeWidth="0.5"/>
          <text x="0" y="-14" textAnchor="middle" fontSize="6.5" fill="var(--text-mute)" letterSpacing="1.5">HQ</text>
          <text x="0" y="-2"  textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="600">Headquarters</text>
          <text x="0" y="10" textAnchor="middle" fontSize="6.5" fill="var(--text-dim)">Algiers</text>
          <g transform="translate(0 22)">
            <circle cx="-12" r="3" fill="var(--good)"/>
            <circle cx="0"   r="3" fill="var(--good)"/>
            <circle cx="12"  r="3" fill="var(--good)"/>
          </g>
        </g>

        {/* DC */}
        <g transform="translate(260 80)">
          <rect x="-44" y="-34" width="88" height="68" rx="10" fill="color-mix(in oklab, var(--accent-2) 14%, transparent)" stroke="color-mix(in oklab, var(--accent-2) 40%, transparent)" strokeWidth="0.5"/>
          <text x="0" y="-18" textAnchor="middle" fontSize="6.5" fill="var(--text-mute)" letterSpacing="1.5">DATACENTER</text>
          <text x="0" y="-6"  textAnchor="middle" fontSize="9" fill="var(--text)" fontWeight="600">Cloud DC</text>
          <text x="0" y="6"  textAnchor="middle" fontSize="6.5" fill="var(--text-dim)">Spine-Leaf · Public DMZ</text>
          {/* Mini fabric */}
          <g transform="translate(0 16)">
            <line x1="-14" x2="14" y1="0" y2="0" stroke="var(--accent-2)" strokeOpacity="0.35" strokeWidth="0.4"/>
            <line x1="-14" x2="0"  y1="0" y2="8" stroke="var(--accent-2)" strokeOpacity="0.35" strokeWidth="0.4"/>
            <line x1="-14" x2="14" y1="0" y2="8" stroke="var(--accent-2)" strokeOpacity="0.35" strokeWidth="0.4"/>
            <line x1="14"  x2="-14"y1="0" y2="8" stroke="var(--accent-2)" strokeOpacity="0.35" strokeWidth="0.4"/>
            <line x1="14"  x2="0"  y1="0" y2="8" stroke="var(--accent-2)" strokeOpacity="0.35" strokeWidth="0.4"/>
            <circle cx="-14" r="2.5" fill="var(--accent-2)"/>
            <circle cx="14"  r="2.5" fill="var(--accent-2)"/>
            <circle cx="-14" cy="8" r="2" fill="var(--accent-2)" opacity="0.7"/>
            <circle cx="0"   cy="8" r="2" fill="var(--accent-2)" opacity="0.7"/>
            <circle cx="14"  cy="8" r="2" fill="var(--accent-2)" opacity="0.7"/>
          </g>
        </g>

        {/* Internet cloud */}
        <g transform="translate(160 130)">
          <ellipse rx="22" ry="8" fill="color-mix(in oklab, var(--text-mute) 16%, transparent)" stroke="var(--hairline-2)" strokeWidth="0.5"/>
          <text x="0" y="2.5" textAnchor="middle" fontSize="6.5" fill="var(--text-mute)" letterSpacing="1.5">INTERNET</text>
          <line x1="-30" x2="60" y1="-2" y2="-50" stroke="var(--text-mute)" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5"/>
          <line x1="30"  x2="100" y1="-2" y2="-50" stroke="var(--text-mute)" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5"/>
        </g>
      </svg>
    </div>
  );
}

// === Spine-leaf fabric diagram ===
function SpineLeafDiagram({ spines = 2, leaves = 3, hostsPerLeaf = 4, height = 280, failedSpine = null }) {
  const w = 600;
  const spineSp = w / (spines + 1);
  const leafSp = w / (leaves + 1);
  const hostSp = w / (leaves * hostsPerLeaf + 1);
  const spineY = 40, leafY = 140, hostY = 240;

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height, display: "block" }}>
        {/* Uplinks: every leaf -> every spine (ECMP) */}
        {Array.from({ length: spines }).map((_, si) => (
          Array.from({ length: leaves }).map((_, li) => {
            const failed = failedSpine === si;
            return (
              <line key={`${si}-${li}`}
                    x1={spineSp * (si + 1)} y1={spineY + 10}
                    x2={leafSp * (li + 1)}  y2={leafY - 10}
                    stroke={failed ? "var(--bad)" : "var(--accent)"}
                    strokeWidth="1.2"
                    strokeOpacity={failed ? 0.35 : 0.55}
                    strokeDasharray={failed ? "3 3" : undefined}/>
            );
          })
        )).flat()}

        {/* Host links */}
        {Array.from({ length: leaves }).map((_, li) => (
          Array.from({ length: hostsPerLeaf }).map((_, hi) => {
            const hostIdx = li * hostsPerLeaf + hi;
            return (
              <line key={`l${li}h${hi}`}
                    x1={leafSp * (li + 1)} y1={leafY + 10}
                    x2={hostSp * (hostIdx + 1)} y2={hostY - 8}
                    stroke="var(--text-mute)" strokeWidth="0.8" strokeOpacity="0.5"/>
            );
          })
        )).flat()}

        {/* Spines */}
        {Array.from({ length: spines }).map((_, si) => {
          const failed = failedSpine === si;
          return (
            <g key={`s${si}`} transform={`translate(${spineSp * (si + 1)} ${spineY})`}>
              <rect x="-44" y="-10" width="88" height="22" rx="6"
                    fill={failed ? "color-mix(in oklab, var(--bad) 16%, transparent)" : "color-mix(in oklab, var(--accent) 14%, transparent)"}
                    stroke={failed ? "var(--bad)" : "color-mix(in oklab, var(--accent) 40%, transparent)"} strokeWidth="0.5"/>
              <text x="0" y="4" textAnchor="middle" fontSize="10" fill={failed ? "var(--bad)" : "var(--text)"} fontWeight="500" fontFamily="var(--f-mono)">spine-{si + 1}</text>
              {failed && <circle cx="32" cy="-2" r="4" fill="var(--bad)"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/></circle>}
            </g>
          );
        })}
        <text x={w / 2} y={spineY - 20} textAnchor="middle" fontSize="9" fill="var(--text-mute)" letterSpacing="2">SPINE TIER · ECMP</text>

        {/* Leaves */}
        {Array.from({ length: leaves }).map((_, li) => (
          <g key={`l${li}`} transform={`translate(${leafSp * (li + 1)} ${leafY})`}>
            <rect x="-44" y="-10" width="88" height="22" rx="6"
                  fill="color-mix(in oklab, var(--accent-2) 14%, transparent)"
                  stroke="color-mix(in oklab, var(--accent-2) 40%, transparent)" strokeWidth="0.5"/>
            <text x="0" y="4" textAnchor="middle" fontSize="10" fill="var(--text)" fontWeight="500" fontFamily="var(--f-mono)">leaf-{li + 1}</text>
          </g>
        ))}
        <text x={w / 2} y={leafY - 20} textAnchor="middle" fontSize="9" fill="var(--text-mute)" letterSpacing="2">LEAF TIER · TOP-OF-RACK</text>

        {/* Hosts */}
        {Array.from({ length: leaves * hostsPerLeaf }).map((_, hi) => (
          <g key={`h${hi}`} transform={`translate(${hostSp * (hi + 1)} ${hostY})`}>
            <rect x="-12" y="-8" width="24" height="16" rx="4"
                  fill="color-mix(in oklab, var(--good) 14%, transparent)"
                  stroke="color-mix(in oklab, var(--good) 30%, transparent)" strokeWidth="0.5"/>
            <text x="0" y="4" textAnchor="middle" fontSize="7" fill="var(--good)" fontFamily="var(--f-mono)">h{hi + 1}</text>
          </g>
        ))}
        <text x={w / 2} y={hostY + 20} textAnchor="middle" fontSize="9" fill="var(--text-mute)" letterSpacing="2">{`COMPUTE HOSTS · ${leaves * hostsPerLeaf} × 1U`}</text>
      </svg>
    </div>
  );
}

export { UptimeChart, Donut, BarChart, StackedBars, Heatmap, IncidentTimeline, MapDots, SiteMap, SpineLeafDiagram };
