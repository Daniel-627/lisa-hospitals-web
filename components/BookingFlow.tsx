"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bookingApi } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { Card, ErrorBox, Field, Spinner, inputCls, inputStyle } from "@/components/ui";
import { Back, Icon, Next } from "@/components/Icon";
import { HOSPITAL } from "@/lib/hospital";

type Doc = { id: string; departmentId: string; department: string; firstName: string; lastName: string; speciality: string };
type TimeOpt = { time: string; doctors: { id: string; name: string }[] };
type Config = { smsVerification: boolean; horizonDays: number; today: string };
type Done = { reference: string; status: string; date: string; time: string; doctor: string; department: string; manageUrl: string };

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const longDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

export default function BookingFlow() {
  const params = useSearchParams();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [loadErr, setLoadErr] = useState("");

  const [deptId, setDeptId] = useState((params.get("dept") ?? params.get("department")) ?? "");
  const [doctorId, setDoctorId] = useState(params.get("doctor") ?? ""); // "" = first available
  const [month, setMonth] = useState<{ y: number; m: number } | null>(null);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<TimeOpt[] | null>(null);
  const [time, setTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, d] = await Promise.all([bookingApi.config(), bookingApi.doctors()]);
        setCfg(c.data.data);
        setDocs(d.data.data);
        const linked = (d.data.data as Doc[]).find((x) => x.id === params.get("doctor"));
        if (linked) { setDeptId(linked.departmentId); setDoctorId(linked.id); }
        else { setDoctorId(""); if (!(d.data.data as Doc[]).some((x) => x.departmentId === (params.get("dept") ?? params.get("department")))) setDeptId(""); }
        const t = c.data.data.today as string;
        setMonth({ y: +t.slice(0, 4), m: +t.slice(5, 7) - 1 });
      } catch (e) { setLoadErr(errMsg(e, "We couldn't load the booking system. Please try again or call us.")); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departments = useMemo(() => {
    const m = new Map<string, string>();
    (docs ?? []).forEach((d) => m.set(d.departmentId, d.department));
    return [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [docs]);
  const deptDocs = useMemo(() => (docs ?? []).filter((d) => d.departmentId === deptId), [docs, deptId]);

  const daysKey = month ? `${deptId}|${doctorId}|${month.y}-${month.m}` : "";
  const [daysRes, setDaysRes] = useState<{ key: string; days: Record<string, number> } | null>(null);
  const loadingDays = !!deptId && !!cfg && daysRes?.key !== daysKey;
  const days = daysRes?.key === daysKey ? daysRes.days : {};
  useEffect(() => {
    if (!deptId || !month || !cfg) return;
    let cancelled = false;
    const first = iso(month.y, month.m, 1);
    const last = iso(month.y, month.m, new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate());
    bookingApi.availability({ departmentId: deptId, doctorId: doctorId || undefined, from: first, to: last })
      .then(({ data }) => { if (!cancelled) setDaysRes({ key: daysKey, days: data.data.days }); })
      .catch((e) => { if (!cancelled) { setError(errMsg(e, "Couldn't load available days")); setDaysRes({ key: daysKey, days: {} }); } });
    return () => { cancelled = true; };
  }, [deptId, doctorId, month, cfg, daysKey]);
  const resetPick = () => { setDate(""); setTimes(null); setTime(""); };

  async function pickDate(d: string) {
    setDate(d); setTime(""); setTimes(null); setError("");
    try {
      const { data } = await bookingApi.slots({ departmentId: deptId, doctorId: doctorId || undefined, date: d });
      setTimes(data.data);
    } catch (e) { setError(errMsg(e, "Couldn't load times")); }
  }

  const chosen = times?.find((t) => t.time === time);
  const resolvedDoctor = doctorId ? deptDocs.find((d) => d.id === doctorId) : null;

  async function sendCode() {
    setError("");
    if (!phone.trim()) { setError("Enter your phone number first"); return; }
    setBusy(true);
    try { await bookingApi.requestOtp(phone); setOtpSent(true); }
    catch (e) { setError(errMsg(e, "Couldn't send the code")); }
    finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!deptId || !date || !time) { setError("Choose a department, day and time first"); return; }
    if (cfg?.smsVerification && !otpSent) { setError("Tap “Send code” to verify your phone number"); return; }
    setBusy(true);
    try {
      const { data } = await bookingApi.create({
        departmentId: deptId, doctorId: doctorId || undefined, date, time,
        guestName: name, guestPhone: phone, guestEmail: email || undefined, reason: reason || undefined,
        otp: cfg?.smsVerification ? otp : undefined, website,
      });
      setDone(data.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(errMsg(err, "We couldn't complete your booking. Please try again."));
      if (err?.response?.status === 409 && date) void pickDate(date); // slot taken → refresh the times
    } finally { setBusy(false); }
  }

  if (loadErr) return <ErrorBox>{loadErr}</ErrorBox>;
  if (!cfg || !docs || !month) return <Spinner label="Loading the booking system..." />;

  if (done) return <Confirmation d={done} />;

  if (docs.length === 0) {
    return (
      <Card>
        <p className="text-sm" style={{ color: "var(--navy)" }}>Online booking isn&apos;t open yet. Please call us on <a className="font-semibold underline" href={`tel:${HOSPITAL.phoneTel}`}>{HOSPITAL.phoneDisplay}</a> to book.</p>
      </Card>
    );
  }

  const horizonEnd = new Date(Date.parse(`${cfg.today}T00:00:00Z`) + cfg.horizonDays * 86400000).toISOString().slice(0, 10);
  const grid = (() => {
    const lead = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
    const n = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  })();
  const canPrev = iso(month.y, month.m, 1) > cfg.today.slice(0, 8) + "01" && !(month.y === +cfg.today.slice(0, 4) && month.m === +cfg.today.slice(5, 7) - 1);
  const canNext = iso(month.y, month.m + 1 > 11 ? 0 : month.m + 1, 1) <= horizonEnd || (month.m === 11 && iso(month.y + 1, 0, 1) <= horizonEnd);
  const move = (n: number) => { resetPick(); setMonth((cur) => { const t = cur!.y * 12 + cur!.m + n; return { y: Math.floor(t / 12), m: t % 12 }; }); };

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && <ErrorBox>{error}</ErrorBox>}

      <Step n={1} title="Who would you like to see?">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Department" htmlFor="dept">
            <select id="dept" className={inputCls} style={inputStyle} value={deptId} onChange={(e) => { setDeptId(e.target.value); setDoctorId(""); resetPick(); }}>
              <option value="">Choose a department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Doctor" htmlFor="doc" hint="Pick “first available” if you don't mind who you see.">
            <select id="doc" className={inputCls} style={inputStyle} value={doctorId} disabled={!deptId} onChange={(e) => { setDoctorId(e.target.value); resetPick(); }}>
              <option value="">First available doctor</option>
              {deptDocs.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} · {d.speciality}</option>)}
            </select>
          </Field>
        </div>
      </Step>

      {deptId && (
        <Step n={2} title="Pick a day and time">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="Previous month" className="w-9 h-9 rounded-lg border disabled:opacity-30" style={{ borderColor: "var(--grey-200)" }}><Back /></button>
                <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{MONTHS[month.m]} {month.y}</div>
                <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label="Next month" className="w-9 h-9 rounded-lg border disabled:opacity-30" style={{ borderColor: "var(--grey-200)" }}><Next /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1" style={{ color: "var(--grey-400)" }} aria-hidden>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1" style={{ opacity: loadingDays ? 0.5 : 1 }}>
                {grid.map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const key = iso(month.y, month.m, d);
                  const free = days[key] ?? 0;
                  const sel = key === date;
                  return (
                    <button
                      key={i} type="button" disabled={free === 0} onClick={() => pickDate(key)}
                      aria-label={`${longDate(key)}${free ? `, ${free} times free` : ", no times"}`} aria-pressed={sel}
                      className="aspect-square rounded-lg text-sm font-medium disabled:cursor-not-allowed"
                      style={{
                        background: sel ? "var(--teal)" : free ? "var(--teal-light)" : "transparent",
                        color: sel ? "white" : free ? "var(--teal-dark)" : "var(--grey-300, #c4c9d0)",
                        textDecoration: free ? "none" : "line-through",
                      }}
                    >{d}</button>
                  );
                })}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--grey-400)" }}>Shaded days have free times. Kenya time (EAT).</p>
            </div>

            <div>
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>{date ? longDate(date) : "Choose a day"}</div>
              {date && !times && <Spinner label="Loading times..." />}
              {times && times.length === 0 && <p className="text-sm" style={{ color: "var(--grey-500)" }}>No times left on this day. Please choose another.</p>}
              {times && times.length > 0 && (
                <div role="radiogroup" aria-label="Available times" className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {times.map((t) => (
                    <button key={t.time} type="button" role="radio" aria-checked={t.time === time} onClick={() => setTime(t.time)}
                      className="py-2.5 rounded-lg text-sm font-semibold border"
                      style={{ background: t.time === time ? "var(--teal)" : "white", color: t.time === time ? "white" : "var(--navy)", borderColor: t.time === time ? "var(--teal)" : "var(--grey-200)" }}>
                      {clock(t.time)}
                    </button>
                  ))}
                </div>
              )}
              {chosen && (
                <p className="text-xs mt-3" style={{ color: "var(--grey-500)" }}>
                  {resolvedDoctor ? `With Dr. ${resolvedDoctor.firstName} ${resolvedDoctor.lastName}` : "A doctor will be assigned to you automatically"}.
                </p>
              )}
            </div>
          </div>
        </Step>
      )}

      {time && (
        <Step n={3} title="Your details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" htmlFor="gname"><input id="gname" required minLength={2} maxLength={150} autoComplete="name" className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Phone number" htmlFor="gphone" hint="We text your booking details here.">
              <input id="gphone" required inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXX" className={inputCls} style={inputStyle} value={phone} onChange={(e) => { setPhone(e.target.value); setOtpSent(false); }} />
            </Field>
            <Field label="Email (optional)" htmlFor="gemail"><input id="gemail" type="email" autoComplete="email" className={inputCls} style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Reason for visit (optional)" htmlFor="greason" hint="Keep it general. Please don't include private medical details.">
              <input id="greason" maxLength={300} className={inputCls} style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            {/* Honeypot: hidden from people, tempting to bots. */}
            <div aria-hidden className="hidden"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>
          </div>

          {cfg.smsVerification && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--grey-100)" }}>
              <div className="flex flex-wrap items-end gap-3">
                <button type="button" onClick={sendCode} disabled={busy || !phone} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--navy)" }}>
                  {otpSent ? "Send a new code" : "Send code"}
                </button>
                {otpSent && (
                  <div className="flex-1 min-w-[10rem]">
                    <Field label="6-digit code" htmlFor="gotp">
                      <input id="gotp" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} className={inputCls} style={inputStyle} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                    </Field>
                  </div>
                )}
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--grey-500)" }}>We verify your number once so nobody can book in your name.</p>
            </div>
          )}

          <p className="text-xs mt-4" style={{ color: "var(--grey-500)" }}>
            We use your name and number only to manage this appointment. See our <Link href="/privacy" className="underline">privacy notice</Link>.
          </p>
          <button type="submit" disabled={busy} className="mt-5 px-8 py-3.5 rounded-lg text-sm font-bold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>
            {busy ? "Booking..." : "Confirm appointment"}
          </button>
        </Step>
      )}
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-3 text-lg mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
        <span className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: "var(--teal)" }} aria-hidden>{n}</span>
        {title}
      </h2>
      <Card>{children}</Card>
    </section>
  );
}

function Confirmation({ d }: { d: Done }) {
  const pending = d.status !== "confirmed";
  const ics = useMemo(() => {
    const [y, mo, da] = d.date.split("-"); const [h, mi] = d.time.split(":");
    const start = `${y}${mo}${da}T${h}${mi}00`;
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lisa Hospitals//Booking//EN", "BEGIN:VEVENT", `UID:${d.reference}@lisahospitals`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, "")}`, `DTSTART;TZID=Africa/Nairobi:${start}`, `DURATION:PT30M`,
      `SUMMARY:Lisa Hospitals: ${d.doctor}`, `LOCATION:${HOSPITAL.name}\\, Nairobi Highway\\, Kisumu`, `DESCRIPTION:Reference ${d.reference}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
  }, [d]);
  return (
    <Card className="text-center">
      <div className="text-4xl mb-3" style={{ color: "var(--teal)" }} aria-hidden><Icon name="success" /></div>
      <h2 className="text-2xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{pending ? "Request received" : "You're booked"}</h2>
      <p className="text-sm mb-6" style={{ color: "var(--grey-500)" }}>
        {pending ? "Our reception will confirm your appointment shortly." : "We've sent the details to your phone."}
      </p>
      <div className="inline-block text-left p-5 rounded-lg mb-6" style={{ background: "var(--grey-100)" }}>
        <div className="text-xs" style={{ color: "var(--grey-400)" }}>Reference</div>
        <div className="text-xl font-bold tracking-wider mb-3" style={{ color: "var(--navy)" }}>{d.reference}</div>
        <div className="text-sm font-medium" style={{ color: "var(--navy)" }}>{longDate(d.date)} at {clock(d.time)}</div>
        <div className="text-sm" style={{ color: "var(--grey-500)" }}>{d.doctor} · {d.department}</div>
      </div>
      <p className="text-xs mb-6" style={{ color: "var(--grey-500)" }}>Please arrive 10 minutes early. Keep your reference; you&apos;ll need it to change or cancel.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href={d.manageUrl.replace(/^https?:\/\/[^/]+/, "")} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Change or cancel</Link>
        <a href={ics} download={`lisa-hospitals-${d.reference}.ics`} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Add to calendar</a>
      </div>
    </Card>
  );
}
