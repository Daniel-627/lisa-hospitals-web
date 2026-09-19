"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { appointmentsApi, patientsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function PatientDashboard() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile, setProfile]           = useState<any>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    const load = async () => {
      try {
        const [apptRes, profileRes] = await Promise.all([
          appointmentsApi.getMine(),
          patientsApi.getProfile(),
        ]);
        setAppointments(apptRes.data.data);
        setProfile(profileRes.data.data);
        setUser(profileRes.data.data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, setUser]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--white)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }}/>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => a.status === "pending" || a.status === "confirmed");
  const past     = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");

  return (
    <div className="min-h-screen" style={{ background: "var(--white)" }}>

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
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {profile?.firstName} {profile?.lastName}
          </span>
          <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* WELCOME */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
            Welcome back, <em className="italic" style={{ color: "var(--teal)" }}>{profile?.firstName}</em>
          </h1>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>
            Patient No: {profile?.patientNumber} · {profile?.insuranceScheme?.toUpperCase() || "No insurance on file"}
          </p>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href} className="p-5 rounded-xl border text-center transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{a.label}</div>
            </Link>
          ))}
        </div>

        {/* UPCOMING APPOINTMENTS */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>Upcoming Appointments</h2>
            <Link href="/patient/appointments/book" className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: "var(--teal)" }}>
              + Book New
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="p-8 rounded-xl border text-center" style={{ borderColor: "var(--grey-200)" }}>
              <p className="text-sm mb-3" style={{ color: "var(--grey-500)" }}>No upcoming appointments</p>
              <Link href="/patient/appointments/book" className="text-sm font-semibold" style={{ color: "var(--teal)" }}>
                Book your first appointment →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <div key={appt.id} className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: "var(--grey-200)", background: "white" }}>
                  <div>
                    <div className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>{appt.department}</div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                      {new Date(appt.appointmentDate).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })} at {appt.appointmentTime}
                    </div>
                    {appt.reason && <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>{appt.reason}</div>}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
                    background: appt.status === "confirmed" ? "var(--teal-light)" : "var(--gold-light)",
                    color:      appt.status === "confirmed" ? "var(--teal-dark)"  : "var(--gold-dark)",
                  }}>
                    {appt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAST APPOINTMENTS */}
        {past.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--navy)" }}>Past Appointments</h2>
            <div className="space-y-3">
              {past.slice(0, 3).map((appt) => (
                <div key={appt.id} className="p-4 rounded-xl border flex items-center justify-between opacity-70" style={{ borderColor: "var(--grey-200)", background: "white" }}>
                  <div>
                    <div className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>{appt.department}</div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                      {new Date(appt.appointmentDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
                    background: appt.status === "completed" ? "var(--teal-light)" : "#fde8e8",
                    color:      appt.status === "completed" ? "var(--teal-dark)"  : "var(--danger)",
                  }}>
                    {appt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const quickActions = [
  { label: "Book Appointment", icon: "📅", href: "/patient/appointments/book" },
  { label: "My Documents",     icon: "📄", href: "/patient/documents" },
  { label: "My Invoices",      icon: "💳", href: "/patient/billing" },
  { label: "My Profile",       icon: "👤", href: "/patient/profile" },
];