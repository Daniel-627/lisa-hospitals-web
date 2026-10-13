"use client";

import { useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner, UrgencyPill } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg, fmtDateTime } from "@/lib/format";
import { useWorklist } from "@/lib/useWorklist";

function ResultsBoard() {
  const [released, setReleased] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const { rows, loading, error, reload } = useWorklist(() => staffApi.myOrders({ released }), String(released), 30000);

  const release = async (o: any) => {
    if (!window.confirm("Release this result to the patient?")) return;
    setBusyId(o.id); setActionError("");
    try { await staffApi.releaseOrder(o.kind, o.id); } catch (err) { setActionError(errMsg(err, "Couldn't release that result.")); }
    setBusyId(null);
    reload();
  };

  return (
    <>
      <div className="flex gap-2 mb-6">
        {[["Awaiting my review", false], ["Released to patients", true]].map(([label, val]) => (
          <button key={String(label)} onClick={() => { setActionError(""); setReleased(val as boolean); }} aria-pressed={released === val}
            className="px-4 py-2 rounded-full text-xs font-semibold" style={{ background: released === val ? "var(--navy)" : "var(--grey-200)", color: released === val ? "white" : "var(--navy)" }}>{label as string}</button>
        ))}
      </div>
      {(actionError || error) && <ErrorBox>{actionError || error}</ErrorBox>}
      {loading ? <Spinner label="Loading results..." /> : rows.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>{released ? "Nothing released yet." : "No results waiting for your review."}</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {rows.map((o: any) => (
            <Card key={`${o.kind}-${o.id}`} className="!p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{o.name}{o.kind === "radiology" && o.bodyPart ? ` · ${o.bodyPart}` : ""}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>{o.firstName} {o.lastName} · {o.patientNumber} · ordered {fmtDateTime(o.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {o.kind === "lab" && <UrgencyPill level={o.urgency} />}
                  {o.results.some((r: any) => r.isAbnormal) && <Pill tone="danger">Abnormal</Pill>}
                  {!released && <button disabled={busyId === o.id} onClick={() => release(o)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>Release to patient</button>}
                </div>
              </div>
              {o.kind === "lab" && (
                <div className="space-y-1">
                  {o.results.map((r: any) => (
                    <div key={r.id} className="text-sm" style={{ color: r.isAbnormal ? "var(--danger)" : "var(--navy)" }}>
                      {r.analyte}: <strong>{r.result}</strong> {r.unit ?? ""}{r.referenceRange ? <span style={{ color: "var(--grey-400)" }}> (normal {r.referenceRange})</span> : null}
                      {r.notes && <div className="text-xs" style={{ color: "var(--grey-500)" }}>{r.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
              {o.kind === "radiology" && o.results.map((r: any) => (
                <div key={r.id} className="text-sm space-y-1" style={{ color: "var(--navy)" }}>
                  {r.impression && <p><strong>Impression:</strong> {r.impression}</p>}
                  {r.findings && <p className="whitespace-pre-line">{r.findings}</p>}
                  <div className="flex gap-3">
                    {r.imageUrl && <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "var(--teal)" }}>Open image</a>}
                    {r.reportUrl && <a href={r.reportUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "var(--teal)" }}>Open report</a>}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function ResultsPage() {
  return (
    <PortalShell audience="staff" title={<>Test <em className="italic" style={{ color: "var(--teal)" }}>Results</em></>} subtitle="Review results for tests you ordered, then release them to the patient.">
      <ResultsBoard />
    </PortalShell>
  );
}
