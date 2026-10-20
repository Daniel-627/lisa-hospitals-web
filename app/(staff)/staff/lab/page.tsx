"use client";

import { useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Pill, Spinner, UrgencyPill, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg, fmtDateTime } from "@/lib/format";
import { useWorklist } from "@/lib/useWorklist";
import { Icon } from "@/components/Icon";

type Row = { analyte: string; result: string; unit: string; referenceRange: string; isAbnormal: boolean };
const ageOf = (dob?: string) => (dob ? `${new Date().getFullYear() - Number(dob.slice(0, 4))}y` : "");

function ResultForm({ order, onDone }: { order: any; onDone: () => void }) {
  const [rows, setRows] = useState<Row[]>([{ analyte: order.testName, result: "", unit: "", referenceRange: "", isAbnormal: false }]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rows.some((r) => !r.analyte.trim() || !r.result.trim())) return setError("Each result needs a name and a value.");
    setBusy(true);
    try {
      await staffApi.labResult(order.id, {
        results: rows.map((r) => ({ analyte: r.analyte.trim(), result: r.result.trim(), unit: r.unit.trim() || undefined, referenceRange: r.referenceRange.trim() || undefined, isAbnormal: r.isAbnormal })),
        notes: notes.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(errMsg(err, "Couldn't save the results."));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "var(--grey-100)" }}>
      {error && <ErrorBox>{error}</ErrorBox>}
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
          <input aria-label="Result name" value={r.analyte} onChange={(e) => set(i, { analyte: e.target.value })} className={`${inputCls} col-span-2`} style={inputStyle} placeholder="Name (Haemoglobin)" maxLength={100} />
          <input aria-label="Value" value={r.result} onChange={(e) => set(i, { result: e.target.value })} className={inputCls} style={inputStyle} placeholder="Value" maxLength={500} />
          <input aria-label="Unit" value={r.unit} onChange={(e) => set(i, { unit: e.target.value })} className={inputCls} style={inputStyle} placeholder="Unit" maxLength={50} />
          <input aria-label="Reference range" value={r.referenceRange} onChange={(e) => set(i, { referenceRange: e.target.value })} className={inputCls} style={inputStyle} placeholder="Normal range" maxLength={100} />
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--danger)" }}>
            <input type="checkbox" checked={r.isAbnormal} onChange={(e) => set(i, { isAbnormal: e.target.checked })} /> Abnormal
            {rows.length > 1 && <button type="button" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="ml-2" style={{ color: "var(--grey-400)" }}><Icon name="close" /></button>}
          </label>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { analyte: "", result: "", unit: "", referenceRange: "", isAbnormal: false }])} className="text-sm font-semibold" style={{ color: "var(--teal)" }}>+ Add another value</button>
      <Field label="Notes (optional)" htmlFor={`notes-${order.id}`}><input id={`notes-${order.id}`} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} className={inputCls} style={inputStyle} /></Field>
      <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Saving..." : "Save results and send to the doctor"}</button>
    </form>
  );
}

function LabBoard() {
  const [showDone, setShowDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const { rows, loading, error, reload } = useWorklist(() => staffApi.labWorklist({ done: showDone || undefined }), String(showDone));

  const collect = async (id: string) => {
    setActionError("");
    try { await staffApi.labCollect(id); } catch (err) { setActionError(errMsg(err, "Couldn't update that order.")); }
    reload();
  };

  return (
    <>
      <label className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--navy)" }}>
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed (last 2 days)
      </label>
      {(actionError || error) && <ErrorBox>{actionError || error}</ErrorBox>}
      {loading ? <Spinner label="Loading the lab list..." /> : rows.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>No tests waiting.</p>
      ) : (
        <div className="space-y-2 max-w-4xl">
          {rows.map((o: any) => (
            <Card key={o.id} className="!p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{o.testName}{o.testCode ? ` (${o.testCode})` : ""}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                    {o.firstName} {o.lastName} · {[ageOf(o.dateOfBirth), o.gender, o.patientNumber].filter(Boolean).join(" · ")}
                  </div>
                  <div className="text-xs" style={{ color: "var(--grey-400)" }}>Ordered by Dr. {o.doctorLast} · {fmtDateTime(o.createdAt)}</div>
                  {o.instructions && <div className="text-xs mt-1" style={{ color: "var(--navy)" }}>{o.instructions}</div>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <UrgencyPill level={o.urgency} />
                  {o.status === "collected" && <Pill tone="ok">Sample collected</Pill>}
                  {o.status === "completed" && <Pill tone="ok">Done</Pill>}
                  {o.status === "pending" && <button onClick={() => collect(o.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Sample collected</button>}
                  {o.status !== "completed" && <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--teal)" }}>{openId === o.id ? "Close" : "Enter results"}</button>}
                </div>
              </div>
              {openId === o.id && <ResultForm order={o} onDone={() => { setOpenId(null); reload(); }} />}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function LabPage() {
  return (
    <PortalShell audience="staff" title={<>Laboratory <em className="italic" style={{ color: "var(--teal)" }}>Worklist</em></>} subtitle="Most urgent first. Updates every 30 seconds.">
      <LabBoard />
    </PortalShell>
  );
}
