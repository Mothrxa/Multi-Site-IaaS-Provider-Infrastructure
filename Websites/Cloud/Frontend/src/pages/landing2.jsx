import React from 'react'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, Pill, Avatar } from '../components/ui.jsx'
import { StrataLogo, StrataWordmark } from '../components/brand.jsx'
import { Sparkline, AreaChart } from '../components/charts.jsx'
import { RegionMap } from './page-dashboard.jsx'
import { api } from '../api/index.js'

function CountUp({ to, suffix = "", prefix = "", dur = 1400, decimals = 0 }) {
  const [v, setV] = React.useState(0);
  const ref = React.useRef(null);
  React.useEffect(() => {
    let raf, fallback, started = false;
    const begin = () => {
      if (started) return; started = true;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      fallback = setTimeout(() => setV(to), dur + 400);
    };
    let io;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(e => { if (e[0].isIntersecting) begin(); }, { threshold: 0.3 });
      if (ref.current) io.observe(ref.current);
    } else { begin(); }
    const hard = setTimeout(() => setV(to), 2000);
    return () => { if (io) io.disconnect(); cancelAnimationFrame(raf); clearTimeout(fallback); clearTimeout(hard); };
  }, [to, dur]);
  return <span ref={ref}>{prefix}{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}



// landing2.jsx — STRATA landing, part 2: bento, product showcase, code, stats, globe, pricing, testimonials, CTA, footer.

function SecHead({ eyebrow, title, sub }) {
  return (
    <div className="section-head reveal">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

function BentoFeatures() {
  const [bars, setBars] = React.useState([30,46,38,58,72,64,88]);
  React.useEffect(() => {
    const t = setInterval(() => {
      setBars(bs => bs.map(b => Math.max(20, Math.min(95, b + (Math.random()-0.5)*28))));
    }, 1800);
    return () => clearInterval(t);
  }, []);
  const regions = ["NYC3","FRA1","LHR1","SFO3","AMS1","SGP1","SYD1","TOR1","ALG1","GRU1","BLR1","NRT1"];
  return (
    <section className="section" id="features">
      <div className="section-inner">
        <SecHead
          eyebrow="Why STRATA"
          title="The cloud, minus the friction."
          sub="Every primitive you need to ship — wired together so you spend your time on product, not plumbing."
        />
        <div className="bento" onMouseMove={e => {
          const cell = e.target.closest('.cell');
          if (!cell) return;
          const r = cell.getBoundingClientRect();
          cell.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          cell.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        }}>

          {/* Tall: Self-service */}
          <div className="cell s-4 tall reveal">
            <div className="glow-blob"/>
            <div className="ic"><I.bolt size={22}/></div>
            <h3>Self-service<br/>in seconds</h3>
            <p>Fully automated provisioning under the hood. You only ever see a green light.</p>
            <div style={{ position:"absolute", left:26, right:26, bottom:24 }}>
              <div style={{ background:"var(--surface-3)", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, border:"1px solid var(--hairline)" }}>
                <span style={{ width:14, height:14, border:"2px solid color-mix(in oklab, var(--accent) 30%, transparent)", borderTopColor:"var(--accent)", borderRadius:"50%", flexShrink:0, animation:"revealUp 1.5s linear infinite" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:"var(--text)" }}>Provisioning web-prod-01…</div>
                  <div style={{ height:4, borderRadius:999, background:"var(--hairline)", marginTop:7, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:"72%", borderRadius:999, background:"linear-gradient(90deg,var(--accent),var(--accent-2))", transition:"width 1.5s ease" }}/>
                  </div>
                </div>
                <span style={{ fontFamily:"var(--f-mono)", fontSize:11, color:"var(--text-mute)" }}>40s</span>
              </div>
            </div>
          </div>

          {/* Scale on the fly */}
          <div className="cell s-4 reveal d1">
            <div className="ic a2"><I.signal size={20}/></div>
            <h3>Scale on the fly</h3>
            <p>Live resize CPU, RAM, disk. Autoscale groups built in.</p>
            <div className="bento-latency">
              {bars.map((h, i) => (
                <div key={i} className="b" style={{ height:`${h}%`, transition:`height 1.8s ease ${i*0.06}s` }}/>
              ))}
            </div>
          </div>

          {/* Algiers DC */}
          <div className="cell s-4 reveal d2">
            <div className="ic g"><I.globe size={20}/></div>
            <h3>Algiers DC<br/>direct network</h3>
            <p>Enterprise datacenter. Private backbone, low latency within Algeria.</p>
            <div className="bento-regions">
              {["ALG1","10Gbps","99.99%","NVMe","BGP"].map((r,i) => (
                <span key={r} className={`r${i < 3 ? " on" : ""}`}>{r}</span>
              ))}
            </div>
          </div>

          {/* API-first */}
          <div className="cell s-8 reveal d1">
            <div className="glow-blob" style={{ left:-60, bottom:-80, right:"auto" }}/>
            <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
              <div className="ic a2" style={{ flexShrink:0 }}><I.cmd size={20}/></div>
              <div>
                <h3>API-first, every surface</h3>
                <p>Web console, REST API, CLI. Every action you can do in the UI has an API equivalent. Automate everything.</p>
              </div>
            </div>
            <div style={{ marginTop:20, display:"flex", gap:8, flexWrap:"wrap" }}>
              {["REST API","CLI","Webhooks","SDKs"].map(t => (
                <span key={t} style={{ fontSize:11.5, fontFamily:"var(--f-mono)", padding:"4px 10px", borderRadius:999, background:"var(--surface-3)", border:"1px solid var(--hairline)", color:"var(--text-dim)" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Per-second billing */}
          <div className="cell s-4 reveal d2">
            <div className="ic w"><I.chart size={20}/></div>
            <h3>Per-second billing</h3>
            <p>Pay for exactly what you used. Never rounded to the hour.</p>
          </div>

          {/* Secure */}
          <div className="cell s-4 reveal d3">
            <div className="ic g"><I.shield size={20}/></div>
            <h3>Secure by default</h3>
            <p>VPC isolation, encrypted volumes, 2FA, audit logs, SOC 2 Type II.</p>
          </div>

          {/* Uptime */}
          <div className="cell s-4 reveal d2">
            <div className="ic"><I.check size={20}/></div>
            <h3>99.99% uptime SLA</h3>
            <p>Built on redundant architecture. Credits if we miss it — no questions asked.</p>
          </div>

        </div>
      </div>
    </section>
  );
}

// ===== PRODUCT SHOWCASE (tabs with live UI mockups) =====
function MiniMock({ kind }) {
  // Tiny faux-UI preview of the portal for each product
  if (kind === "vm") {
    return (
      <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--bg-1)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--hairline)", display: "flex", alignItems: "center", gap: 10 }}>
          <I.server size={15} stroke="var(--accent)"/>
          <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>web-prod-01</span>
          <Pill kind="good" dot>Running</Pill>
          <span className="spacer" style={{ flex: 1 }}/>
          <span className="mono mute" style={{ fontSize: 11 }}>164.92.118.42</span>
        </div>
        <div style={{ padding: 16 }} className="g cols-3">
          {[["CPU", "42%", "var(--accent)"], ["RAM", "2.6 GB", "var(--accent-2)"], ["Disk", "12/80", "var(--good)"]].map(([l, v, c]) => (
            <div key={l} className="card" style={{ padding: 12, background: "var(--surface-3)" }}>
              <div className="mute" style={{ fontSize: 11 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{v}</div>
              <div className="bar" style={{ marginTop: 8 }}><span style={{ width: l === "CPU" ? "42%" : l === "RAM" ? "65%" : "15%", background: c }}/></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "cnt") {
    return (
      <div className="card" style={{ padding: 16, background: "var(--bg-1)" }}>
        {[["api-edge", "nginx:alpine", "good"], ["worker-q", "node:20", "good"], ["cache", "redis:7", "good"]].map(([n, img, s], i) => (
          <div key={n} className="row" style={{ gap: 12, padding: "10px 0", borderBottom: i < 2 ? "0.5px solid var(--hairline)" : "none" }}>
            <I.cloud size={15} stroke="var(--accent-2)"/>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>{n}</span>
            <span className="mono mute" style={{ fontSize: 11 }}>{img}</span>
            <span className="spacer" style={{ flex: 1 }}/>
            <Pill kind={s} dot>healthy</Pill>
          </div>
        ))}
        <div className="banner ok" style={{ marginTop: 12, fontSize: 12 }}>
          <I.signal size={14} stroke="var(--good)"/><span>Autoscaled to 6 replicas · load balanced</span>
        </div>
      </div>
    );
  }
  if (kind === "storage") {
    return (
      <div className="card" style={{ padding: 16, background: "var(--bg-1)" }}>
        {[["vol-data", 200, 84], ["vol-db", 500, 220], ["root", 80, 12]].map(([n, sz, u]) => (
          <div key={n} style={{ padding: "8px 0" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 12.5 }}>{n}</span>
              <span className="mute mono" style={{ fontSize: 11 }}>{u}/{sz} GB</span>
            </div>
            <div className="bar"><span style={{ width: `${(u / sz) * 100}%` }}/></div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 16, background: "var(--bg-1)" }}>
      <table className="tbl">
        <tbody>
          <tr><td className="mono" style={{ fontSize: 12 }}>web.acme.app</td><td><Pill>A</Pill></td><td className="mono mute" style={{ fontSize: 11 }}>164.92.118.42</td></tr>
          <tr><td className="mono" style={{ fontSize: 12 }}>api.acme.app</td><td><Pill>CNAME</Pill></td><td className="mono mute" style={{ fontSize: 11 }}>web.acme.app</td></tr>
          <tr><td className="mono" style={{ fontSize: 12 }}>lb-prod-nyc3</td><td><Pill kind="accent">LB</Pill></td><td className="mono mute" style={{ fontSize: 11 }}>3 backends</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function ProductShowcase({ onGo }) {
  const [tab, setTab] = React.useState("vm");
  const products = {
    vm:      { ic: <I.server size={18}/>, h: "Virtual Machines", p: "Full-stack Linux or Windows. Pre-built images, bring-your-own ISO, or boot from a snapshot. Resize live, snapshot anytime.", bullets: ["1–64 vCPU · up to 256 GB RAM", "14 OS images + custom ISO upload", "Live resize, zero downtime", "Per-second billing"] },
    cnt:     { ic: <I.cloud size={18}/>, h: "Containers", p: "Pull any image from Docker Hub or a private registry. We handle the runtime, routing, TLS, and renewals — you push code.", bullets: ["Any OCI / Docker image", "Auto-HTTPS via Let's Encrypt", "Horizontal autoscaling", "Build straight from Git"] },
    storage: { ic: <I.database size={18}/>, h: "Block Storage", p: "Attach high-IOPS NVMe volumes to any VM or container. Snapshot in seconds, encrypted at rest.", bullets: ["10 GB – 16 TB volumes", "Up to 7,500 IOPS", "Encrypted at rest", "Instant snapshots"] },
    network: { ic: <I.wifi size={18}/>, h: "Networking", p: "Private VPCs, floating IPs, L4/L7 load balancers, and firewall rules — declarative, not click-clack.", bullets: ["Private VPCs per region", "L4 + L7 load balancing", "DDoS protection included", "Managed DNS"] },
  };
  const p = products[tab];
  return (
    <section className="section" id="products">
      <div className="section-inner">
        <SecHead eyebrow="Products" title="Pick a primitive. Ship a product." sub="Independently usable, and they compose without the YAML soup."/>
        <div className="row reveal" style={{ justifyContent: "center", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
          {Object.entries(products).map(([k, v]) => (
            <Btn key={k} kind={tab === k ? "primary" : ""} icon={v.ic} onClick={() => setTab(k)}>{v.h}</Btn>
          ))}
        </div>
        <div className="g cols-12 reveal" style={{ alignItems: "center", gap: 40 }}>
          <div style={{ gridColumn: "span 5" }}>
            <h3 style={{ fontSize: 30, letterSpacing: "-0.025em" }}>{p.h}</h3>
            <p className="dim" style={{ fontSize: 16, lineHeight: 1.6, marginTop: 14 }}>{p.p}</p>
            <div className="col" style={{ gap: 12, marginTop: 22 }}>
              {p.bullets.map(b => (
                <div key={b} className="row" style={{ gap: 11 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "color-mix(in oklab, var(--accent) 16%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <I.check size={13}/>
                  </span>
                  <span style={{ fontSize: 14.5 }}>{b}</span>
                </div>
              ))}
            </div>
            <Btn kind="primary" style={{ marginTop: 26 }} icon={<I.arrowR size={14}/>} onClick={() => onGo("signup")}>Try {p.h}</Btn>
          </div>
          <div style={{ gridColumn: "span 7" }}>
            <MiniMock kind={tab}/>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== CODE SHOWCASE =====
function CodeShowcase() {
  const [tab, setTab] = React.useState("cli");
  const snippets = {
    cli: (
      <pre><span className="c"># Spin up a VM in one command</span>{"\n"}<span className="k">strata</span> vm create \{"\n"}{"  "}--image <span className="s">ubuntu-24.04</span> \{"\n"}{"  "}--region <span className="s">nyc3</span> \{"\n"}{"  "}--plan <span className="s">s-2-4</span> \{"\n"}{"  "}--ssh-key <span className="s">macbook-lina</span>{"\n"}{"\n"}<span className="c"># → web-prod-01 ready in 55s at 164.92.118.42</span></pre>
    ),
    api: (
      <pre><span className="c">// POST /v1/instances</span>{"\n"}<span className="k">await</span> fetch(<span className="s">"https://api.strata.cloud/v1/instances"</span>, {"{"}{"\n"}{"  "}method: <span className="s">"POST"</span>,{"\n"}{"  "}headers: {"{"} <span className="n">Authorization</span>: <span className="s">`Bearer ${"{"}TOKEN{"}"}`</span> {"}"},{"\n"}{"  "}body: <span className="f">JSON</span>.stringify({"{"}{"\n"}{"    "}image: <span className="s">"ubuntu-24.04"</span>,{"\n"}{"    "}region: <span className="s">"nyc3"</span>,{"\n"}{"    "}plan: <span className="s">"s-2-4"</span>{"\n"}{"  "}{"}"}){"\n"}{"}"});</pre>
    ),
    tf: (
      <pre><span className="c"># main.tf</span>{"\n"}<span className="k">resource</span> <span className="s">"strata_instance"</span> <span className="s">"web"</span> {"{"}{"\n"}{"  "}<span className="n">image</span>  = <span className="s">"ubuntu-24.04"</span>{"\n"}{"  "}<span className="n">region</span> = <span className="s">"nyc3"</span>{"\n"}{"  "}<span className="n">plan</span>   = <span className="s">"s-2-4"</span>{"\n"}{"  "}<span className="n">ssh_keys</span> = [strata_ssh_key.lina.id]{"\n"}{"\n"}{"  "}<span className="n">user_data</span> = <span className="f">file</span>(<span className="s">"cloud-init.yml"</span>){"\n"}{"}"}</pre>
    ),
  };
  return (
    <section className="section">
      <div className="section-inner">
        <div className="g cols-12 reveal" style={{ alignItems: "center", gap: 48 }}>
          <div style={{ gridColumn: "span 5" }}>
            <div className="eyebrow">Built for developers</div>
            <h2 style={{ fontSize: 40, letterSpacing: "-0.025em", marginTop: 12 }}>Your workflow,<br/>not ours.</h2>
            <p className="dim" style={{ fontSize: 16.5, lineHeight: 1.6, marginTop: 16 }}>
              Click it in the console, or script it with the CLI.
              Every action in STRATA is an API call — the dashboard is just one client.
            </p>
            <div className="row" style={{ gap: 22, marginTop: 26 }}>
              <div className="row" style={{ gap: 9 }}><I.cmd size={18} stroke="var(--accent)"/><span style={{ fontSize: 14, fontWeight: 500 }}>CLI</span></div>
              <div className="row" style={{ gap: 9 }}><I.command size={18} stroke="var(--accent)"/><span style={{ fontSize: 14, fontWeight: 500 }}>REST API</span></div>
            </div>
          </div>
          <div style={{ gridColumn: "span 7" }}>
            <div className="code-window">
              <div className="tabs-row">
                {[["cli", "strata-cli"], ["api", "api.js"], ["tf", "main.tf"]].map(([k, l]) => (
                  <div key={k} className={`ct ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
                    <I.doc size={13}/>{l}
                  </div>
                ))}
              </div>
              {snippets[tab]}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== STATS BAND =====
function StatsBand() {
  const [stats, setStats] = React.useState(null);
  React.useEffect(() => { api.stats().then(s => { if(s) setStats(s); }); }, []);
  const cells = [
    { n: stats?.total_resources ?? 0,  suf: "",     l: "Running resources",  sub: "VMs and containers" },
    { n: 1.2,                          suf: "M+",   l: "vCPUs in pool",     sub: "On-demand capacity" },
    { n: stats?.active_clients ?? 412, suf: "",     l: "Active clients",    sub: "Growing every week" },
    { n: stats?.uptime ?? 99.99,       suf: "%",    l: "Uptime SLA",        sub: "Backed by credits" },
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="section-inner">
        <div className="stats-band reveal">
          {cells.map((c, i) => (
            <div className="cell" key={i}>
              <div className="n">
                <CountUp to={c.n} decimals={c.n < 10 && c.suf !== "%" ? 0 : c.suf === "%" ? 2 : 0} suffix={c.suf}/>
              </div>
              <div className="l">{c.l}</div>
              <div className="sub">{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== GLOBE SECTION =====
function GlobeSection() {
  const cities = ["10 Gbps backbone","Enterprise hardware","NVMe SSD storage","BGP routing","99.99% uptime SLA","24/7 NOC monitoring","DDoS protection","Private VPC","Encrypted volumes","SOC 2 Type II","ISO 27001","GDPR compliant"];
  return (
    <section className="section">
      <div className="section-inner">
        <div style={{ display:"grid", gridTemplateColumns:"5fr 7fr", gap:56, alignItems:"center" }}>
          <div className="reveal">
            <div className="section-head" style={{ textAlign:"left", marginBottom:32 }}>
              <div className="eyebrow" style={{ justifyContent:"flex-start" }}>Global infrastructure</div>
              <h2>Algiers DC.<br/>Enterprise network.</h2>
              <p style={{ maxWidth:"none", margin:"14px 0 0" }}>Enterprise-grade datacenter in Algiers with direct BGP routing, 10 Gbps backbone, and NVMe storage. Egress within your resources is always free.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px", marginTop:20 }}>
              {cities.map(c => (
                <div key={c} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-dim)" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }}/>
                  {c}
                </div>
              ))}
            </div>
          </div>
          <div className="reveal d1">
            <div style={{ borderRadius:18, overflow:"hidden", background:"var(--bg-2)", border:"1px solid var(--hairline)", padding:8, height:400 }}>
              <RegionMap/>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== PRICING =====
function Pricing({ onGo }) {
  const [mode, setMode] = React.useState("mo");
  const plans = [
    {
      id: "shared", name: "Shared", mo: 6, hr: 0.0089,
      desc: "Shared vCPU from a pooled fleet. Perfect for dev environments, staging, and low-traffic apps.",
      specs: [
        "1 vCPU (shared) · 1 GB RAM",
        "25 GB NVMe SSD",
        "1 TB outbound transfer",
        "Per-second billing",
        "Algiers DC",
        "Community support",
      ],
    },
    {
      id: "standard", name: "Standard", mo: 24, hr: 0.0357, featured: true,
      desc: "Dedicated vCPU, consistent performance. The right choice for production web apps and APIs.",
      specs: [
        "2 vCPU (dedicated) · 4 GB RAM",
        "80 GB NVMe SSD",
        "4 TB outbound transfer",
        "Per-second billing",
        "Algiers DC · private VPC",
        "Floating IP included",
        "Priority support",
      ],
    },
    {
      id: "perf", name: "Performance", mo: 140, hr: 0.2083,
      desc: "High-memory dedicated hardware for databases, ML workloads, and anything that needs consistent raw power.",
      specs: [
        "4 vCPU (dedicated) · 16 GB RAM",
        "200 GB NVMe SSD",
        "6 TB outbound transfer",
        "Per-second billing",
        "Algiers DC · private VPC",
        "Floating IP + firewall rules",
        "24/7 SLA · priority queue",
      ],
    },
  ];
  return (
    <section className="section" id="pricing">
      <div className="section-inner">
        <SecHead eyebrow="Pricing" title="Simple, per-second pricing." sub="No reserved instances, no upfront commitment. Pay for what you use — billed by the second, capped monthly."/>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:48 }} className="reveal">
          <div className="seg">
            <button className={mode === "mo" ? "on" : ""} onClick={() => setMode("mo")}>Monthly</button>
            <button className={mode === "yr" ? "on" : ""} onClick={() => setMode("yr")}>Annually</button>
            {mode === "yr" && <span className="save">Save 20%</span>}
          </div>
        </div>
        <div className="pricing-grid reveal d1">
          {plans.map((p) => (
            <div className={`price-card${p.featured ? " featured" : ""}`} key={p.id}>
              {p.featured && <div className="badge">Most popular</div>}
              <div className="plan">{p.name}</div>
              <div className="amount">
                {mode === "mo" ? `$${p.mo}` : `$${Math.round(p.mo * 12 * 0.8)}`}
                <span> /{mode === "mo" ? "mo" : "yr"}</span>
              </div>
              <div style={{ fontSize:12, color:"var(--text-mute)", fontFamily:"var(--f-mono)", marginTop:4 }}>
                ${p.hr.toFixed(4)}/hr · billed per second
              </div>
              <div className="desc" style={{ marginTop:12 }}>{p.desc}</div>
              <div className="line"/>
              <ul>
                {p.specs.map((s, j) => (
                  <li key={j}><I.check size={14}/><span>{s}</span></li>
                ))}
              </ul>
              <Btn
                kind={p.featured ? "primary glow" : ""}
                style={{ marginTop:24, width:"100%", justifyContent:"center" }}
                onClick={() => onGo("signup")}
              >
                {p.featured ? "Start for free →" : `Deploy ${p.name}`}
              </Btn>
            </div>
          ))}
        </div>
        <div style={{ background:"var(--surface)", border:"1px solid var(--hairline)", borderRadius:16, padding:"20px 28px", marginTop:32, display:"flex", justifyContent:"space-between", alignItems:"center" }} className="reveal">
          <div>
            <div style={{ fontSize:14, fontWeight:600 }}>Containers from $0.80/mo</div>
            <div style={{ fontSize:13, color:"var(--text-mute)", marginTop:4 }}>Run any OCI image. Auto-HTTPS, health checks, rolling restarts. Billed per second.</div>
          </div>
          <Btn onClick={() => onGo("signup")} style={{ flexShrink:0 }}>Deploy a container →</Btn>
        </div>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginTop:24 }} className="reveal">
          <span style={{ fontSize:13.5, color:"var(--text-mute)" }}>Need GPUs, bare metal, or volume discounts?</span>
          <a style={{ color:"var(--accent)", fontWeight:600, fontSize:13.5, cursor:"pointer" }}>Talk to us →</a>
        </div>
      </div>
    </section>
  );
}

// ===== TESTIMONIALS =====
function Testimonials() {
  const row1 = [
    { q: "We moved 200 services off a hyperscaler and cut our bill by 60%. The per-second billing alone paid for the migration.", n: "Amara Okafor", r: "CTO, Halcyon" },
    { q: "Deploys that took our team 20 minutes now take under a minute. The REST API is genuinely first-class.", n: "Yacine Rahmani", r: "Platform Lead, kilo" },
    { q: "Bring-your-own-ISO was the dealbreaker feature. No other provider let us boot our hardened image this easily.", n: "Sofia Marin", r: "Infra Eng, OBELISK" },
    { q: "The CLI alone is worth the switch. strata deploy just works. No YAML config files, no hunting through docs.", n: "Lucas Petit", r: "SRE, Cartograph" },
  ];
  const row2 = [
    { q: "Migration took 2 hours. We were up and running faster than we expected, with better observability than before.", n: "Rania Aziz", r: "DevOps Lead, Northstar" },
    { q: "Pricing is transparent. I always know what I'll pay. No surprise bills at end of month — ever.", n: "David Chen", r: "Founder, ten/ten" },
    { q: "Best DX in the cloud space. The portal, the API, the support — all genuinely great.", n: "Ines Benali", r: "Backend Eng, MERIDIAN" },
    { q: "Autoscale groups detected a spike before our on-call did and scaled up automatically. Zero downtime.", n: "Marco Silva", r: "CTO, Wavelabs" },
  ];
  const TCard = ({ t }) => (
    <div className="tcard">
      <div className="stars">★★★★★</div>
      <div className="quote">"{t.q}"</div>
      <div className="who">
        <div className="av">{t.n.split(" ").map(w => w[0]).join("").slice(0,2)}</div>
        <div>
          <div className="name">{t.n}</div>
          <div className="role">{t.r}</div>
        </div>
      </div>
    </div>
  );
  return (
    <section className="section">
      <div className="section-inner">
        <SecHead eyebrow="Loved by builders" title="Don't take our word for it." sub="Join 40,000+ developers who've made the switch."/>
      </div>
      <div className="tmarquee" style={{ overflow:"hidden" }}>
        <div className="track">
          {[...row1,...row1].map((t,i) => <TCard key={i} t={t}/>)}
        </div>
        <div className="track2">
          {[...row2,...row2].map((t,i) => <TCard key={i} t={t}/>)}
        </div>
      </div>
    </section>
  );
}

// ===== CTA MEGA =====
function CTAMega({ onGo }) {
  return (
    <section className="section" style={{ padding:"60px 0 100px" }}>
      <div className="section-inner">
        <div className="cta-mega reveal">
          <div className="mesh-bg" aria-hidden="true">
            <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
          </div>
          <h2>
            $200 credit.<br/>
            <span className="grad">55-second deploys.</span><br/>
            Your move.
          </h2>
          <p>Sign up in 30 seconds. Burn through the credit before you ever add a card.</p>
          <div className="cta-row">
            <Btn kind="primary glow" size="lg" onClick={() => onGo("signup")}>
              Create your account <I.arrowR size={16}/>
            </Btn>
            <Btn size="lg" onClick={() => onGo("portal-dashboard")} style={{ background:"rgba(240,238,233,0.12)", color:"#f0eee9", borderColor:"rgba(240,238,233,0.18)" }}>
              <I.cmd size={15}/> Live demo
            </Btn>
          </div>
          <div className="trust">
            <span><I.shield size={14}/> SOC 2 Type II</span>
            <span><I.check size={14}/> No credit card required</span>
            <span><I.bolt size={14}/> Deploy in 55s</span>
            <span><I.globe size={14}/> Algiers DC</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== FOOTER =====
function FooterMkt() {
  const cols = {
    Product:   ["Virtual Machines","Containers","Block Storage","Networking","Snapshots","Marketplace"],
    Resources: ["Documentation","API reference","CLI","Status","Changelog"],
    Company:   ["About","Customers","Careers","Press","Contact","Blog"],
    Legal:     ["Privacy","Terms","Security","Compliance","DPA","Cookies"],
  };
  return (
    <footer className="footer-mkt">
      <div className="inner">
        <div className="top">
          <div>
            <div style={{ marginBottom:18 }}><StrataWordmark size={14} variant="prism"/></div>
            <p style={{ fontSize:13.5, lineHeight:1.55, color:"var(--text-mute)", maxWidth:280 }}>
              Cloud infrastructure built for builders. Enterprise-grade, one unified API.
            </p>
            <div style={{ display:"flex", gap:14, marginTop:24, color:"var(--text-mute)" }}>
              <I.github size={18} style={{ cursor:"pointer" }}/>
              <I.envelope size={18} style={{ cursor:"pointer" }}/>
              <I.megaphone size={18} style={{ cursor:"pointer" }}/>
            </div>
          </div>
          {Object.entries(cols).map(([k, vs]) => (
            <div key={k}>
              <div className="col-head">{k}</div>
              <div className="col-links">
                {vs.map(v => <a key={v} href="#">{v}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="bottom">
          <span className="copy">© 2026 STRATA Cloud, Inc. All rights reserved.</span>
          <div className="links">
            <a href="#">SOC 2 Type II</a>
            <a href="#">ISO 27001</a>
            <a href="#">GDPR ready</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { BentoFeatures, ProductShowcase, CodeShowcase, StatsBand, GlobeSection, Pricing, Testimonials, CTAMega, FooterMkt }
