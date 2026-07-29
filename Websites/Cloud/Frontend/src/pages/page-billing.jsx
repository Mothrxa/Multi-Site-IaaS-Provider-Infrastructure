import React from 'react'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, KPI, Field, Tabs, Toggle, Modal, Bar, Pill } from '../components/ui.jsx'
import { billingApi, toast } from '../api/index.js'
import { Loading } from '../components/feedback.jsx'

const bMoney = (n, dp = 2) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp })

const BILLING_MODELS = [
  { id: "payg",    title: "Pay-as-you-go", desc: "Metered every second, billed at month end. No commitment, no minimums.", when: "Billed monthly · 30 days net" },
  { id: "prepaid", title: "Prepaid credit", desc: "Top up a wallet, we deduct hourly. We email you before it runs dry.", when: "Pay upfront · no recurring charge" },
  { id: "monthly", title: "Monthly plan", desc: "Commit to a fixed bundle for discounts. Overage at standard rates.", when: "Billed on the 1st · auto-renews" },
]

function BillingModelCard({ m, selected, onSelect }) {
  return (
    <div className="card" onClick={() => onSelect(m.id)} style={{
      cursor: "pointer",
      borderColor: selected ? "var(--accent)" : "var(--hairline)",
      boxShadow: selected ? "0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent)" : "var(--shadow-card)",
      transition: "all 0.15s",
    }}>
      <div className="row" style={{ gap: 10, marginBottom: 10 }}>
        <span style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${selected ? "var(--accent)" : "var(--hairline-2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }}/>}
        </span>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{m.title}</span>
      </div>
      <p className="dim" style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{m.desc}</p>
      <div className="mute" style={{ fontSize: 11.5, marginTop: 12 }}>{m.when}</div>
    </div>
  );
}

function AddCardModal({ open, onClose, onAdded }) {
  const [num, setNum] = React.useState("");
  const [exp, setExp] = React.useState("");
  const [holder, setHolder] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  if (!open) return null;
  const save = async () => {
    setSaving(true);
    try {
      const [mm, yy] = exp.split("/").map(s => s.trim());
      const m = await billingApi.addMethod({ number: num, exp_month: parseInt(mm) || null, exp_year: parseInt(yy) || null, holder });
      toast(`${m.brand} ····${m.last4} added`, "success");
      onAdded();
      onClose();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };
  return (
    <Modal open={open} title="Add payment method" width={440} onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" onClick={save} disabled={saving || num.replace(/\D/g,"").length < 13}>{saving ? "Adding…" : "Add card"}</Btn></>}>
      <div className="col" style={{ gap: 12 }}>
        <Field label="Card number"><input className="input mono" placeholder="4242 4242 4242 4242" value={num} onChange={e => setNum(e.target.value)}/></Field>
        <div className="g cols-2" style={{ gap: 12 }}>
          <Field label="Expiry (MM/YY)"><input className="input mono" placeholder="09/28" value={exp} onChange={e => setExp(e.target.value)}/></Field>
          <Field label="Name on card"><input className="input" placeholder="Full name" value={holder} onChange={e => setHolder(e.target.value)}/></Field>
        </div>
      </div>
    </Modal>
  );
}

function PageBilling({ onGo }) {
  const [tab, setTab] = React.useState("overview");
  const [bill, setBill] = React.useState(null);
  const [savingModel, setSavingModel] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [cap, setCap] = React.useState("");
  const [alert, setAlert] = React.useState("");
  const [limitsOn, setLimitsOn] = React.useState(false);

  const load = () => billingApi.get().then(b => {
    setBill(b);
    setCap(b.spendCap ? String(b.spendCap) : "");
    setAlert(b.alertThreshold ? String(b.alertThreshold) : "");
    setLimitsOn(b.spendCap > 0);
  }).catch(() => setBill({ credit:0, billingModel:'payg', paymentMethods:[], spendCap:0, alertThreshold:0, current:{ period:'—', mtd:0, projected:0, hourly:0, lineItems:[] }, invoices:[] }));
  React.useEffect(() => { load(); }, []);

  if (!bill) return (
    <div>
      <div className="page-h"><div><h1>Billing</h1><div className="sub">Loading your billing…</div></div></div>
      <Loading/>
    </div>
  );

  const cur = bill.current;
  const dailyBurn = cur.hourly * 24;
  const daysLeft = dailyBurn > 0 ? Math.floor(bill.credit / dailyBurn) : Infinity;
  const maxLine = Math.max(...cur.lineItems.map(l => l.amount), 0.0001);

  const setModel = async (model) => {
    if (model === bill.billingModel) return;
    setSavingModel(true);
    try { await billingApi.setModel(model); setBill({ ...bill, billingModel: model }); toast("Billing model updated", "success"); }
    catch (e) { toast(e.message, "error"); }
    finally { setSavingModel(false); }
  };
  const saveLimits = async () => {
    try {
      await billingApi.setLimits(limitsOn ? Number(cap) || 0 : 0, limitsOn ? Number(alert) || 0 : 0);
      toast("Spending limits saved", "success"); load();
    } catch (e) { toast(e.message, "error"); }
  };
  const makeDefault = async (id) => { try { await billingApi.makeDefault(id); load(); toast("Default updated", "success"); } catch (e) { toast(e.message, "error"); } };
  const removeMethod = async (id) => { try { await billingApi.removeMethod(id); load(); toast("Card removed", "success"); } catch (e) { toast(e.message, "error"); } };

  const activeModel = BILLING_MODELS.find(m => m.id === bill.billingModel) || BILLING_MODELS[0];

  return (
    <div>
      <div className="page-h">
        <div>
          <h1>Billing</h1>
          <div className="sub">Manage your billing model, payment methods, and invoices.</div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "overview", label: "Overview" },
        { id: "model",    label: "Billing model" },
        { id: "methods",  label: "Payment methods", count: bill.paymentMethods.length },
        { id: "invoices", label: "Invoices", count: bill.invoices.length },
        { id: "usage",    label: "Usage" },
      ]}/>

      {tab === "overview" && (
        <div className="g cols-12">
          <div style={{ gridColumn: "span 8" }}>
            <Card>
              <div className="row" style={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div className="card-title">CREDIT BALANCE</div>
                  <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6 }}>
                    {bMoney(bill.credit)}<span className="mute" style={{ fontSize: 16, fontWeight: 400, marginLeft: 6 }}>credit</span>
                  </div>
                  <div className="mute" style={{ fontSize: 12.5, marginTop: 4 }}>
                    {dailyBurn > 0 ? `Sufficient for ~${daysLeft} days at current burn rate` : "No active resources — credit is not being consumed"}
                  </div>
                </div>
                <Btn kind="primary" icon={<I.plus size={14}/>} onClick={() => setAddOpen(true)}>Top up</Btn>
              </div>
              <div className="divider"/>
              <div className="g cols-3">
                <KPI label="Accrued this month" value={bMoney(cur.mtd)}/>
                <KPI label="Daily burn" value={bMoney(dailyBurn)}/>
                <KPI label="Projected month" value={bMoney(cur.projected)}/>
              </div>
            </Card>

            <Card style={{ marginTop: 18 }} title={`Spend by resource · ${cur.period}`} action={<Btn kind="ghost sm" onClick={() => onGo("portal-vps-list")}>View all →</Btn>}>
              {cur.lineItems.length === 0 ? (
                <div className="mute" style={{ fontSize: 13, padding: "12px 0" }}>No active resources this period. Deploy a VM or container to start metering.</div>
              ) : (
                <div className="col" style={{ gap: 10 }}>
                  {cur.lineItems.slice().sort((a,b)=>b.amount-a.amount).map((r) => (
                    <div key={r.id}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                        <div className="row" style={{ gap: 10 }}>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</span>
                          <span className="mute" style={{ fontSize: 11.5 }}>{r.kind === "vm" ? "VM" : "Container"} · {r.plan_id}</span>
                        </div>
                        <span className="mono" style={{ fontSize: 13 }}>{bMoney(r.amount)}</span>
                      </div>
                      <Bar pct={Math.round((r.amount / maxLine) * 100)}/>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div style={{ gridColumn: "span 4" }}>
            <Card title="Active billing model">
              <div className="row" style={{ gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.bolt size={16}/>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{activeModel.title}</div>
                  <div className="mute" style={{ fontSize: 11.5 }}>{activeModel.when}</div>
                </div>
              </div>
              <Btn kind="ghost sm" onClick={() => setTab("model")}>Change billing model →</Btn>
            </Card>

            <Card style={{ marginTop: 16 }} title="Default payment">
              {bill.paymentMethods.length === 0 ? (
                <>
                  <div className="mute" style={{ fontSize: 12.5, marginBottom: 10 }}>No payment method on file.</div>
                  <Btn kind="primary" size="sm" icon={<I.plus size={12}/>} onClick={() => setAddOpen(true)}>Add card</Btn>
                </>
              ) : (
                <>
                  {bill.paymentMethods.filter(m => m.is_default).slice(0,1).map(m => (
                    <div key={m.id} className="card" style={{ background: "var(--surface-3)", padding: 16 }}>
                      <div className="row" style={{ gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "linear-gradient(135deg, #1A1F71, #f7b600)", color: "#fff" }}>{m.brand}</span>
                        <span className="mono" style={{ fontSize: 13 }}>···· ···· ···· {m.last4}</span>
                      </div>
                      <div className="mute" style={{ fontSize: 12 }}>{m.holder || "—"}{m.exp_month ? ` · expires ${String(m.exp_month).padStart(2,"0")}/${String(m.exp_year).slice(-2)}` : ""}</div>
                    </div>
                  ))}
                  <Btn kind="ghost sm" style={{ marginTop: 10 }} onClick={() => setTab("methods")}>Manage methods →</Btn>
                </>
              )}
            </Card>

            <Card style={{ marginTop: 16 }} title="Spending limits" action={<Toggle on={limitsOn} onChange={setLimitsOn}/>}>
              {limitsOn ? (
                <>
                  <Field label="Hard cap (monthly $)" hint="We'll shut down all resources when reached.">
                    <input className="input mono" placeholder="500" value={cap} onChange={e => setCap(e.target.value)}/>
                  </Field>
                  <Field label="Alert threshold ($)" hint="Email when reached." style={{ marginTop: 12 }}>
                    <input className="input mono" placeholder="400" value={alert} onChange={e => setAlert(e.target.value)}/>
                  </Field>
                  <Btn kind="primary" size="sm" style={{ marginTop: 12 }} onClick={saveLimits}>Save limits</Btn>
                </>
              ) : (
                <div className="mute" style={{ fontSize: 12.5 }}>No spending limits set. Toggle on to cap your monthly spend.</div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "model" && (
        <div>
          <div className="dim" style={{ fontSize: 13, marginBottom: 20, maxWidth: 640 }}>
            Pick how you'd like to be billed. Changes take effect at the start of the next billing cycle.
          </div>
          <div className="g cols-3">
            {BILLING_MODELS.map(m => (
              <BillingModelCard key={m.id} m={m} selected={bill.billingModel === m.id} onSelect={setModel}/>
            ))}
          </div>
          {savingModel && <div className="mute" style={{ fontSize: 12.5, marginTop: 16 }}>Saving…</div>}
        </div>
      )}

      {tab === "methods" && (
        <div className="g cols-12">
          <div style={{ gridColumn: "span 8" }}>
            <Card title="Saved payment methods" action={<Btn kind="primary" size="sm" icon={<I.plus size={12}/>} onClick={() => setAddOpen(true)}>Add method</Btn>}>
              {bill.paymentMethods.length === 0 ? (
                <div className="mute" style={{ fontSize: 13, padding: "20px 0", textAlign: "center" }}>No payment methods yet. Add a card to get started.</div>
              ) : (
                <div className="col" style={{ gap: 12 }}>
                  {bill.paymentMethods.map(m => (
                    <div key={m.id} className="card row" style={{ padding: 16, gap: 14, background: "var(--surface-3)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 9px", borderRadius: 5, background: "linear-gradient(135deg, #1A1F71, #f7b600)", color: "#fff" }}>{m.brand}</span>
                      <div className="col" style={{ gap: 2, flex: 1 }}>
                        <span className="mono" style={{ fontSize: 13 }}>···· {m.last4}</span>
                        <span className="mute" style={{ fontSize: 11.5 }}>{m.exp_month ? `expires ${String(m.exp_month).padStart(2,"0")}/${String(m.exp_year).slice(-2)}` : "—"}{m.holder ? ` · ${m.holder}` : ""}</span>
                      </div>
                      {m.is_default
                        ? <Pill kind="accent">Default</Pill>
                        : <Btn kind="ghost sm" onClick={() => makeDefault(m.id)}>Make default</Btn>}
                      <Btn kind="ghost icon sm" icon={<I.x size={14}/>} onClick={() => removeMethod(m.id)}/>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <div style={{ gridColumn: "span 4" }}>
            <Card title="Secure by design">
              <div className="dim" style={{ fontSize: 13, lineHeight: 1.55 }}>
                Card details are tokenized and never stored on our servers. We keep only the brand and last four digits for display.
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        bill.invoices.length === 0 ? (
          <Card><div className="mute" style={{ fontSize: 13, padding: "20px 4px", textAlign: "center" }}>No invoices yet. Your first invoice will be generated at the end of this billing cycle.</div></Card>
        ) : (
          <Card pad={false}>
            <table className="tbl">
              <thead><tr><th style={{ paddingLeft: 22 }}>Invoice</th><th>Period</th><th>Amount</th><th>Status</th><th>Issued</th><th style={{ paddingRight: 22 }}></th></tr></thead>
              <tbody>
                {bill.invoices.map(inv => (
                  <tr key={inv.number}>
                    <td style={{ paddingLeft: 22 }} className="mono">{inv.number}</td>
                    <td>{inv.period}</td>
                    <td className="mono">{bMoney(inv.amount)}</td>
                    <td><Pill kind="good" dot>Paid</Pill></td>
                    <td className="mute">{inv.issued}</td>
                    <td style={{ paddingRight: 22, textAlign: "right" }}><Btn kind="ghost sm" icon={<I.download size={12}/>}>PDF</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}

      {tab === "usage" && (
        <Card title={`Usage breakdown · ${cur.period}`}>
          {cur.lineItems.length === 0 ? (
            <div className="mute" style={{ fontSize: 13, padding: "12px 0" }}>No metered usage yet this cycle.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Resource</th><th>Type</th><th>Hours</th><th>Rate</th><th>Subtotal</th></tr></thead>
              <tbody>
                {cur.lineItems.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.name}</td>
                    <td className="mute">{r.kind === "vm" ? "VM" : "Container"} · {r.plan_id}</td>
                    <td className="mono">{r.hours.toLocaleString()}</td>
                    <td className="mono mute" style={{ fontSize: 12 }}>{bMoney(r.hourly_rate, 4)}/hr</td>
                    <td className="mono">{bMoney(r.amount)}</td>
                  </tr>
                ))}
                <tr style={{ background: "var(--surface-3)" }}>
                  <td colSpan="4" style={{ fontWeight: 600, textAlign: "right", paddingRight: 18 }}>Total accrued</td>
                  <td className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{bMoney(cur.mtd)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </Card>
      )}

      <AddCardModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={load}/>
    </div>
  );
}

export { PageBilling }
