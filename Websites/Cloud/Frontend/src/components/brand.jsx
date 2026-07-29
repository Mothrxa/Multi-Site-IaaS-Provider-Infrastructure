import React from 'react'
import { I, Icon } from './icons.jsx'

function CloudLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#1e2d5a"/>
      <path d="M28 57 a15 15 0 0 1 1-30 a11 11 0 0 1 10-7 a17 17 0 0 1 32 5 a13 13 0 1 1 -1 32 Z"
        fill="none" stroke="white" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1="36" y1="57" x2="36" y2="67" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="27" y1="67" x2="45" y2="67" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="27" y1="67" x2="27" y2="76" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="45" y1="67" x2="45" y2="76" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="27" cy="77" r="2.8" fill="white"/>
      <circle cx="45" cy="77" r="2.8" fill="white"/>
      <line x1="50" y1="57" x2="50" y2="71" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="50" y1="71" x2="58" y2="71" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="58" y1="71" x2="58" y2="77" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="50" cy="77" r="2.8" fill="white"/>
      <circle cx="58" cy="77" r="2.8" fill="white"/>
      <line x1="65" y1="57" x2="65" y2="65" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="57" y1="65" x2="73" y2="65" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="73" y1="65" x2="73" y2="77" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="57" y1="65" x2="57" y2="72" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="73" cy="77" r="2.8" fill="white"/>
      <circle cx="57" cy="72" r="2.8" fill="white"/>
    </svg>
  )
}

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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <CloudLogo size={size * 3.2} />
      <span style={{
        fontWeight: 700, fontSize: size, letterSpacing: "0.18em",
        color: "var(--text)", fontFamily: "var(--f-sans)"
      }}>STRATA</span>
    </div>
  );
}


export { StrataLogo, StrataWordmark, CloudLogo }
