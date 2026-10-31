"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { authApi } from "@/lib/api";
import { LogoMark, Spinner } from "@/components/ui";
import { CLINICAL } from "@/lib/features";

export type Me = { id: string; email: string; phone: string; firstName: string; lastName: string; role: string };

const MeContext = createContext<Me | null>(null);
export const useMe = () => {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe must be used inside <PortalShell>");
  return me;
};

const NAV = {
  staff: [
    { href: "/staff/bookings", label: "Bookings", roles: ["admin", "receptionist", "doctor"] },
    { href: "/staff/calendar", label: "My calendar", roles: ["doctor"] },
    { href: "/staff/dashboard", label: "Dashboard" },
    { href: "/staff/queue", label: "Queue", roles: ["receptionist", "nurse", "doctor", "admin"] },
    { href: "/staff/checkin", label: "Check-in", roles: ["receptionist", "nurse", "doctor", "admin"] },
    { href: "/staff/patients", label: "Patients", roles: ["receptionist", "nurse", "doctor", "admin", "billing_officer"] },
    { href: "/staff/admissions", label: "Admissions", roles: ["doctor", "nurse", "receptionist", "billing_officer", "admin"] },
    { href: "/staff/billing", label: "Billing", roles: ["billing_officer", "receptionist", "admin"] },
    { href: "/staff/appointments", label: "Appointments", roles: ["admin", "receptionist", "doctor", "nurse"] },
    { href: "/staff/results", label: "Results", roles: ["doctor"] },
    { href: "/staff/lab", label: "Lab", roles: ["lab_technician"] },
    { href: "/staff/radiology", label: "Radiology", roles: ["radiographer"] },
    { href: "/staff/pharmacy", label: "Pharmacy", roles: ["pharmacist"] },
    { href: "/staff/documents", label: "Documents" },
    { href: "/patient/dashboard", label: "My health" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/staff/bookings", label: "Bookings" },
    { href: "/admin/booking", label: "Booking settings" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/news", label: "News" },
    { href: "/admin/enquiries", label: "Messages" },
    { href: "/admin/audit", label: "Audit log" },
    { href: "/staff/dashboard", label: "Staff portal" },
  ],
  patient: [
    { href: "/patient/dashboard", label: "Dashboard" },
    { href: "/patient/appointments/book", label: "Book" },
    { href: "/patient/documents", label: "Documents" },
    { href: "/patient/invoices", label: "Invoices" },
    { href: "/patient/admissions", label: "Hospital stays" },
    { href: "/patient/results", label: "Results" },
    { href: "/patient/profile", label: "Profile" },
  ],
} as const;

type Slot = ReactNode | ((me: Me) => ReactNode);
type Props = { audience: "staff" | "patient" | "admin"; title: Slot; subtitle?: Slot; children: ReactNode };

/**
 * Guards a portal page: must be signed in with Clerk, the role (read from OUR api, not the browser)
 * must match the audience, and patients must have finished their profile. Renders nav + header.
 */
export default function PortalShell({ audience, title, subtitle, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/login"); return; }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await authApi.me();
        const u: Me = data.data;
        const isPatient = u.role === "patient";

        if (audience === "staff" && isPatient) { router.replace("/patient/dashboard"); return; }
        // Staff are people too: they may open the patient portal for their OWN health records.
        if (audience === "admin" && u.role !== "admin") { router.replace(isPatient ? "/patient/dashboard" : "/staff/dashboard"); return; }
        if (isPatient && (!u.phone || u.phone.startsWith("clerk-"))) { router.replace("/complete-profile"); return; }

        if (!cancelled) setMe(u);
      } catch (err: any) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 401) setError("The server couldn't verify your session. Please sign out and sign in again.");
        else if (status === 404) router.replace("/complete-profile");
        else setError("We couldn't reach the server. Please check your connection and try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router, audience, attempt]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--white)" }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--grey-500)" }}>{error}</p>
          <button onClick={() => { setError(""); setAttempt((n) => n + 1); }} className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>
            Try again
          </button>
          <button onClick={() => signOut({ redirectUrl: "/login" })} className="ml-3 px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded || !me) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--white)" }}><Spinner /></div>;
  }

  type NavItem = { href: string; label: string; roles?: readonly string[] };
  const base: readonly NavItem[] = NAV[audience];
  // Admins get an "Admin" tab in the staff portal so they can jump back.
  const links =
    audience === "staff" && me.role === "admin" ? [...base, { href: "/admin/dashboard", label: "Admin" }]
    : audience === "patient" && me.role !== "patient" ? [...base, { href: "/staff/dashboard", label: "Staff portal" }]
    : base;
  // Some tabs only make sense for certain roles (the server enforces this too).
  // Booking-only mode: just the booking desk, plus admin tools that aren't clinical.
  const BOOKING_ONLY = new Set(["/staff/bookings", "/staff/calendar", "/admin/services", "/admin/dashboard", "/admin/users", "/admin/booking", "/admin/news", "/admin/enquiries", "/admin/audit"]);
  const scoped = CLINICAL ? links : links.filter((l) => BOOKING_ONLY.has(l.href));
  const visible = scoped.filter((l) => !(l as NavItem).roles || (l as NavItem).roles!.includes(me.role));
  const resolve = (v: Slot) => (typeof v === "function" ? v(me) : v);
  return (
    <MeContext.Provider value={me}>
      <div className="min-h-screen" style={{ background: audience === "patient" ? "var(--white)" : "var(--grey-100)" }}>
        <header className="sticky top-0 z-50 no-print" style={{ background: "var(--navy)" }}>
          <div className="flex items-center justify-between px-6 h-16">
            <Link href={links[0].href} className="flex items-center gap-3">
              <LogoMark />
              <span className="text-white font-bold text-sm">Lisa Hospitals</span>
              {audience !== "patient" && (
                <span className="text-xs px-2 py-0.5 rounded hidden sm:inline" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>{audience === "admin" ? "Admin" : "Staff Portal"}</span>
              )}
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm hidden md:inline" style={{ color: "rgba(255,255,255,0.6)" }}>{me.firstName} {me.lastName}</span>
              {audience === "patient" ? (
                <UserButton />
              ) : (
                <button onClick={() => signOut({ redirectUrl: "/login" })} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                  Sign out
                </button>
              )}
            </div>
          </div>
          <nav className="flex gap-1 px-4 overflow-x-auto" aria-label="Portal">
            {visible.map((l) => {
              const active = pathname === l.href || (l.href !== links[0].href && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                  className="px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2"
                  style={{ color: active ? "white" : "rgba(255,255,255,0.55)", borderColor: active ? "var(--teal)" : "transparent" }}>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-normal mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{resolve(title)}</h1>
            {subtitle && <p className="text-sm" style={{ color: "var(--grey-500)" }}>{resolve(subtitle)}</p>}
          </div>
          {children}
        </main>
      </div>
    </MeContext.Provider>
  );
}
