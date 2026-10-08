"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Spinner, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { URGENCY, errMsg } from "@/lib/format";

const ageOf = (dob?: string) => (dob ? `${new Date().getFullYear() - Number(dob.slice(0, 4))} years` : "");
const toNum = (v: string) => (v.trim() === "" ? undefined : Number(v));

function TriageForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<any>(null);
  const [loadError, setLoadError] = useState("");

  const [temp, setTemp] = useState("");
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [urgency, setUrgency] = useState("");
  const [complaint, setComplaint] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    staffApi.visit(id)
      .then(({ data: res }) => {
        if (cancelled) return;
        const d = res.data;
        setData(d);
        if (d.triage) { // re-triage: start from the last reading
          const t = d.triage;
          setTemp(t.temperature ? String(Number(t.temperature)) : ""); setBp(t.bloodPressure ?? ""); setPulse(t.pulseRate != null ? String(t.pulseRate) : "");
          setSpo2(t.oxygenSaturation ? String(Number(t.oxygenSaturation)) : ""); setWeight(t.weight ? String(Number(t.weight)) : ""); setHeight(t.height ? String(Number(t.height)) : "");
          setUrgency(t.urgencyLevel ?? ""); setComplaint(t.chiefComplaint ?? "");
        }
      })
      .catch((err) => { if (!cancelled) setLoadError(err.response?.status === 403 ? "This patient is in a different department." : errMsg(err, "Couldn't load this visit.")); });
    return () => { cancelled = true; };
  }, [id, version]);

  const back = <Link href="/staff/queue" className="text-sm" style={{ color: "var(--teal)" }}>← Back to the queue</Link>;
  if (loadError) return <>{back}<div className="mt-4"><ErrorBox>{loadError}</ErrorBox></div></>;
  if (!data) return <Spinner label="Loading..." />;

  const { patient, visit } = data;
  const status = visit.status;

  if (status === "waiting") {
    return (
      <>{back}
        <Card className="max-w-md mt-4 text-center !p-8 space-y-4">
          <p className="text-sm" style={{ color: "var(--navy)" }}>{patient.firstName} {patient.lastName} has not been started in triage yet.</p>
          {error && <ErrorBox>{error}</ErrorBox>}
          <button onClick={async () => { try { await staffApi.startTriage(id); setVersion((v) => v + 1); } catch (err) { setError(errMsg(err, "Couldn't start triage.")); } }}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Start triage</button>
        </Card>
      </>
    );
  }
  if (status !== "in_triage" && status !== "triaged") {
    return <>{back}<div className="mt-4"><ErrorBox>Triage is closed for this patient (status: {status.replace("_", " ")}).</ErrorBox></div></>;
  }

  // Gentle prompts only. Age-specific limits vary, so urgency is always the nurse's decision.
  const alerts: string[] = [];
  if (spo2 && Number(spo2) < 92) alerts.push("low oxygen saturation (below 92%)");
  if (temp && Number(temp) >= 38) alerts.push("fever (38 °C or above)");
  if (temp && Number(temp) < 35.5) alerts.push("low body temperature (below 35.5 °C)");
  const bmi = Number(weight) > 0 && Number(height) > 0 ? Number(weight) / Math.pow(Number(height) / 100, 2) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!urgency) return setError("Choose how urgent this patient is.");
    if (bp.trim() && !/^\d{2,3}\/\d{2,3}$/.test(bp.trim())) return setError("Blood pressure should look like 120/80.");
    const nums = { temperature: toNum(temp), pulseRate: toNum(pulse), oxygenSaturation: toNum(spo2), weight: toNum(weight), height: toNum(height) };
    if (Object.values(nums).some((n) => n !== undefined && !Number.isFinite(n))) return setError("Check the numbers you entered.");

    setSaving(true);
    try {
      await staffApi.recordTriage(id, { ...nums, bloodPressure: bp.trim() || undefined, urgencyLevel: urgency, chiefComplaint: complaint.trim() || undefined });
      router.push("/staff/queue");
    } catch (err) {
      setError(errMsg(err, "Couldn't save triage."));
      setSaving(false);
    }
  };

  const num = (idStr: string, value: string, set: (v: string) => void, step: string, placeholder: string) => (
    <input id={idStr} type="number" inputMode="decimal" step={step} value={value} onChange={(e) => set(e.target.value)} className={inputCls} style={inputStyle} placeholder={placeholder} />
  );

  return (
    <>
      {back}
      <div className="mt-4 mb-6">
        <h2 className="text-2xl font-semibold" style={{ color: "var(--navy)" }}>#{visit.queueNumber} · {patient.firstName} {patient.lastName}</h2>
        <p className="text-sm" style={{ color: "var(--grey-500)" }}>
          {[ageOf(patient.dateOfBirth), patient.gender, patient.patientNumber, patient.bloodGroup ? `Blood group ${patient.bloodGroup}` : ""].filter(Boolean).join(" · ")}
        </p>
        {visit.reason && <p className="text-sm mt-1" style={{ color: "var(--grey-500)" }}>Reason given at check-in: {visit.reason}</p>}
      </div>

      {patient.allergies && (
        <div className="mb-6 p-3 rounded-lg text-sm font-medium" style={{ background: "#fde8e8", color: "var(--danger)" }}>⚠ Allergies: {patient.allergies}</div>
      )}

      <form onSubmit={submit} className="max-w-3xl space-y-6" noValidate>
        {error && <ErrorBox>{error}</ErrorBox>}

        <Card className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Vital signs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Temperature (°C)" htmlFor="t-temp">{num("t-temp", temp, setTemp, "0.1", "36.6")}</Field>
            <Field label="Blood pressure" htmlFor="t-bp"><input id="t-bp" value={bp} onChange={(e) => setBp(e.target.value)} className={inputCls} style={inputStyle} placeholder="120/80" maxLength={7} /></Field>
            <Field label="Pulse (bpm)" htmlFor="t-pulse">{num("t-pulse", pulse, setPulse, "1", "72")}</Field>
            <Field label="Oxygen (SpO₂ %)" htmlFor="t-spo2">{num("t-spo2", spo2, setSpo2, "0.1", "98")}</Field>
            <Field label="Weight (kg)" htmlFor="t-weight">{num("t-weight", weight, setWeight, "0.1", "")}</Field>
            <Field label="Height (cm)" htmlFor="t-height">{num("t-height", height, setHeight, "0.1", "")}</Field>
          </div>
          {bmi && <p className="text-xs" style={{ color: "var(--grey-400)" }}>BMI ≈ {bmi.toFixed(1)} (meaningful for adults)</p>}
          {alerts.length > 0 && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>
              Worth a closer look: {alerts.join(", ")}. Use your clinical judgement to set the urgency.
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Chief complaint</h3>
          <textarea aria-label="Chief complaint" rows={3} value={complaint} maxLength={2000} onChange={(e) => setComplaint(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} placeholder="What is the patient here for, in their words?" />
        </Card>

        <Card className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>How urgent is this patient?</h3>
          <div role="radiogroup" aria-label="Urgency" className="space-y-2">
            {URGENCY.map((u) => (
              <label key={u.value} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer" style={{ borderColor: urgency === u.value ? "var(--teal)" : "var(--grey-200)", background: urgency === u.value ? "var(--teal-light)" : "white" }}>
                <input type="radio" name="urgency" value={u.value} checked={urgency === u.value} onChange={() => setUrgency(u.value)} />
                <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{u.label}</span>
                <span className="text-xs" style={{ color: "var(--grey-500)" }}>{u.hint}</span>
              </label>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--grey-400)" }}>Critical and emergent patients move to the front of the doctor&apos;s queue automatically.</p>
        </Card>

        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={saving} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: saving ? "var(--teal-dark)" : "var(--teal)" }}>
            {saving ? "Saving..." : "Save triage"}
          </button>
          <Link href="/staff/queue" className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Cancel</Link>
        </div>
      </form>
    </>
  );
}

export default function TriagePage() {
  return (
    <PortalShell audience="staff" title={<>Patient <em className="italic" style={{ color: "var(--teal)" }}>Triage</em></>}>
      <TriageForm />
    </PortalShell>
  );
}
