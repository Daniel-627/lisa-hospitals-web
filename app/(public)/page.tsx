import Link from "next/link";
import type { Metadata } from "next";
import { Badge24 } from "@/components/public";
import { BOOK_URL, HOSPITAL } from "@/lib/hospital";
import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";

export const metadata: Metadata = {
  title: "Lisa Hospitals — Your Health, Our Priority",
  description: "Comprehensive 24-hour healthcare in Kisumu: emergency care, specialist clinics, maternity, laboratory, pharmacy and more.",
};

const stats = [
  { num: "24", unit: "/7", label: "Emergency Access" },
  { num: "12", unit: "+", label: "Departments" },
  { num: "4", unit: "+", label: "Insurance Partners" },
  { num: "1", unit: "", label: "ICU Unit" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <div className="relative overflow-hidden px-6 py-24 text-center" style={{ background: "var(--navy)" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "var(--teal)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5" style={{ background: "var(--teal)", transform: "translate(-30%, 30%)" }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-widest uppercase" style={{ background: "rgba(0,150,154,0.15)", border: "1px solid rgba(0,150,154,0.3)", color: "#5cdde0" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00969A" }} />
            Open 24 Hours · Namba Okana, Kisumu
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Your Health Is<br /><em className="italic" style={{ color: "#5cdde0" }}>Our Priority</em>
          </h1>
          <p className="text-lg mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Comprehensive medical care for you and your family — from emergency response and specialist clinics to maternity and critical care.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href={BOOK_URL} className="px-8 py-3.5 rounded-lg text-white font-semibold text-sm" style={{ background: "var(--teal)" }}>Book an Appointment</Link>
            <Link href="/services" className="px-8 py-3.5 rounded-lg font-semibold text-sm text-white" style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}>Our Services</Link>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--teal)" }}>What we offer</div>
          <h2 className="text-4xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
            Our Medical <em className="italic" style={{ color: "var(--teal)" }}>Services</em>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {DEPARTMENTS.map((s) => (
            <Link key={s.slug} href={`/services/${toUrlSlug(s.slug)}`} className="p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
              <div className="text-2xl mb-3" aria-hidden>{s.icon}</div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>{s.name}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--grey-500)" }}>{s.short}</p>
              {s.badge && <div className="mt-2"><Badge24 label={s.badge} /></div>}
            </Link>
          ))}
        </div>
      </section>

      {/* INSURANCE */}
      <section className="px-6 py-12 text-center" style={{ background: "var(--teal-light)" }}>
        <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--teal-dark)" }}>Accepted coverage</div>
        <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>We Accept Your <em className="italic">Insurance</em></h2>
        <p className="text-sm mb-6" style={{ color: "var(--grey-500)" }}>Direct facility — no referrals needed</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {HOSPITAL.insurers.map((ins) => (
            <div key={ins} className="px-6 py-3 rounded-lg font-bold text-sm" style={{ background: "white", border: "1.5px solid var(--grey-200)", color: "var(--navy)" }}>{ins}</div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 py-16" style={{ background: "var(--navy)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>{s.num}<span style={{ color: "var(--teal)" }}>{s.unit}</span></div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center" style={{ background: "var(--teal)" }}>
        <h2 className="text-4xl font-normal text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>Ready to See a Doctor?</h2>
        <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.8)" }}>Book an appointment online or walk in anytime — we&apos;re open around the clock.</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href={BOOK_URL} className="px-8 py-3.5 rounded-lg font-bold text-sm" style={{ background: "white", color: "var(--teal)" }}>Book Appointment</Link>
          <a href={`tel:${HOSPITAL.phoneTel}`} className="px-8 py-3.5 rounded-lg font-semibold text-sm text-white" style={{ border: "2px solid rgba(255,255,255,0.5)" }}>Call {HOSPITAL.phoneDisplay}</a>
        </div>
      </section>
    </>
  );
}
