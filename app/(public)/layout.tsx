import type { ReactNode } from "react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { HOSPITAL } from "@/lib/hospital";

function EmergencyBar() {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold flex-wrap text-center" style={{ background: "var(--gold)", color: "var(--navy)" }}>
      <span>24-Hour Emergency Line</span>
      <a href={`tel:${HOSPITAL.phoneTel}`} className="text-base font-bold underline-offset-2 hover:underline">{HOSPITAL.phoneDisplay}</a>
      <span className="hidden sm:inline" style={{ opacity: 0.5 }}>·</span>
      <span className="hidden sm:inline">Walk-ins welcome · No referrals needed</span>
    </div>
  );
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--white)" }}>
      <PublicNav />
      <EmergencyBar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
