"use client";

import { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api";
import { errMsg, hhmm, todayLocal } from "@/lib/format";
import { ErrorBox, Field, inputCls, inputStyle } from "@/components/ui";

export type Booking = {
  id: string; reference: string; status: string; slotDate: string; slotTime: string; guestName: string; guestPhone?: string; reason?: string;
  doctorId: string; doctorName: string; department: string; departmentId: string; source: string; phoneVerified: boolean;
  flag?: string | null; flagReason?: string | null; flagSuggestion?: string | null;
  reconfirmedAt?: string | null; checkedInAt?: string | null; callAttempts?: number; lastCallAt?: string | null;
};

export const shift = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
export const nice = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const clock = (t: string) => { const [h, m] = hhmm(t).split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
export const nowHHMM = () => new Date().toTimeString().slice(0, 5);
export const isPast = (b: { slotDate: string; slotTime: string }) => `${b.slotDate} ${hhmm(b.slotTime)}` <= `${todayLocal()} ${nowHHMM()}`;

export const FLAG_LABEL: Record<string, string> = {
  doctor_request: "Doctor can't make it",
  time_off: "Doctor on leave",
  unverified: "Phone not verified",
  repeat_noshow: "Missed earlier appointments",
  holiday: "Hospital closed that day",
};

/** A phone number you can tap (opens the calling app on phones, Phone Link on Windows) and copy. */
export function PhoneLink({ phone }: { phone?: string }) {
  const [copied, setCopied] = useState(false);
  if (!phone) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <a href={`tel:${phone}`} className="underline font-semibold">{phone}</a>
      <button type="button" onClick={() => { void navigator.clipboard?.writeText(phone); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="text-[11px] px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--grey-200)", color: "var(--grey-500)" }} aria-label={`Copy ${phone}`}>
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(10,25,47,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6 bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-xl px-2" style={{ color: "var(--grey-500)" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Cancel with a reason (kept in the audit log; the patient's text just says it was cancelled). */
export function CancelSheet({ b, onClose, onDone }: { b: Booking; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const quick = ["Doctor unavailable", "Patient asked to cancel", "Duplicate booking", "Couldn't reach patient"];
  async function go() {
    setBusy(true); setError("");
    try { await bookingApi.staffStatus(b.id, "cancelled", reason.trim() || undefined); onDone(); }
    catch (e) { setError(errMsg(e, "Couldn't cancel")); setBusy(false); }
  }
  return (
    <Sheet title={`Cancel ${b.guestName}'s appointment`} onClose={onClose}>
      {error && <ErrorBox>{error}</ErrorBox>}
      <p className="text-xs mb-3" style={{ color: "var(--grey-500)" }}>{nice(b.slotDate)} at {clock(b.slotTime)} with {b.doctorName}. The time becomes free for others and the patient is texted.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {quick.map((q) => <button key={q} type="button" onClick={() => setReason(q)} className="px-3 py-1.5 rounded-full text-xs border" style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: reason === q ? "var(--teal-light)" : "white" }}>{q}</button>)}
      </div>
      <input aria-label="Reason" maxLength={200} placeholder="Reason (kept internally)" className={inputCls} style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="flex gap-3 mt-4">
        <button onClick={go} disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--danger)" }}>{busy ? "Cancelling..." : "Cancel appointment"}</button>
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Keep it</button>
      </div>
    </Sheet>
  );
}

/** Doctor: "I can't keep this one" (one booking), or "I can't work this day" (whole day). */
export function RequestSheet({ b, date, onClose, onDone }: { b?: Booking; date?: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = b ? await bookingApi.requestChange(b.id, reason, suggestion || undefined) : await bookingApi.requestDayOff(date!, reason);
      onDone(data.message || "Sent to reception");
    } catch (err) { setError(errMsg(err, "Couldn't send the request")); setBusy(false); }
  }
  return (
    <Sheet title={b ? "Ask reception to rearrange" : `I can't work ${nice(date!)}`} onClose={onClose}>
      {error && <ErrorBox>{error}</ErrorBox>}
      <p className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>
        {b ? `${b.guestName}, ${nice(b.slotDate)} at ${clock(b.slotTime)}. ` : "All your active appointments that day. "}
        The time stays held until reception has called the patient and moved or cancelled it. The patient never sees your reason.
      </p>
      <form onSubmit={go} className="space-y-4">
        <Field label="Reason (internal)" htmlFor="rq-reason"><input id="rq-reason" required minLength={3} maxLength={300} className={inputCls} style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        {b && <Field label="Suggested alternative (optional)" htmlFor="rq-sug" hint="e.g. Thursday after 2pm, or Dr. Otieno"><input id="rq-sug" maxLength={300} className={inputCls} style={inputStyle} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} /></Field>}
        <button disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>{busy ? "Sending..." : "Send to reception"}</button>
      </form>
    </Sheet>
  );
}

/** Past calls on a booking. */
export function CallHistory({ id }: { id: string }) {
  const [rows, setRows] = useState<{ id: string; outcome: string; note?: string; createdAt: string; by?: string }[] | null>(null);
  useEffect(() => { bookingApi.callHistory(id).then(({ data }) => setRows(data.data)).catch(() => setRows([])); }, [id]);
  if (!rows) return <div className="text-xs" style={{ color: "var(--grey-400)" }}>Loading calls...</div>;
  if (rows.length === 0) return <div className="text-xs" style={{ color: "var(--grey-400)" }}>No calls logged yet.</div>;
  return (
    <ul className="text-xs space-y-0.5" style={{ color: "var(--grey-500)" }}>
      {rows.map((r) => (
        <li key={r.id}>{new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {r.by ?? "Staff"} · {r.outcome.replace("_", " ")}{r.note ? ` · ${r.note}` : ""}</li>
      ))}
    </ul>
  );
}

type Waiting = {
  id: string; department: string; guestName: string; guestPhone: string; note?: string | null; fromDate: string; toDate?: string | null;
  callAttempts: number; phoneVerified: boolean; createdAt: string;
  nextFree: { date: string; time: string; doctorId: string; doctor: string } | null;
};

/** People who asked to be told when a time opens. Those with a time free right now are listed first. */
export function WaitlistPanel({ tick, onChanged }: { tick: number; onChanged: (msg?: string) => void }) {
  const [rows, setRows] = useState<Waiting[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bookingApi.waitlist().then(({ data }) => { if (!cancelled) setRows(data.data); }).catch((e) => { if (!cancelled) setError(errMsg(e, "Couldn't load the waiting list")); });
    return () => { cancelled = true; };
  }, [tick]);

  async function run(w: Waiting, fn: () => Promise<any>, msg: string) {
    setBusyId(w.id); setError("");
    try { await fn(); onChanged(msg); }
    catch (e) { setError(errMsg(e, "That didn't work")); }
    finally { setBusyId(""); }
  }
  if (!rows || rows.length === 0) return null;
  const ready = rows.filter((r) => r.nextFree).length;
  const btn = "px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50";
  return (
    <section aria-label="Waiting list">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--navy)" }}>
        Waiting list · {rows.length}
        {ready > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--teal)" }}>{ready} can be offered a time now</span>}
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="space-y-2">
          {error && <ErrorBox>{error}</ErrorBox>}
          {rows.map((w) => (
            <div key={w.id} className="p-3 rounded-lg border bg-white" style={{ borderColor: w.nextFree ? "var(--teal)" : "var(--grey-200)" }}>
              <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
                <div className="flex-1 min-w-[14rem]">
                  <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{w.guestName}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}><PhoneLink phone={w.guestPhone} /> · {w.department}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>Waiting since {new Date(w.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{w.note ? ` · “${w.note}”` : ""}{w.callAttempts ? ` · called ${w.callAttempts}× no answer` : ""}</div>
                  {w.nextFree
                    ? <div className="text-xs mt-1 font-semibold" style={{ color: "var(--teal-dark)" }}>Time open: {nice(w.nextFree.date)} at {clock(w.nextFree.time)} with {w.nextFree.doctor}</div>
                    : <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>Nothing free yet</div>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {w.nextFree && <button disabled={busyId === w.id} onClick={() => run(w, () => bookingApi.waitlistBook(w.id, { date: w.nextFree!.date, time: w.nextFree!.time, doctorId: w.nextFree!.doctorId }), `${w.guestName} booked from the waiting list.`)} className={btn} style={{ background: "var(--teal)", color: "white" }}>Book this time (after they agree)</button>}
                <button disabled={busyId === w.id} onClick={() => run(w, () => bookingApi.waitlistCall(w.id), "No answer logged.")} className={btn} style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>No answer</button>
                <button disabled={busyId === w.id} onClick={() => { if (window.confirm(`Take ${w.guestName} off the waiting list?`)) void run(w, () => bookingApi.waitlistRemove(w.id), "Removed from the waiting list."); }} className={btn} style={{ background: "#fde8e8", color: "var(--danger)" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
