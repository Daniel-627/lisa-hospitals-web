"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Spinner, inputCls, inputStyle } from "@/components/ui";
import { departmentsApi, staffApi } from "@/lib/api";
import { errMsg, hhmm, todayLocal } from "@/lib/format";

type Picked = { id: string; name: string; number: string };

function CheckInForm() {
  const sp = useSearchParams();
  const prePatient = sp.get("patientId");
  const preAppt = sp.get("appointmentId") ?? "";

  const [patient, setPatient] = useState<Picked | null>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [apptChoice, setApptChoice] = useState<string | null>(null); // null = use the one we arrived with
  const [deptChoice, setDeptChoice] = useState("");
  const [priority, setPriority] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<any>(null);

  useEffect(() => {
    departmentsApi.getAll().then(({ data }) => setDepts(data.data)).catch(() => {});
  }, []);

  // Today's open appointments for this patient (only available if we're allowed to open their file).
  const onFile = ({ data }: any) => {
    const p = data.data;
    setPatient({ id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.patientNumber });
    setAppts((p.appointments ?? []).filter((a: any) => a.appointmentDate === todayLocal() && (a.status === "pending" || a.status === "confirmed")));
  };
  const onFileError = (err: any) => {
    const p = err.response?.data?.patient; // 403: we may still know who they are
    if (p) setPatient({ id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.patientNumber });
    setAppts([]);
  };
  const loadPatient = (id: string) => staffApi.getPatientById(id).then(onFile).catch(onFileError);

  // Arriving from a patient file or an appointment (?patientId=…): load them once.
  useEffect(() => {
    if (prePatient) staffApi.getPatientById(prePatient).then(onFile).catch(onFileError);
  }, [prePatient]); // eslint-disable-line react-hooks/exhaustive-deps

  const term = search.trim();
  const shown = term.length >= 2 ? results : [];
  useEffect(() => {
    if (term.length < 2) return;
    const t = setTimeout(() => {
      staffApi.getPatients({ q: term, limit: 6 }).then(({ data }) => setResults(data.data)).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [term]);

  const apptId = apptChoice !== null ? apptChoice : appts.some((a) => a.id === preAppt) ? preAppt : "";
  const appt = appts.find((a) => a.id === apptId);
  const departmentId = appt ? appt.departmentId : deptChoice;

  const reset = () => { setDone(null); setPatient(null); setAppts([]); setApptChoice(null); setDeptChoice(""); setPriority(false); setReason(""); setSearch(""); setResults([]); setError(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!patient) return setError("Choose a patient first.");
    if (!departmentId) return setError("Choose a department.");
    setSaving(true);
    try {
      const { data } = await staffApi.checkIn({
        patientId: patient.id,
        departmentId: appt ? undefined : departmentId,
        appointmentId: appt?.id,
        isPriority: priority || undefined,
        reason: reason.trim() || undefined,
      });
      setDone(data.data);
    } catch (err) {
      setError(errMsg(err, "Couldn't check the patient in."));
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Card className="max-w-md text-center !p-8 space-y-4">
        <div className="text-sm" style={{ color: "var(--grey-500)" }}>{patient?.name} is checked in to {done.department}</div>
        <div className="text-7xl font-bold" style={{ color: priority ? "var(--danger)" : "var(--navy)", fontFamily: "var(--font-display)" }}>#{done.queueNumber}</div>
        <p className="text-sm" style={{ color: "var(--navy)" }}>Tell the patient their queue number and ask them to wait to be called.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={reset} className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Check in another patient</button>
          <Link href="/staff/queue" className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>View the queue</Link>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6">
      {error && <ErrorBox>{error}</ErrorBox>}
      <Card className="space-y-5">
        <Field label="Patient">
          {patient ? (
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--teal-light)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--teal-dark)" }}>{patient.name} <span className="font-normal">· {patient.number}</span></div>
              <button type="button" onClick={() => { setPatient(null); setAppts([]); setApptChoice(null); }} className="text-xs font-semibold" style={{ color: "var(--teal-dark)" }}>Change</button>
            </div>
          ) : (
            <>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, patient number or phone…" className={inputCls} style={inputStyle} />
              {shown.length > 0 && (
                <ul className="mt-2 rounded-lg border divide-y" style={{ borderColor: "var(--grey-200)" }}>
                  {shown.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => { setSearch(""); setResults([]); loadPatient(r.id); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: "var(--navy)" }}>
                        {r.firstName} {r.lastName} <span style={{ color: "var(--grey-400)" }}>· {r.patientNumber}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs mt-2" style={{ color: "var(--grey-400)" }}>
                Not registered yet? <Link href="/staff/patients/new" className="font-semibold" style={{ color: "var(--teal)" }}>Register a new patient</Link>
              </p>
            </>
          )}
        </Field>

        {patient && appts.length > 0 && (
          <Field label="Coming for an appointment today?" htmlFor="ci-appt">
            <select id="ci-appt" value={apptId} onChange={(e) => setApptChoice(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">No, a walk-in visit</option>
              {appts.map((a) => <option key={a.id} value={a.id}>{hhmm(a.appointmentTime)} · {a.department}</option>)}
            </select>
          </Field>
        )}

        {appt ? (
          <div className="text-sm" style={{ color: "var(--navy)" }}>Department: <strong>{appt.department}</strong></div>
        ) : (
          <Field label="Department" htmlFor="ci-dept">
            <select id="ci-dept" value={deptChoice} onChange={(e) => setDeptChoice(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Choose a department…</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Reason for visit (optional)" htmlFor="ci-reason" hint="Only clinical staff in that department can see this.">
          <input id="ci-reason" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} className={inputCls} style={inputStyle} />
        </Field>

        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--navy)" }}>
          <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
          Emergency / priority (moves to the front of the queue)
        </label>
      </Card>

      <button type="submit" disabled={saving} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: saving ? "var(--teal-dark)" : "var(--teal)" }}>
        {saving ? "Checking in..." : "Check in"}
      </button>
    </form>
  );
}

export default function CheckInPage() {
  return (
    <PortalShell audience="staff" title={<>Patient <em className="italic" style={{ color: "var(--teal)" }}>Check-in</em></>} subtitle="Give the patient a queue number for their department">
      {/* useSearchParams needs a Suspense boundary for production builds */}
      <Suspense fallback={<Spinner />}><CheckInForm /></Suspense>
    </PortalShell>
  );
}
