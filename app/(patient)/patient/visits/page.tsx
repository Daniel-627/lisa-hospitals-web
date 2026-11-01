"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner } from "@/components/ui";
import { chatApi } from "@/lib/api";
import { errMsg, fmtDate, hhmm, todayLocal } from "@/lib/format";

type Visit = { id: string; reference: string; date: string; time: string; status: string; attended: boolean; department: string; doctor: string; reason?: string | null; cancelReason?: string | null };

const LABEL = (v: Visit): { text: string; tone: "ok" | "warn" | "muted" | "danger" } => {
  if (v.status === "cancelled") return { text: "Cancelled", tone: "muted" };
  if (v.status === "no_show") return { text: "Missed", tone: "danger" };
  if (v.attended || v.status === "completed") return { text: "Attended", tone: "ok" };
  if (v.status === "confirmed") return { text: "Confirmed", tone: "ok" };
  return { text: "Awaiting confirmation", tone: "warn" };
};

function Row({ v }: { v: Visit }) {
  const l = LABEL(v);
  return (
    <li className="py-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-b last:border-b-0" style={{ borderColor: "var(--grey-200)" }}>
      <div className="min-w-[9rem]">
        <div className="font-semibold" style={{ color: "var(--navy)" }}>{fmtDate(v.date)}</div>
        <div className="text-sm" style={{ color: "var(--grey-500)" }}>{hhmm(v.time)}</div>
      </div>
      <div className="flex-1 min-w-[10rem]">
        <div className="text-sm font-medium" style={{ color: "var(--navy)" }}>{v.doctor}</div>
        <div className="text-sm" style={{ color: "var(--grey-500)" }}>{v.department} · {v.reference}</div>
      </div>
      <Pill tone={l.tone}>{l.text}</Pill>
    </li>
  );
}

function Content() {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    chatApi.visits().then((r) => setVisits(r.data.data)).catch((e) => { setVisits([]); setError(errMsg(e, "We couldn't load your visits. Please refresh.")); });
  }, []);
  if (!visits) return <Spinner />;
  const today = todayLocal();
  const live = (v: Visit) => v.status === "pending" || v.status === "confirmed";
  const upcoming = visits.filter((v) => live(v) && v.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = visits.filter((v) => !upcoming.includes(v));
  return (
    <div className="max-w-3xl space-y-6">
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="flex flex-wrap gap-3">
        <Link href="/book" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Book a visit</Link>
        <Link href="/patient/messages" className="px-5 py-2.5 rounded-lg text-sm font-semibold border" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}>Message Lisa to change a booking</Link>
      </div>
      <Card>
        <h2 className="font-semibold mb-1" style={{ color: "var(--navy)" }}>Upcoming</h2>
        {upcoming.length === 0 ? <p className="text-sm py-3" style={{ color: "var(--grey-500)" }}>Nothing booked right now.</p> : <ul>{upcoming.map((v) => <Row key={v.id} v={v} />)}</ul>}
      </Card>
      <Card>
        <h2 className="font-semibold mb-1" style={{ color: "var(--navy)" }}>Visit history</h2>
        {past.length === 0 ? <p className="text-sm py-3" style={{ color: "var(--grey-500)" }}>Your past visits will appear here.</p> : <ul>{past.map((v) => <Row key={v.id} v={v} />)}</ul>}
      </Card>
      <p className="text-xs" style={{ color: "var(--grey-500)" }}>Shows bookings made with the phone number or email on your account.</p>
    </div>
  );
}

export default function Page() {
  return <PortalShell audience="patient" title="My visits" subtitle="Your appointments and visit history."><Content /></PortalShell>;
}
