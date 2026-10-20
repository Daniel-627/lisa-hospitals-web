"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Card, DetailRow, ErrorBox, Pill, Spinner, StatusBadge, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { docLabel, errMsg, fmtDate, fmtDateTime, hhmm, insuranceLabel } from "@/lib/format";
import { Back, Icon } from "@/components/Icon";

type Denied = {
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  canRequestEmergency: boolean;
  primaryDoctor: { name: string } | null;
  canRequestAccess: boolean;
  requestPending: boolean;
};

function RequestAccessForm({ patientId, onSent }: { patientId: string; onSent: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await staffApi.requestAccess(patientId, message.trim() || undefined);
      onSent();
    } catch (err) {
      setError(errMsg(err, "Couldn't send the request."));
      setBusy(false);
    }
  };
  return (
    <form onSubmit={send} className="space-y-3 text-left">
      {error && <ErrorBox>{error}</ErrorBox>}
      <label htmlFor="req-msg" className="block text-sm font-medium" style={{ color: "var(--navy)" }}>Message (optional)</label>
      <textarea id="req-msg" rows={2} value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} placeholder="e.g. I'm seeing this patient for a second opinion." />
      <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Sending..." : "Ask for access"}</button>
    </form>
  );
}

function EmergencyAccessForm({ patientId, onGranted }: { patientId: string; onGranted: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) return setError("Please explain why you need access (at least 10 characters).");
    setBusy(true);
    setError("");
    try {
      await staffApi.requestEmergencyAccess(patientId, reason.trim());
      onGranted();
    } catch (err) {
      setError(errMsg(err, "Couldn't grant emergency access."));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 text-left">
      {error && <ErrorBox>{error}</ErrorBox>}
      <label htmlFor="reason" className="block text-sm font-medium" style={{ color: "var(--navy)" }}>Why do you need this record now?</label>
      <textarea id="reason" rows={3} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} placeholder="e.g. Patient collapsed in the waiting area; need allergy and medication history." />
      <p className="text-xs" style={{ color: "var(--grey-400)" }}>Access lasts 4 hours. Your name, the patient and this reason are recorded in the audit log and reviewed by administrators.</p>
      <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--danger)" }}>
        {busy ? "Granting..." : "Request emergency access"}
      </button>
    </form>
  );
}

function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const canEdit = ["receptionist", "nurse", "doctor", "admin"].includes(me.role); // check-in
  const canEditProfile = ["receptionist", "admin"].includes(me.role); // registration and contact details
  const isDoctor = me.role === "doctor";    // doctors get the medical record only
  const [version, setVersion] = useState(0);
  const [p, setP] = useState<any>(null);
  const [denied, setDenied] = useState<Denied | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    staffApi.getPatientById(id)
      .then(({ data }) => { if (!cancelled) { setP(data.data); setDenied(null); setError(""); } })
      .catch((err) => {
        if (cancelled) return;
        const d = err.response?.data;
        if (err.response?.status === 403 && d?.code === "ACCESS_REQUIRED") {
          setP(null); setError("");
          setDenied({ patient: d.patient, canRequestEmergency: !!d.canRequestEmergencyAccess, primaryDoctor: d.primaryDoctor ?? null, canRequestAccess: !!d.canRequestAccess, requestPending: !!d.requestPending });
        } else {
          setError(err.response?.status === 404 ? "Patient not found." : errMsg(err, "Couldn't load this patient."));
        }
      });
    return () => { cancelled = true; };
  }, [id, version]);

  const back = <Link href="/staff/patients" className="text-sm" style={{ color: "var(--teal)" }}><Back />All patients</Link>;

  if (error) return <>{back}<div className="mt-4"><ErrorBox>{error}</ErrorBox></div></>;

  if (denied) {
    return (
      <>
        {back}
        <Card className="max-w-xl mt-4 !p-8 text-center space-y-5">
          <div className="text-3xl flex justify-center" style={{ color: "var(--teal)" }} aria-hidden><Icon name="trust" /></div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>{denied.patient.firstName} {denied.patient.lastName}</h2>
            <p className="text-sm" style={{ color: "var(--grey-500)" }}>{denied.patient.patientNumber}</p>
          </div>
          {denied.primaryDoctor ? (
            <p className="text-sm" style={{ color: "var(--grey-500)" }}>
              This patient is being treated by <strong style={{ color: "var(--navy)" }}>{denied.primaryDoctor.name}</strong>. The record is private to the treating doctor unless they choose to share it.
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--grey-500)" }}>
              This record is private. It opens for the doctor who picks the patient up from the queue, or who has the patient booked with them.
            </p>
          )}
          {denied.requestPending && (
            <p className="text-sm font-semibold" style={{ color: "var(--teal-dark)" }}>Your request has been sent. The record opens once {denied.primaryDoctor?.name ?? "the treating doctor"} approves it.</p>
          )}
          {denied.canRequestAccess && !denied.requestPending && <RequestAccessForm patientId={denied.patient.id} onSent={() => setVersion((v) => v + 1)} />}
          {denied.canRequestEmergency && (
            <details className="text-left">
              <summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--danger)" }}>Emergency access (audited)</summary>
              <div className="mt-3"><EmergencyAccessForm patientId={denied.patient.id} onGranted={() => setVersion((v) => v + 1)} /></div>
            </details>
          )}
        </Card>
      </>
    );
  }

  if (!p) return <Spinner label="Loading patient..." />;
  const clinical = p.accessLevel === "clinical";
  const triageLevel = p.accessLevel === "triage"; // nurses: allergies and blood group, nothing more

  return (
    <>
      {back}

      <div className="flex items-start justify-between flex-wrap gap-4 mt-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--navy)" }}>{p.firstName} {p.lastName}</h2>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>{p.patientNumber}{isDoctor ? "" : ` · ${insuranceLabel(p.insuranceScheme)}`}</p>
          {!p.hasAccount && <div className="mt-2"><Pill tone="warn">Walk-in · no online account</Pill></div>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && <Link href={`/staff/checkin?patientId=${p.id}`} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--navy)" }}>Check in</Link>}
          {canEditProfile && <Link href={`/staff/patients/${p.id}/edit`} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Edit details</Link>}
          {["billing_officer", "receptionist", "admin"].includes(me.role) && <Link href={`/staff/billing/new?patientId=${p.id}`} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>New invoice</Link>}
          <Link href={`/staff/documents?patientId=${p.id}`} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Upload document</Link>
        </div>
      </div>

      {clinical ? (
        <div className="mb-6 text-xs px-3 py-2 rounded-lg inline-block" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>
          Access: {p.accessReason}{p.accessExpiresAt ? ` · until ${fmtDateTime(p.accessExpiresAt)}` : ""} · viewing is logged
        </div>
      ) : triageLevel ? (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>
          Limited view for care in your department: allergies and blood group are shown. Visit history and documents belong to the treating doctor.
        </div>
      ) : (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>
          Limited view. Clinical details (allergies, blood group, visit reasons and documents) are restricted for your role.
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {!isDoctor && <DetailRow label="Phone" value={p.phone?.startsWith("clerk-") ? "Not provided" : p.phone} />}
          {!isDoctor && <DetailRow label="Email" value={p.email} />}
          <DetailRow label="Date of birth" value={`${fmtDate(p.dateOfBirth)}${p.dobIsEstimated ? " (estimated)" : ""}`} />
          <DetailRow label="Gender" value={p.gender} />
          {(clinical || triageLevel) && <DetailRow label="Blood group" value={p.bloodGroup} />}
          {!isDoctor && <>
            <DetailRow label="National ID" value={p.nationalId} />
            <DetailRow label="Insurance no." value={p.insuranceNumber} />
            <DetailRow label="Address" value={p.address} />
            <DetailRow label="Next of kin" value={p.nextOfKinName && `${p.nextOfKinName}${p.nextOfKinRelation ? ` (${p.nextOfKinRelation})` : ""}`} />
            <DetailRow label="Next of kin phone" value={p.nextOfKinPhone} />
          </>}
          {(clinical || triageLevel) && <div className="col-span-2"><DetailRow label="Allergies" value={p.allergies} /></div>}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--navy)" }}>Appointments</h3>
          {p.appointments.length === 0 ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>No appointments.</p> : (
            <div className="space-y-2">
              {p.appointments.map((a: any) => (
                <Card key={a.id} className="!p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{a.department}</div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>{fmtDate(a.appointmentDate)} at {hhmm(a.appointmentTime)}</div>
                    {a.reason && <div className="text-xs mt-0.5" style={{ color: "var(--grey-400)" }}>{a.reason}</div>}
                  </div>
                  <StatusBadge status={a.status} />
                </Card>
              ))}
            </div>
          )}
        </section>

        {clinical && (
          <section>
            <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--navy)" }}>Documents</h3>
            {p.documents.length === 0 ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>No documents.</p> : (
              <div className="space-y-2">
                {p.documents.map((d: any) => (
                  <Card key={d.id} className="!p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--navy)" }}>{d.title}</div>
                      <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                        {docLabel(d.documentType)} · {fmtDate(String(d.createdAt).slice(0, 10))}{d.isVisible === false ? " · hidden from patient" : ""}
                      </div>
                    </div>
                    {String(d.fileUrl).startsWith("https://") && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold shrink-0" style={{ color: "var(--teal)" }}>Open</a>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {clinical && (p.consultations ?? []).length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--navy)" }}>Consultations</h3>
          <div className="space-y-2">
            {p.consultations.map((c: any) => (
              <Card key={c.id} className="!p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{c.diagnosis || "No diagnosis recorded"}{c.icdCode ? ` (${c.icdCode})` : ""}</div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>{c.doctor} · {c.department} · {fmtDateTime(c.date)}</div>
                  </div>
                  {c.followUpDate && <Pill tone="warn">Follow-up {fmtDate(c.followUpDate)}</Pill>}
                </div>
                <details className="mt-2">
                  <summary className="text-xs font-semibold cursor-pointer" style={{ color: "var(--teal)" }}>Notes, plan and medicines</summary>
                  <div className="mt-2 space-y-2 text-sm" style={{ color: "var(--navy)" }}>
                    {c.clinicalNotes && <p className="whitespace-pre-line">{c.clinicalNotes}</p>}
                    {c.treatmentPlan && <p><span style={{ color: "var(--grey-400)" }}>Plan: </span>{c.treatmentPlan}</p>}
                    {((c.labs ?? []).length > 0 || (c.scans ?? []).length > 0) && (
                      <div>
                        <p style={{ color: "var(--grey-400)" }}>Tests</p>
                        <ul className="list-disc pl-5">
                          {(c.labs ?? []).map((o: any) => (
                            <li key={o.id}>{o.testName} ({o.status}){o.results?.length ? `: ${o.results.map((r: any) => `${r.analyte} ${r.result}${r.unit ? ` ${r.unit}` : ""}`).join(", ")}` : ""}</li>
                          ))}
                          {(c.scans ?? []).map((o: any) => (
                            <li key={o.id}>{o.modality}{o.bodyPart ? ` · ${o.bodyPart}` : ""} ({o.status}){o.results?.[0]?.impression ? `: ${o.results[0].impression}` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.medicines.length > 0 && (
                      <ul className="list-disc pl-5">
                        {c.medicines.map((m: any, i: number) => <li key={i}>{m.drugName} · {m.dosage} · {m.frequency} · {m.duration}{m.isDispensed ? " (dispensed)" : ""}</li>)}
                      </ul>
                    )}
                  </div>
                </details>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function StaffPatientPage() {
  return (
    <PortalShell audience="staff" title={<>Patient <em className="italic" style={{ color: "var(--teal)" }}>File</em></>}>
      <PatientDetail />
    </PortalShell>
  );
}
