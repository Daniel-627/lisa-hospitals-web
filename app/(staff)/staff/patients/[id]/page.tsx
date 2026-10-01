"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import { Card, DetailRow, ErrorBox, Spinner, StatusBadge } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { docLabel, errMsg, fmtDate, hhmm, insuranceLabel } from "@/lib/format";

function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    staffApi.getPatientById(id)
      .then(({ data }) => { if (!cancelled) setP(data.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.status === 404 ? "Patient not found." : errMsg(err, "Couldn't load this patient.")); });
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <><Link href="/staff/patients" className="text-sm" style={{ color: "var(--teal)" }}>← All patients</Link><div className="mt-4"><ErrorBox>{error}</ErrorBox></div></>;
  if (!p) return <Spinner label="Loading patient..." />;

  return (
    <>
      <Link href="/staff/patients" className="text-sm" style={{ color: "var(--teal)" }}>← All patients</Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mt-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--navy)" }}>{p.firstName} {p.lastName}</h2>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>{p.patientNumber} · {insuranceLabel(p.insuranceScheme)}</p>
        </div>
        <Link href={`/staff/documents?patientId=${p.id}`} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>
          Upload document
        </Link>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <DetailRow label="Phone" value={p.phone?.startsWith("clerk-") ? "Not provided" : p.phone} />
          <DetailRow label="Email" value={p.email} />
          <DetailRow label="Date of birth" value={fmtDate(p.dateOfBirth)} />
          <DetailRow label="Gender" value={p.gender} />
          <DetailRow label="Blood group" value={p.bloodGroup} />
          <DetailRow label="National ID" value={p.nationalId} />
          <DetailRow label="Insurance no." value={p.insuranceNumber} />
          <DetailRow label="Address" value={p.address} />
          <DetailRow label="Next of kin" value={p.nextOfKinName && `${p.nextOfKinName}${p.nextOfKinRelation ? ` (${p.nextOfKinRelation})` : ""}`} />
          <DetailRow label="Next of kin phone" value={p.nextOfKinPhone} />
          <div className="col-span-2"><DetailRow label="Allergies" value={p.allergies} /></div>
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
