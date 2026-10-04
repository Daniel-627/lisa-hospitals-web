"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Pages that have their own full-screen layout (portals, sign-in/up, setup) do NOT get the public nav/footer.
// Everything else — home, services, doctors, news, about, contact, the 404 page, future public pages — does.
const BARE = /^\/(patient|staff|admin|login|register|sign-in|sign-up|complete-profile|auth)(\/|$)/;

export default function SiteChrome({ nav, footer, children }: { nav: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (BARE.test(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--white)" }}>
      {nav}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
