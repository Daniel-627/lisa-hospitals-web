import Link from "next/link";
import type { Metadata } from "next";
import { Badge24, PageHero, Section } from "@/components/public";
import { apiGet } from "@/lib/serverApi";
import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";

export const metadata: Metadata = {
  title: "Our Services — Lisa Hospitals",
  description: "Explore our 12 departments: emergency care, maternity, laboratory, pharmacy, radiology, dental, eye care and more.",
};
export const revalidate = 60;

export default async function ServicesPage() {
  const { data } = await apiGet<any[]>("/api/departments");
  const live = new Map((data ?? []).map((d) => [d.slug, d]));

  return (
    <>
      <PageHero eyebrow="What we offer" title="Our Medical" accent="Services" subtitle="Twelve departments under one roof, with emergency care available 24 hours a day." />
      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEPARTMENTS.map((d) => {
            const l = live.get(d.slug);
            const is24 = l?.isOpen24hrs ?? d.is24;
            return (
              <Link key={d.slug} href={`/services/${toUrlSlug(d.slug)}`} className="block p-6 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl" aria-hidden>{d.icon}</div>
                  {is24 && <Badge24 label={d.badge ?? "24HR"} />}
                </div>
                <h2 className="text-base font-semibold mb-1" style={{ color: "var(--navy)" }}>{l?.name ?? d.name}</h2>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--grey-500)" }}>{d.short}</p>
                <span className="text-sm font-semibold" style={{ color: "var(--teal)" }}>Learn more →</span>
              </Link>
            );
          })}
        </div>
      </Section>
    </>
  );
}
