// STRATA — brand mark. Stacked layered prism evoking strata / network layers.
// Three logo variants exposed via tweaks: "stack", "prism", "pulse".

function StrataLogo({ size = 28, variant = "stack", monochrome = false, ...rest }) {
  const grad = `stratag-${variant}-${size}`;
  const c1 = monochrome ? "currentColor" : "var(--accent-2)";
  const c2 = monochrome ? "currentColor" : "var(--accent)";

  if (variant === "prism") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" {...rest}>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c1}/><stop offset="1" stopColor={c2}/>
          </linearGradient>
        </defs>
        <path d="M16 3 L28 10 L28 22 L16 29 L4 22 L4 10 Z" fill={`url(#${grad})`} opacity="0.18"/>
        <path d="M16 3 L28 10 L16 17 L4 10 Z" fill={`url(#${grad})`}/>
        <path d="M16 17 L28 10 L28 22 L16 29 Z" fill={c2} opacity="0.55"/>
        <path d="M16 17 L4 10 L4 22 L16 29 Z" fill={c1} opacity="0.4"/>
      </svg>
    );
  }
  if (variant === "pulse") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" {...rest}>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={c1}/><stop offset="1" stopColor={c2}/>
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="13" fill="none" stroke={`url(#${grad})`} strokeWidth="1.6" opacity="0.4"/>
        <circle cx="16" cy="16" r="9"  fill="none" stroke={`url(#${grad})`} strokeWidth="1.6" opacity="0.7"/>
        <path d="M4 16 h6 l2 -5 l3 11 l2 -7 l2 4 h9" fill="none" stroke={`url(#${grad})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // default: stacked rhombi
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" {...rest}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1}/><stop offset="1" stopColor={c2}/>
        </linearGradient>
      </defs>
      <path d="M16 4 L28 11 L16 18 L4 11 Z"  fill={`url(#${grad})`}/>
      <path d="M16 14 L28 21 L16 28 L4 21 Z" fill={`url(#${grad})`} opacity="0.55"/>
      <path d="M16 9  L28 16 L16 23 L4 16 Z" fill={`url(#${grad})`} opacity="0.78"/>
    </svg>
  );
}

function StrataWordmark({ size = 16, variant = "stack" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <StrataLogo size={size * 1.7} variant={variant} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{
          fontWeight: 600, fontSize: size, letterSpacing: "0.18em",
          color: "var(--text)", fontFamily: "var(--f-sans)"
        }}>STRATA</span>
        <span style={{
          fontSize: size * 0.55, color: "var(--text-mute)",
          letterSpacing: "0.32em", marginTop: 3, textTransform: "uppercase",
        }}>Cloud · Network</span>
      </div>
    </div>
  );
}


export { StrataLogo, StrataWordmark };
