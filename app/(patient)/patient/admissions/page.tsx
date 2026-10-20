"use client";

import { useEffect, useState } from "react";
import PortalShell, { useMe } from "@/components/PortalShell";
import DischargeSheet from "@/components/DischargeSheet";
import { Card, ErrorBox, Pill, Spinner } from "@/components/ui";
import { patientsApi } from "@/lib/api";
import { errMsg, fmtDateTime } from "@/lib/format";

function Stays() {
  const me = useMe();
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    patientsApi.getAdmissions()
      .then(({ data }) => { if (!cancelled) setList(data.data); })
      .catch((err) => { if (!cancelled) { setList([]); setError(errMsg(err, "Couldn't load your hospital stays.")); } });
    return () => { cancelled = true; };
  }, []);

  if (!list) return <Spinner label="Loading your hospital stays..." />;
  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      {list.length === 0 && !error ? (
        <div className="p-8 rounded-xl border text-center" style={{ borderColor: "var(--grey-200)" }}>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>No hospital stays on record. If you are admitted, your discharge summary will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {list.map((a) => (
            <div key={a.id}>
              <Card className="!p-4 no-print">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{a.department} · {a.ward}{a.bedNumber ? `, bed ${a.bedNumber}` : ""}</div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>{fmtDateTime(a.admittedAt)}{a.dischargedAt ? ` to ${fmtDateTime(a.dischargedAt)}` : ""} · Dr. {a.admittedByFirst} {a.admittedByLast}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={a.status === "admitted" ? "warn" : "ok"}>{a.status === "admitted" ? "In hospital" : "Discharged"}</Pill>
                    {a.summaryId && <button onClick={() => setOpenId(openId === a.id ? null : a.id)} className="text-sm font-semibold" style={{ color: "var(--teal)" }}>{openId === a.id ? "Hide summary" : "View summary"}</button>}
                  </div>
                </div>
              </Card>
              {openId === a.id && a.summaryId && (
                <div className="mt-3">
                  <DischargeSheet patient={{ firstName: me.firstName, lastName: me.lastName, patientNumber: "" }}
                    stay={{ ward: a.ward, bedNumber: a.bedNumber, department: a.department, admittedAt: a.admittedAt, dischargedAt: a.dischargedAt }}
                    summary={a} dischargedBy={null} />
                  <button onClick={() => window.print()} className="no-print mt-3 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Print / save as PDF</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function PatientStaysPage() {
  return (
    <PortalShell audience="patient" title={<>Hospital <em className="italic" style={{ color: "var(--teal)" }}>Stays</em></>} subtitle="Your admissions and discharge summaries">
      <Stays />
    </PortalShell>
  );
}
