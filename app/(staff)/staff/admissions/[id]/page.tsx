"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell, { useMe } from "@/components/PortalShell";
import DischargeSheet from "@/components/DischargeSheet";
import { Card, ErrorBox, Field, Pill, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { PAY_STATUS, errMsg, fmtDateTime, fmtKes, owed, todayLocal } from "@/lib/format";
import { Back } from "@/components/Icon";

const btn = "px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60";

function Detail() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const canBill = ["billing_officer", "receptionist", "admin"].includes(me.role);

  const [data, setData] = useState<any>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);

  const [wards, setWards] = useState<string[]>([]);
  useEffect(() => { staffApi.catalog().then(({ data: res }) => setWards(res.data?.ward ?? [])).catch(() => {}); }, []);
  const [ward, setWard] = useState("");
  const [bed, setBed] = useState("");
  const [form, setForm] = useState({ finalDiagnosis: "", treatmentGiven: "", conditionOnDischarge: "", followUpInstructions: "", followUpDate: "" });
  const prefilled = useRef(false);

  const load = useCallback(() => {
    staffApi.admission(id).then(({ data: res }) => {
      const d = res.data;
      setData(d); setLoadError("");
      setWard(d.admission.ward ?? ""); setBed(d.admission.bedNumber ?? "");
      // Start the discharge form from the doctor's consultation notes, once.
      if (d.prefill && !prefilled.current) {
        setForm((f) => ({ ...f, finalDiagnosis: f.finalDiagnosis || d.prefill.finalDiagnosis || "", treatmentGiven: f.treatmentGiven || d.prefill.treatmentGiven || "" }));
        prefilled.current = true;
      }
    }).catch((err) => setLoadError(errMsg(err, "Couldn't load this admission.")));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (loadError) return <ErrorBox>{loadError}</ErrorBox>;
  if (!data) return <Spinner label="Loading admission..." />;

  const { admission: a, patient, bills, summary } = data;
  const admitted = a.admissionStatus === "admitted";
  const stillOwed = bills.reduce((s: number, b: any) => s + owed(b), 0);

  const saveBed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setFlash(""); setBusy(true);
    try { await staffApi.updateBed(id, { ward: ward.trim(), bedNumber: bed.trim() || undefined }); setFlash("Bed updated."); load(); }
    catch (err) { setError(errMsg(err, "Couldn't update the bed.")); }
    setBusy(false);
  };

  const discharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setFlash("");
    if (!form.finalDiagnosis.trim()) return setError("Enter the final diagnosis.");
    if (!form.treatmentGiven.trim()) return setError("Describe the treatment given.");
    if (!form.conditionOnDischarge) return setError("Choose the patient's condition on discharge.");
    if (form.followUpDate && form.followUpDate < todayLocal()) return setError("The follow-up date can't be in the past.");
    const warn = stillOwed > 0 ? ` They still owe ${fmtKes(stillOwed)}; that stays with the billing desk and does not delay discharge.` : "";
    if (!window.confirm(`Discharge this patient?${warn}`)) return;
    setBusy(true);
    try {
      await staffApi.discharge(id, {
        finalDiagnosis: form.finalDiagnosis.trim(), treatmentGiven: form.treatmentGiven.trim(), conditionOnDischarge: form.conditionOnDischarge,
        followUpInstructions: form.followUpInstructions.trim() || undefined, followUpDate: form.followUpDate || null,
      });
      setFlash("Patient discharged.");
      load();
    } catch (err) { setError(errMsg(err, "Couldn't discharge the patient.")); }
    setBusy(false);
  };

  const billing = (
    <Card className="no-print">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Bill for this stay</h2>
      {bills.length === 0 ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>No invoice raised yet.</p> : (
        <ul className="space-y-2 mb-3">
          {bills.map((b: any) => (
            <li key={b.id} className="flex justify-between items-center gap-3 text-sm" style={{ color: "var(--navy)" }}>
              {canBill ? <Link href={`/staff/billing/${b.id}`} className="font-semibold" style={{ color: "var(--teal)" }}>{b.invoiceNumber}</Link> : <span className="font-semibold">{b.invoiceNumber}</span>}
              <span>{fmtKes(b.totalAmount)}</span>
              <Pill tone={PAY_STATUS[b.paymentStatus].tone}>{PAY_STATUS[b.paymentStatus].label}</Pill>
            </li>
          ))}
        </ul>
      )}
      {stillOwed > 0 && <p className="text-sm font-semibold mb-3" style={{ color: "var(--danger)" }}>{fmtKes(stillOwed)} still owed</p>}
      {canBill && <Link href={`/staff/billing/new?patientId=${patient.id}&visitId=${a.visitId}`} className={`${btn} inline-block`} style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>Raise an invoice for this stay</Link>}
    </Card>
  );

  return (
    <>
      <div className="no-print">
        <Link href="/staff/admissions" className="text-sm" style={{ color: "var(--teal)" }}><Back />Admissions</Link>
        {error && <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>}
        {flash && <div className="mt-4"><SuccessBox>{flash}</SuccessBox></div>}
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3 mt-4 mb-6 no-print">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--navy)" }}>{patient.firstName} {patient.lastName}</h2>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>{patient.patientNumber} · {data.department} · admitted by {data.admittedByName} on {fmtDateTime(a.admittedAt)}</p>
          {patient.allergies && <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>Allergies: {patient.allergies}</p>}
        </div>
        <Pill tone={admitted ? "warn" : "ok"}>{admitted ? "Admitted" : "Discharged"}</Pill>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {!admitted && summary && (
            <>
              <DischargeSheet patient={patient} dischargedBy={data.dischargedByName}
                stay={{ ward: a.ward, bedNumber: a.bedNumber, department: data.department, admittedAt: a.admittedAt, dischargedAt: a.dischargedAt }} summary={summary} />
              <button onClick={() => window.print()} className={`${btn} no-print`} style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Print discharge summary</button>
            </>
          )}
          {!admitted && !summary && (
            <Card><p className="text-sm" style={{ color: "var(--grey-500)" }}>
              {data.hasSummary ? "The discharge summary is clinical and is only shown to the treating team." : "No discharge summary on file."}
            </p></Card>
          )}

          {admitted && data.canDischarge && (
            <Card className="no-print">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Discharge</h2>
              <form onSubmit={discharge} className="space-y-4">
                <Field label="Final diagnosis" htmlFor="d-diag"><textarea id="d-diag" rows={2} value={form.finalDiagnosis} onChange={(e) => setForm({ ...form, finalDiagnosis: e.target.value })} className={inputCls} style={inputStyle} maxLength={5000} /></Field>
                <Field label="Treatment given" htmlFor="d-tx"><textarea id="d-tx" rows={4} value={form.treatmentGiven} onChange={(e) => setForm({ ...form, treatmentGiven: e.target.value })} className={inputCls} style={inputStyle} maxLength={10000} /></Field>
                <Field label="Condition on discharge" htmlFor="d-cond">
                  <select id="d-cond" value={form.conditionOnDischarge} onChange={(e) => setForm({ ...form, conditionOnDischarge: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="">Choose…</option>
                    {data.conditions.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Follow-up instructions (optional)" htmlFor="d-fu" hint="Medicines to continue, warning signs, wound care, diet…"><textarea id="d-fu" rows={3} value={form.followUpInstructions} onChange={(e) => setForm({ ...form, followUpInstructions: e.target.value })} className={inputCls} style={inputStyle} maxLength={5000} /></Field>
                <Field label="Follow-up date (optional)" htmlFor="d-date"><input id="d-date" type="date" min={todayLocal()} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className={inputCls} style={inputStyle} /></Field>
                <button type="submit" disabled={busy} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Working..." : "Discharge patient"}</button>
              </form>
            </Card>
          )}
          {admitted && !data.canDischarge && me.role === "doctor" && (
            <Card className="no-print"><p className="text-sm" style={{ color: "var(--grey-500)" }}>Only the admitting doctor can discharge this patient, or a doctor they have shared the record with.</p></Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          {data.canEditBed && (
            <Card className="no-print">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Ward and bed</h2>
              <form onSubmit={saveBed} className="space-y-3">
                <input aria-label="Ward" list="wards" value={ward} onChange={(e) => setWard(e.target.value)} className={inputCls} style={inputStyle} maxLength={100} />
                <datalist id="wards">{wards.map((w) => <option key={w} value={w} />)}</datalist>
                <input aria-label="Bed number" value={bed} onChange={(e) => setBed(e.target.value)} className={inputCls} style={inputStyle} placeholder="Bed number" maxLength={20} />
                <button type="submit" disabled={busy || !ward.trim()} className={btn} style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Move patient</button>
              </form>
            </Card>
          )}
          {!data.canEditBed && <Card className="no-print"><div className="text-sm" style={{ color: "var(--navy)" }}>{a.ward}{a.bedNumber ? ` · Bed ${a.bedNumber}` : ""}</div></Card>}
          {billing}
        </div>
      </div>
    </>
  );
}

export default function AdmissionPage() {
  return (
    <PortalShell audience="staff" title={<>Admission <em className="italic" style={{ color: "var(--teal)" }}>Details</em></>}>
      <Detail />
    </PortalShell>
  );
}
