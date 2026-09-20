"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { staffApi } from "@/lib/api";

export default function StaffDashboard() {
  const router  = useRouter();
  const [stats, setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/staff/login"); return; }

    const load = async () => {
      try {
        const { data } = await staffApi.getDashboard();
        setStats(data.data);
      } catch {
        router.push("/staff/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/staff/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--white)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }}/>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--grey-100)" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16" style={{ background: "var(--navy)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--teal)" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="1" width="4" height="18" rx="2" fill="white"/>
              <rect x="1" y="8" width="18" height="4" rx="2" fill="white"/>
            </svg>
          </div>
          <span className="text-white font-bold text-sm">Lisa Hospitals</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>Staff Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
            Staff <em className="italic" style={{ color: "var(--teal)" }}>Dashboard</em>
          </h1>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>
            {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Patients",          value: stats?.totalPatients,         icon: "👥", color: "var(--navy)" },
            { label: "Total Appointments",       value: stats?.totalAppointments,     icon: "📅", color: "var(--teal)" },
            { label: "Pending Appointments",     value: stats?.pendingAppointments,   icon: "⏳", color: "var(--gold)" },
            { label: "Confirmed Appointments",   value: stats?.confirmedAppointments, icon: "✅", color: "var(--success)" },
          ].map((s) => (
            <div key={s.label} className="p-6 rounded-xl" style={{ background: "white", border: "1px solid var(--grey-200)" }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold mb-1" style={{ color: s.color, fontFamily: "var(--font-display)" }}>{s.value ?? 0}</div>
              <div className="text-xs" style={{ color: "var(--grey-500)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--navy)" }}>Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {staffActions.map((a) => (
              <Link key={a.label} href={a.href} className="p-5 rounded-xl border text-center transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{a.label}</div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const staffActions = [
  { label: "View Patients",      icon: "👥", href: "/staff/patients" },
  { label: "Appointments",       icon: "📅", href: "/staff/appointments" },
  { label: "Upload Document",    icon: "📄", href: "/staff/documents" },
  { label: "Billing",            icon: "💳", href: "/staff/billing" },
];