import React from 'react'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, KPI, Field, Tabs, Stepper, Toggle, Modal, Avatar, Bar, Pill } from '../components/ui.jsx'
import { Sparkline, AreaChart } from '../components/charts.jsx'
import { StrataLogo, StrataWordmark } from '../components/brand.jsx'
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakButton } from '../components/tweaks-panel.jsx'
import { BentoFeatures, ProductShowcase, Pricing, FooterMkt } from './landing2.jsx'
import { api } from '../api/index.js'

// landing.jsx — STRATA marketing landing (ultra-fancy). Part 1: nav, hero, marquee.
// Part 2 (bento, code, stats, globe, pricing, testimonials, CTA, footer) in landing2.jsx.

// Reveal is now pure CSS (transform-only, see landing.css). No JS needed.
function useReveal() {}

// Count-up animation. Robust against backgrounded tabs: a setTimeout fallback
// guarantees the final value even if requestAnimationFrame is throttled/paused.
function CountUp({ to, suffix = "", prefix = "", dur = 1400, decimals = 0 }) {
  const [v, setV] = React.useState(0);
  const ref = React.useRef(null);
  React.useEffect(() => {
    let raf, fallback, started = false;
    const begin = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(to * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      fallback = setTimeout(() => setV(to), dur + 400); // guarantees final value
    };
    let io;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) begin(); }, { threshold: 0.3 });
      if (ref.current) io.observe(ref.current);
    } else { begin(); }
    // Absolute safety: if nothing fired within 2s, show final value.
    const hard = setTimeout(() => setV(to), 2000);
    return () => { if (io) io.disconnect(); cancelAnimationFrame(raf); clearTimeout(fallback); clearTimeout(hard); };
  }, [to, dur]);
  return <span ref={ref}>{prefix}{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function MeshBg({ cta }) {
  return (
    <div className="mesh-bg" aria-hidden="true">
      <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
      {!cta && <><div className="orb o4"/><div className="orb o5"/></>}
    </div>
  );
}

function LandingNav({ onGo }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`nav-mkt${scrolled ? " scrolled" : ""}`}>
      <div className="wrap">
        <div className="row" style={{ gap: 0 }}>
          <a onClick={() => onGo("landing")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <StrataWordmark size={14} variant="prism"/>
          </a>
          <nav>
            <span className="navlink" onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>Features <I.chevD size={12}/></span>
            <span className="navlink" onClick={() => document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}>Products <I.chevD size={12}/></span>
            <span className="navlink" onClick={() => document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"})}>Pricing</span>
            <a className="navlink" href="https://docs.strata.dz" target="_blank" rel="noopener">Docs</a>
            <a className="navlink" href="https://discord.gg/strata" target="_blank" rel="noopener">Community</a>
          </nav>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Btn kind="ghost" size="sm" onClick={() => onGo("login")}>Sign in</Btn>
          <Btn kind="primary glow" size="sm" onClick={() => onGo("signup")}>
            Start free <I.arrowR size={13}/>
          </Btn>
        </div>
      </div>
    </header>
  );
}

function DeployTerminal() {
  const script = [
    { d: 300, t: <span className="dim">Creating VM · Ubuntu 24.04 LTS</span> },
    { d: 600, t: <span className="dim">Plan: Standard · 2 vCPU · 4 GB · 80 GB SSD</span> },
    { d: 650, t: <span className="dim">Region: Algiers DC · capacity available</span> },
    { d: 750, t: <span className="dim">→ Allocating resources from pool…</span> },
    { d: 700, t: <><span className="ok">✓</span> Resources allocated <span className="dim">· disk attached</span></> },
    { d: 650, t: <span className="dim">→ Configuring network · VPC · firewall…</span> },
    { d: 700, t: <><span className="ok">✓</span> IP assigned <span className="accent">164.92.118.42</span></> },
    { d: 700, t: <span className="dim">→ Running bootstrap configuration…</span> },
    { d: 750, t: <><span className="ok">✓</span> SSH ready <span className="dim">· firewall applied</span></> },
    { d: 500, t: <><span className="accent">web-prod-01</span> is live <span className="ok">●</span></> },
    { d: 350, t: <span className="dim">  deployed in 55.3s · $0.0357/hr</span> },
  ];
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    let i = 0, timers = [];
    const run = () => {
      if (i >= script.length) { timers.push(setTimeout(() => { i = 0; setShown(0); run(); }, 4000)); return; }
      timers.push(setTimeout(() => { setShown(s => s + 1); i++; run(); }, script[i].d));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="deploy-card">
      <div style={{
        height: 4, borderRadius: "20px 20px 0 0",
        background: "linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent))",
        backgroundSize: "200% 100%",
        animation: "gradText 4s ease-in-out infinite",
      }}/>
      <div className="term">
        {script.slice(0, shown).map((l, i) => (
          <div key={i} style={{ animation: "revealUp 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>{l.t}</div>
        ))}
        <div><span className="pfx">$</span> <span className="cur"/></div>
      </div>
    </div>
  );
}

const TICKER_MSGS = [
  "atlas-web-07 deployed · NYC3 · 52.1s",
  "helios/ml-worker-4 scaled to 8 replicas",
  "nexion-db-02 snapshot created · 48 GB",
  "sahel-api restarted · 0 packet loss",
  "maris-bastion cert renewed automatically",
];

function Hero({ onGo }) {
  const [stats, setStats] = React.useState(null);
  const [tickerIdx, setTickerIdx] = React.useState(0);
  React.useEffect(() => {
    api.stats().then(s => { if (s) setStats(s); });
    const t = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_MSGS.length), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="hero">
      <MeshBg/>
      <div className="hero-beam" aria-hidden="true"/>
      <div className="grid-overlay"/>
      <div className="wrap">
        <div className="cols">
          {/* LEFT */}
          <div>
            <div className="eyebrow-chip reveal">
              <span className="tag">New</span>
              <span>One-click VM &amp; container deploys · Algiers DC</span>
              <I.arrowR size={12} style={{ opacity: 0.5, marginLeft: 2 }}/>
            </div>
            <h1 className="big reveal d1">
              Deploy in{" "}
              <span className="grad">{stats?.deploy_seconds ?? 55} seconds.</span>
              <br/>Scale in one click.
            </h1>
            <p className="lede reveal d2">
              Virtual machines and containers on a global fleet.
              Bring your own ISO or image, pay by the second,
              and never wait on a sales call.
            </p>
            <div className="cta reveal d3">
              <Btn kind="primary glow" size="lg" onClick={() => onGo("signup")}>
                Start free — $200 credit <I.arrowR size={15}/>
              </Btn>
              <Btn kind="" size="lg" onClick={() => onGo("portal-dashboard")}>
                <I.cmd size={15}/> Live demo
              </Btn>
            </div>

            <div className="hero-stats reveal d4">
              <div className="s">
                <div className="n"><CountUp to={stats?.deploy_seconds ?? 55} suffix="s"/></div>
                <div className="l">Median deploy</div>
              </div>
              <div className="s">
                <div className="n"><CountUp to={stats?.uptime ?? 99.99} decimals={2} suffix="%"/></div>
                <div className="l">Uptime SLA</div>
              </div>
              <div className="s">
                <div className="n"><CountUp to={stats?.total_resources ?? 0}/></div>
                <div className="l">Resources running</div>
              </div>
              <div className="s">
                <div className="n"><CountUp to={stats?.active_clients ?? 0}/></div>
                <div className="l">Active clients</div>
              </div>
            </div>

            <div className="live-ticker reveal d5">
              <span className="dot-live"/>
              <span className="msg" key={tickerIdx}>{TICKER_MSGS[tickerIdx]}</span>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ position: "relative", overflow: "visible", display: "flex", justifyContent: "center" }} className="reveal d2">
            <DeployTerminal/>
            <div className="float-chip" style={{ top:-18, right:-16, animation:"float-chip 4.5s ease-in-out infinite" }}>
              <span className="ic"><I.check size={14}/></span>
              <div>
                <div style={{ fontWeight:600, fontSize:12.5 }}>Health: passing</div>
                <div style={{ fontSize:11, opacity:0.55 }}>all services · 0ms</div>
              </div>
            </div>
            <div className="float-chip" style={{ bottom:-28, left:-16, animation:"float-chip 5.5s ease-in-out infinite", animationDelay:"2s" }}>
              <span className="ic w"><I.bolt size={14}/></span>
              <div>
                <div style={{ fontWeight:600, fontSize:12.5 }}>Provisioned in 55s</div>
                <div style={{ fontSize:11, opacity:0.55 }}>Ubuntu 24.04 · online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const brands = [
    "WAVELABS", "northstar", "Halcyon", "kilo", "fielded.ai",
    "OBELISK", "Drift", "Cartograph", "ten/ten", "MERIDIAN",
    "Axon", "paperstack", "VOLT", "helix.io", "SUPROVA",
  ];
  const items = [...brands, ...brands];
  return (
    <section style={{ padding: "56px 0 0" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span style={{ fontSize: 11.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-mute)", fontWeight: 600 }}>
          Trusted by 40,000+ builders worldwide
        </span>
      </div>
      <div className="marquee-wrap">
        <div className="track">
          {items.map((b, i) => (
            <span key={i} className="item">
              {i > 0 && <span className="sep"/>}
              <span style={{ fontFamily: (b.includes(".") || b.includes("/")) ? "var(--f-mono)" : "var(--f-sans)" }}>{b}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Landing({ onGo }) {
  useReveal();
  return (
    <div>
      <LandingNav onGo={onGo}/>
      <Hero onGo={onGo}/>
      <BentoFeatures/>
      <ProductShowcase onGo={onGo}/>
      <Pricing onGo={onGo}/>
      <FooterMkt/>
    </div>
  );
}


export { Landing }
