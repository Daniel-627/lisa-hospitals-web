"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner, UrgencyPill, inputCls, inputStyle } from "@/components/ui";
import { departmentsApi, staffApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

type Result = { key: string; visits: any[]; note?: string; error: string };

const ageOf = (dob?: string) => (dob ? `${new Date().getFullYear() - Number(dob.slice(0, 4))}y` : "");
const waited = (iso: string, now: number) => {
  if (!now) return "";
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

// Each role sees the stages in the order that matters to them.
const STAGES: Record<string, [string, string, string][]> = {
  nurse:  [["waiting", "Waiting for triage", "Nobody is waiting for triage."], ["in_triage", "In triage", "Nobody is in triage."], ["triaged", "Ready for the doctor", "Nobody is ready for the doctor."], ["in_progress", "With the doctor", "Nobody is being seen."]],
  doctor: [["triaged", "Ready for the doctor", "Nobody is ready for you."], ["in_progress", "With the doctor", "Nobody is being seen."], ["waiting", "Not triaged yet", "Everyone has been triaged."], ["in_triage", "In triage", "Nobody is in triage."]],
  other:  [["waiting", "Waiting for triage", "Nobody is waiting."], ["in_triage", "In triage", "Nobody is in triage."], ["triaged", "Ready for the doctor", "Nobody is ready."], ["in_progress", "With the doctor", "Nobody is being seen."]],
};

function QueueBoard() {
  const me = useMe();
  const router = useRouter();
  const isNurse = me.role === "nurse";
  const isDoctor = me.role === "doctor";
  const isClinician = isNurse || isDoctor;
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
  const finished = visits.filter((v) => v.status === "completed" || v.status === "left");

  const act = async (v: any, fn: (id: string) => Promise<any>, confirmText?: string, after?: () => void) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(v.id);
    setActionError("");
    try { await fn(v.id); after?.(); } catch (err) { setActionError(errMsg(err, "Couldn't update the queue.")); }
    setTick((n) => n + 1); // refresh straight away
    setBusyId(null);
  };

  const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50";
  const primary = { background: "var(--teal)", color: "white" };
  const quiet = { background: "var(--grey-200)", color: "var(--navy)" };

  const card = (v: any) => {
    const busy = busyId === v.id;
    const open = ["waiting", "in_triage", "triaged", "in_progress"].includes(v.status);
    return (
      <Card key={v.id} className="!p-4 flex items-center gap-4 flex-wrap">
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
            <UrgencyPill level={v.urgencyLevel} />
            {v.isPriority && !v.urgencyLevel && <Pill tone="danger">Priority</Pill>}
            {v.status === "triaged" && v.doctorFirstName && <Pill tone="warn">For Dr. {v.doctorLastName}</Pill>}
            {v.status === "waiting" && v.doctorFirstName && <Pill tone="warn">For Dr. {v.doctorLastName}</Pill>}
            {v.status === "in_progress" && v.doctorFirstName && <Pill tone="ok">With Dr. {v.doctorLastName}</Pill>}
            {open && v.status !== "in_progress" && <span className="text-xs" style={{ color: "var(--grey-400)" }}>waiting {waited(v.arrivedAt, now)}</span>}
            {v.status === "left" && <Pill>Left without being seen</Pill>}
            {v.status === "completed" && <Pill tone="ok">Done</Pill>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/staff/patients/${v.patientId}`} className={btn} style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Open file</Link>

          {isNurse && v.status === "waiting" && <button disabled={busy} onClick={() => act(v, staffApi.startTriage, undefined, () => router.push(`/staff/triage/${v.id}`))} className={btn} style={primary}>Start triage</button>}
          {isNurse && v.status === "waiting" && <button disabled={busy} onClick={() => act(v, staffApi.pickUp, "Treat this patient directly, without triage?")} className={btn} style={quiet}>Treat directly</button>}
          {isNurse && v.status === "in_triage" && <Link href={`/staff/triage/${v.id}`} className={btn} style={primary}>Record vitals</Link>}
          {isNurse && v.status === "in_triage" && <button disabled={busy} onClick={() => act(v, staffApi.cancelTriage)} className={btn} style={quiet}>Back to queue</button>}
          {isNurse && v.status === "triaged" && <Link href={`/staff/triage/${v.id}`} className={btn} style={quiet}>Update vitals</Link>}

          {isDoctor && (v.status === "waiting" || v.status === "triaged") && <button disabled={busy} onClick={() => act(v, staffApi.pickUp, undefined, () => router.push(`/staff/consult/${v.id}`))} className={btn} style={primary}>Pick up</button>}
          {isDoctor && v.status === "in_progress" && <Link href={`/staff/consult/${v.id}`} className={btn} style={primary}>Consult</Link>}

          {isNurse && v.status === "in_progress" && <button disabled={busy} onClick={() => act(v, staffApi.completeVisit, "Mark this visit as completed?")} className={btn} style={primary}>Complete</button>}
          {isClinician && v.status === "in_progress" && <button disabled={busy} onClick={() => act(v, staffApi.releaseVisit)} className={btn} style={quiet}>Back to queue</button>}

          {open && <button disabled={busy} onClick={() => act(v, staffApi.markLeft, "Mark this patient as having left without being seen?")} className={btn} style={{ background: "#fde8e8", color: "var(--danger)" }}>Left</button>}
        </div>
      </Card>
    );
  };

  const section = (title: string, list: any[], empty: string) => (
    <section className="mb-8" key={title}>
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
          {(STAGES[isNurse ? "nurse" : isDoctor ? "doctor" : "other"]).map(([status, title, empty]) => section(title, visits.filter((v) => v.status === status), empty))}
          {showDone && section("Finished today", finished, "Nothing finished yet today.")}
        </>
      )}
    </>
  );
}

export default function QueuePage() {
  return (
    <PortalShell audience="staff" title={<>Department <em className="italic" style={{ color: "var(--teal)" }}>Queue</em></>} subtitle="Emergencies first, then by urgency, then in order of arrival">
      <QueueBoard />
    </PortalShell>
  );
}
