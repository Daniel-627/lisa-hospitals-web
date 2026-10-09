"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Pill, Spinner, SuccessBox, UrgencyPill, inputCls, inputStyle } from "@/components/ui";
import { departmentsApi, staffApi } from "@/lib/api";
import { errMsg, fmtDate, fmtDateTime, todayLocal } from "@/lib/format";

type Rx = { key: number; drugName: string; dosage: string; frequency: string; duration: string; instructions: string };

const ageOf = (dob?: string) => (dob ? `${new Date().getFullYear() - Number(dob.slice(0, 4))} years` : "");
const allergyTokens = (a?: string | null) => (a ?? "").split(/[,;\n/]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length >= 3);
const allergyHit = (drug: string, tokens: string[]) => {
  const d = drug.trim().toLowerCase();
  return d.length >= 3 ? tokens.find((t) => d.includes(t) || t.includes(d)) ?? null : null;
};

function Consultation() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const keys = useRef(1);

  const [version, setVersion] = useState(0);
  const [data, setData] = useState<any>(null);
  const [depts, setDepts] = useState<any[]>([]);
  const [loadError, setLoadError] = useState("");

  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icd, setIcd] = useState("");
  const [plan, setPlan] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [referral, setReferral] = useState("");
  const [rx, setRx] = useState<Rx[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    departmentsApi.getAll().then(({ data: res }) => setDepts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    staffApi.consultation(id)
      .then(({ data: res }) => {
        if (cancelled) return;
        const d = res.data;
        setData(d);
        const c = d.consultation;
        setNotes(c?.clinicalNotes ?? ""); setDiagnosis(c?.diagnosis ?? ""); setIcd(c?.icdCode ?? "");
        setPlan(c?.treatmentPlan ?? ""); setFollowUp(c?.followUpDate ?? ""); setReferral(c?.referredTo ?? "");
        setRx(d.prescriptions.filter((m: any) => !m.isDispensed).map((m: any) => ({
          key: keys.current++, drugName: m.drugName, dosage: m.dosage, frequency: m.frequency, duration: m.duration, instructions: m.instructions ?? "",
        })));
      })
      .catch((err) => { if (!cancelled) setLoadError(err.response?.status === 403 ? (err.response.data?.error ?? "You can't open this consultation.") : errMsg(err, "Couldn't load this consultation.")); });
    return () => { cancelled = true; };
  }, [id, version]);

  const back = <Link href="/staff/queue" className="text-sm" style={{ color: "var(--teal)" }}>← Back to the queue</Link>;
  if (loadError) return <>{back}<div className="mt-4"><ErrorBox>{loadError}</ErrorBox></div></>;
  if (!data) return <Spinner label="Loading consultation..." />;

  const { patient, visit, triage, history, canEdit } = data;
  const locked = data.prescriptions.filter((m: any) => m.isDispensed);
  const tokens = allergyTokens(patient.allergies);

  const setRow = (key: number, patch: Partial<Rx>) => setRx(rx.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () => setRx([...rx, { key: keys.current++, drugName: "", dosage: "", frequency: "", duration: "", instructions: "" }]);

  const save = async (complete: boolean) => {
    setError(""); setFlash("");
    const rows = rx.filter((r) => r.drugName.trim() || r.dosage.trim() || r.frequency.trim() || r.duration.trim());
    if (rows.some((r) => !r.drugName.trim() || !r.dosage.trim() || !r.frequency.trim() || !r.duration.trim())) {
      return setError("Each medicine needs a name, dosage, frequency and duration.");
    }
    if (complete) {
      if (!diagnosis.trim() && !notes.trim()) return setError("Add a diagnosis or clinical notes before completing the visit.");
      const refName = depts.find((d) => d.id === referral)?.name;
      if (!window.confirm(refName ? `Complete this visit and send the patient to ${refName}?` : "Complete this visit?")) return;
    }
    setSaving(true);
    try {
      await staffApi.saveConsultation(id, {
        clinicalNotes: notes, diagnosis, icdCode: icd, treatmentPlan: plan,
        followUpDate: followUp || null, referredTo: referral || null,
        prescriptions: rows.map(({ key, ...m }) => ({ ...m, instructions: m.instructions.trim() || undefined })),
        complete,
      });
      if (complete) { router.push("/staff/queue"); return; }
      setFlash("Saved.");
      setVersion((v) => v + 1);
    } catch (err) {
      setError(errMsg(err, "Couldn't save the consultation."));
    } finally {
      setSaving(false);
    }
  };

  const pickUp = async () => {
    setError("");
    try { await staffApi.pickUp(id); setVersion((v) => v + 1); } catch (err) { setError(errMsg(err, "Couldn't pick up this patient.")); }
  };

  const status = visit.status as string;
  const banner =
    canEdit ? null
    : status === "waiting" || status === "triaged" ? "Pick up this patient to start the consultation."
    : status === "in_triage" ? "This patient is still in triage."
    : status === "in_progress" ? "This patient is with another doctor. You can read the record but not edit it."
    : "This visit is complete. You are viewing the saved consultation.";

  const dis = !canEdit;
  const vit = (label: string, value?: string | number | null, unit = "") =>
    value != null && value !== "" ? <div><div className="text-xs" style={{ color: "var(--grey-400)" }}>{label}</div><div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{value}{unit}</div></div> : null;

  return (
    <>
      {back}
      <div className="mt-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--navy)" }}>#{visit.queueNumber} · {patient.firstName} {patient.lastName}</h2>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>
            {[ageOf(patient.dateOfBirth), patient.gender, patient.patientNumber, patient.bloodGroup ? `Blood group ${patient.bloodGroup}` : "", visit.department].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Link href={`/staff/patients/${patient.id}`} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Full patient file</Link>
      </div>

      {patient.allergies && <div className="mb-6 p-3 rounded-lg text-sm font-medium" style={{ background: "#fde8e8", color: "var(--danger)" }}>⚠ Allergies: {patient.allergies}</div>}
      {banner && (
        <div className="mb-6 p-3 rounded-lg text-sm flex items-center justify-between gap-3 flex-wrap" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>
          <span>{banner}</span>
          {(status === "waiting" || status === "triaged") && <button onClick={pickUp} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--teal)" }}>Pick up</button>}
        </div>
      )}
      {error && <ErrorBox>{error}</ErrorBox>}
      {flash && <SuccessBox>{flash}</SuccessBox>}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: what the nurse found, and the patient's history ── */}
        <div className="space-y-6">
          <Card className="space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Triage</h3><UrgencyPill level={triage?.urgencyLevel} /></div>
            {triage ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {vit("Temperature", triage.temperature ? Number(triage.temperature) : null, " °C")}
                  {vit("Blood pressure", triage.bloodPressure)}
                  {vit("Pulse", triage.pulseRate, " bpm")}
                  {vit("Oxygen", triage.oxygenSaturation ? Number(triage.oxygenSaturation) : null, " %")}
                  {vit("Weight", triage.weight ? Number(triage.weight) : null, " kg")}
                  {vit("Height", triage.height ? Number(triage.height) : null, " cm")}
                </div>
                {triage.chiefComplaint && <p className="text-sm" style={{ color: "var(--navy)" }}><span style={{ color: "var(--grey-400)" }}>Complaint: </span>{triage.chiefComplaint}</p>}
              </>
            ) : <p className="text-sm" style={{ color: "var(--grey-500)" }}>{visit.reason ? `Not triaged. Reason at check-in: ${visit.reason}` : "Not triaged."}</p>}
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Previous visits</h3>
            {history.length === 0 ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>No earlier consultations on record.</p> : history.map((h: any) => (
              <div key={h.id} className="text-sm border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: "var(--grey-100)" }}>
                <div className="font-semibold" style={{ color: "var(--navy)" }}>{h.diagnosis || "No diagnosis recorded"}</div>
                <div className="text-xs" style={{ color: "var(--grey-500)" }}>{fmtDate(String(h.date).slice(0, 10))} · {h.doctor} · {h.department}</div>
                {h.medicines.length > 0 && <div className="text-xs mt-1" style={{ color: "var(--grey-500)" }}>Medicines: {h.medicines.map((m: any) => m.drugName).join(", ")}</div>}
                {h.clinicalNotes && <details className="mt-1"><summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--teal)" }}>Notes</summary><p className="text-xs mt-1 whitespace-pre-line" style={{ color: "var(--navy)" }}>{h.clinicalNotes}</p></details>}
              </div>
            ))}
          </Card>
        </div>

        {/* ── Right: the doctor's write-up ── */}
        <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="lg:col-span-2 space-y-6" noValidate>
          <Card className="space-y-5">
            <Field label="Clinical notes" htmlFor="c-notes">
              <textarea id="c-notes" rows={8} value={notes} disabled={dis} maxLength={20000} onChange={(e) => setNotes(e.target.value)} className={inputCls} style={inputStyle} placeholder="History, examination findings…" />
            </Field>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><Field label="Diagnosis" htmlFor="c-diag"><input id="c-diag" value={diagnosis} disabled={dis} maxLength={2000} onChange={(e) => setDiagnosis(e.target.value)} className={inputCls} style={inputStyle} /></Field></div>
              <Field label="ICD-10 code" htmlFor="c-icd"><input id="c-icd" value={icd} disabled={dis} maxLength={20} onChange={(e) => setIcd(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. B50.9" /></Field>
            </div>
            <Field label="Treatment plan" htmlFor="c-plan">
              <textarea id="c-plan" rows={3} value={plan} disabled={dis} maxLength={5000} onChange={(e) => setPlan(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} />
            </Field>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Prescription</h3>
            {locked.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg text-sm" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>
                <span><strong>{m.drugName}</strong> · {m.dosage} · {m.frequency} · {m.duration}</span><Pill tone="ok">Dispensed</Pill>
              </div>
            ))}
            {rx.map((r) => {
              const hit = allergyHit(r.drugName, tokens);
              return (
                <div key={r.key} className="p-3 rounded-lg border space-y-3" style={{ borderColor: hit ? "var(--danger)" : "var(--grey-200)" }}>
                  <div className="grid sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2"><input aria-label="Medicine" value={r.drugName} disabled={dis} maxLength={200} onChange={(e) => setRow(r.key, { drugName: e.target.value })} className={inputCls} style={inputStyle} placeholder="Medicine" /></div>
                    <input aria-label="Dosage" value={r.dosage} disabled={dis} maxLength={100} onChange={(e) => setRow(r.key, { dosage: e.target.value })} className={inputCls} style={inputStyle} placeholder="Dosage (500 mg)" />
                    <input aria-label="Frequency" value={r.frequency} disabled={dis} maxLength={100} onChange={(e) => setRow(r.key, { frequency: e.target.value })} className={inputCls} style={inputStyle} placeholder="Frequency (3 times daily)" />
                    <input aria-label="Duration" value={r.duration} disabled={dis} maxLength={100} onChange={(e) => setRow(r.key, { duration: e.target.value })} className={inputCls} style={inputStyle} placeholder="Duration (5 days)" />
                    <div className="sm:col-span-2"><input aria-label="Instructions" value={r.instructions} disabled={dis} maxLength={1000} onChange={(e) => setRow(r.key, { instructions: e.target.value })} className={inputCls} style={inputStyle} placeholder="Instructions (after meals…)" /></div>
                    {!dis && <button type="button" onClick={() => setRx(rx.filter((x) => x.key !== r.key))} className="text-xs font-semibold text-left sm:text-right" style={{ color: "var(--danger)" }}>Remove</button>}
                  </div>
                  {hit && <p className="text-xs font-semibold" style={{ color: "var(--danger)" }}>⚠ May match this patient&apos;s recorded allergy: {hit}. Please check before prescribing.</p>}
                </div>
              );
            })}
            {!dis && <button type="button" onClick={addRow} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>+ Add medicine</button>}
          </Card>

          <Card className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Follow-up date (optional)" htmlFor="c-follow"><input id="c-follow" type="date" min={todayLocal()} value={followUp} disabled={dis} onChange={(e) => setFollowUp(e.target.value)} className={inputCls} style={inputStyle} /></Field>
              <Field label="Refer to another department (optional)" htmlFor="c-ref" hint="When you complete the visit, the patient joins that department's queue.">
                <select id="c-ref" value={referral} disabled={dis} onChange={(e) => setReferral(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="">No referral</option>
                  {depts.filter((d) => d.id !== visit.departmentId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          {canEdit && (
            <div className="flex gap-3 flex-wrap">
              <button type="submit" disabled={saving} className="px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>{saving ? "Saving..." : "Save"}</button>
              <button type="button" onClick={() => save(true)} disabled={saving} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>Save &amp; complete visit</button>
            </div>
          )}
          {data.consultation?.followUpDate && !canEdit && <p className="text-sm" style={{ color: "var(--navy)" }}>Follow-up: {fmtDate(data.consultation.followUpDate)}</p>}
          {data.consultation?.updatedAt && <p className="text-xs" style={{ color: "var(--grey-400)" }}>Last saved {fmtDateTime(data.consultation.updatedAt)}</p>}
        </form>
      </div>
    </>
  );
}

export default function ConsultPage() {
  return (
    <PortalShell audience="staff" title={<>Doctor <em className="italic" style={{ color: "var(--teal)" }}>Consultation</em></>}>
      <Consultation />
    </PortalShell>
  );
}
