"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PortalShell, { useMe } from "@/components/PortalShell";
import SlotPicker from "@/components/SlotPicker";
import { Card, ErrorBox, Field, Pill, Spinner, StatusBadge, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { CallHistory, CancelSheet, FLAG_LABEL, PhoneLink, RequestSheet, Sheet, WaitlistPanel, clock, isPast, nice, shift, type Booking } from "@/components/BookingDeskParts";
import Link from "next/link";
import { bookingApi } from "@/lib/api";
import { errMsg, todayLocal } from "@/lib/format";

type Doc = { id: string; departmentId: string; department: string; firstName: string; lastName: string; speciality: string };

type Work = { needsCall: Booking[]; confirmTomorrow: Booking[]; confirmToday: Booking[]; awaitingOutcome: Booking[] };
const btn = "px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50";

/** One booking someone has to phone about. */
function CallItem({ b, mode, busy, onCall, onMove, onCancel, onCheckIn, onNoShow }: {
  b: Booking; mode: "flag" | "confirm" | "outcome"; busy: boolean;
  onCall: (o: "coming" | "no_answer" | "resolved") => void; onMove: () => void; onCancel: () => void; onCheckIn: () => void; onNoShow: () => void;
}) {
  const [history, setHistory] = useState(false);
  const isToday = b.slotDate === todayLocal();
  return (
    <div className="p-3 rounded-lg border" style={{ borderColor: b.flag ? "#f2b8b8" : "var(--grey-200)", background: b.flag ? "#fff7f7" : "white" }}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
        <div className="text-sm font-bold w-28 shrink-0" style={{ color: "var(--navy)" }}>{nice(b.slotDate)}<br />{clock(b.slotTime)}</div>
        <div className="flex-1 min-w-[14rem]">
          <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{b.guestName}</div>
          <div className="text-xs" style={{ color: "var(--grey-500)" }}><PhoneLink phone={b.guestPhone} /> · {b.doctorName} · {b.department}</div>
          {b.flag && (
            <div className="text-xs mt-1 font-semibold" style={{ color: "var(--danger)" }}>
              {FLAG_LABEL[b.flag] ?? b.flag}{b.flagReason ? `: ${b.flagReason}` : ""}{b.flagSuggestion ? ` (suggested: ${b.flagSuggestion})` : ""}
            </div>
          )}
          {!!b.callAttempts && <div className="text-xs mt-1" style={{ color: "var(--gold-dark)" }}>Called {b.callAttempts}× with no answer{b.lastCallAt ? `, last at ${new Date(b.lastCallAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}</div>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {mode !== "outcome" && <button disabled={busy} onClick={() => onCall("coming")} className={btn} style={{ background: "var(--teal)", color: "white" }}>Spoke: coming</button>}
        {mode !== "outcome" && <button disabled={busy} onClick={() => onCall("no_answer")} className={btn} style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>No answer</button>}
        {mode === "flag" && b.flag && (b.flag === "doctor_request" || b.flag === "time_off") && <button disabled={busy} onClick={() => onCall("resolved")} className={btn} style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Doctor can attend</button>}
        {mode === "outcome" && isToday && <button disabled={busy} onClick={onCheckIn} className={btn} style={{ background: "var(--teal)", color: "white" }}>Check in</button>}
        {mode === "outcome" && <button disabled={busy} onClick={onNoShow} className={btn} style={{ background: "var(--grey-100)", color: "var(--grey-500)" }}>No-show</button>}
        <button disabled={busy} onClick={onMove} className={btn} style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Move</button>
        <button disabled={busy} onClick={onCancel} className={btn} style={{ background: "#fde8e8", color: "var(--danger)" }}>Cancel</button>
        <button onClick={() => setHistory(!history)} className={btn} style={{ color: "var(--grey-500)" }}>{history ? "Hide calls" : "Calls"}</button>
      </div>
      {history && <div className="mt-2"><CallHistory id={b.id} /></div>}
    </div>
  );
}

/** The red "to do" panel for reception: everything that needs a phone call or a decision. */
function Attention({ work, act }: { work: Work; act: { call: (b: Booking, o: "coming" | "no_answer" | "resolved") => void; move: (b: Booking) => void; cancel: (b: Booking) => void; checkIn: (b: Booking) => void; noShow: (b: Booking) => void; busyId: string } }) {
  const sections: { key: keyof Work; title: string; hint: string; mode: "flag" | "confirm" | "outcome"; tone: "danger" | "warn" | "muted" }[] = [
    { key: "needsCall", title: "Call now", hint: "Doctor changes, leave, unverified phones and repeat no-shows", mode: "flag", tone: "danger" },
    { key: "confirmToday", title: "Today: not yet confirmed", hint: "Try again this morning", mode: "confirm", tone: "danger" },
    { key: "awaitingOutcome", title: "Awaiting outcome", hint: "Time has passed and they weren't checked in", mode: "outcome", tone: "warn" },
    { key: "confirmTomorrow", title: "Tomorrow's confirmation calls", hint: "Ring each patient to check they're still coming", mode: "confirm", tone: "muted" },
  ];
  const total = sections.reduce((n, x) => n + work[x.key].length, 0);
  const [open, setOpen] = useState<string | null>(null);
  const firstFull = sections.find((x) => work[x.key].length)?.key ?? null;
  const current = open ?? firstFull;
  if (total === 0) return <Card><p className="text-sm" style={{ color: "var(--teal-dark)" }}>Nothing needs a call right now.</p></Card>;
  return (
    <Card>
      <div className="flex flex-wrap gap-2 mb-4">
        {sections.map((x) => (
          <button key={x.key} onClick={() => setOpen(x.key)} aria-pressed={current === x.key} className="px-3 py-2 rounded-lg text-xs font-semibold border"
            style={{ borderColor: current === x.key ? "var(--navy)" : "var(--grey-200)", background: work[x.key].length && x.tone === "danger" ? "#fde8e8" : "white", color: work[x.key].length && x.tone === "danger" ? "var(--danger)" : "var(--navy)" }}>
            {x.title} · {work[x.key].length}
          </button>
        ))}
      </div>
      {sections.filter((x) => x.key === current).map((x) => (
        <div key={x.key}>
          <p className="text-xs mb-3" style={{ color: "var(--grey-500)" }}>{x.hint}</p>
          {work[x.key].length === 0 ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>Nothing here.</p> : (
            <div className="space-y-2">
              {work[x.key].map((b) => (
                <CallItem key={b.id} b={b} mode={x.mode} busy={act.busyId === b.id}
                  onCall={(o) => act.call(b, o)} onMove={() => act.move(b)} onCancel={() => act.cancel(b)} onCheckIn={() => act.checkIn(b)} onNoShow={() => act.noShow(b)} />
              ))}
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

function Desk() {
  const me = useMe();
  const isDoctor = me.role === "doctor";
  const canAct = me.role === "admin" || me.role === "receptionist";

  const [date, setDate] = useState(todayLocal());
  const [span, setSpan] = useState<"day" | "week">("day");
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [work, setWork] = useState<Work | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [busyId, setBusyId] = useState("");
  const [moving, setMoving] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [requesting, setRequesting] = useState<{ b?: Booking; date?: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => { bookingApi.doctors().then(({ data }) => setDocs(data.data)).catch(() => {}); }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      bookingApi.staffList({ from: date, to: span === "week" ? shift(date, 6) : date, doctorId: doctorId || undefined, status: status || undefined, q: q || undefined })
        .then(({ data }) => { if (!cancelled) { setRows(data.data); setError(""); } })
        .catch((e) => { if (!cancelled) { setRows([]); setError(e.response?.status === 403 ? "Your role doesn't have access to bookings." : errMsg(e, "Couldn't load bookings.")); } });
      if (canAct) bookingApi.worklist().then(({ data }) => { if (!cancelled) setWork(data.data); }).catch(() => {});
    }, q ? 300 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [date, span, doctorId, status, q, tick, canAct]);

  // Keep the call list fresh while the desk stays open all day.
  useEffect(() => { if (!canAct) return; const i = setInterval(reload, 120000); return () => clearInterval(i); }, [canAct, reload]);

  async function run(b: Booking, fn: () => Promise<any>, ok: string) {
    setBusyId(b.id); setError(""); setFlash("");
    try { await fn(); setFlash(ok); reload(); }
    catch (e) { setError(errMsg(e, "That didn't work. Please try again.")); }
    finally { setBusyId(""); }
  }
  const setStatusTo = (b: Booking, to: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    void run(b, () => bookingApi.staffStatus(b.id, to), "Updated.");
  };
  const callAct = (b: Booking, o: "coming" | "no_answer" | "resolved") => void run(b, () => bookingApi.logCall(b.id, o), o === "no_answer" ? "No answer logged. It stays on the list." : "Logged.");
  const checkIn = (b: Booking) => void run(b, () => bookingApi.checkIn(b.id), `${b.guestName} checked in.`);
  const noShow = (b: Booking) => { if (window.confirm(`Mark ${b.guestName} as a no-show? They'll get a "we missed you" text.`)) void run(b, () => bookingApi.staffStatus(b.id, "no_show"), "Marked as no-show."); };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (rows ?? []).forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);
  const grouped = useMemo(() => {
    const m = new Map<string, Booking[]>();
    (rows ?? []).forEach((r) => m.set(r.slotDate, [...(m.get(r.slotDate) ?? []), r]));
    return [...m.entries()];
  }, [rows]);
  const attention = work ? work.needsCall.length + work.confirmToday.length + work.awaitingOutcome.length : 0;

  return (
    <div className="space-y-5">
      {canAct && work && (
        <section aria-label="Needs attention">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--navy)" }}>
            To do {attention > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--danger)" }}>{attention} need action</span>}
          </h2>
          <Attention work={work} act={{ call: callAct, move: setMoving, cancel: setCancelling, checkIn, noShow, busyId }} />
        </section>
      )}
      {canAct && <WaitlistPanel tick={tick} onChanged={(m) => { if (m) setFlash(m); reload(); }} />}

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setDate(shift(date, span === "week" ? -7 : -1))} aria-label="Previous" className="w-9 h-9 rounded-lg border" style={{ borderColor: "var(--grey-200)" }}>‹</button>
            <input type="date" aria-label="Date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }} />
            <button onClick={() => setDate(shift(date, span === "week" ? 7 : 1))} aria-label="Next" className="w-9 h-9 rounded-lg border" style={{ borderColor: "var(--grey-200)" }}>›</button>
            <button onClick={() => setDate(todayLocal())} className="ml-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Today</button>
          </div>
          <select aria-label="Range" value={span} onChange={(e) => setSpan(e.target.value as any)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}>
            <option value="day">One day</option><option value="week">7 days</option>
          </select>
          {!isDoctor && (
            <select aria-label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}>
              <option value="">All doctors</option>
              {docs.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
          )}
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}>
            <option value="">Any status</option>
            {["pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          {!isDoctor && <input aria-label="Search" placeholder="Search name, phone, reference" value={q} onChange={(e) => setQ(e.target.value)} className="px-3 py-2 rounded-lg border text-sm flex-1 min-w-[12rem]" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }} />}
          <Link href={`/staff/bookings/print?date=${date}${doctorId ? `&doctorId=${doctorId}` : ""}`} target="_blank" className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Print day list</Link>
          {isDoctor && <button onClick={() => setRequesting({ date })} className="px-4 py-2.5 rounded-lg text-sm font-semibold ml-auto" style={{ background: "#fde8e8", color: "var(--danger)" }}>I can&apos;t work this day</button>}
          {canAct && <button onClick={() => { setCreating(true); setFlash(""); }} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white ml-auto" style={{ background: "var(--teal)" }}>+ Book for a caller</button>}
        </div>
        {rows && rows.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(counts).map(([s, n]) => <Pill key={s} tone={s === "confirmed" ? "ok" : s === "pending" ? "warn" : s === "cancelled" ? "danger" : "muted"}>{n} {s.replace("_", " ")}</Pill>)}
          </div>
        )}
      </Card>

      {flash && <SuccessBox>{flash}</SuccessBox>}
      {error && <ErrorBox>{error}</ErrorBox>}
      {isDoctor && <p className="text-xs" style={{ color: "var(--grey-500)" }}>You see your own schedule: patient names and times only. If you can&apos;t keep an appointment, ask reception to rearrange it.</p>}

      {!rows ? <Spinner label="Loading bookings..." /> : rows.length === 0 ? (
        <Card><p className="text-sm text-center py-6" style={{ color: "var(--grey-500)" }}>No bookings for this selection.</p></Card>
      ) : grouped.map(([day, list]) => (
        <section key={day}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>{nice(day)}{day === todayLocal() ? " · Today" : ""}</h2>
          <div className="space-y-2">
            {list.map((b) => {
              const live = b.status === "pending" || b.status === "confirmed";
              const past = isPast(b);
              const today = b.slotDate === todayLocal();
              return (
                <Card key={b.id} className="!p-4">
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                    <div className="w-20 shrink-0 text-sm font-bold" style={{ color: "var(--navy)" }}>{clock(b.slotTime)}</div>
                    <div className="flex-1 min-w-[14rem]">
                      <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{b.guestName}</div>
                      <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                        {b.guestPhone && <><PhoneLink phone={b.guestPhone} />{" · "}</>}{b.doctorName} · {b.department}
                      </div>
                      {b.flag && live && <div className="text-xs mt-1 font-semibold" style={{ color: "var(--danger)" }}>{FLAG_LABEL[b.flag] ?? b.flag}{b.flagReason ? `: ${b.flagReason}` : ""}{b.flagSuggestion ? ` (suggested: ${b.flagSuggestion})` : ""}</div>}
                      {b.reason && !isDoctor && <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>“{b.reason}”</div>}
                      <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>{b.reference} · {b.source === "reception" ? "Booked by reception" : "Booked online"}{b.reconfirmedAt && live && !b.checkedInAt ? " · confirmed by phone" : ""}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={b.status} />
                      {b.checkedInAt && <Pill tone="ok">Checked in</Pill>}
                    </div>
                  </div>
                  {canAct && live && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {today && !b.checkedInAt && <button disabled={busyId === b.id} onClick={() => checkIn(b)} className={btn} style={{ background: "var(--teal)", color: "white" }}>Check in</button>}
                      {b.status === "pending" && !b.checkedInAt && <button disabled={busyId === b.id} onClick={() => setStatusTo(b, "confirmed")} className={btn} style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Confirm</button>}
                      {b.checkedInAt && <button disabled={busyId === b.id} onClick={() => setStatusTo(b, "completed")} className={btn} style={{ background: "#e6f4ea", color: "#1e6b34" }}>Done</button>}
                      {!b.checkedInAt && <button disabled={busyId === b.id} onClick={() => setMoving(b)} className={btn} style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Move</button>}
                      {!b.checkedInAt && past && <button disabled={busyId === b.id} onClick={() => noShow(b)} className={btn} style={{ background: "var(--grey-100)", color: "var(--grey-500)" }}>No-show</button>}
                      {!b.checkedInAt && <button disabled={busyId === b.id} onClick={() => setCancelling(b)} className={btn} style={{ background: "#fde8e8", color: "var(--danger)" }}>Cancel</button>}
                    </div>
                  )}
                  {isDoctor && live && !b.checkedInAt && !past && (
                    <div className="mt-3"><button onClick={() => setRequesting({ b })} className={btn} style={{ background: "#fde8e8", color: "var(--danger)" }}>I can&apos;t keep this one</button></div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {moving && <MoveSheet b={moving} onClose={() => setMoving(null)} onDone={() => { setMoving(null); setFlash("Appointment moved. The patient has been texted."); reload(); }} />}
      {cancelling && <CancelSheet b={cancelling} onClose={() => setCancelling(null)} onDone={() => { setCancelling(null); setFlash("Appointment cancelled. The slot is free again."); reload(); }} />}
      {requesting && <RequestSheet b={requesting.b} date={requesting.date} onClose={() => setRequesting(null)} onDone={(m) => { setRequesting(null); setFlash(m); reload(); }} />}
      {creating && <CreateSheet docs={docs} onClose={() => setCreating(false)} onDone={() => { setCreating(false); setFlash("Appointment booked."); reload(); }} />}
    </div>
  );
}

function MoveSheet({ b, onClose, onDone }: { b: Booking; onClose: () => void; onDone: () => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [doctorId, setDoctorId] = useState(b.doctorId);
  const [pick, setPick] = useState<{ date: string; time: string; doctorId?: string }>({ date: "", time: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { bookingApi.doctors(b.departmentId).then(({ data }) => setDocs(data.data)).catch(() => {}); }, [b.departmentId]);
  async function save() {
    setBusy(true); setError("");
    try { await bookingApi.staffMove(b.id, { date: pick.date, time: pick.time, doctorId }); onDone(); }
    catch (e) { setError(errMsg(e, "Couldn't move the appointment")); }
    finally { setBusy(false); }
  }
  return (
    <Sheet title={`Move ${b.guestName}`} onClose={onClose}>
      {error && <ErrorBox>{error}</ErrorBox>}
      <p className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>Now: {nice(b.slotDate)} at {clock(b.slotTime)} with {b.doctorName}</p>
      <div className="space-y-4">
        <Field label="Doctor" htmlFor="mv-doc">
          <select id="mv-doc" className={inputCls} style={inputStyle} value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setPick({ date: "", time: "" }); }}>
            {docs.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
          </select>
        </Field>
        <SlotPicker key={doctorId} departmentId={b.departmentId} doctorId={doctorId} onChange={setPick} />
        <button disabled={busy || !pick.time} onClick={save} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ background: "var(--teal)" }}>{busy ? "Moving..." : "Move appointment"}</button>
      </div>
    </Sheet>
  );
}

function CreateSheet({ docs, onClose, onDone }: { docs: Doc[]; onClose: () => void; onDone: () => void }) {
  const depts = useMemo(() => { const m = new Map<string, string>(); docs.forEach((d) => m.set(d.departmentId, d.department)); return [...m.entries()]; }, [docs]);
  const [deptId, setDeptId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [pick, setPick] = useState<{ date: string; time: string; doctorId?: string }>({ date: "", time: "" });
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await bookingApi.staffCreate({ departmentId: deptId, doctorId: doctorId || undefined, date: pick.date, time: pick.time, guestName: name, guestPhone: phone, reason: reason || undefined }); onDone(); }
    catch (err) { setError(errMsg(err, "Couldn't book")); }
    finally { setBusy(false); }
  }
  return (
    <Sheet title="Book for a caller" onClose={onClose}>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={save} className="space-y-4">
        <Field label="Department" htmlFor="cr-dept">
          <select id="cr-dept" required className={inputCls} style={inputStyle} value={deptId} onChange={(e) => { setDeptId(e.target.value); setDoctorId(""); setPick({ date: "", time: "" }); }}>
            <option value="">Choose…</option>{depts.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
          </select>
        </Field>
        {deptId && (
          <Field label="Doctor" htmlFor="cr-doc">
            <select id="cr-doc" className={inputCls} style={inputStyle} value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setPick({ date: "", time: "" }); }}>
              <option value="">First available</option>
              {docs.filter((d) => d.departmentId === deptId).map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
          </Field>
        )}
        {deptId && <SlotPicker key={`${deptId}|${doctorId}`} departmentId={deptId} doctorId={doctorId} onChange={setPick} />}
        {pick.time && (<>
          <Field label="Patient name" htmlFor="cr-name"><input id="cr-name" required minLength={2} className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Phone" htmlFor="cr-phone" hint="They'll get a confirmation SMS."><input id="cr-phone" required inputMode="tel" className={inputCls} style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Note (optional)" htmlFor="cr-reason"><input id="cr-reason" maxLength={300} className={inputCls} style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <button disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>{busy ? "Booking..." : "Book appointment"}</button>
        </>)}
      </form>
    </Sheet>
  );
}

export default function StaffBookingsPage() {
  return (
    <PortalShell audience="staff" title={<>Appoint<em className="italic" style={{ color: "var(--teal)" }}>ments</em></>} subtitle="Time slots, doctors and callers in one place">
      <Desk />
    </PortalShell>
  );
}
