"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { bookingApi, type BookingProof } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { Card, ErrorBox, Field, Spinner, SuccessBox, StatusBadge, inputCls, inputStyle } from "@/components/ui";
import { HOSPITAL } from "@/lib/hospital";

type B = { reference: string; status: string; date: string; time: string; doctor: string; doctorId: string; department: string; departmentId: string; guestName: string; phoneMasked: string; rescheduleCount: number };

const longDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

export default function ManageBooking() {
  const sp = useSearchParams();
  const [ref, setRef] = useState(sp.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [proof, setProof] = useState<BookingProof | null>(null);
  const [b, setB] = useState<B | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"view" | "move" | "cancel">("view");
  const linked = useRef(false);

  async function find(p: BookingProof) {
    setBusy(true); setError("");
    try { const { data } = await bookingApi.lookup(p); setB(data.data); setProof(p); setMode("view"); }
    catch (e) { setError(errMsg(e, "We couldn't find that booking")); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const t = sp.get("t"), r = sp.get("ref");
    if (t && r && !linked.current) { linked.current = true; void find({ reference: r, token: t }); }
  }, [sp]);

  async function doCancel() {
    if (!proof) return;
    setBusy(true); setError("");
    try { await bookingApi.cancel(proof); setNotice("Your appointment has been cancelled."); await find(proof); }
    catch (e) { setError(errMsg(e, "Couldn't cancel")); setBusy(false); }
  }

  if (!b) {
    return (
      <Card>
        {error && <ErrorBox>{error}</ErrorBox>}
        <form onSubmit={(e) => { e.preventDefault(); void find({ reference: ref, phone }); }} className="space-y-4">
          <Field label="Booking reference" htmlFor="mref" hint="Starts with LH- (in your confirmation SMS)">
            <input id="mref" required className={inputCls} style={inputStyle} value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="LH-XXXXXX" />
          </Field>
          <Field label="Phone number used to book" htmlFor="mphone">
            <input id="mphone" required inputMode="tel" className={inputCls} style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <button disabled={busy} className="px-6 py-3 rounded-lg text-sm font-bold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>{busy ? "Looking..." : "Find my booking"}</button>
        </form>
        {busy && sp.get("t") && <Spinner label="Opening your booking..." />}
      </Card>
    );
  }

  const live = b.status === "pending" || b.status === "confirmed";
  return (
    <div className="space-y-5">
      {notice && <SuccessBox>{notice}</SuccessBox>}
      {error && <ErrorBox>{error}</ErrorBox>}
      <Card>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-xs" style={{ color: "var(--grey-400)" }}>Reference</div>
            <div className="text-xl font-bold tracking-wider" style={{ color: "var(--navy)" }}>{b.reference}</div>
          </div>
          <StatusBadge status={b.status} />
        </div>
        <div className="text-sm font-medium" style={{ color: "var(--navy)" }}>{longDate(b.date)} at {clock(b.time)}</div>
        <div className="text-sm" style={{ color: "var(--grey-500)" }}>{b.doctor} · {b.department}</div>
        <div className="text-xs mt-2" style={{ color: "var(--grey-400)" }}>{b.guestName} · {b.phoneMasked}</div>

        {live && mode === "view" && (
          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => { setMode("move"); setNotice(""); setError(""); }} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Change time</button>
            <button onClick={() => { setMode("cancel"); setNotice(""); setError(""); }} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#fde8e8", color: "var(--danger)" }}>Cancel appointment</button>
          </div>
        )}
        {!live && <p className="text-sm mt-5" style={{ color: "var(--grey-500)" }}>This appointment is {b.status.replace("_", " ")}. <Link href="/book" className="font-semibold underline">Book a new one</Link>.</p>}
        {live && b.rescheduleCount >= 2 && mode === "view" && <p className="text-xs mt-4" style={{ color: "var(--grey-500)" }}>This appointment has been moved twice. To change it again, call <a href={`tel:${HOSPITAL.phoneTel}`} className="underline">{HOSPITAL.phoneDisplay}</a>.</p>}
      </Card>

      {mode === "cancel" && (
        <Card>
          <p className="text-sm mb-4" style={{ color: "var(--navy)" }}>Cancel this appointment? The time will be released for other patients.</p>
          <div className="flex gap-3">
            <button onClick={doCancel} disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--danger)" }}>{busy ? "Cancelling..." : "Yes, cancel it"}</button>
            <button onClick={() => setMode("view")} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Keep it</button>
          </div>
        </Card>
      )}

      {mode === "move" && proof && (
        <Mover b={b} proof={proof} onDone={(nb) => { setB(nb); setMode("view"); setNotice("Your appointment has been moved."); }} onCancel={() => setMode("view")} setError={setError} />
      )}
    </div>
  );
}

function Mover({ b, proof, onDone, onCancel, setError }: { b: B; proof: BookingProof; onDone: (b: B) => void; onCancel: () => void; setError: (s: string) => void }) {
  const [days, setDays] = useState<Record<string, number> | null>(null);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<{ time: string }[] | null>(null);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { data } = await bookingApi.availability({ departmentId: b.departmentId, doctorId: b.doctorId }); setDays(data.data.days); }
      catch (e) { setError(errMsg(e, "Couldn't load available days")); setDays({}); }
    })();
  }, [b.departmentId, b.doctorId, setError]);

  async function pick(d: string) {
    setDate(d); setTime(""); setTimes(null); setError("");
    try { const { data } = await bookingApi.slots({ departmentId: b.departmentId, doctorId: b.doctorId, date: d }); setTimes(data.data); }
    catch (e) { setError(errMsg(e, "Couldn't load times")); }
  }
  async function save() {
    setBusy(true); setError("");
    try { const { data } = await bookingApi.reschedule({ ...proof, date, time }); onDone(data.data); }
    catch (e) { setError(errMsg(e, "Couldn't change the time")); if (date) void pick(date); }
    finally { setBusy(false); }
  }

  if (!days) return <Spinner label="Loading available days..." />;
  const keys = Object.keys(days).sort();
  return (
    <Card>
      <div className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Choose a new day with {b.doctor}</div>
      {keys.length === 0 ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>No other times are open with this doctor. Please call us.</p> : (
        <div className="flex flex-wrap gap-2 mb-5">
          {keys.map((k) => (
            <button key={k} onClick={() => pick(k)} aria-pressed={k === date} className="px-3 py-2 rounded-lg text-xs font-semibold border"
              style={{ background: k === date ? "var(--teal)" : "white", color: k === date ? "white" : "var(--navy)", borderColor: k === date ? "var(--teal)" : "var(--grey-200)" }}>{shortDate(k)}</button>
          ))}
        </div>
      )}
      {date && !times && <Spinner label="Loading times..." />}
      {times && times.length === 0 && <p className="text-sm mb-4" style={{ color: "var(--grey-500)" }}>No times left that day.</p>}
      {times && times.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
          {times.map((t) => (
            <button key={t.time} onClick={() => setTime(t.time)} aria-pressed={t.time === time} className="py-2.5 rounded-lg text-sm font-semibold border"
              style={{ background: t.time === time ? "var(--teal)" : "white", color: t.time === time ? "white" : "var(--navy)", borderColor: t.time === time ? "var(--teal)" : "var(--grey-200)" }}>{clock(t.time)}</button>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={save} disabled={!time || busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ background: "var(--teal)" }}>{busy ? "Saving..." : "Confirm new time"}</button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Back</button>
      </div>
    </Card>
  );
}
