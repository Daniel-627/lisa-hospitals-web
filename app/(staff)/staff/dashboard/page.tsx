"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Spinner } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

const actions = [
  { label: "View Patients",   icon: "👥", href: "/staff/patients" },
  { label: "Appointments",    icon: "📅", href: "/staff/appointments" },
  { label: "Upload Document", icon: "📄", href: "/staff/documents" },
  { label: "Billing",         icon: "💳", href: null }, // future phase
];

function Content() {
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
    { label: "Total Patients",         value: stats?.totalPatients,         icon: "👥", color: "var(--navy)" },
    { label: "Total Appointments",     value: stats?.totalAppointments,     icon: "📅", color: "var(--teal)" },
    { label: "Pending Appointments",   value: stats?.pendingAppointments,   icon: "⏳", color: "var(--gold)" },
    { label: "Confirmed Appointments", value: stats?.confirmedAppointments, icon: "✅", color: "var(--success)" },
  ];

  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!stats && !error ? <Spinner /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {cards.map((s) => (
            <Card key={s.label} className="!p-6">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold mb-1" style={{ color: s.color, fontFamily: "var(--font-display)" }}>{s.value ?? 0}</div>
              <div className="text-xs" style={{ color: "var(--grey-500)" }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--navy)" }}>Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((a) => a.href ? (
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
    </>
  );
}

export default function StaffDashboard() {
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
