"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { LogoMark } from "@/components/ui";
import { BOOK_URL, HOSPITAL } from "@/lib/hospital";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/doctors", label: "Doctors" },
  { href: "/news", label: "News" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function PublicNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50" style={{ background: "var(--navy)" }}>
      <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <LogoMark size={36} />
          <div>
            <div className="text-white font-bold text-base leading-tight">{HOSPITAL.name}</div>
            <div className="text-xs leading-tight" style={{ color: "var(--teal)", letterSpacing: "1px" }}>KISUMU, KENYA</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}
              className="px-3 py-2 text-sm font-medium rounded-lg"
              style={{ color: isActive(l.href) ? "white" : "rgba(255,255,255,0.65)", background: isActive(l.href) ? "rgba(255,255,255,0.08)" : "transparent" }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href={`tel:${HOSPITAL.phoneTel}`} className="text-sm font-medium hidden xl:block" style={{ color: "rgba(255,255,255,0.7)" }}>{HOSPITAL.phoneDisplay}</a>
          <Link href={isSignedIn ? "/auth/callback" : "/login"} className="text-sm font-medium px-3 py-2 rounded-lg hidden sm:block" style={{ color: "rgba(255,255,255,0.7)" }}>
            {isSignedIn ? "My portal" : "Sign in"}
          </Link>
          <Link href={BOOK_URL} className="text-sm font-semibold px-4 py-2 rounded-lg text-white hidden sm:block" style={{ background: "var(--teal)" }}>Book Appointment</Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu"
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden px-6 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} aria-label="Mobile">
          <div className="flex flex-col pt-2">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-sm font-medium"
                style={{ color: isActive(l.href) ? "white" : "rgba(255,255,255,0.65)" }}>{l.label}</Link>
            ))}
            <Link href={isSignedIn ? "/auth/callback" : "/login"} onClick={() => setOpen(false)} className="py-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
              {isSignedIn ? "My portal" : "Sign in"}
            </Link>
            <Link href={BOOK_URL} onClick={() => setOpen(false)} className="mt-2 text-center text-sm font-semibold px-4 py-3 rounded-lg text-white" style={{ background: "var(--teal)" }}>Book Appointment</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
