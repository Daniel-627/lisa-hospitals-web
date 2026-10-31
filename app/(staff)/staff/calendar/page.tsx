"use client";

import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { Sheet, clock, nice } from "@/components/BookingDeskParts";
import { bookingApi } from "@/lib/api";
import { DAYS, errMsg, hhmm, todayLocal } from "@/lib/format";

type Block = { dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number; walkinSlots: number };
type Off = { id: string; startDate: string; endDate: string; startTime: string | null; endTime: string | null; reason: string | null };
type Cal = { from: string; to: string; hours: any[]; timeOff: Off[]; bookingCounts: Record<string, number>; holidays: { id: string; date: string; name: string }[] };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const dow = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();
// Starting point for a doctor who hasn't set hours yet: every day of the week, which they then trim.
const TEMPLATE: Block[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startTime: "08:00", endTime: "17:00", slotMinutes: 20, walkinSlots: 0 }));

function Hours({ initial, saved, onSaved }: { initial: Block[]; saved: boolean; onSaved: () => void }) {
  const [blocks, setBlocks] = useState<Block[]>(initial.length ? initial : TEMPLATE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [flash, setFlash] = useState("");
  const update = (i: number, p: Partial<Block>) => setBlocks(blocks.map((b, k) => (k === i ? { ...b, ...p } : b)));
  const working = new Set(blocks.map((b) => b.dayOfWeek));
  const toggleDay = (d: number) => setBlocks(working.has(d) ? blocks.filter((b) => b.dayOfWeek !== d) : [...blocks, { dayOfWeek: d, startTime: "08:00", endTime: "17:00", slotMinutes: 20, walkinSlots: 0 }]);
  const ordered = blocks.map((b, i) => ({ b, i })).sort((x, y) => x.b.dayOfWeek - y.b.dayOfWeek || x.b.startTime.localeCompare(y.b.startTime));

  async function save() {
    setBusy(true); setError(""); setFlash("");
    try { await bookingApi.mySaveHours(blocks); setFlash("Saved. Patients can now book these times."); onSaved(); }
    catch (e) { setError(errMsg(e, "Couldn't save your hours")); }
    finally { setBusy(false); }
  }
  const sel = "px-3 py-2 rounded-lg border text-sm";
  const st = { borderColor: "var(--grey-200)", color: "var(--navy)" };
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>My weekly hours</h2>
        <p className="text-xs mt-1" style={{ color: "var(--grey-500)" }}>
          {saved ? "Patients can book the times below. Change them any time; existing bookings stay." : "Nothing is bookable until you save your hours. Untick the days you don't work."}
        </p>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}{flash && <SuccessBox>{flash}</SuccessBox>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Working days">
        {DAYS.map((n, d) => (
          <button key={n} type="button" onClick={() => toggleDay(d)} aria-pressed={working.has(d)} className="px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ background: working.has(d) ? "var(--teal)" : "white", color: working.has(d) ? "white" : "var(--grey-500)", borderColor: working.has(d) ? "var(--teal)" : "var(--grey-200)" }}>{n.slice(0, 3)}</button>
        ))}
      </div>
      <div className="space-y-3">
        {ordered.map(({ b, i }) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select aria-label="Day" className={sel} style={st} value={b.dayOfWeek} onChange={(e) => update(i, { dayOfWeek: +e.target.value })}>{DAYS.map((n, d) => <option key={n} value={d}>{n}</option>)}</select>
            <input aria-label="Start" type="time" className={sel} style={st} value={b.startTime} onChange={(e) => update(i, { startTime: e.target.value })} />
            <span style={{ color: "var(--grey-400)" }}>to</span>
            <input aria-label="End" type="time" className={sel} style={st} value={b.endTime} onChange={(e) => update(i, { endTime: e.target.value })} />
            <select aria-label="Appointment length" className={sel} style={st} value={b.slotMinutes} onChange={(e) => update(i, { slotMinutes: +e.target.value })}>{[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min each</option>)}</select>
            <select aria-label="Walk-in hold" className={sel} style={st} value={b.walkinSlots} onChange={(e) => update(i, { walkinSlots: +e.target.value })}>
              <option value={0}>No walk-in hold</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Hold last {n} for walk-ins</option>)}
            </select>
            <button type="button" onClick={() => setBlocks(blocks.filter((_, k) => k !== i))} className="px-2 py-2 text-xs font-semibold" style={{ color: "var(--danger)" }}>Remove</button>
          </div>
        ))}
        {blocks.length === 0 && <p className="text-sm" style={{ color: "var(--grey-500)" }}>No working days. Patients can&apos;t book you.</p>}
      </div>
      <div className="flex gap-3 flex-wrap">
        <button type="button" onClick={() => setBlocks([...blocks, { dayOfWeek: 1, startTime: "14:00", endTime: "17:00", slotMinutes: 20, walkinSlots: 0 }])} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>+ Add another block (e.g. afternoon)</button>
        <button disabled={busy} onClick={save} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Saving..." : "Save my hours"}</button>
      </div>
    </Card>
  );
}

function BlockSheet({ date, cal, onClose, onDone }: { date: string; cal: Cal; onClose: () => void; onDone: (msg: string) => void }) {
  const here = cal.timeOff.filter((o) => o.startDate <= date && o.endDate >= date);
  const [mode, setMode] = useState<"day" | "hours">("day");
  const [endDate, setEndDate] = useState(date);
  const [from, setFrom] = useState("12:00"); const [to, setTo] = useState("14:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const booked = cal.bookingCounts[date] ?? 0;

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const body = mode === "day" ? { startDate: date, endDate, reason: reason || undefined } : { startDate: date, startTime: from, endTime: to, reason: reason || undefined };
      const { data } = await bookingApi.myAddTimeOff(body);
      onDone(data.message);
    } catch (err) { setError(errMsg(err, "Couldn't save")); setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true); setError("");
    try { await bookingApi.myDeleteTimeOff(id); onDone("Removed. Patients can book that time again."); }
    catch (err) { setError(errMsg(err, "Couldn't remove")); setBusy(false); }
  }
  return (
    <Sheet title={nice(date)} onClose={onClose}>
      {error && <ErrorBox>{error}</ErrorBox>}
      {booked > 0 && <p className="text-xs mb-3 p-2 rounded-lg" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>{booked} patient{booked === 1 ? " is" : "s are"} booked this day. If you block time that covers them, reception is told to call and rearrange them.</p>}
      {here.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-xs font-semibold" style={{ color: "var(--navy)" }}>Already blocked</div>
          {here.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 text-sm p-2 rounded-lg" style={{ background: "var(--grey-100)" }}>
              <span style={{ color: "var(--navy)" }}>{o.startTime ? `${clock(o.startTime)} to ${clock(o.endTime!)}` : o.endDate !== o.startDate ? `${nice(o.startDate)} to ${nice(o.endDate)}` : "Whole day"}{o.reason ? ` · ${o.reason}` : ""}</span>
              <button disabled={busy} onClick={() => remove(o.id)} className="text-xs font-semibold" style={{ color: "var(--danger)" }}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {date >= todayLocal() ? (
        <form onSubmit={save} className="space-y-4">
          <div className="flex gap-2" role="radiogroup" aria-label="What to block">
            {([["day", "Whole day"], ["hours", "Some hours"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className="px-4 py-2 rounded-lg text-sm font-semibold border"
                style={{ background: mode === k ? "var(--navy)" : "white", color: mode === k ? "white" : "var(--navy)", borderColor: "var(--grey-200)" }}>{l}</button>
            ))}
          </div>
          {mode === "day" ? (
            <Field label="Until (inclusive)" htmlFor="bl-end" hint="Leave as it is for just this day, or pick a later date for a leave period."><input id="bl-end" type="date" min={date} className={inputCls} style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor="bl-from"><input id="bl-from" type="time" required className={inputCls} style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
              <Field label="To" htmlFor="bl-to"><input id="bl-to" type="time" required className={inputCls} style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            </div>
          )}
          <Field label="Reason (internal, optional)" htmlFor="bl-reason"><input id="bl-reason" maxLength={200} className={inputCls} style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <button disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--danger)" }}>{busy ? "Saving..." : "Block this time"}</button>
        </form>
      ) : <p className="text-sm" style={{ color: "var(--grey-500)" }}>This day has passed.</p>}
    </Sheet>
  );
}

function Content() {
  const [month, setMonth] = useState(() => ({ y: +todayLocal().slice(0, 4), m: +todayLocal().slice(5, 7) - 1 }));
  const key = `${month.y}-${String(month.m + 1).padStart(2, "0")}`;
  const [res, setRes] = useState<{ key: string; cal?: Cal; error: string } | null>(null);
  const [tick, setTick] = useState(0);
  const [pick, setPick] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    let cancelled = false;
    bookingApi.myCalendar(key)
      .then(({ data }) => { if (!cancelled) setRes({ key, cal: data.data, error: "" }); })
      .catch((e) => { if (!cancelled) setRes({ key, error: errMsg(e, "Couldn't load your calendar") }); });
    return () => { cancelled = true; };
  }, [key, tick]);

  const cal = res?.key === key ? res.cal : undefined;
  const error = res?.key === key ? res.error : "";
  const grid = useMemo(() => {
    const lead = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
    const n = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)] as (number | null)[];
  }, [month]);
  const move = (n: number) => setMonth((c) => { const t = c.y * 12 + c.m + n; return { y: Math.floor(t / 12), m: t % 12 }; });

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!cal) return <Spinner label="Loading your calendar..." />;
  const hoursByDow = new Set(cal.hours.map((h) => h.dayOfWeek));
  const blocks: Block[] = cal.hours.map((h) => ({ dayOfWeek: h.dayOfWeek, startTime: hhmm(h.startTime), endTime: hhmm(h.endTime), slotMinutes: h.slotMinutes ?? 20, walkinSlots: h.walkinSlots ?? 0 }));
  const offOn = (d: string) => cal.timeOff.filter((o) => o.startDate <= d && o.endDate >= d);

  return (
    <div className="space-y-6">
      {flash && <SuccessBox>{flash}</SuccessBox>}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => move(-1)} aria-label="Previous month" className="w-9 h-9 rounded-lg border" style={{ borderColor: "var(--grey-200)" }}>‹</button>
          <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{MONTHS[month.m]} {month.y}</div>
          <button onClick={() => move(1)} aria-label="Next month" className="w-9 h-9 rounded-lg border" style={{ borderColor: "var(--grey-200)" }}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1" style={{ color: "var(--grey-400)" }} aria-hidden>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (d === null) return <div key={i} />;
            const date = iso(month.y, month.m, d);
            const offs = offOn(date);
            const whole = offs.some((o) => !o.startTime);
            const part = !whole && offs.length > 0;
            const hol = cal.holidays.find((h) => h.date === date);
            const works = hoursByDow.has(dow(date));
            const n = cal.bookingCounts[date] ?? 0;
            const past = date < todayLocal();
            return (
              <button key={i} onClick={() => { setPick(date); setFlash(""); }} aria-label={`${nice(date)}${whole ? ", day off" : part ? ", part of the day off" : ""}${hol ? `, closed: ${hol.name}` : ""}${n ? `, ${n} booked` : ""}`}
                className="min-h-[3.5rem] rounded-lg p-1 text-left border flex flex-col" style={{
                  background: hol ? "var(--grey-100)" : whole ? "#fde8e8" : part ? "var(--gold-light)" : works ? "white" : "var(--grey-100)",
                  borderColor: date === todayLocal() ? "var(--teal)" : "var(--grey-200)", opacity: past ? 0.55 : 1,
                }}>
                <span className="text-xs font-semibold" style={{ color: "var(--navy)" }}>{d}</span>
                <span className="text-[10px] leading-tight mt-auto" style={{ color: whole ? "var(--danger)" : "var(--grey-500)" }}>
                  {hol ? "Closed" : whole ? "Off" : part ? "Part off" : !works ? "Not working" : ""}{n ? `${hol || whole || part || !works ? " · " : ""}${n} booked` : ""}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--grey-500)" }}>Click a day to block it or some of its hours. Red = day off, amber = part of the day off, grey = not a working day or the hospital is closed.</p>
      </Card>
      <Hours key={tick + "-" + blocks.length} initial={blocks} saved={blocks.length > 0} onSaved={() => setTick((n) => n + 1)} />
      {pick && <BlockSheet date={pick} cal={cal} onClose={() => setPick("")} onDone={(m) => { setPick(""); setFlash(m); setTick((n) => n + 1); }} />}
    </div>
  );
}

export default function DoctorCalendarPage() {
  return (
    <PortalShell audience="staff" title={<>My <em className="italic" style={{ color: "var(--teal)" }}>calendar</em></>} subtitle="Your hours and the times you can't be booked">
      <Content />
    </PortalShell>
  );
}
