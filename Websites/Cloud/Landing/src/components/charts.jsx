import React from 'react'

// charts.jsx — lightweight inline SVG charts (sparkline, area, gauge, donut, radial)

function Sparkline({ data, width = 240, height = 56, stroke = "var(--accent)", fill = true, smooth = true }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 8) - 4]);
  let d = "";
  if (smooth) {
    d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
  } else {
    d = "M " + pts.map(p => p.join(" ")).join(" L ");
  }
  const areaD = d + ` L ${width} ${height} L 0 ${height} Z`;
  const gid = "sg-" + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.35"/>
          <stop offset="1" stopColor={stroke} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={areaD} fill={`url(#${gid})`}/>}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function AreaChart({ series, width = 600, height = 220, yLabels = true, xLabels = null, colors }) {
  // series: [{ name, data: [...] }]
  if (!series || series.length === 0) return null;
  const all = series.flatMap(s => s.data);
  const min = 0, max = Math.max(...all) * 1.1 || 1;
  const padL = 36, padR = 8, padT = 8, padB = 22;
  const W = width - padL - padR, H = height - padT - padB;
  const n = series[0].data.length;
  const stepX = W / (n - 1);
  const palette = colors || ["var(--accent)", "var(--accent-2)", "var(--good)"];

  const paths = series.map((s, si) => {
    const pts = s.data.map((v, i) => [padL + i * stepX, padT + H - ((v - min) / (max - min)) * H]);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    const areaD = d + ` L ${padL + (n - 1) * stepX} ${padT + H} L ${padL} ${padT + H} Z`;
    return { d, areaD, color: palette[si % palette.length], name: s.name };
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: padT + H - t * H,
    val: Math.round(min + t * (max - min)),
  }));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        {paths.map((p, i) => (
          <linearGradient key={i} id={`area-grad-${i}-${Math.random().toString(36).slice(2,6)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.color} stopOpacity="0.28"/>
            <stop offset="1" stopColor={p.color} stopOpacity="0"/>
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={width - padR} y2={t.y} stroke="var(--hairline)" strokeWidth="0.5" strokeDasharray="2 3"/>
          {yLabels && <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="var(--text-mute)">{t.val}</text>}
        </g>
      ))}
      {paths.map((p, i) => {
        const gid = `ag-${i}-${Math.random().toString(36).slice(2,6)}`;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={p.color} stopOpacity="0.32"/>
                <stop offset="1" stopColor={p.color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={p.areaD} fill={`url(#${gid})`}/>
            <path d={p.d} fill="none" stroke={p.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
          </g>
        );
      })}
      {xLabels && xLabels.map((lbl, i) => {
        const idx = Math.round((i / (xLabels.length - 1)) * (n - 1));
        return (
          <text key={i} x={padL + idx * stepX} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--text-mute)">{lbl}</text>
        );
      })}
    </svg>
  );
}

function Gauge({ value = 0.4, label, color = "var(--accent)", size = 140 }) {
  const r = (size - 16) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="10"/>
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${circ * value} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--text)">{Math.round(value * 100)}%</text>
      {label && <text x={cx} y={cy + 24} textAnchor="middle" fontSize="11" fill="var(--text-mute)">{label}</text>}
    </svg>
  );
}

function Donut({ segments, size = 140, label }) {
  // segments: [{ value, color, name }]
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - 16) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="14"/>
      {segments.map((s, i) => {
        const len = (s.value / total) * circ;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="14"
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += len;
        return el;
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--text)">{total}</text>
      {label && <text x={cx} y={cy + 22} textAnchor="middle" fontSize="11" fill="var(--text-mute)">{label}</text>}
    </svg>
  );
}

// Generate seeded fake series
function fakeSeries(n = 30, base = 50, amp = 20, seed = 1) {
  let s = seed * 9301;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round(base + Math.sin(i / 3 + seed) * amp + (r() - 0.5) * amp * 0.6))
  );
}


export { Sparkline, AreaChart, Gauge, Donut, fakeSeries }
