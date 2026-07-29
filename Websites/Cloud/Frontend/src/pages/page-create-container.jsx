import React from 'react'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, KPI, Field, Tabs, Stepper, Toggle, Modal, Avatar, Bar, Pill } from '../components/ui.jsx'
import { Sparkline, AreaChart, Gauge, Donut } from '../components/charts.jsx'
import { StrataLogo, StrataWordmark } from '../components/brand.jsx'
import { DeployingModal } from './page-create-vps.jsx'
import { resourcesApi, toast } from '../api/index.js'

// page-create-container.jsx — Create-a-container wizard

const POPULAR_IMAGES = [
  { name: "nginx",    tag: "alpine",    size: "7 MB",   desc: "Reverse proxy + static" },
  { name: "node",     tag: "20-alpine", size: "180 MB", desc: "Node.js LTS" },
  { name: "python",   tag: "3.12-slim", size: "120 MB", desc: "Python 3.12" },
  { name: "postgres", tag: "16",        size: "440 MB", desc: "Postgres 16" },
  { name: "redis",    tag: "7-alpine",  size: "40 MB",  desc: "In-memory KV" },
  { name: "caddy",    tag: "2",         size: "85 MB",  desc: "Auto-HTTPS" },
];

const CONTAINER_PLANS = [
  { name: "c-nano",  cpu: 0.25, ram: 256, hr: 0.0011, mo: 0.80 },
  { name: "c-micro", cpu: 0.5,  ram: 512, hr: 0.0021, mo: 1.50, popular: true },
  { name: "c-small", cpu: 1,    ram: 1024,hr: 0.0042, mo: 3.00 },
  { name: "c-med",   cpu: 2,    ram: 2048,hr: 0.0084, mo: 6.00 },
  { name: "c-large", cpu: 4,    ram: 4096,hr: 0.0167, mo: 12.00 },
  { name: "c-xl",    cpu: 8,    ram: 8192,hr: 0.0333, mo: 24.00 },
];

function PageCreateContainer({ onGo }) {
  const [state, setState] = React.useState({
    source: "registry",
    image: "nginx",
    tag: "alpine",
    custom: "",
    name: "api-edge",
    plan: "c-micro",
    region: "alg1",
    port: 80,
    autoHttps: true,
    env: [{ k: "NODE_ENV", v: "production" }],
    replicas: 1,
    autoscale: false,
    autoscaleMax: 5,
  });
  const [deploying, setDeploying] = React.useState(false);
  const [created, setCreated] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const plan = CONTAINER_PLANS.find(p => p.name === state.plan);
  const totalMo = (plan ? plan.mo : 0) * (state.autoscale ? state.replicas : state.replicas);

  const imageRef = state.source === "registry" && state.custom
    ? state.custom
    : `${state.image}:${state.tag}`;

  const handleDeploy = async () => {
    setErr(null); setCreated(null); setDeploying(true);
    try {
      const r = await resourcesApi.create({
        kind: 'container',
        name: state.name,
        image: imageRef,
        region: state.region,
        plan_id: state.plan,
        ports: String(state.port || 80),
        replicas: state.replicas,
        env: (state.env || []).filter(e => e.k),
      });
      setCreated(r);
      toast(`${r.name} is deploying · ${r.replicas} replica${r.replicas > 1 ? 's' : ''}`, 'success');
    } catch (e) {
      setErr(e.message);
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 4 }}>
            <a className="mute" style={{ cursor: "pointer", fontSize: 12.5 }} onClick={() => onGo("portal-dashboard")}>Dashboard</a>
            <span className="mute" style={{ fontSize: 12 }}>/</span>
            <span style={{ fontSize: 12.5 }}>New container</span>
          </div>
          <h1>Run a container</h1>
          <div className="sub">Pull any OCI image. We'll route traffic, terminate TLS, and restart on crash.</div>
        </div>
      </div>

      <div className="g cols-12">
        <div style={{ gridColumn: "span 8" }} className="col">
          {/* Source */}
          <Card title="Image">
            <div className="row" style={{ gap: 8, marginBottom: 16 }}>
              {[
                { id: "registry", lbl: "From registry", ico: <I.cloud size={13}/> },
                { id: "popular",  lbl: "Popular images", ico: <I.star size={13}/> },
                { id: "build",    lbl: "Build from Git",  ico: <I.branch size={13}/> },
              ].map(t => (
                <Btn key={t.id}
                  kind={state.source === t.id ? "primary" : ""}
                  size="sm" icon={t.ico}
                  onClick={() => setState({ ...state, source: t.id })}
                >{t.lbl}</Btn>
              ))}
            </div>

            {state.source === "popular" && (
              <div className="g cols-3" style={{ gap: 10 }}>
                {POPULAR_IMAGES.map(img => (
                  <div key={img.name}
                    className={`os-tile ${state.image === img.name ? "sel" : ""}`}
                    onClick={() => setState({ ...state, image: img.name, tag: img.tag })}
                  >
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{img.name}</span>
                      <span className="mute mono" style={{ fontSize: 10.5 }}>{img.size}</span>
                    </div>
                    <span className="mute mono" style={{ fontSize: 11 }}>:{img.tag}</span>
                    <span className="mute" style={{ fontSize: 11.5, marginTop: 4 }}>{img.desc}</span>
                  </div>
                ))}
              </div>
            )}

            {state.source === "registry" && (
              <div className="col" style={{ gap: 12 }}>
                <Field label="Image URL" hint="Public Docker Hub images don't need authentication. Private registries: add credentials below.">
                  <input className="input mono" placeholder="ghcr.io/your-org/api:v1.4.2"
                    value={state.custom}
                    onChange={e => setState({ ...state, custom: e.target.value })}/>
                </Field>
                <div className="mute" style={{ fontSize: 12, marginTop: 10 }}>
                  Private registry credentials aren't supported yet — public images only for now.
                </div>
              </div>
            )}

            {state.source === "build" && (
              <div className="mute" style={{ fontSize: 13, padding: "12px 0" }}>
                Building from a Git repository isn't available yet — use a prebuilt image from a registry instead.
              </div>
            )}
          </Card>

          {/* Plan & region */}
          <Card title="Plan">
            <div className="mute" style={{ fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan</div>
            <div className="plan-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {CONTAINER_PLANS.map(p => (
                <div key={p.name}
                  className={`plan-tile ${state.plan === p.name ? "sel" : ""}`}
                  onClick={() => setState({ ...state, plan: p.name })}
                >
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="name mono">{p.name}</span>
                    {p.popular && <Pill kind="accent" style={{ fontSize: 9, padding: "2px 6px" }}>Popular</Pill>}
                  </div>
                  <div className="specs">{p.cpu} vCPU · {p.ram} MB RAM</div>
                  <div className="price">${p.mo}<small>/mo · ${p.hr.toFixed(4)}/hr</small></div>
                </div>
              ))}
            </div>
          </Card>

          {/* Networking */}
          <Card title="Networking">
            <div className="g cols-2" style={{ gap: 12 }}>
              <Field label="Container port" hint="The port your app listens on inside the container.">
                <input className="input mono" type="number" value={state.port}
                  onChange={e => setState({ ...state, port: parseInt(e.target.value) || 80 })}/>
              </Field>
            </div>
            <div className="row" style={{ marginTop: 14, gap: 16 }}>
              <Toggle on={state.autoHttps} onChange={v => setState({ ...state, autoHttps: v })} label="Auto-HTTPS via Let's Encrypt"/>
            </div>
          </Card>

          {/* Env */}
          <Card title="Environment variables">
            <div className="col" style={{ gap: 8 }}>
              {state.env.map((e, i) => (
                <div key={i} className="row" style={{ gap: 8 }}>
                  <input className="input mono" placeholder="KEY" value={e.k} style={{ flex: 1 }}
                    onChange={ev => { const a = [...state.env]; a[i] = { ...e, k: ev.target.value }; setState({ ...state, env: a }); }}/>
                  <input className="input mono" placeholder="value" value={e.v} style={{ flex: 2 }}
                    onChange={ev => { const a = [...state.env]; a[i] = { ...e, v: ev.target.value }; setState({ ...state, env: a }); }}/>
                  <Btn kind="ghost icon sm" icon={<I.x size={13}/>}
                    onClick={() => setState({ ...state, env: state.env.filter((_, x) => x !== i) })}/>
                </div>
              ))}
              <Btn kind="ghost sm" icon={<I.plus size={12}/>} style={{ alignSelf: "flex-start" }}
                onClick={() => setState({ ...state, env: [...state.env, { k: "", v: "" }] })}>
                Add variable
              </Btn>
            </div>
          </Card>

          {/* Scaling */}
          <Card title="Scaling">
            <div className="g cols-2" style={{ gap: 16, alignItems: "center" }}>
              <Field label={`Replicas: ${state.replicas}`} hint="Identical instances behind the load balancer.">
                <input type="range" className="rng" min="1" max="10" value={state.replicas}
                  onChange={e => setState({ ...state, replicas: parseInt(e.target.value) })}/>
              </Field>
              <div>
                <Toggle on={state.autoscale} onChange={v => setState({ ...state, autoscale: v })}
                  label={`Autoscale up to ${state.autoscaleMax} replicas`}/>
                {state.autoscale && (
                  <input type="range" className="rng" min={state.replicas} max="20" value={state.autoscaleMax}
                    onChange={e => setState({ ...state, autoscaleMax: parseInt(e.target.value) })}
                    style={{ marginTop: 10 }}/>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar summary */}
        <div style={{ gridColumn: "span 4" }}>
          <div className="card" style={{ position: "sticky", top: 20 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>Summary</div>
            <div className="card" style={{ background: "var(--surface-3)", padding: 14 }}>
              <div className="row" style={{ gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "color-mix(in oklab, var(--accent-2) 20%, transparent)", color: "var(--accent-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.cloud size={18}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{state.name}</div>
                  <div className="mute mono" style={{ fontSize: 11 }}>
                    {state.source === "registry" ? (state.custom || "—") : `${state.image}:${state.tag}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="col" style={{ gap: 8, marginTop: 14, fontSize: 12.5 }}>
              {[
                ["Region",   state.region?.toUpperCase() || "—"],
                ["Plan",     plan ? plan.name : "—"],
                ["Replicas", state.autoscale ? `${state.replicas}–${state.autoscaleMax}` : `${state.replicas}`],
                ["Port",     state.port],
                ["HTTPS",    state.autoHttps ? "Auto" : "Off"],
                ["Env vars", state.env.length],
              ].map(([k, v]) => (
                <div key={k} className="row" style={{ justifyContent: "space-between" }}>
                  <span className="mute">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            <div className="divider"/>

            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="mute" style={{ fontSize: 12 }}>Estimated</span>
              <span style={{ fontSize: 22, fontWeight: 600 }}>${totalMo.toFixed(2)}<span className="mute" style={{ fontSize: 12 }}>/mo</span></span>
            </div>
            <div className="mute mono" style={{ fontSize: 11, marginTop: 2 }}>
              ${plan ? (plan.hr * state.replicas).toFixed(4) : "—"}/hr · {state.replicas} replica{state.replicas > 1 ? "s" : ""}
            </div>

            <Btn kind="primary" style={{ width: "100%", marginTop: 18, height: 42, justifyContent: "center" }}
              icon={<I.bolt size={14}/>}
              disabled={deploying || state.source === "build"}
              onClick={handleDeploy}>
              {deploying ? "Deploying…" : "Run container"}
            </Btn>
            {state.source === "build" && (
              <div className="mute" style={{ fontSize: 11.5, marginTop: 6, textAlign: "center" }}>
                Pick a registry or popular image to deploy.
              </div>
            )}
            <Btn style={{ width: "100%", marginTop: 8, justifyContent: "center" }}
              onClick={() => onGo("portal-dashboard")}>Cancel</Btn>
          </div>
        </div>
      </div>

      <DeployingModal
        open={deploying}
        hostname={state.name}
        kind="container"
        ip={created?.ip}
        error={err}
        onDone={() => {
          setDeploying(false);
          if (created) onGo("portal-cnt-detail-" + created.id);
        }}
      />
    </div>
  );
}


export { PageCreateContainer }
