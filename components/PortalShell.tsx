"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { authApi } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { LogoMark, Spinner } from "@/components/ui";
import {
  BedDouble, CalendarCheck, CalendarDays, ClipboardCheck, CreditCard, FileText, FlaskConical, Globe, LayoutDashboard, ListOrdered, LogOut,
  Menu, MessageSquare, Newspaper, Pill, ScrollText, Settings, Stethoscope, Users, UserRound, Receipt, type LucideIcon,
} from "lucide-react";
import { CLINICAL } from "@/lib/features";

export type Me = { id: string; email: string; phone: string; firstName: string; lastName: string; role: string };

const MeContext = createContext<Me | null>(null);
export const useMe = () => {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe must be used inside <PortalShell>");
  return me;
};

const NAV_ICONS: Record<string, LucideIcon> = {
  "/staff/dashboard": LayoutDashboard, "/staff/bookings": CalendarCheck, "/staff/calendar": CalendarDays, "/staff/queue": ListOrdered,
  "/staff/checkin": ClipboardCheck, "/staff/patients": Users, "/staff/admissions": BedDouble, "/staff/billing": CreditCard,
  "/staff/appointments": CalendarDays, "/staff/results": FlaskConical, "/staff/lab": FlaskConical, "/staff/radiology": Stethoscope,
  "/staff/pharmacy": Pill, "/staff/documents": FileText, "/patient/dashboard": UserRound, "/patient/appointments/book": CalendarCheck,
  "/patient/documents": FileText, "/patient/invoices": Receipt, "/patient/admissions": BedDouble, "/patient/results": FlaskConical, "/patient/profile": UserRound,
  "/admin/dashboard": LayoutDashboard, "/admin/users": Users, "/admin/news": Newspaper, "/admin/enquiries": MessageSquare,
  "/admin/audit": ScrollText, "/admin/booking": Settings, "/admin/services": Stethoscope,
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
  const [menuOpen, setMenuOpen] = useState(false);

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
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const GROUPS: [string, string[]][] = [
    ["Appointments", ["/staff/bookings", "/staff/calendar", "/admin/booking", "/admin/services"]],
    ["Manage", ["/admin/dashboard", "/admin/users", "/admin/news", "/admin/enquiries", "/admin/audit"]],
  ];
  const grouped = CLINICAL
    ? [["Menu", visible] as [string, readonly NavItem[]]]
    : [...GROUPS.map(([g, hrefs]) => [g, visible.filter((l) => hrefs.includes(l.href))] as [string, readonly NavItem[]]),
       ["More", visible.filter((l) => !GROUPS.some(([, h]) => h.includes(l.href)))] as [string, readonly NavItem[]]].filter(([, items]) => items.length > 0);
  const initials = `${me.firstName?.[0] ?? ""}${me.lastName?.[0] ?? ""}`.toUpperCase();
  const areaLabel = audience === "admin" ? "Admin" : audience === "staff" ? "Staff portal" : "My health";

  return (
    <MeContext.Provider value={me}>
      <div className="portal min-h-screen flex" style={{ background: "var(--page)" }}>
        {/* Mobile: dark overlay behind the open menu */}
        {menuOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden no-print" onClick={() => setMenuOpen(false)} aria-hidden />}

        <aside
          className={`no-print fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col border-r transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ background: "white", borderColor: "var(--grey-200)" }} aria-label="Portal menu"
        >
          <div className="h-[72px] px-5 flex items-center gap-3 border-b shrink-0" style={{ borderColor: "var(--grey-200)" }}>
            <LogoMark />
            <div className="leading-tight">
              <div className="font-semibold text-[15px]" style={{ color: "var(--navy)" }}>Lisa Hospitals</div>
              <div className="text-xs" style={{ color: "var(--grey-500)" }}>{areaLabel}</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Portal">
            {grouped.map(([group, items]) => (
              <div key={group} className="mb-6">
                <h2 className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--grey-400)" }}>{group}</h2>
                <ul className="space-y-1">
                  {items.map((l) => {
                    const active = isActive(l.href);
                    const Ic = NAV_ICONS[l.href] ?? LayoutDashboard;
                    return (
                      <li key={l.href}>
                        <Link href={l.href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--grey-100)]"
                          style={{ background: active ? "var(--teal-light)" : undefined, color: active ? "var(--teal-dark)" : "var(--grey-600)" }}>
                          <Ic className="size-5 shrink-0" aria-hidden />
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t shrink-0" style={{ borderColor: "var(--grey-200)" }}>
            <div className="flex items-center gap-3 mb-3 min-w-0">
              {audience === "patient" ? <UserButton /> : (
                <div className="size-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }} aria-hidden>{initials}</div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{me.firstName} {me.lastName}</div>
                <div className="text-xs truncate" style={{ color: "var(--grey-500)" }}>{roleLabel(me.role)}</div>
              </div>
            </div>
            <button onClick={() => signOut({ redirectUrl: "/login" })} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border hover:bg-[var(--grey-100)]" style={{ borderColor: "var(--grey-200)", color: "var(--grey-600)" }}>
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="no-print sticky top-0 z-30 h-[72px] flex items-center gap-3 px-4 sm:px-6 border-b" style={{ background: "white", borderColor: "var(--grey-200)" }}>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="lg:hidden size-10 rounded-lg border flex items-center justify-center" style={{ borderColor: "var(--grey-200)", color: "var(--grey-600)" }}>
              <Menu className="size-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider truncate" style={{ color: "var(--grey-400)" }}>{areaLabel}</div>
              <div className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
            <Link href="/" className="text-sm font-medium px-3 py-2 rounded-lg border hidden sm:inline-flex items-center gap-2 hover:bg-[var(--grey-100)]" style={{ borderColor: "var(--grey-200)", color: "var(--grey-600)" }}>
              <Globe className="size-4" aria-hidden /> Public site
            </Link>
          </header>

          <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-[28px] font-semibold leading-tight mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{resolve(title)}</h1>
              {subtitle && <p className="text-sm" style={{ color: "var(--grey-500)" }}>{resolve(subtitle)}</p>}
            </div>
            {children}
          </main>
        </div>
      </div>
    </MeContext.Provider>
  );
}
