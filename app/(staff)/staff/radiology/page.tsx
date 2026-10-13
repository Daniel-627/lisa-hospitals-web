"use client";

import { useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Pill, Spinner, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg, fmtDateTime } from "@/lib/format";
import { useWorklist } from "@/lib/useWorklist";

const ageOf = (dob?: string) => (dob ? `${new Date().getFullYear() - Number(dob.slice(0, 4))}y` : "");

function ReportForm({ order, onDone }: { order: any; onDone: () => void }) {
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!findings.trim() && !impression.trim()) return setError("Enter the findings or the impression.");
    if ((imageUrl.trim() && !imageUrl.trim().startsWith("https://")) || (reportUrl.trim() && !reportUrl.trim().startsWith("https://"))) return setError("Links must start with https://");
    setBusy(true);
    try {
      await staffApi.radiologyResult(order.id, { findings: findings.trim() || undefined, impression: impression.trim() || undefined, imageUrl: imageUrl.trim() || undefined, reportUrl: reportUrl.trim() || undefined });
      onDone();
    } catch (err) {
      setError(errMsg(err, "Couldn't save the report."));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "var(--grey-100)" }}>
      {error && <ErrorBox>{error}</ErrorBox>}
      <Field label="Findings" htmlFor={`f-${order.id}`}><textarea id={`f-${order.id}`} rows={4} value={findings} maxLength={10000} onChange={(e) => setFindings(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <Field label="Impression" htmlFor={`i-${order.id}`}><textarea id={`i-${order.id}`} rows={2} value={impression} maxLength={5000} onChange={(e) => setImpression(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Image link (https, optional)" htmlFor={`u-${order.id}`}><input id={`u-${order.id}`} type="url" value={imageUrl} maxLength={500} onChange={(e) => setImageUrl(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="Report link (https, optional)" htmlFor={`r-${order.id}`}><input id={`r-${order.id}`} type="url" value={reportUrl} maxLength={500} onChange={(e) => setReportUrl(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      </div>
      <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Saving..." : "Save report and send to the doctor"}</button>
    </form>
  );
}

function RadiologyBoard() {
  const [showDone, setShowDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { rows, loading, error, reload } = useWorklist(() => staffApi.radiologyWorklist({ done: showDone || undefined }), String(showDone));

  return (
    <>
      <label className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--navy)" }}>
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed (last 2 days)
      </label>
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? <Spinner label="Loading the imaging list..." /> : rows.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>No imaging requests waiting.</p>
      ) : (
        <div className="space-y-2 max-w-4xl">
          {rows.map((o: any) => (
            <Card key={o.id} className="!p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{o.modality}{o.bodyPart ? ` · ${o.bodyPart}` : ""}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>{o.firstName} {o.lastName} · {[ageOf(o.dateOfBirth), o.gender, o.patientNumber].filter(Boolean).join(" · ")}</div>
                  <div className="text-xs" style={{ color: "var(--grey-400)" }}>Requested by Dr. {o.doctorLast} · {fmtDateTime(o.createdAt)}</div>
                  {o.clinicalInfo && <div className="text-xs mt-1" style={{ color: "var(--navy)" }}>{o.clinicalInfo}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {o.status === "completed" ? <Pill tone="ok">Done</Pill> : (
                    <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--teal)" }}>{openId === o.id ? "Close" : "Write report"}</button>
                  )}
                </div>
              </div>
              {openId === o.id && <ReportForm order={o} onDone={() => { setOpenId(null); reload(); }} />}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function RadiologyPage() {
  return (
    <PortalShell audience="staff" title={<>Radiology <em className="italic" style={{ color: "var(--teal)" }}>Worklist</em></>} subtitle="Imaging requests in the order they came in. Updates every 30 seconds.">
      <RadiologyBoard />
    </PortalShell>
  );
}
