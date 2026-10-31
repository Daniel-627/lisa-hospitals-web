"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { bookingApi } from "@/lib/api";
import { errMsg, todayLocal } from "@/lib/format";

type Doc = { id: string; firstName: string; lastName: string };
const nice = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Content() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [leave, setLeave] = useState<any[] | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState(""); const [flash, setFlash] = useState("");
  const [affected, setAffected] = useState<any[]>([]);
  const [form, setForm] = useState({ doctorId: "", startDate: todayLocal(), endDate: todayLocal(), reason: "" });
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [report, setReport] = useState<any[] | null>(null);
  const [closed, setClosed] = useState<{ id: string; date: string; name: string }[]>([]);
  const [hol, setHol] = useState({ date: todayLocal(), name: "" });
  const [exp, setExp] = useState({ from: todayLocal().slice(0, 8) + "01", to: todayLocal() });

  useEffect(() => { bookingApi.closedDays().then(({ data }) => setClosed(data.data)).catch(() => {}); }, [tick]);
  useEffect(() => { bookingApi.noShowReport(90).then(({ data }) => setReport(data.data.rows)).catch(() => setReport([])); }, []);

  useEffect(() => {
    Promise.all([bookingApi.doctors(), bookingApi.timeOff(), bookingApi.settings()])
      .then(([d, t, s]) => { setDocs(d.data.data); setLeave(t.data.data); setSettings(s.data.data); })
      .catch((e) => setError(errMsg(e, "Couldn't load booking settings")));
  }, [tick]);

  const name = (id: string) => { const d = docs.find((x) => x.id === id); return d ? `Dr. ${d.firstName} ${d.lastName}` : "Doctor"; };

  async function addLeave(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setFlash(""); setAffected([]);
    try {
      const { data } = await bookingApi.addTimeOff({ ...form, reason: form.reason || undefined });
      setAffected(data.data.affectedBookings);
      setFlash(data.data.affectedBookings.length ? `Saved. ${data.data.affectedBookings.length} existing booking(s) fall on these days. Move or cancel them in Bookings.` : "Time off saved. No bookings were affected.");
      setTick((n) => n + 1);
    } catch (err) { setError(errMsg(err, "Couldn't save")); } finally { setBusy(false); }
  }
  async function removeLeave(id: string) {
    if (!window.confirm("Remove this time off? The doctor's slots will open again.")) return;
    try { await bookingApi.deleteTimeOff(id); setTick((n) => n + 1); } catch (err) { setError(errMsg(err, "Couldn't remove")); }
  }
  async function addHoliday(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setFlash("");
    try { const { data } = await bookingApi.addClosedDay(hol); setFlash(data.message); setHol({ ...hol, name: "" }); setTick((n) => n + 1); }
    catch (err) { setError(errMsg(err, "Couldn't save")); } finally { setBusy(false); }
  }
  async function removeHoliday(id: string) {
    if (!window.confirm("Reopen this day for online booking?")) return;
    try { await bookingApi.removeClosedDay(id); setTick((n) => n + 1); } catch (err) { setError(errMsg(err, "Couldn't remove")); }
  }
  async function download(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await bookingApi.exportBookings(exp.from, exp.to);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url; a.download = `lisa-bookings-${exp.from}-to-${exp.to}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      let msg = "Couldn't export";
      try { msg = JSON.parse(await err?.response?.data?.text?.())?.error ?? msg; } catch { /* keep default */ }
      setError(msg);
    } finally { setBusy(false); }
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setFlash("");
    try {
      const { leadMinutes, horizonDays, cutoffHours, maxActivePerPhone } = settings;
      await bookingApi.saveSettings({ leadMinutes: +leadMinutes, horizonDays: +horizonDays, cutoffHours: +cutoffHours, maxActivePerPhone: +maxActivePerPhone });
      setFlash("Settings saved.");
    } catch (err) { setError(errMsg(err, "Couldn't save settings")); } finally { setBusy(false); }
  }

  if (!settings || !leave) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />;
  const num = (k: string, label: string, hint: string, max?: number) => (
    <Field label={label} htmlFor={k} hint={hint}>
      <input id={k} type="number" min={0} max={max} required className={inputCls} style={inputStyle} value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
    </Field>
  );
  return (
    <div className="space-y-6 max-w-3xl">
      {flash && <SuccessBox>{flash}</SuccessBox>}
      {error && <ErrorBox>{error}</ErrorBox>}

      <Card>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>Doctor time off</h2>
        <p className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>Leave, courses or public holidays. Blocked days vanish from online booking straight away. Working hours are set on each doctor&apos;s page under Users.</p>
        <form onSubmit={addLeave} className="grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Doctor" htmlFor="to-doc">
            <select id="to-doc" required className={inputCls} style={inputStyle} value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Choose…</option>{docs.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
          </Field>
          <Field label="From" htmlFor="to-from"><input id="to-from" type="date" required className={inputCls} style={inputStyle} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} /></Field>
          <Field label="To (inclusive)" htmlFor="to-to"><input id="to-to" type="date" required min={form.startDate} className={inputCls} style={inputStyle} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <button disabled={busy} className="px-4 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>Block days</button>
          <div className="sm:col-span-4"><input aria-label="Reason" placeholder="Reason (optional, internal)" maxLength={200} className={inputCls} style={inputStyle} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        </form>

        {affected.length > 0 && (
          <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>
            <div className="font-bold mb-1">Needs rebooking:</div>
            {affected.map((a) => <div key={a.id}>{nice(a.slotDate)} {String(a.slotTime).slice(0, 5)} · {a.guestName} · {a.guestPhone}</div>)}
          </div>
        )}

        <div className="mt-5 divide-y" style={{ borderColor: "var(--grey-200)" }}>
          {leave.length === 0 && <p className="text-sm" style={{ color: "var(--grey-500)" }}>No upcoming time off.</p>}
          {leave.map((l) => (
            <div key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
              <div><span className="font-medium" style={{ color: "var(--navy)" }}>{name(l.doctorId)}</span> <span style={{ color: "var(--grey-500)" }}>· {nice(l.startDate)}{l.endDate !== l.startDate ? ` – ${nice(l.endDate)}` : ""}{l.reason ? ` · ${l.reason}` : ""}</span></div>
              <button onClick={() => removeLeave(l.id)} className="text-xs font-semibold" style={{ color: "var(--danger)" }}>Remove</button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>Closed days (whole hospital)</h2>
        <p className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>Public holidays or any day we&apos;re shut. Online booking closes for every doctor that day. Reception can still book by phone if needed.</p>
        <form onSubmit={addHoliday} className="grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Date" htmlFor="hd-date"><input id="hd-date" type="date" required min={todayLocal()} className={inputCls} style={inputStyle} value={hol.date} onChange={(e) => setHol({ ...hol, date: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Name" htmlFor="hd-name"><input id="hd-name" required minLength={2} maxLength={120} className={inputCls} style={inputStyle} value={hol.name} onChange={(e) => setHol({ ...hol, name: e.target.value })} placeholder="e.g. Jamhuri Day" /></Field></div>
          <button disabled={busy} className="px-4 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>Close this day</button>
        </form>
        <div className="mt-4 divide-y" style={{ borderColor: "var(--grey-200)" }}>
          {closed.length === 0 && <p className="text-sm" style={{ color: "var(--grey-500)" }}>No closed days coming up.</p>}
          {closed.map((c) => (
            <div key={c.id} className="py-2 flex items-center justify-between text-sm"><span style={{ color: "var(--navy)" }}>{nice(c.date)} · {c.name}</span><button onClick={() => removeHoliday(c.id)} className="text-xs font-semibold" style={{ color: "var(--danger)" }}>Reopen</button></div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>Export bookings</h2>
        <p className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>A spreadsheet (CSV) of every booking in the dates, including attended, missed and cancelled. Opens in Excel. Contains patient names and phones, so keep it safe.</p>
        <form onSubmit={download} className="flex flex-wrap items-end gap-3">
          <Field label="From" htmlFor="ex-from"><input id="ex-from" type="date" required className={inputCls} style={inputStyle} value={exp.from} onChange={(e) => setExp({ ...exp, from: e.target.value })} /></Field>
          <Field label="To" htmlFor="ex-to"><input id="ex-to" type="date" required min={exp.from} className={inputCls} style={inputStyle} value={exp.to} onChange={(e) => setExp({ ...exp, to: e.target.value })} /></Field>
          <button disabled={busy} className="px-5 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--navy)" }}>Download CSV</button>
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>Attendance, last 90 days</h2>
        <p className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>Attended = checked in at reception. Missed = marked no-show.</p>
        {!report ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>Loading...</p> : report.length === 0 ? <p className="text-sm" style={{ color: "var(--grey-500)" }}>No appointments to report yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs" style={{ color: "var(--grey-400)" }}><th className="py-1.5 pr-3 font-medium">Doctor</th><th className="pr-3 font-medium">Department</th><th className="pr-3 font-medium">Attended</th><th className="pr-3 font-medium">Missed</th><th className="pr-3 font-medium">Cancelled</th><th className="font-medium">Miss rate</th></tr></thead>
              <tbody>
                {report.map((r) => {
                  const seen = r.attended + r.noShow;
                  return (
                    <tr key={r.doctorId} className="border-t" style={{ borderColor: "var(--grey-100)", color: "var(--navy)" }}>
                      <td className="py-2 pr-3 font-medium">Dr. {r.firstName} {r.lastName}</td><td className="pr-3">{r.department}</td>
                      <td className="pr-3">{r.attended}</td><td className="pr-3">{r.noShow}</td><td className="pr-3">{r.cancelled}</td>
                      <td>{seen ? `${Math.round((r.noShow / seen) * 100)}%` : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Booking rules</h2>
        <form onSubmit={saveSettings} className="grid sm:grid-cols-2 gap-4">
          {num("leadMinutes", "Minimum notice (minutes)", "Online bookings must be at least this far ahead.", 10080)}
          {num("horizonDays", "Book up to (days ahead)", "How far into the future people can book.", 365)}
          {num("cutoffHours", "Self-service cut-off (hours)", "Patients can't cancel or change inside this window. Reception always can.", 336)}
          {num("maxActivePerPhone", "Upcoming bookings per phone", "Stops one number holding lots of slots.", 20)}
          <div className="sm:col-span-2"><button disabled={busy} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>Save rules</button></div>
        </form>
      </Card>
    </div>
  );
}

export default function AdminBookingPage() {
  return (
    <PortalShell audience="admin" title={<>Booking <em className="italic" style={{ color: "var(--teal)" }}>settings</em></>} subtitle="Time off and booking rules">
      <Content />
    </PortalShell>
  );
}
