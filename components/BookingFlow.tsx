"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bookingApi } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { Card, ErrorBox, Field, Spinner, inputCls, inputStyle } from "@/components/ui";
import { Back, Icon, Next } from "@/components/Icon";
import { HOSPITAL } from "@/lib/hospital";
import { dateLocale, serviceName, tr, useLang, type Lang, type TrKey } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";

type Doc = { id: string; departmentId: string; department: string; firstName: string; lastName: string; speciality: string };
type Service = { id: string; departmentId: string; name: string; nameSw?: string | null; durationMin: number; doctorIds: string[] };
type TimeOpt = { time: string; doctors: { id: string; name: string }[] };
type Config = { smsVerification: boolean; horizonDays: number; today: string };
type Done = { reference: string; status: string; date: string; time: string; doctor: string; department: string; manageUrl: string };

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const longDate = (d: string, lang: Lang) => new Date(`${d}T00:00:00Z`).toLocaleDateString(dateLocale(lang), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthName = (y: number, m: number, lang: Lang) => new Date(Date.UTC(y, m, 1)).toLocaleDateString(dateLocale(lang), { month: "long", timeZone: "UTC" });
const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

export default function BookingFlow() {
  const params = useSearchParams();
  const [lang] = useLang();
  const T = (k: TrKey, v?: Record<string, string | number>) => tr(lang, k, v);

  const [cfg, setCfg] = useState<Config | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [closed, setClosed] = useState<Record<string, string>>({});
  const [loadErr, setLoadErr] = useState("");

  const [deptId, setDeptId] = useState(params.get("dept") ?? params.get("department") ?? "");
  const [serviceId, setServiceId] = useState("");
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
        const [c, d, h] = await Promise.all([bookingApi.config(), bookingApi.doctors(), bookingApi.closedDays().catch(() => ({ data: { data: [] } }))]);
        setCfg(c.data.data);
        setDocs(d.data.data);
        setClosed(Object.fromEntries((h.data.data as { date: string; name: string }[]).map((x) => [x.date, x.name])));
        const all = d.data.data as Doc[];
        const linked = all.find((x) => x.id === params.get("doctor"));
        if (linked) { setDeptId(linked.departmentId); setDoctorId(linked.id); }
        else { setDoctorId(""); if (!all.some((x) => x.departmentId === (params.get("dept") ?? params.get("department")))) setDeptId(""); }
        const t = c.data.data.today as string;
        setMonth({ y: +t.slice(0, 4), m: +t.slice(5, 7) - 1 });
      } catch (e) { setLoadErr(errMsg(e, tr("en", "loadFail"))); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departments = useMemo(() => {
    const m = new Map<string, string>();
    (docs ?? []).forEach((d) => m.set(d.departmentId, d.department));
    return [...m.entries()].map(([id, n]) => ({ id, name: n })).sort((a, b) => a.name.localeCompare(b.name));
  }, [docs]);

  // Services of the chosen department (if it has any, the patient picks one first).
  const [svcRes, setSvcRes] = useState<{ dept: string; rows: Service[] } | null>(null);
  const services = svcRes?.dept === deptId ? svcRes.rows : [];
  useEffect(() => {
    if (!deptId) return;
    let cancelled = false;
    bookingApi.services(deptId).then(({ data }) => { if (!cancelled) setSvcRes({ dept: deptId, rows: data.data }); }).catch(() => { if (!cancelled) setSvcRes({ dept: deptId, rows: [] }); });
    return () => { cancelled = true; };
  }, [deptId]);
  const service = services.find((s) => s.id === serviceId);
  const needsService = services.length > 0;
  const deptDocs = useMemo(() => (docs ?? []).filter((d) => d.departmentId === deptId && (!service || service.doctorIds.includes(d.id))), [docs, deptId, service]);
  const ready = !!deptId && (!needsService || !!serviceId);

  const daysKey = month ? `${deptId}|${serviceId}|${doctorId}|${month.y}-${month.m}` : "";
  const [daysRes, setDaysRes] = useState<{ key: string; days: Record<string, number> } | null>(null);
  const loadingDays = ready && !!cfg && daysRes?.key !== daysKey;
  const days = daysRes?.key === daysKey ? daysRes.days : {};
  useEffect(() => {
    if (!ready || !month || !cfg) return;
    let cancelled = false;
    const first = iso(month.y, month.m, 1);
    const last = iso(month.y, month.m, new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate());
    bookingApi.availability({ departmentId: deptId, serviceId: serviceId || undefined, doctorId: doctorId || undefined, from: first, to: last })
      .then(({ data }) => { if (!cancelled) setDaysRes({ key: daysKey, days: data.data.days }); })
      .catch((e) => { if (!cancelled) { setError(errMsg(e, T("loadFail"))); setDaysRes({ key: daysKey, days: {} }); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, deptId, serviceId, doctorId, month, cfg, daysKey]);
  const resetPick = () => { setDate(""); setTimes(null); setTime(""); };

  async function pickDate(d: string) {
    setDate(d); setTime(""); setTimes(null); setError("");
    try {
      const { data } = await bookingApi.slots({ departmentId: deptId, serviceId: serviceId || undefined, doctorId: doctorId || undefined, date: d });
      setTimes(data.data);
    } catch (e) { setError(errMsg(e, T("loadFail"))); }
  }

  const chosen = times?.find((t) => t.time === time);
  const resolvedDoctor = doctorId ? deptDocs.find((d) => d.id === doctorId) : null;

  async function sendCode() {
    setError("");
    if (!phone.trim()) { setError(T("phone")); return; }
    setBusy(true);
    try { await bookingApi.requestOtp(phone, lang); setOtpSent(true); }
    catch (e) { setError(errMsg(e, T("bookFail"))); }
    finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ready || !date || !time) { setError(T("pickFirst")); return; }
    if (cfg?.smsVerification && !otpSent) { setError(T("needCode")); return; }
    setBusy(true);
    try {
      const { data } = await bookingApi.create({
        departmentId: deptId, serviceId: serviceId || undefined, doctorId: doctorId || undefined, date, time, lang,
        guestName: name, guestPhone: phone, guestEmail: email || undefined, reason: reason || undefined,
        otp: cfg?.smsVerification ? otp : undefined, website,
      });
      setDone(data.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(errMsg(err, T("bookFail")));
      if (err?.response?.status === 409 && date) void pickDate(date); // slot taken → refresh the times
    } finally { setBusy(false); }
  }

  if (loadErr) return <ErrorBox>{loadErr}</ErrorBox>;
  if (!cfg || !docs || !month) return <Spinner label={T("loading")} />;
  if (done) return <Confirmation d={done} lang={lang} />;

  if (docs.length === 0) {
    return (
      <Card>
        <p className="text-sm" style={{ color: "var(--navy)" }}>{T("closed", { phone: HOSPITAL.phoneDisplay })}</p>
      </Card>
    );
  }

  const horizonEnd = new Date(Date.parse(`${cfg.today}T00:00:00Z`) + cfg.horizonDays * 86400000).toISOString().slice(0, 10);
  const grid = (() => {
    const lead = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
    const n = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  })();
  const canPrev = !(month.y === +cfg.today.slice(0, 4) && month.m === +cfg.today.slice(5, 7) - 1);
  const canNext = iso(month.m === 11 ? month.y + 1 : month.y, (month.m + 1) % 12, 1) <= horizonEnd;
  const move = (n: number) => { resetPick(); setMonth((cur) => { const t = cur!.y * 12 + cur!.m + n; return { y: Math.floor(t / 12), m: t % 12 }; }); };
  const monthHolidays = Object.entries(closed).filter(([d]) => d.startsWith(`${month.y}-${String(month.m + 1).padStart(2, "0")}`));
  const noDaysAtAll = ready && !loadingDays && Object.keys(days).length === 0;

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="flex justify-end"><LangToggle /></div>
      {error && <ErrorBox>{error}</ErrorBox>}

      <Step n={1} title={T("step1")}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={T("dept")} htmlFor="dept">
            <select id="dept" className={inputCls} style={inputStyle} value={deptId} onChange={(e) => { setDeptId(e.target.value); setServiceId(""); setDoctorId(""); resetPick(); }}>
              <option value="">{T("deptPick")}</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          {needsService && (
            <Field label={T("service")} htmlFor="svc">
              <select id="svc" className={inputCls} style={inputStyle} value={serviceId} onChange={(e) => { setServiceId(e.target.value); setDoctorId(""); resetPick(); }}>
                <option value="">{T("servicePick")}</option>
                {services.map((s) => <option key={s.id} value={s.id}>{serviceName(lang, s)} · {s.durationMin} min</option>)}
              </select>
            </Field>
          )}
          <Field label={T("doctor")} htmlFor="doc" hint={T("doctorHint")}>
            <select id="doc" className={inputCls} style={inputStyle} value={doctorId} disabled={!ready} onChange={(e) => { setDoctorId(e.target.value); resetPick(); }}>
              <option value="">{T("doctorAny")}</option>
              {deptDocs.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} · {d.speciality}</option>)}
            </select>
          </Field>
        </div>
      </Step>

      {ready && (
        <Step n={2} title={T("step2")}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label={T("prevMonth")} className="w-9 h-9 rounded-lg border disabled:opacity-30" style={{ borderColor: "var(--grey-200)" }}><Back /></button>
                <div className="font-semibold text-sm capitalize" style={{ color: "var(--navy)" }}>{monthName(month.y, month.m, lang)} {month.y}</div>
                <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label={T("nextMonth")} className="w-9 h-9 rounded-lg border disabled:opacity-30" style={{ borderColor: "var(--grey-200)" }}><Next /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1" style={{ color: "var(--grey-400)" }} aria-hidden>
                {(lang === "sw" ? ["J", "J", "J", "J", "A", "I", "J"] : ["S", "M", "T", "W", "T", "F", "S"]).map((d, i) => <div key={i}>{d}</div>)}
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
                      title={closed[key] ? T("closedDay", { name: closed[key] }) : undefined}
                      aria-label={`${longDate(key, lang)}${closed[key] ? `, ${T("closedDay", { name: closed[key] })}` : ""}`} aria-pressed={sel}
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
              <p className="text-xs mt-3" style={{ color: "var(--grey-400)" }}>{T("shaded")}</p>
              {monthHolidays.map(([d, n]) => <p key={d} className="text-xs mt-1" style={{ color: "var(--grey-500)" }}>{new Date(`${d}T00:00:00Z`).toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short", timeZone: "UTC" })}: {T("closedDay", { name: n })}</p>)}
            </div>

            <div>
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>{date ? longDate(date, lang) : T("chooseDay")}</div>
              {date && !times && <Spinner label={T("loadingTimes")} />}
              {times && times.length === 0 && <p className="text-sm" style={{ color: "var(--grey-500)" }}>{T("noTimes")}</p>}
              {times && times.length > 0 && (
                <div role="radiogroup" aria-label={T("times")} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                  {resolvedDoctor ? T("withDoctor", { doctor: `Dr. ${resolvedDoctor.firstName} ${resolvedDoctor.lastName}` }) : T("autoDoctor")}.
                </p>
              )}
            </div>
          </div>

          <WaitlistOffer highlight={noDaysAtAll} deptId={deptId} serviceId={serviceId} doctorId={doctorId} lang={lang} smsVerification={cfg.smsVerification} />
        </Step>
      )}

      {time && (
        <Step n={3} title={T("step3")}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={T("name")} htmlFor="gname"><input id="gname" required minLength={2} maxLength={150} autoComplete="name" className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label={T("phone")} htmlFor="gphone" hint={T("phoneHint")}>
              <input id="gphone" required inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXX" className={inputCls} style={inputStyle} value={phone} onChange={(e) => { setPhone(e.target.value); setOtpSent(false); }} />
            </Field>
            <Field label={T("email")} htmlFor="gemail"><input id="gemail" type="email" autoComplete="email" className={inputCls} style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label={T("reason")} htmlFor="greason" hint={T("reasonHint")}>
              <input id="greason" maxLength={300} className={inputCls} style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            {/* Honeypot: hidden from people, tempting to bots. */}
            <div aria-hidden className="hidden"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>
          </div>

          {cfg.smsVerification && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--grey-100)" }}>
              <div className="flex flex-wrap items-end gap-3">
                <button type="button" onClick={sendCode} disabled={busy || !phone} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--navy)" }}>
                  {otpSent ? T("newCode") : T("sendCode")}
                </button>
                {otpSent && (
                  <div className="flex-1 min-w-[10rem]">
                    <Field label={T("code")} htmlFor="gotp">
                      <input id="gotp" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} className={inputCls} style={inputStyle} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                    </Field>
                  </div>
                )}
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--grey-500)" }}>{T("verifyNote")}</p>
            </div>
          )}

          <p className="text-xs mt-4" style={{ color: "var(--grey-500)" }}>
            {T("privacy")} <Link href="/privacy" className="underline">{T("privacyLink")}</Link>.
          </p>
          <button type="submit" disabled={busy} className="mt-5 px-8 py-3.5 rounded-lg text-sm font-bold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>
            {busy ? T("booking") : T("confirm")}
          </button>
        </Step>
      )}
    </form>
  );
}

/** "Nothing free that suits you?" → leave a number; reception calls when a time opens. */
function WaitlistOffer({ highlight, deptId, serviceId, doctorId, lang, smsVerification }: { highlight: boolean; deptId: string; serviceId: string; doctorId: string; lang: Lang; smsVerification: boolean }) {
  const T = (k: TrKey) => tr(lang, k);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [from, setFrom] = useState("");
  const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [sent, setSent] = useState(false);
  const [website, setWebsite] = useState("");

  async function code() {
    setError(""); setBusy(true);
    try { await bookingApi.requestOtp(phone, lang); setOtpSent(true); } catch (e) { setError(errMsg(e, tr(lang, "bookFail"))); } finally { setBusy(false); }
  }
  async function go(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (smsVerification && !otpSent) { setError(T("needCode")); return; }
    setBusy(true);
    try {
      await bookingApi.joinWaitlist({ departmentId: deptId, serviceId: serviceId || undefined, doctorId: doctorId || undefined, fromDate: from || undefined, guestName: name, guestPhone: phone, lang, otp: smsVerification ? otp : undefined, website });
      setSent(true);
    } catch (err) { setError(errMsg(err, tr(lang, "bookFail"))); } finally { setBusy(false); }
  }

  if (sent) return <p className="mt-6 p-3 rounded-lg text-sm" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>{T("waitDone")}</p>;
  return (
    <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--grey-200)" }}>
      {!open ? (
        <p className="text-sm" style={{ color: highlight ? "var(--navy)" : "var(--grey-500)", fontWeight: highlight ? 600 : 400 }}>
          {T("full")} <button type="button" onClick={() => setOpen(true)} className="underline font-semibold" style={{ color: "var(--teal-dark)" }}>{T("joinWait")}</button>
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--navy)" }}>{T("waitIntro")}</p>
          {error && <ErrorBox>{error}</ErrorBox>}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={T("name")} htmlFor="wname"><input id="wname" required minLength={2} className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label={T("phone")} htmlFor="wphone"><input id="wphone" required inputMode="tel" className={inputCls} style={inputStyle} value={phone} onChange={(e) => { setPhone(e.target.value); setOtpSent(false); }} /></Field>
            <Field label={T("waitFrom")} htmlFor="wfrom"><input id="wfrom" type="date" className={inputCls} style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <div aria-hidden className="hidden"><input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
          </div>
          {smsVerification && (
            <div className="flex flex-wrap items-end gap-3">
              <button type="button" onClick={code} disabled={busy || !phone} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--navy)" }}>{otpSent ? T("newCode") : T("sendCode")}</button>
              {otpSent && <div className="w-40"><input aria-label={T("code")} placeholder={T("code")} required inputMode="numeric" pattern="\d{6}" maxLength={6} className={inputCls} style={inputStyle} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /></div>}
            </div>
          )}
          <button type="button" onClick={(e) => go(e as any)} disabled={busy || !name || !phone} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>{busy ? T("waitSending") : T("waitSend")}</button>
        </div>
      )}
    </div>
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

function Confirmation({ d, lang }: { d: Done; lang: Lang }) {
  const T = (k: TrKey) => tr(lang, k);
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
      <h2 className="text-2xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{pending ? T("donePending") : T("doneBooked")}</h2>
      <p className="text-sm mb-6" style={{ color: "var(--grey-500)" }}>{pending ? T("doneSmsPending") : T("doneSmsConfirmed")}</p>
      <div className="inline-block text-left p-5 rounded-lg mb-6" style={{ background: "var(--grey-100)" }}>
        <div className="text-xs" style={{ color: "var(--grey-400)" }}>{T("reference")}</div>
        <div className="text-xl font-bold tracking-wider mb-3" style={{ color: "var(--navy)" }}>{d.reference}</div>
        <div className="text-sm font-medium" style={{ color: "var(--navy)" }}>{longDate(d.date, lang)} · {clock(d.time)}</div>
        <div className="text-sm" style={{ color: "var(--grey-500)" }}>{d.doctor} · {d.department}</div>
      </div>
      <p className="text-xs mb-6" style={{ color: "var(--grey-500)" }}>{T("arrive")}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href={d.manageUrl.replace(/^https?:\/\/[^/]+/, "")} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>{T("changeCancel")}</Link>
        <a href={ics} download={`lisa-hospitals-${d.reference}.ics`} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>{T("addCal")}</a>
      </div>
    </Card>
  );
}
