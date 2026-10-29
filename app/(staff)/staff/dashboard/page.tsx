"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Card, ErrorBox, Spinner } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { CLINICAL } from "@/lib/features";
import { useRouter } from "next/navigation";

const actions: { label: string; icon: string; href: string | null; roles?: string[] }[] = [
  { label: "Check-in",        icon: "checkin", href: "/staff/checkin" },
  { label: "Queue",           icon: "queue", href: "/staff/queue" },
  { label: "View Patients",   icon: "patients", href: "/staff/patients" },
  { label: "Appointments",    icon: "appointments", href: "/staff/appointments" },
  { label: "Upload Document", icon: "documents", href: "/staff/documents" },
  { label: "Admissions",      icon: "admissions", href: "/staff/admissions", roles: ["doctor", "nurse", "receptionist", "billing_officer", "admin"] },
  { label: "Billing",         icon: "billing", href: "/staff/billing", roles: ["billing_officer", "receptionist", "admin"] },
];

function Content() {
  const me = useMe();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    staffApi.getDashboard()
      .then(({ data }) => { if (!cancelled) setStats(data.data); })
      .catch((err) => { if (!cancelled) setError(errMsg(err, "Couldn't load the dashboard. Please refresh.")); });
    return () => { cancelled = true; };
  }, []);

  const cards = [
    { label: "Total Patients",         value: stats?.totalPatients,         icon: "patients", color: "var(--navy)" },
    { label: "Total Appointments",     value: stats?.totalAppointments,     icon: "appointments", color: "var(--teal)" },
    { label: "Pending Appointments",   value: stats?.pendingAppointments,   icon: "pending", color: "var(--gold)" },
    { label: "Confirmed Appointments", value: stats?.confirmedAppointments, icon: "confirmed", color: "var(--success)" },
  ];

  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!stats && !error ? <Spinner /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {cards.map((s) => (
            <Card key={s.label} className="!p-6">
              <div className="text-2xl mb-2" style={{ color: s.color }} aria-hidden><Icon name={s.icon} /></div>
              <div className="text-3xl font-bold mb-1" style={{ color: s.color, fontFamily: "var(--font-display)" }}>{s.value ?? 0}</div>
              <div className="text-xs" style={{ color: "var(--grey-500)" }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--navy)" }}>Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.filter((a) => !a.roles || a.roles.includes(me.role)).map((a) => a.href ? (
          <Link key={a.label} href={a.href} className="p-5 rounded-xl border text-center transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
            <div className="text-2xl mb-2" style={{ color: "var(--teal)" }} aria-hidden><Icon name={a.icon} /></div>
            <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{a.label}</div>
          </Link>
        ) : (
          <div key={a.label} className="p-5 rounded-xl border text-center opacity-60" style={{ borderColor: "var(--grey-200)", background: "white" }}>
            <div className="text-2xl mb-2" style={{ color: "var(--teal)" }} aria-hidden><Icon name={a.icon} /></div>
            <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{a.label}</div>
            <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>Coming soon</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function StaffDashboard() {
  const router = useRouter();
  useEffect(() => { if (!CLINICAL) router.replace("/staff/bookings"); }, [router]);
  if (!CLINICAL) return <Spinner label="Opening bookings..." />;
  return (
    <PortalShell
      audience="staff"
      title={<>Staff <em className="italic" style={{ color: "var(--teal)" }}>Dashboard</em></>}
      subtitle={new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
    >
      <Content />
    </PortalShell>
  );
}
