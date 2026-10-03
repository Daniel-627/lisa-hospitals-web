import { HOSPITAL } from "@/lib/hospital";

export default function EmergencyBar() {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold flex-wrap text-center" style={{ background: "var(--gold)", color: "var(--navy)" }}>
      <span>24-Hour Emergency Line</span>
      <a href={`tel:${HOSPITAL.phoneTel}`} className="text-base font-bold underline-offset-2 hover:underline">{HOSPITAL.phoneDisplay}</a>
      <span className="hidden sm:inline" style={{ opacity: 0.5 }}>·</span>
      <span className="hidden sm:inline">Walk-ins welcome · No referrals needed</span>
    </div>
  );
}
