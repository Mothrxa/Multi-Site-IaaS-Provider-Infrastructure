import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, Stat, Pill, SectionHeader, Avatar, Progress, Sparkline, useLiveSeries } from '../components/ui.jsx'
import { BarChart, Donut, StackedBars } from '../components/charts.jsx'

// pages-biz.jsx — BizOps department: customer accounts, billing, revenue

function BizOverview({ goto }) {
  const mrr = useLiveSeries([280,285,288,292,295,298,301,304,307,310,312,315], { interval: 3000, max: 400, step: 0.03 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Good morning, Yacine" subtitle="Customers, billing and revenue across the platform."
        breadcrumbs={["BizOps", "Overview"]}
        actions={<>
          <button className="btn"><I.cal size={14}/>This quarter</button>
          <button className="btn primary"><I.download size={14}/>Export</button>
        </>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card>
          <Stat label="MRR" value={`€${mrr[mrr.length-1].toFixed(0)}k`} delta="+8.4% MoM" deltaTone="good"/>
          <Sparkline data={mrr} color="var(--accent)" height={42}/>
        </Card>
        <Card><Stat label="Active customers" value="412" delta="+18 net new" deltaTone="good"/></Card>
        <Card><Stat label="Outstanding" value="€18.4k" delta="4 invoices" deltaTone="warn"/></Card>
        <Card><Stat label="At risk" value="11" delta="renewal in 30d" deltaTone="warn"/></Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Revenue · last 12 months" subtitle="MRR with QoQ trend"
              action={<button className="btn ghost" style={{ height: 26, padding: "0 10px", fontSize: 11 }} onClick={() => goto("revenue")}>Open</button>}>
          <BarChart data={[
            { label: "Jun", value: 248 }, { label: "Jul", value: 256 },
            { label: "Aug", value: 261 }, { label: "Sep", value: 269 },
            { label: "Oct", value: 276 }, { label: "Nov", value: 282 },
            { label: "Dec", value: 290 }, { label: "Jan", value: 296 },
            { label: "Feb", value: 302 }, { label: "Mar", value: 308 },
            { label: "Apr", value: 312 }, { label: "May", value: Math.round(mrr[mrr.length-1]) },
          ]} height={200}/>
        </Card>
        <Card title="Plan mix" subtitle="Customers by tier">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
            <Donut value={62} max={100} label="Business · 62%" sub="MIX" color="var(--accent)" size={120}/>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {[
              { n: "Starter",    v: 18, c: "var(--info)" },
              { n: "Business",   v: 62, c: "var(--accent)" },
              { n: "Enterprise", v: 20, c: "var(--accent-2)" },
            ].map(p => (
              <div key={p.n} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: p.c }}/>
                <span style={{ flex: 1, fontSize: 12, color: "var(--text-dim)" }}>{p.n}</span>
                <span className="mono" style={{ fontSize: 12 }}>{p.v}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Top accounts (MRR)">
          {[
            { co: "Atlas Cloud",   mrr: "€42.0k", chg: "+5.2%" },
            { co: "Helios Tech",   mrr: "€28.4k", chg: "+1.8%" },
            { co: "Maris Logistics",mrr:"€18.2k", chg: "+0.4%" },
            { co: "Nexion SARL",   mrr: "€12.4k", chg: "+12.6%" },
            { co: "Riadh Capital", mrr: "€9.8k",  chg: "-2.1%"  },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none", alignItems: "center" }}>
              <Avatar name={a.co} size={28}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.co}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 13 }}>{a.mrr}</div>
                <div className="mono" style={{ fontSize: 10, color: a.chg.startsWith("-") ? "var(--bad)" : "var(--good)" }}>{a.chg}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Pipeline · stage progression"
              action={<button className="btn ghost" style={{ height: 26, padding: "0 10px", fontSize: 11 }} onClick={() => goto("pipeline")}>Open</button>}>
          {[
            { stage: "Discovery",   v: 18, value: "€482k" },
            { stage: "Qualified",   v: 12, value: "€312k" },
            { stage: "Proposal",    v: 7,  value: "€241k" },
            { stage: "Negotiation", v: 4,  value: "€186k" },
            { stage: "Closed Won",  v: 3,  value: "€88k"  },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none" }}>
              <span style={{ width: 100, fontSize: 12, color: "var(--text-dim)" }}>{s.stage}</span>
              <div style={{ flex: 1 }}><Progress value={s.v} max={20} tone={s.stage === "Closed Won" ? "good" : "accent"}/></div>
              <span className="mono" style={{ fontSize: 12, minWidth: 56, textAlign: "right" }}>{s.value}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function BizCustomers() {
  const [q, setQ] = React.useState("");
  const rows = [
    { co: "Atlas Cloud",      plan: "Enterprise", ind: "Tech",      vms: 412, ctrs: 184, mrr: "€42.0k", acv: "€504k", h: "good", ren: "Feb 27" },
    { co: "Helios Tech",      plan: "Enterprise", ind: "Tech",      vms: 218, ctrs: 92,  mrr: "€28.4k", acv: "€341k", h: "good", ren: "Aug 26" },
    { co: "Maris Logistics",  plan: "Business",   ind: "Logistics", vms: 142, ctrs: 18,  mrr: "€18.2k", acv: "€218k", h: "warn", ren: "Jun 26" },
    { co: "Nexion SARL",      plan: "Business",   ind: "Software",  vms: 88,  ctrs: 24,  mrr: "€12.4k", acv: "€149k", h: "good", ren: "Mar 27" },
    { co: "Riadh Capital",    plan: "Business",   ind: "Finance",   vms: 62,  ctrs: 8,   mrr: "€9.8k",  acv: "€118k", h: "warn", ren: "Sep 26" },
    { co: "Saharan AI",       plan: "Starter",    ind: "AI",        vms: 12,  ctrs: 4,   mrr: "€1.5k",  acv: "€18k",  h: "info", ren: "Trial" },
    { co: "Karkur Studios",   plan: "Starter",    ind: "Media",     vms: 4,   ctrs: 2,   mrr: "€0.7k",  acv: "€8k",   h: "info", ren: "Trial" },
  ];
  const filtered = q ? rows.filter(r => r.co.toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Customers" subtitle="Commercial view · account directory and health."
        breadcrumbs={["BizOps", "Customers"]}
        actions={<>
          <input className="input" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 220 }}/>
          <button className="btn primary"><I.plus size={14}/>Add account</button>
        </>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Active accounts" value="412"/></Card>
        <Card><Stat label="At risk" value="11" delta="renewal < 30d" deltaTone="warn"/></Card>
        <Card><Stat label="Trial" value="38" delta="12 close this week" deltaTone="info"/></Card>
        <Card><Stat label="Avg ACV" value="€9.2k"/></Card>
      </div>

      <Card title="Accounts" subtitle="Sorted by MRR · click for details">
        <table className="tbl">
          <thead><tr><th>Account</th><th>Plan</th><th>VMs</th><th>Ctrs</th><th>MRR</th><th>ACV</th><th>Health</th><th>Renewal</th></tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.co}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={c.co} size={28}/><div><div style={{ fontWeight: 500 }}>{c.co}</div><div style={{ fontSize: 11, color: "var(--text-mute)" }}>{c.ind}</div></div></div></td>
                <td><Pill>{c.plan}</Pill></td>
                <td className="mono">{c.vms}</td>
                <td className="mono">{c.ctrs}</td>
                <td className="mono">{c.mrr}</td>
                <td className="mono">{c.acv}</td>
                <td><Pill tone={c.h}>{c.h === "good" ? "healthy" : c.h === "warn" ? "at risk" : "trial"}</Pill></td>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{c.ren}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function BizBilling() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Billing & Usage" subtitle="Per-customer consumption · feeds into invoicing."
        breadcrumbs={["BizOps", "Customers", "Billing & Usage"]}
        actions={<><button className="btn"><I.download size={14}/>Export CSV</button><button className="btn primary"><I.refresh size={14}/>Run reconciliation</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="This-month usage" value="€312k" delta="+€18k MTD" deltaTone="info"/></Card>
        <Card><Stat label="Compute hours" value="184,210" hint="VMs + containers"/></Card>
        <Card><Stat label="Block storage" value="42.8" suffix="TB"/></Card>
        <Card><Stat label="Egress (billed)" value="14.2" suffix="TB"/></Card>
      </div>

      <Card title="Customer usage · current period" subtitle="May 1 → May 21 · billable resources">
        <table className="tbl">
          <thead><tr><th>Customer</th><th>VM-hours</th><th>Ctr-hours</th><th>Storage GB·mo</th><th>Egress GB</th><th>Subtotal</th><th>Period status</th></tr></thead>
          <tbody>
            {[
              { co: "Atlas Cloud",     vh: 142840, ch: 84210, st: 18400, eg: 4280, sub: "€38,210", s: "metering" },
              { co: "Helios Tech",     vh: 74220,  ch: 41200, st: 9200,  eg: 2140, sub: "€21,840", s: "metering" },
              { co: "Maris Logistics", vh: 42180,  ch: 9410,  st: 4800,  eg: 1240, sub: "€14,420", s: "metering" },
              { co: "Nexion SARL",     vh: 28840,  ch: 12410, st: 2400,  eg: 480,  sub: "€8,140",  s: "metering" },
              { co: "Riadh Capital",   vh: 18280,  ch: 4210,  st: 1800,  eg: 220,  sub: "€6,420",  s: "metering" },
              { co: "Saharan AI",      vh: 4840,   ch: 1840,  st: 280,   eg: 120,  sub: "€1,810",  s: "trial"    },
              { co: "Karkur Studios",  vh: 1240,   ch: 840,   st: 80,    eg: 22,   sub: "€420",    s: "trial"    },
            ].map((c, i) => (
              <tr key={i}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={c.co} size={26}/><span style={{ fontWeight: 500 }}>{c.co}</span></div></td>
                <td className="mono">{c.vh.toLocaleString()}</td>
                <td className="mono">{c.ch.toLocaleString()}</td>
                <td className="mono">{c.st.toLocaleString()}</td>
                <td className="mono">{c.eg.toLocaleString()}</td>
                <td className="mono" style={{ fontWeight: 500 }}>{c.sub}</td>
                <td><Pill tone={c.s === "trial" ? "info" : undefined}>{c.s}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Resource breakdown · this month">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { n: "Compute (VMs)",       v: 58, c: "var(--accent)" },
              { n: "Containers",          v: 18, c: "var(--accent-2)" },
              { n: "Block storage",       v: 12, c: "var(--info)" },
              { n: "Object storage",      v: 6,  c: "var(--good)" },
              { n: "Egress / network",    v: 4,  c: "var(--warn)" },
              { n: "Snapshots & backups", v: 2,  c: "var(--text-mute)" },
            ].map(p => (
              <div key={p.n} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: p.c }}/>
                <span style={{ flex: 1, fontSize: 12, color: "var(--text-dim)" }}>{p.n}</span>
                <span className="mono" style={{ fontSize: 12 }}>{p.v}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Pricing reference" subtitle="Standard list pricing">
          <table className="tbl">
            <thead><tr><th>SKU</th><th>Unit</th><th>Price</th></tr></thead>
            <tbody>
              {[
                { n: "c1-small  (1 vCPU · 2 GB)",   u: "VM-hour", p: "€0.012" },
                { n: "c2-medium (2 vCPU · 4 GB)",   u: "VM-hour", p: "€0.024" },
                { n: "c2-large  (4 vCPU · 8 GB)",   u: "VM-hour", p: "€0.048" },
                { n: "m1-xlarge (8 vCPU · 32 GB)",  u: "VM-hour", p: "€0.140" },
                { n: "Container slot",              u: "ctr-hour",p: "€0.004" },
                { n: "Block storage",               u: "GB·month",p: "€0.080" },
                { n: "Egress",                      u: "GB",      p: "€0.040" },
              ].map(r => (
                <tr key={r.n}>
                  <td className="mono">{r.n}</td>
                  <td style={{ color: "var(--text-dim)" }}>{r.u}</td>
                  <td className="mono">{r.p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function BizInvoices() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Invoices" subtitle="Customer billing cycle · issued, paid, overdue."
        breadcrumbs={["BizOps", "Customers", "Invoices"]}
        actions={<>
          <button className="btn"><I.refresh size={14}/>Sync from accounting</button>
          <button className="btn primary"><I.send size={14}/>Issue next batch</button>
        </>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Issued (MTD)" value="62" delta="€288k"/></Card>
        <Card><Stat label="Paid" value="58" delta="€269k" deltaTone="good"/></Card>
        <Card><Stat label="Outstanding" value="4" delta="€18.4k" deltaTone="warn"/></Card>
        <Card><Stat label="Avg. DSO" value="14" suffix="days" delta="-2d" deltaTone="good"/></Card>
      </div>

      <Card title="Invoices" subtitle="Most recent first">
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Period</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {[
              { id: "INV-2026-0481", co: "Atlas Cloud",     period: "May 2026", iss: "May 1",  due: "May 31", amt: "€42,000", s: "sent",     tone: "info"  },
              { id: "INV-2026-0480", co: "Helios Tech",     period: "May 2026", iss: "May 1",  due: "May 31", amt: "€28,400", s: "sent",     tone: "info"  },
              { id: "INV-2026-0479", co: "Maris Logistics", period: "May 2026", iss: "May 1",  due: "May 31", amt: "€18,200", s: "paid",     tone: "good"  },
              { id: "INV-2026-0478", co: "Nexion SARL",     period: "May 2026", iss: "May 1",  due: "May 31", amt: "€12,400", s: "paid",     tone: "good"  },
              { id: "INV-2026-0421", co: "Riadh Capital",   period: "Apr 2026", iss: "Apr 1",  due: "Apr 30", amt: "€9,800",  s: "overdue",  tone: "bad"   },
              { id: "INV-2026-0420", co: "Karkur Studios",  period: "Apr 2026", iss: "Apr 1",  due: "Apr 30", amt: "€420",    s: "overdue",  tone: "bad"   },
              { id: "INV-2026-0419", co: "Saharan AI",      period: "Apr 2026", iss: "Apr 1",  due: "Apr 30", amt: "€1,810",  s: "paid",     tone: "good"  },
              { id: "INV-2026-0418", co: "Atlas Cloud",     period: "Apr 2026", iss: "Apr 1",  due: "Apr 30", amt: "€39,840", s: "paid",     tone: "good"  },
            ].map(inv => (
              <tr key={inv.id}>
                <td className="mono">{inv.id}</td>
                <td>{inv.co}</td>
                <td style={{ color: "var(--text-dim)" }}>{inv.period}</td>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{inv.iss}</td>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{inv.due}</td>
                <td className="mono" style={{ fontWeight: 500 }}>{inv.amt}</td>
                <td><Pill tone={inv.tone}>{inv.s}</Pill></td>
                <td style={{ textAlign: "right" }}><button className="btn ghost icon"><I.download size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function BizRevenue() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Revenue" subtitle="MRR, ARR, expansion, churn."
        breadcrumbs={["BizOps", "Commercial", "Revenue"]}
        actions={<button className="btn"><I.download size={14}/>Export</button>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="MRR" value="€315k" delta="+€7k MoM" deltaTone="good"/></Card>
        <Card><Stat label="ARR run-rate" value="€3.78M" delta="+8.4%" deltaTone="good"/></Card>
        <Card><Stat label="Expansion" value="€18k" delta="+22% MoM" deltaTone="good"/></Card>
        <Card><Stat label="Churn" value="€4.4k" delta="-12% MoM" deltaTone="good"/></Card>
      </div>

      <Card title="MRR movement" subtitle="New, expansion, churn, contraction">
        <StackedBars rows={[
          { label: "Jan", parts: [{ value: 296, color: "var(--accent)" }, { value: 10, color: "var(--good)" }, { value: -4, color: "var(--bad)" }] },
          { label: "Feb", parts: [{ value: 302, color: "var(--accent)" }, { value: 12, color: "var(--good)" }, { value: -6, color: "var(--bad)" }] },
          { label: "Mar", parts: [{ value: 308, color: "var(--accent)" }, { value: 14, color: "var(--good)" }, { value: -8, color: "var(--bad)" }] },
          { label: "Apr", parts: [{ value: 312, color: "var(--accent)" }, { value: 9,  color: "var(--good)" }, { value: -5, color: "var(--bad)" }] },
          { label: "May", parts: [{ value: 315, color: "var(--accent)" }, { value: 11, color: "var(--good)" }, { value: -4, color: "var(--bad)" }] },
        ]} columns={[
          { label: "Starting MRR",        color: "var(--accent)" },
          { label: "New + Expansion",     color: "var(--good)" },
          { label: "Churn + Contraction", color: "var(--bad)" },
        ]}/>
      </Card>

      <Card title="Cohort retention" subtitle="By signup month · % retained">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: 2, fontSize: 9 }}>
          <div></div>
          {Array.from({length: 12}).map((_, m) => (
            <div key={m} style={{ color: "var(--text-mute)", textAlign: "center" }} className="mono">{m === 0 ? "M0" : m}</div>
          ))}
          {["Jan 25","Feb 25","Mar 25","Apr 25","May 25","Jun 25","Jul 25","Aug 25"].map((coh, ci) => (
            <React.Fragment key={ci}>
              <div style={{ color: "var(--text-mute)", fontSize: 10 }} className="mono">{coh}</div>
              {Array.from({length: 12}).map((_, m) => {
                if (m > 11 - ci) return <div key={m} style={{ background: "transparent" }}/>;
                const v = Math.max(40, 100 - m * 5 - Math.random() * 8);
                return <div key={m} style={{
                  background: `color-mix(in oklab, var(--accent) ${v}%, transparent)`,
                  height: 22, borderRadius: 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: v > 60 ? "white" : "var(--text-dim)",
                }} className="mono">{Math.round(v)}</div>;
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BizPipeline() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Pipeline" subtitle="Active deals across the funnel."
        breadcrumbs={["BizOps", "Commercial", "Pipeline"]}
        actions={<><button className="btn"><I.filter size={14}/>Filter</button><button className="btn primary"><I.plus size={14}/>New deal</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { stage: "Discovery",  value: "€482k", count: 18, color: "var(--text-mute)" },
          { stage: "Qualified",  value: "€312k", count: 12, color: "var(--info)" },
          { stage: "Proposal",   value: "€241k", count: 7,  color: "var(--accent)" },
          { stage: "Negotiation",value: "€186k", count: 4,  color: "var(--warn)" },
          { stage: "Closed Won", value: "€88k",  count: 3,  color: "var(--good)" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }}/>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-dim)" }}>{s.stage}</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-mute)" }} className="mono">{s.count}</span>
            </div>
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>Total value</div>
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {Array.from({length: Math.min(4, s.count)}).map((_, j) => (
                <Card key={j} style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{["Atlas expansion", "Acmé Cloud", "Nexion renewal", "Helios upsell", "Riadh extension", "Maris contract", "Saharan AI", "Karkur seat", "Velocity Labs", "Sigma Trade"][i*4+j] || "Deal"}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>€{(Math.random() * 80 + 10).toFixed(0)}k · {["Yacine","Léa","Karim"][j%3]}</div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { BizOverview, BizCustomers, BizBilling, BizInvoices, BizRevenue, BizPipeline };
