import Link from "next/link";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/public";
import { BOOK_URL, HOSPITAL } from "@/lib/hospital";

export const metadata: Metadata = {
  title: "About Us — Lisa Hospitals",
  description: "Lisa Hospitals is a 24-hour hospital on Nairobi Highway, Kisumu, offering comprehensive care for the whole family.",
};

// NOTE: replace this copy with the hospital's own story, mission and leadership when you have it.
const values = [
  { icon: "🤝", title: "Compassion", text: "We treat every patient the way we would want our own family treated." },
  { icon: "🎯", title: "Excellence", text: "Careful, evidence-based care delivered by a dedicated clinical team." },
  { icon: "🔓", title: "Access", text: "Open 24 hours, no referrals needed, and we accept major insurance schemes." },
  { icon: "🔒", title: "Trust", text: "Your health information is handled with care and kept confidential." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="Caring for Kisumu," accent="around the clock" subtitle={`${HOSPITAL.name} — ${HOSPITAL.tagline}.`} />

      <Section narrow>
        <h2 className="text-2xl font-normal mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Our mission</h2>
        <p className="text-base leading-relaxed mb-4" style={{ color: "var(--grey-500)" }}>
          {HOSPITAL.name} is a hospital in {HOSPITAL.addressLines[0].replace("along ", "on ")}, Kisumu, offering comprehensive medical care for you and your family — from emergency response and specialist clinics to maternity and critical care.
        </p>
        <p className="text-base leading-relaxed" style={{ color: "var(--grey-500)" }}>
          Our doors are open 24 hours a day, seven days a week. Walk in any time — no referral is needed.
        </p>
      </Section>

      <section className="px-6 py-14" style={{ background: "var(--grey-100)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-normal text-center mb-8" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>What we stand for</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v) => (
              <div key={v.title} className="p-6 rounded-xl border" style={{ borderColor: "var(--grey-200)", background: "white" }}>
                <div className="text-2xl mb-3" aria-hidden>{v.icon}</div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--grey-500)" }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section narrow>
        <div id="insurance" className="scroll-mt-24 p-6 rounded-xl" style={{ background: "var(--teal-light)" }}>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--navy)" }}>Insurance we accept</h2>
          <p className="text-sm mb-4" style={{ color: "var(--grey-500)" }}>We are a direct facility for these schemes — no referrals needed.</p>
          <div className="flex gap-3 flex-wrap">
            {HOSPITAL.insurers.map((i) => (
              <span key={i} className="px-5 py-2 rounded-lg font-bold text-sm" style={{ background: "white", border: "1.5px solid var(--grey-200)", color: "var(--navy)" }}>{i}</span>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <Link href="/doctors" className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Meet our doctors</Link>
          <Link href={BOOK_URL} className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Book an appointment</Link>
        </div>
      </Section>
    </>
  );
}
