// icons.jsx — minimal stroke icon set, matching macOS/iOS visual tone

const Icon = ({ d, size = 18, stroke = "currentColor", sw = 1.6, fill = "none", children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d ? <path d={d}/> : children}
  </svg>
);

const I = {
  // Navigation
  home:        (p) => <Icon {...p}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></Icon>,
  grid:        (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Icon>,
  layers:      (p) => <Icon {...p}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 18l9 5 9-5"/></Icon>,
  server:      (p) => <Icon {...p}><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="7" cy="7.5" r="0.6" fill="currentColor"/><circle cx="7" cy="16.5" r="0.6" fill="currentColor"/></Icon>,
  shield:      (p) => <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/></Icon>,
  globe:       (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></Icon>,
  pulse:       (p) => <Icon {...p}><path d="M3 12h4l2-6 4 12 2-6h6"/></Icon>,
  bolt:        (p) => <Icon {...p}><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/></Icon>,
  cog:         (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12l2.5.5M2.5 11.5L5 12M12 5V2.5M12 21.5V19M16.95 7.05l1.77-1.77M5.28 18.72l1.77-1.77M16.95 16.95l1.77 1.77M5.28 5.28l1.77 1.77"/></Icon>,
  ticket:      (p) => <Icon {...p}><path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M13 5v14" strokeDasharray="2 3"/></Icon>,
  user:        (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></Icon>,
  users:       (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.8"/><path d="M3 19c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5"/><path d="M15 19c.7-2 2.5-3 4-3"/></Icon>,
  cal:         (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Icon>,
  cash:        (p) => <Icon {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M5 12h.5M19 12h-.5"/></Icon>,
  doc:         (p) => <Icon {...p}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"/><path d="M14 3v6h6"/></Icon>,
  envelope:    (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></Icon>,
  megaphone:   (p) => <Icon {...p}><path d="M3 11v2a1 1 0 001 1h2l8 5V5L6 10H4a1 1 0 00-1 1z"/><path d="M17 8a5 5 0 010 8"/></Icon>,
  question:    (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></Icon>,
  search:      (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></Icon>,
  bell:        (p) => <Icon {...p}><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 004 0"/></Icon>,
  sun:         (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></Icon>,
  moon:        (p) => <Icon {...p}><path d="M21 13A9 9 0 0111 3a8 8 0 1010 10z"/></Icon>,
  cmd:         (p) => <Icon {...p}><path d="M9 6a3 3 0 11-3 3M15 6a3 3 0 113 3M9 18a3 3 0 11-3-3M15 18a3 3 0 113-3M6 9h12v6H6z"/></Icon>,
  plus:        (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  arrowR:      (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
  arrowDR:     (p) => <Icon {...p}><path d="M7 7h10v10M7 17L17 7"/></Icon>,
  arrowUR:     (p) => <Icon {...p}><path d="M7 17L17 7M9 7h8v8"/></Icon>,
  check:       (p) => <Icon {...p}><path d="M5 13l4 4L19 7"/></Icon>,
  x:           (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>,
  more:        (p) => <Icon {...p}><circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/></Icon>,
  chevR:       (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  chevD:       (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  filter:      (p) => <Icon {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5z"/></Icon>,
  download:    (p) => <Icon {...p}><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"/></Icon>,
  paperclip:   (p) => <Icon {...p}><path d="M21 12l-8.5 8.5a5 5 0 11-7-7L14 5a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 11-3-3L15 8"/></Icon>,
  flag:        (p) => <Icon {...p}><path d="M5 3v18M5 4h11l-2 4 2 4H5"/></Icon>,
  briefcase:   (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/></Icon>,
  chart:       (p) => <Icon {...p}><path d="M3 21V5M3 21h18M7 17V12M12 17V8M17 17v-3"/></Icon>,
  pie:         (p) => <Icon {...p}><path d="M12 3v9h9a9 9 0 11-9-9z"/></Icon>,
  target:      (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></Icon>,
  truck:       (p) => <Icon {...p}><path d="M3 7h11v9H3zM14 11h4l3 3v2h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></Icon>,
  send:        (p) => <Icon {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></Icon>,
  inbox:       (p) => <Icon {...p}><path d="M3 13l3-9h12l3 9M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6M3 13h5l1 3h6l1-3h5"/></Icon>,
  archive:     (p) => <Icon {...p}><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v13h14V8M10 12h4"/></Icon>,
  star:        (p) => <Icon {...p}><path d="M12 3l3 6 6.5 1-4.7 4.6L18 21l-6-3-6 3 1.2-6.4L2.5 10 9 9l3-6z"/></Icon>,
  exit:        (p) => <Icon {...p}><path d="M14 3h5a2 2 0 012 2v14a2 2 0 01-2 2h-5M10 17l-5-5 5-5M5 12h12"/></Icon>,
  signal:      (p) => <Icon {...p}><path d="M3 18h2v3H3zM8 14h2v7H8zM13 9h2v12h-2zM18 4h2v17h-2z"/></Icon>,
  github:      (p) => <Icon {...p}><path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.2-.2-4.5-1.1-4.5-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 015 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.8-4.5 5 .4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A10 10 0 0012 2z"/></Icon>,
  cloud:       (p) => <Icon {...p}><path d="M6 18h11a4 4 0 100-8 6 6 0 00-11.6 1.5A3.5 3.5 0 006 18z"/></Icon>,
  database:    (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></Icon>,
  cpu:         (p) => <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></Icon>,
  wifi:        (p) => <Icon {...p}><path d="M5 12a10 10 0 0114 0M8.5 15a6 6 0 017 0"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></Icon>,
  link:        (p) => <Icon {...p}><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></Icon>,
  command:     (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9l3 3-3 3M13 15h2"/></Icon>,
  branch:      (p) => <Icon {...p}><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 8v8M6 14a8 8 0 008-8h2"/></Icon>,
  refresh:     (p) => <Icon {...p}><path d="M21 12a9 9 0 01-15.5 6.3M3 12A9 9 0 0118.5 5.7M21 4v5h-5M3 20v-5h5"/></Icon>,
  lock:        (p) => <Icon {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></Icon>,
};

export { I };
