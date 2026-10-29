"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PortalShell, { useMe } from "@/components/PortalShell";
import SlotPicker from "@/components/SlotPicker";
import { Card, ErrorBox, Field, Pill, Spinner, StatusBadge, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { bookingApi } from "@/lib/api";
import { errMsg, hhmm, todayLocal } from "@/lib/format";

type Booking = {
  id: string; reference: string; status: string; slotDate: string; slotTime: string; guestName: string; guestPhone?: string; reason?: string;
  doctorId: string; doctorName: string; department: string; departmentId: string; source: string; phoneVerified: boolean;
};
type Doc = { id: string; departmentId: string; department: string; firstName: string; lastName: string; speciality: string };

const shift = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const nice = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const clock = (t: string) => { const [h, m] = hhmm(t).split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

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
  const [docs, setDocs] = useState<Doc[]>([]);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [busyId, setBusyId] = useState("");
  const [moving, setMoving] = useState<Booking | null>(null);
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
    }, q ? 300 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [date, span, doctorId, status, q, tick]);

  async function act(b: Booking, to: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(b.id); setError(""); setFlash("");
    try { await bookingApi.staffStatus(b.id, to); setFlash("Updated."); reload(); }
    catch (e) { setError(errMsg(e, "Couldn't update the booking")); }
    finally { setBusyId(""); }
  }

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

  const btn = "px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50";

  return (
    <div className="space-y-5">
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
      {isDoctor && <p className="text-xs" style={{ color: "var(--grey-500)" }}>You see your own schedule: patient names and times only.</p>}

      {!rows ? <Spinner label="Loading bookings..." /> : rows.length === 0 ? (
        <Card><p className="text-sm text-center py-6" style={{ color: "var(--grey-500)" }}>No bookings for this selection.</p></Card>
      ) : grouped.map(([day, list]) => (
        <section key={day}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>{nice(day)}{day === todayLocal() ? " · Today" : ""}</h2>
          <div className="space-y-2">
            {list.map((b) => {
              const live = b.status === "pending" || b.status === "confirmed";
              const past = `${b.slotDate} ${hhmm(b.slotTime)}` <= `${todayLocal()} ${new Date().toTimeString().slice(0, 5)}`;
              return (
                <Card key={b.id} className="!p-4">
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                    <div className="w-20 shrink-0 text-sm font-bold" style={{ color: "var(--navy)" }}>{clock(b.slotTime)}</div>
                    <div className="flex-1 min-w-[14rem]">
                      <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{b.guestName}</div>
                      <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                        {b.guestPhone && <a href={`tel:${b.guestPhone}`} className="underline">{b.guestPhone}</a>}{b.guestPhone && " · "}{b.doctorName} · {b.department}
                      </div>
                      {b.reason && <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>“{b.reason}”</div>}
                      <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>{b.reference} · {b.source === "reception" ? "Booked by reception" : "Booked online"}{b.source === "online" && !b.phoneVerified ? " · phone not verified" : ""}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  {canAct && live && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {b.status === "pending" && <button disabled={busyId === b.id} onClick={() => act(b, "confirmed")} className={btn} style={{ background: "var(--teal)", color: "white" }}>Confirm</button>}
                      <button disabled={busyId === b.id} onClick={() => setMoving(b)} className={btn} style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Move</button>
                      {b.status === "confirmed" && past && <>
                        <button disabled={busyId === b.id} onClick={() => act(b, "completed")} className={btn} style={{ background: "#e6f4ea", color: "#1e6b34" }}>Attended</button>
                        <button disabled={busyId === b.id} onClick={() => act(b, "no_show", "Mark this patient as a no-show?")} className={btn} style={{ background: "var(--grey-100)", color: "var(--grey-500)" }}>No-show</button>
                      </>}
                      <button disabled={busyId === b.id} onClick={() => act(b, "cancelled", "Cancel this appointment? The patient will be texted.")} className={btn} style={{ background: "#fde8e8", color: "var(--danger)" }}>Cancel</button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {moving && <MoveSheet b={moving} onClose={() => setMoving(null)} onDone={() => { setMoving(null); setFlash("Appointment moved. The patient has been texted."); reload(); }} />}
      {creating && <CreateSheet docs={docs} onClose={() => setCreating(false)} onDone={() => { setCreating(false); setFlash("Appointment booked."); reload(); }} />}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
