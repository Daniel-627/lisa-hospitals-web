"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg, fmtDateTime, fmtKes } from "@/lib/format";

const daysIn = (from: string, to?: string | null) => Math.max(1, Math.ceil(((to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime()) / 86_400_000));

function Wards() {
  const [tab, setTab] = useState<"admitted" | "discharged">("admitted");
  const [res, setRes] = useState<{ tab: string; list: any[]; error: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    staffApi.admissions({ status: tab })
      .then(({ data }) => { if (!cancelled) setRes({ tab, list: data.data, error: "" }); })
      .catch((err) => { if (!cancelled) setRes({ tab, list: [], error: errMsg(err, "Couldn't load admissions.") }); });
    return () => { cancelled = true; };
  }, [tab]);

  const loading = !res || res.tab !== tab;
  return (
    <>
      <div className="flex gap-1 p-1 rounded-lg w-fit mb-5" style={{ background: "var(--grey-200)" }} role="tablist">
        {([["admitted", "In the wards"], ["discharged", "Recently discharged"]] as const).map(([v, l]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className="px-4 py-1.5 rounded-md text-sm font-medium" style={{ background: tab === v ? "white" : "transparent", color: "var(--navy)" }}>{l}</button>
        ))}
      </div>
      {!loading && res!.error && <ErrorBox>{res!.error}</ErrorBox>}
      {loading ? <Spinner label="Loading..." /> : res!.list.length === 0 && !res!.error ? (
        <p className="text-sm py-6" style={{ color: "var(--grey-500)" }}>{tab === "admitted" ? "Nobody is admitted right now." : "No discharges yet."}</p>
      ) : (
        <div className="space-y-2">
          {res!.list.map((a) => (
            <Link key={a.id} href={`/staff/admissions/${a.id}`} className="block">
              <Card className="!p-4 flex items-center justify-between gap-4 flex-wrap hover:shadow-md transition-shadow">
                <div className="min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{a.firstName} {a.lastName} <span style={{ color: "var(--grey-400)" }}>· {a.patientNumber}</span></div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                    {a.ward}{a.bedNumber ? ` · Bed ${a.bedNumber}` : ""} · {a.department} · Dr. {a.doctorFirstName} {a.doctorLastName}
                  </div>
                  <div className="text-xs" style={{ color: "var(--grey-400)" }}>
                    {tab === "admitted" ? `Admitted ${fmtDateTime(a.admittedAt)} · day ${daysIn(a.admittedAt)}` : `Discharged ${fmtDateTime(a.dischargedAt)} · stayed ${daysIn(a.admittedAt, a.dischargedAt)} day(s)`}
                  </div>
                </div>
                {Number(a.outstanding) > 0 && <Pill tone="warn">{fmtKes(a.outstanding)} owed</Pill>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdmissionsPage() {
  return (
    <PortalShell audience="staff" title={<>Ward <em className="italic" style={{ color: "var(--teal)" }}>Admissions</em></>} subtitle="Inpatients, beds and discharge">
      <Wards />
    </PortalShell>
  );
}
