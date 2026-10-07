"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Card, DetailRow, ErrorBox, Pill, Spinner, StatusBadge, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { docLabel, errMsg, fmtDate, fmtDateTime, hhmm, insuranceLabel } from "@/lib/format";

type Denied = { patient: { id: string; firstName: string; lastName: string; patientNumber: string }; canRequest: boolean };

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
  const canEdit = ["receptionist", "nurse", "doctor", "admin"].includes(me.role);
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
          setDenied({ patient: d.patient, canRequest: !!d.canRequestEmergencyAccess });
        } else {
          setError(err.response?.status === 404 ? "Patient not found." : errMsg(err, "Couldn't load this patient."));
        }
      });
    return () => { cancelled = true; };
  }, [id, version]);

  const back = <Link href="/staff/patients" className="text-sm" style={{ color: "var(--teal)" }}>← All patients</Link>;

  if (error) return <>{back}<div className="mt-4"><ErrorBox>{error}</ErrorBox></div></>;

  if (denied) {
    return (
      <>
        {back}
        <Card className="max-w-xl mt-4 !p-8 text-center space-y-4">
          <div className="text-3xl" aria-hidden>🔒</div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>{denied.patient.firstName} {denied.patient.lastName}</h2>
            <p className="text-sm" style={{ color: "var(--grey-500)" }}>{denied.patient.patientNumber}</p>
          </div>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>
            This record is private. You can open it when the patient is booked with you or your department, or is in your department right now.
          </p>
          {denied.canRequest ? (
            <EmergencyAccessForm patientId={denied.patient.id} onGranted={() => setVersion((v) => v + 1)} />
          ) : (
            <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>Ask the treating clinician if you need information from this record.</p>
          )}
        </Card>
      </>
    );
  }

  if (!p) return <Spinner label="Loading patient..." />;
  const clinical = p.accessLevel === "clinical";

  return (
    <>
      {back}

      <div className="flex items-start justify-between flex-wrap gap-4 mt-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--navy)" }}>{p.firstName} {p.lastName}</h2>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>{p.patientNumber} · {insuranceLabel(p.insuranceScheme)}</p>
          {!p.hasAccount && <div className="mt-2"><Pill tone="warn">Walk-in · no online account</Pill></div>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && <Link href={`/staff/checkin?patientId=${p.id}`} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--navy)" }}>Check in</Link>}
          {canEdit && <Link href={`/staff/patients/${p.id}/edit`} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Edit details</Link>}
          <Link href={`/staff/documents?patientId=${p.id}`} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Upload document</Link>
        </div>
      </div>

      {clinical ? (
        <div className="mb-6 text-xs px-3 py-2 rounded-lg inline-block" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>
          Access: {p.accessReason}{p.accessExpiresAt ? ` · until ${fmtDateTime(p.accessExpiresAt)}` : ""} · viewing is logged
        </div>
      ) : (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>
          Limited view. Clinical details (allergies, blood group, visit reasons and documents) are restricted for your role.
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <DetailRow label="Phone" value={p.phone?.startsWith("clerk-") ? "Not provided" : p.phone} />
          <DetailRow label="Email" value={p.email} />
          <DetailRow label="Date of birth" value={`${fmtDate(p.dateOfBirth)}${p.dobIsEstimated ? " (estimated)" : ""}`} />
          <DetailRow label="Gender" value={p.gender} />
          {clinical && <DetailRow label="Blood group" value={p.bloodGroup} />}
          <DetailRow label="National ID" value={p.nationalId} />
          <DetailRow label="Insurance no." value={p.insuranceNumber} />
          <DetailRow label="Address" value={p.address} />
          <DetailRow label="Next of kin" value={p.nextOfKinName && `${p.nextOfKinName}${p.nextOfKinRelation ? ` (${p.nextOfKinRelation})` : ""}`} />
          <DetailRow label="Next of kin phone" value={p.nextOfKinPhone} />
          {clinical && <div className="col-span-2"><DetailRow label="Allergies" value={p.allergies} /></div>}
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
