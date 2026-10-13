"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell, { useMe } from "@/components/PortalShell";
import InvoiceSheet from "@/components/InvoiceSheet";
import { Card, ErrorBox, Field, Pill, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { CLAIM_SCHEMES, INSURANCE, errMsg, fmtDate, fmtKes, insuranceLabel, owed } from "@/lib/format";

const btn = "px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60";
const primary = { background: "var(--teal)", color: "white" };
const quiet = { background: "var(--grey-200)", color: "var(--navy)" };
const CLAIM_TONE: Record<string, "ok" | "warn" | "muted" | "danger"> = { submitted: "warn", approved: "ok", paid: "ok", rejected: "danger" };

function Detail() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const canWaive = me.role === "billing_officer" || me.role === "admin";
  const keys = useRef(1);

  const [inv, setInv] = useState<any>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [ref, setRef] = useState("");
  const [extra, setExtra] = useState<{ key: number; description: string; quantity: string; unitPrice: string }[]>([]);
  const [claim, setClaim] = useState({ scheme: "sha", claimNumber: "", amount: "" });
  const [claimPay, setClaimPay] = useState<Record<string, string>>({}); // claim id → amount received

  const load = useCallback(() => {
    billingApi.getById(id)
      .then(({ data }) => { setInv(data.data); setLoadError(""); })
      .catch((err) => setLoadError(errMsg(err, "Couldn't load this invoice.")));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setError(""); setFlash(""); setBusy(true);
    try { await fn(); setFlash(ok); after?.(); load(); } catch (err) { setError(errMsg(err, "That didn't work. Please try again.")); }
    setBusy(false);
  };

  if (loadError) return <ErrorBox>{loadError}</ErrorBox>;
  if (!inv) return <Spinner label="Loading invoice..." />;

  const due = owed(inv);
  const open = inv.paymentStatus !== "waived";
  const num = (v: string) => Number(v);

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    const a = num(amount);
    if (!(a > 0)) return setError("Enter the amount received.");
    run(() => billingApi.recordPayment(id, { amount: a, paymentMethod: method, referenceNumber: ref.trim() || undefined }), "Payment recorded.", () => { setAmount(""); setRef(""); });
  };

  const addCharges = (e: React.FormEvent) => {
    e.preventDefault();
    const items: { description: string; quantity: number; unitPrice: number }[] = [];
    for (const l of extra) {
      if (!l.description.trim()) return setError("Every added charge needs a description.");
      const q = Number(l.quantity), p = Number(l.unitPrice);
      if (!Number.isInteger(q) || q < 1) return setError("Quantity must be a whole number, 1 or more.");
      if (l.unitPrice.trim() === "" || !(p >= 0)) return setError(`Enter a price for "${l.description}".`);
      items.push({ description: l.description.trim(), quantity: q, unitPrice: p });
    }
    if (!items.length) return;
    run(() => billingApi.addItems(id, items), "Charges added.", () => setExtra([]));
  };

  const waive = () => {
    const reason = window.prompt(`Waive the remaining ${fmtKes(due)}? Give a reason (kept on the invoice and in the audit log):`);
    if (reason === null) return;
    run(() => billingApi.waive(id, reason), "Invoice waived.");
  };

  const submitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const a = num(claim.amount);
    if (!(a > 0)) return setError("Enter the amount you are claiming.");
    run(() => billingApi.createClaim(id, { scheme: claim.scheme, claimNumber: claim.claimNumber.trim() || undefined, claimAmount: a }), "Claim recorded.", () => setClaim({ scheme: claim.scheme, claimNumber: "", amount: "" }));
  };

  return (
    <>
      <div className="no-print">
        <Link href="/staff/billing" className="text-sm" style={{ color: "var(--teal)" }}>← All invoices</Link>
        {error && <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>}
        {flash && <div className="mt-4"><SuccessBox>{flash}</SuccessBox></div>}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mt-4">
        <div className="lg:col-span-3">
          <InvoiceSheet inv={inv} />
          <div className="no-print mt-4 flex gap-2 flex-wrap">
            <button onClick={() => window.print()} className={btn} style={quiet}>Print invoice / receipt</button>
            <Link href={`/staff/patients/${inv.patientId}`} className={btn} style={quiet}>Patient file</Link>
            {inv.visitId && <Link href={`/staff/billing/new?patientId=${inv.patientId}&visitId=${inv.visitId}`} className={btn} style={quiet}>Another invoice for this visit</Link>}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5 no-print">
          {open && due > 0 && (
            <Card>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Record a payment</h2>
              <form onSubmit={pay} className="space-y-3">
                <Field label={`Amount (KES) · ${fmtKes(due)} due`} htmlFor="pay-amount">
                  <div className="flex gap-2">
                    <input id="pay-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} style={inputStyle} inputMode="decimal" />
                    <button type="button" onClick={() => setAmount(String(due))} className="px-3 rounded-lg text-xs font-semibold shrink-0" style={quiet}>Full</button>
                  </div>
                </Field>
                <Field label="Method" htmlFor="pay-method">
                  <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls} style={inputStyle}>
                    {INSURANCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Reference (M-Pesa code, receipt no.)" htmlFor="pay-ref">
                  <input id="pay-ref" value={ref} onChange={(e) => setRef(e.target.value)} className={inputCls} style={inputStyle} maxLength={100} />
                </Field>
                <button type="submit" disabled={busy} className={btn} style={primary}>Record payment</button>
              </form>
            </Card>
          )}

          {open && (
            <Card>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Add charges</h2>
              <form onSubmit={addCharges} className="space-y-2">
                {extra.map((l) => (
                  <div key={l.key} className="grid grid-cols-12 gap-2">
                    <input aria-label="Description" value={l.description} onChange={(e) => setExtra((x) => x.map((y) => y.key === l.key ? { ...y, description: e.target.value } : y))} className={`${inputCls} col-span-12`} style={inputStyle} placeholder="Description" maxLength={300} />
                    <input aria-label="Quantity" value={l.quantity} onChange={(e) => setExtra((x) => x.map((y) => y.key === l.key ? { ...y, quantity: e.target.value } : y))} className={`${inputCls} col-span-4`} style={inputStyle} inputMode="numeric" placeholder="Qty" />
                    <input aria-label="Unit price" value={l.unitPrice} onChange={(e) => setExtra((x) => x.map((y) => y.key === l.key ? { ...y, unitPrice: e.target.value } : y))} className={`${inputCls} col-span-6`} style={inputStyle} inputMode="decimal" placeholder="Unit price" />
                    <button type="button" aria-label="Remove" onClick={() => setExtra((x) => x.filter((y) => y.key !== l.key))} className="col-span-2 text-sm" style={{ color: "var(--danger)" }}>✕</button>
                  </div>
                ))}
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setExtra((x) => [...x, { key: keys.current++, description: "", quantity: "1", unitPrice: "" }])} className={btn} style={quiet}>+ Charge line</button>
                  {extra.length > 0 && <button type="submit" disabled={busy} className={btn} style={primary}>Add to invoice</button>}
                </div>
              </form>
            </Card>
          )}

          <Card>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Insurance claims</h2>
            {inv.claims.length === 0 && <p className="text-xs mb-3" style={{ color: "var(--grey-500)" }}>No claims on this invoice.</p>}
            <div className="space-y-3 mb-3">
              {inv.claims.map((c: any) => (
                <div key={c.id} className="p-3 rounded-lg" style={{ background: "var(--grey-100)" }}>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{insuranceLabel(c.scheme)} · {fmtKes(c.claimAmount)}</span>
                    <Pill tone={CLAIM_TONE[c.status] ?? "muted"}>{c.status}</Pill>
                  </div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>{c.claimNumber ? `${c.claimNumber} · ` : ""}Submitted {fmtDate(String(c.submittedAt).slice(0, 10))}{c.approvedAmount ? ` · approved ${fmtKes(c.approvedAmount)}` : ""}</div>
                  {c.notes && <div className="text-xs mt-1" style={{ color: "var(--grey-500)" }}>{c.notes}</div>}
                  {(c.status === "submitted" || c.status === "approved") && (
                    <div className="flex gap-2 flex-wrap mt-2 items-center">
                      {c.status === "submitted" && <button disabled={busy} className={`${btn} !py-1.5 !px-3 !text-xs`} style={quiet} onClick={() => {
                        const v = window.prompt("Amount the insurer approved (KES):", c.claimAmount);
                        if (v !== null) run(() => billingApi.resolveClaim(c.id, { status: "approved", approvedAmount: Number(v) }), "Claim approved.");
                      }}>Approved</button>}
                      <input aria-label="Amount received" value={claimPay[c.id] ?? ""} onChange={(e) => setClaimPay((m) => ({ ...m, [c.id]: e.target.value }))} placeholder="Received (KES)" inputMode="decimal" className="w-28 px-2 py-1.5 rounded-lg border text-xs" style={inputStyle} />
                      <button disabled={busy} className={`${btn} !py-1.5 !px-3 !text-xs`} style={primary} onClick={() => run(() => billingApi.resolveClaim(c.id, { status: "paid", amountReceived: Number(claimPay[c.id]) }), "Insurer payment recorded on the invoice.")}>Mark paid</button>
                      <button disabled={busy} className={`${btn} !py-1.5 !px-3 !text-xs`} style={{ background: "#fde8e8", color: "var(--danger)" }} onClick={() => {
                        const v = window.prompt("Why was it rejected?");
                        if (v) run(() => billingApi.resolveClaim(c.id, { status: "rejected", notes: v }), "Claim rejected. The balance is back with the patient.");
                      }}>Rejected</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {open && due > 0 && (
              <form onSubmit={submitClaim} className="grid grid-cols-2 gap-2">
                <select aria-label="Scheme" value={claim.scheme} onChange={(e) => setClaim({ ...claim, scheme: e.target.value })} className={inputCls} style={inputStyle}>
                  {CLAIM_SCHEMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input aria-label="Claim amount" value={claim.amount} onChange={(e) => setClaim({ ...claim, amount: e.target.value })} className={inputCls} style={inputStyle} placeholder="Amount (KES)" inputMode="decimal" />
                <input aria-label="Claim number" value={claim.claimNumber} onChange={(e) => setClaim({ ...claim, claimNumber: e.target.value })} className={`${inputCls} col-span-2`} style={inputStyle} placeholder="Claim / pre-auth number (optional)" maxLength={100} />
                <button type="submit" disabled={busy} className={`${btn} col-span-2`} style={quiet}>Submit a claim</button>
              </form>
            )}
          </Card>

          {canWaive && open && due > 0 && (
            <button onClick={waive} disabled={busy} className={`${btn} w-full`} style={{ background: "#fde8e8", color: "var(--danger)" }}>Waive the remaining {fmtKes(due)}</button>
          )}
        </div>
      </div>
    </>
  );
}

export default function InvoicePage() {
  return (
    <PortalShell audience="staff" title={<>Invoice <em className="italic" style={{ color: "var(--teal)" }}>Details</em></>}>
      <Detail />
    </PortalShell>
  );
}
