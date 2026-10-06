"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Spinner, StatusBadge } from "@/components/ui";
import { appointmentsApi, patientsApi } from "@/lib/api";
import { errMsg, fmtDate, hhmm, insuranceLabel } from "@/lib/format";

const quickActions = [
  { label: "Book Appointment", icon: "📅", href: "/patient/appointments/book" },
  { label: "My Documents",     icon: "📄", href: "/patient/documents" },
  { label: "My Profile",       icon: "👤", href: "/patient/profile" },
  { label: "My Invoices",      icon: "💳", href: null }, // future phase
];

function Content() {
  const [appointments, setAppointments] = useState<any[] | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([appointmentsApi.getMine(), patientsApi.getProfile()])
      .then(([a, p]) => { if (!cancelled) { setAppointments(a.data.data); setProfile(p.data.data); } })
      .catch((err) => {
        if (cancelled) return;
        setAppointments([]);
        if (err.response?.status === 404) setNeedsProfile(true); // e.g. a staff member who has never used the patient side
        else setError(errMsg(err, "We couldn't load your dashboard. Please refresh."));
      });
    return () => { cancelled = true; };
  }, []);

  const enroll = async () => {
    setEnrolling(true);
    setError("");
    try {
      await patientsApi.enroll();
      window.location.reload();
    } catch (err) {
      setError(errMsg(err, "Couldn't create your patient profile."));
      setEnrolling(false);
    }
  };

  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancellingId(id);
    setError("");
    try {
      await appointmentsApi.cancel(id);
      setAppointments((list) => list && list.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    } catch (err) {
      setError(errMsg(err, "Couldn't cancel that appointment."));
    } finally {
      setCancellingId(null);
    }
  };

  if (!appointments) return <Spinner label="Loading your dashboard..." />;

  if (needsProfile) {
    return (
      <>
        {error && <ErrorBox>{error}</ErrorBox>}
        <Card className="max-w-lg text-center !p-8">
          <div className="text-3xl mb-3" aria-hidden>🩺</div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--navy)" }}>Set up your patient profile</h2>
          <p className="text-sm mb-5" style={{ color: "var(--grey-500)" }}>
            You work here, but you can also be a patient. Create a patient profile to book appointments and keep your own health records. Your colleagues can&apos;t see them unless they are treating you.
          </p>
          <button onClick={enroll} disabled={enrolling} className="px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: "var(--teal)" }}>
            {enrolling ? "Creating..." : "Create my patient profile"}
          </button>
        </Card>
      </>
    );
  }

  const upcoming = appointments
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .sort((a, b) => `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(`${b.appointmentDate} ${b.appointmentTime}`));
  const past = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      {profile && (
        <p className="text-sm -mt-5 mb-8" style={{ color: "var(--grey-500)" }}>
          Patient No: {profile.patientNumber} · {insuranceLabel(profile.insuranceScheme)}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {quickActions.map((a) => a.href ? (
          <Link key={a.label} href={a.href} className="p-5 rounded-xl border text-center transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{a.label}</div>
          </Link>
        ) : (
          <div key={a.label} className="p-5 rounded-xl border text-center opacity-60" style={{ borderColor: "var(--grey-200)", background: "white" }}>
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{a.label}</div>
            <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>Coming soon</div>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>Upcoming Appointments</h2>
          <Link href="/patient/appointments/book" className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: "var(--teal)" }}>+ Book New</Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-8 rounded-xl border text-center" style={{ borderColor: "var(--grey-200)" }}>
            <p className="text-sm mb-3" style={{ color: "var(--grey-500)" }}>No upcoming appointments</p>
            <Link href="/patient/appointments/book" className="text-sm font-semibold" style={{ color: "var(--teal)" }}>Book your first appointment →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <Card key={a.id} className="!p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>{a.department}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                    {fmtDate(a.appointmentDate, { weekday: "long", day: "numeric", month: "long" })} at {hhmm(a.appointmentTime)}
                  </div>
                  {a.reason && <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>{a.reason}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <button onClick={() => cancel(a.id)} disabled={cancellingId === a.id} className="text-xs font-semibold disabled:opacity-50" style={{ color: "var(--danger)" }}>
                    {cancellingId === a.id ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--navy)" }}>Past Appointments</h2>
          <div className="space-y-3">
            {past.slice(0, 5).map((a) => (
              <Card key={a.id} className="!p-4 flex items-center justify-between opacity-70">
                <div>
                  <div className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>{a.department}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>{fmtDate(a.appointmentDate)}</div>
                </div>
                <StatusBadge status={a.status} />
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function PatientDashboard() {
  return (
    <PortalShell audience="patient" title={(me) => <>Welcome back, <em className="italic" style={{ color: "var(--teal)" }}>{me.firstName}</em></>}>
      <Content />
    </PortalShell>
  );
}
