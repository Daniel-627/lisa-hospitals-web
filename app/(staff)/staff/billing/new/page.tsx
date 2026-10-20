"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import PatientPicker, { type PickedPatient } from "@/components/PatientPicker";
import PricePicker, { type PriceItem } from "@/components/PricePicker";
import { Card, ErrorBox, Field, Spinner, inputCls, inputStyle } from "@/components/ui";
import { billingApi, staffApi } from "@/lib/api";
import { errMsg, fmtKes } from "@/lib/format";
import { Icon } from "@/components/Icon";

type Line = { key: number; description: string; quantity: string; unitPrice: string };

function NewInvoice() {
  const router = useRouter();
  const sp = useSearchParams();
  const prePatient = sp.get("patientId");
  const visitId = sp.get("visitId") ?? undefined;
  const keys = useRef(2);

  const [patient, setPatient] = useState<PickedPatient | null>(null);
  const [lines, setLines] = useState<Line[]>([{ key: 1, description: "", quantity: "1", unitPrice: "" }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!prePatient) return;
    staffApi.getPatientById(prePatient)
      .then(({ data }) => setPatient({ id: data.data.id, name: `${data.data.firstName} ${data.data.lastName}`, number: data.data.patientNumber }))
      .catch((err) => { const p = err.response?.data?.patient; if (p) setPatient({ id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.patientNumber }); });
  }, [prePatient]);

  // Arriving from a visit/admission: offer the doctor's consultation fee as a starting line.
  useEffect(() => {
    if (!visitId) return;
    billingApi.suggest(visitId).then(({ data }) => {
      const items = data.data.items as { description: string; quantity: number; unitPrice: string }[];
      if (items.length) setLines(items.map((i) => ({ key: keys.current++, description: i.description, quantity: String(i.quantity), unitPrice: String(Number(i.unitPrice)) })));
      if (!prePatient && data.data.patientId) {
        staffApi.getPatientById(data.data.patientId).then(({ data: d }) => setPatient({ id: d.data.id, name: `${d.data.firstName} ${d.data.lastName}`, number: d.data.patientNumber })).catch(() => {});
      }
    }).catch(() => {});
  }, [visitId, prePatient]);

  const set = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  // Add a priced item as a new line; an untouched blank first row is reused rather than left empty.
  const pick = (p: PriceItem) => setLines((ls) => {
    const line = { key: keys.current++, description: p.name, quantity: "1", unitPrice: String(Number(p.unitPrice)) };
    const blank = ls.length === 1 && !ls[0].description.trim() && !ls[0].unitPrice;
    return blank ? [line] : [...ls, line];
  });
  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!patient) return setError("Choose a patient first.");
    const items: { description: string; quantity: number; unitPrice: number }[] = [];
    for (const l of lines) {
      if (!l.description.trim() && !l.unitPrice) continue; // ignore blank rows
      const qty = Number(l.quantity), price = Number(l.unitPrice);
      if (!l.description.trim()) return setError("Every charge needs a description.");
      if (!Number.isInteger(qty) || qty < 1) return setError("Quantity must be a whole number, 1 or more.");
      if (!Number.isFinite(price) || price < 0 || l.unitPrice.trim() === "") return setError(`Enter a price for "${l.description}".`);
      items.push({ description: l.description.trim(), quantity: qty, unitPrice: price });
    }
    if (items.length === 0) return setError("Add at least one charge.");
    setSaving(true);
    try {
      const { data } = await billingApi.createInvoice({ patientId: patient.id, visitId, notes: notes.trim() || undefined, items });
      router.push(`/staff/billing/${data.data.id}`);
    } catch (err) {
      setError(errMsg(err, "Couldn't create the invoice."));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      {error && <ErrorBox>{error}</ErrorBox>}
      <Card>
        <Field label="Patient" htmlFor="pp-search"><PatientPicker value={patient} onChange={setPatient} /></Field>
        {visitId && <p className="text-xs mt-2" style={{ color: "var(--grey-400)" }}>This invoice will be linked to the patient&apos;s visit, so it shows on their admission.</p>}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Price list</h2>
        <PricePicker onPick={pick} />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Charges</h2>
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div key={l.key} className="grid grid-cols-12 gap-2 items-start">
              <input aria-label={`Description ${i + 1}`} value={l.description} onChange={(e) => set(l.key, { description: e.target.value })} className={`${inputCls} col-span-12 sm:col-span-6`} style={inputStyle} placeholder="e.g. Ward bed (per day), X-ray, Panadol" maxLength={300} />
              <input aria-label={`Quantity ${i + 1}`} value={l.quantity} onChange={(e) => set(l.key, { quantity: e.target.value })} className={`${inputCls} col-span-4 sm:col-span-2`} style={inputStyle} inputMode="numeric" placeholder="Qty" />
              <input aria-label={`Unit price ${i + 1}`} value={l.unitPrice} onChange={(e) => set(l.key, { unitPrice: e.target.value })} className={`${inputCls} col-span-6 sm:col-span-3`} style={inputStyle} inputMode="decimal" placeholder="Unit price (KES)" />
              <button type="button" aria-label={`Remove charge ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="col-span-2 sm:col-span-1 py-3 text-sm disabled:opacity-30" style={{ color: "var(--danger)" }}><Icon name="close" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLines((ls) => [...ls, { key: keys.current++, description: "", quantity: "1", unitPrice: "" }])} className="mt-4 text-sm font-semibold" style={{ color: "var(--teal)" }}>+ Add a charge</button>
        <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: "var(--grey-200)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Total</span>
          <span className="text-lg font-bold" style={{ color: "var(--navy)" }}>{fmtKes(total)}</span>
        </div>
      </Card>

      <Card>
        <Field label="Notes (optional)" htmlFor="inv-notes">
          <textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} className={inputCls} style={inputStyle} />
        </Field>
      </Card>

      <button type="submit" disabled={saving} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{saving ? "Creating..." : "Create invoice"}</button>
    </form>
  );
}

export default function NewInvoicePage() {
  return (
    <PortalShell audience="staff" title={<>New <em className="italic" style={{ color: "var(--teal)" }}>Invoice</em></>} subtitle="Raise charges for a patient">
      <Suspense fallback={<Spinner />}><NewInvoice /></Suspense>
    </PortalShell>
  );
}
