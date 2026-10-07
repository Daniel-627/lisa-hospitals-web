"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner, inputCls, inputStyle } from "@/components/ui";
import { departmentsApi, staffApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

type Result = { key: string; visits: any[]; note?: string; error: string };

const ageOf = (dob?: string) => (dob ? `${new Date().getFullYear() - Number(dob.slice(0, 4))}y` : "");
const waited = (iso: string, now: number) => {
  if (!now) return "";
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

function QueueBoard() {
  const me = useMe();
  const isClinician = me.role === "doctor" || me.role === "nurse";
  const [deptFilter, setDeptFilter] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [depts, setDepts] = useState<any[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    departmentsApi.getAll().then(({ data }) => setDepts(data.data)).catch(() => {});
  }, []);

  // The board refreshes itself every 20 seconds, and the "waiting" clocks tick with it.
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const iv = setInterval(() => { setNow(Date.now()); setTick((n) => n + 1); }, 20000);
    return () => { clearTimeout(first); clearInterval(iv); };
  }, []);

  const key = `${deptFilter}|${showDone}`;
  useEffect(() => {
    let cancelled = false;
    staffApi.queue({ departmentId: deptFilter || undefined, done: showDone || undefined })
      .then(({ data }) => { if (!cancelled) setResult({ key, visits: data.data.visits, note: data.data.note, error: "" }); })
      .catch((err) => { if (!cancelled) setResult((r) => ({ key, visits: r?.key === key ? r.visits : [], error: errMsg(err, "Couldn't load the queue.") })); });
    return () => { cancelled = true; };
  }, [key, deptFilter, showDone, tick]);

  const loading = !result || result.key !== key;
  const visits = loading ? [] : result!.visits;
  const error = actionError || (loading ? "" : result!.error);
  const waiting = visits.filter((v) => v.status === "waiting");
  const inProgress = visits.filter((v) => v.status === "in_progress");
  const finished = visits.filter((v) => v.status === "completed" || v.status === "left");

  const act = async (v: any, fn: (id: string) => Promise<any>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(v.id);
    setActionError("");
    try { await fn(v.id); } catch (err) { setActionError(errMsg(err, "Couldn't update the queue.")); }
    setTick((n) => n + 1); // refresh straight away
    setBusyId(null);
  };

  const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50";

  const card = (v: any) => (
    <Card key={v.id} className="!p-4 flex items-center gap-4 flex-wrap" >
      <div className="text-center shrink-0 w-14">
        <div className="text-2xl font-bold" style={{ color: v.isPriority ? "var(--danger)" : "var(--navy)", fontFamily: "var(--font-display)" }}>#{v.queueNumber}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{v.firstName} {v.lastName}</div>
        <div className="text-xs" style={{ color: "var(--grey-500)" }}>
          {[ageOf(v.dateOfBirth), v.gender, v.patientNumber, !deptFilter && !isClinician ? v.department : ""].filter(Boolean).join(" · ")}
        </div>
        {v.reason && <div className="text-xs mt-0.5" style={{ color: "var(--grey-400)" }}>{v.reason}</div>}
        <div className="flex gap-2 mt-1.5 flex-wrap items-center">
          {v.isPriority && <Pill tone="danger">Priority</Pill>}
          {v.status === "waiting" && v.doctorFirstName && <Pill tone="warn">For Dr. {v.doctorLastName}</Pill>}
          {v.status === "in_progress" && v.doctorFirstName && <Pill tone="ok">With Dr. {v.doctorLastName}</Pill>}
          {v.status === "waiting" && <span className="text-xs" style={{ color: "var(--grey-400)" }}>waiting {waited(v.arrivedAt, now)}</span>}
          {v.status === "left" && <Pill>Left without being seen</Pill>}
          {v.status === "completed" && <Pill tone="ok">Done</Pill>}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Link href={`/staff/patients/${v.patientId}`} className={btn} style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Open file</Link>
        {isClinician && v.status === "waiting" && <button disabled={busyId === v.id} onClick={() => act(v, staffApi.pickUp)} className={btn} style={{ background: "var(--teal)", color: "white" }}>Pick up</button>}
        {isClinician && v.status === "in_progress" && <button disabled={busyId === v.id} onClick={() => act(v, staffApi.completeVisit, "Mark this visit as completed?")} className={btn} style={{ background: "var(--teal)", color: "white" }}>Complete</button>}
        {isClinician && v.status === "in_progress" && <button disabled={busyId === v.id} onClick={() => act(v, staffApi.releaseVisit)} className={btn} style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Back to queue</button>}
        {(v.status === "waiting" || v.status === "in_progress") && <button disabled={busyId === v.id} onClick={() => act(v, staffApi.markLeft, "Mark this patient as having left without being seen?")} className={btn} style={{ background: "#fde8e8", color: "var(--danger)" }}>Left</button>}
      </div>
    </Card>
  );

  const section = (title: string, list: any[], empty: string) => (
    <section className="mb-8">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>{title} <span style={{ color: "var(--grey-400)" }}>({list.length})</span></h2>
      {list.length === 0 ? <p className="text-sm" style={{ color: "var(--grey-400)" }}>{empty}</p> : <div className="space-y-2">{list.map(card)}</div>}
    </section>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {!isClinician && (
          <>
            <label htmlFor="q-dept" className="sr-only">Department</label>
            <select id="q-dept" value={deptFilter} onChange={(e) => { setActionError(""); setDeptFilter(e.target.value); }} className={inputCls} style={{ ...inputStyle, width: "auto" }}>
              <option value="">All departments</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </>
        )}
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--navy)" }}>
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show finished today
        </label>
        {isClinician && <span className="text-xs" style={{ color: "var(--grey-400)" }}>Your department · updates every 20 seconds</span>}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      {!loading && result?.note && <p className="text-sm py-6" style={{ color: "var(--grey-500)" }}>{result.note}</p>}
      {loading ? <Spinner label="Loading the queue..." /> : (
        <>
          {section("Waiting", waiting, "Nobody is waiting.")}
          {section("In progress", inProgress, "Nobody is being seen right now.")}
          {showDone && section("Finished today", finished, "Nothing finished yet today.")}
        </>
      )}
    </>
  );
}

export default function QueuePage() {
  return (
    <PortalShell audience="staff" title={<>Department <em className="italic" style={{ color: "var(--teal)" }}>Queue</em></>} subtitle="Priority patients first, then in order of arrival">
      <QueueBoard />
    </PortalShell>
  );
}
