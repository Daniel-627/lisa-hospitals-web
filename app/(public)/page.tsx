import Link from "next/link";
import type { Metadata } from "next";

import { Badge24 } from "@/components/public";
import { HeroCarousel } from "@/components/HeroCarousel";
import { BOOK_URL, HOSPITAL } from "@/lib/hospital";
import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";

export const metadata: Metadata = {
  title: "Lisa Hospitals — Your Health, Our Priority",
  description:
    "Comprehensive 24-hour healthcare in Kisumu: emergency care, specialist clinics, maternity, laboratory, pharmacy and more.",
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
      <HeroCarousel />

      {/* SERVICES */}
      <section className="px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-14">
            <div
              className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--teal)" }}
            >
              What we offer
            </div>

            <h2
              className="text-3xl font-normal sm:text-4xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--navy)",
              }}
            >
              Our Medical{" "}
              <em className="italic" style={{ color: "var(--teal)" }}>
                Services
              </em>
            </h2>

            <p
              className="mx-auto mt-4 max-w-2xl text-sm leading-6 sm:text-base"
              style={{ color: "var(--grey-500)" }}
            >
              Comprehensive healthcare services designed to support you and
              your family at every stage of care.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {DEPARTMENTS.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${toUrlSlug(service.slug)}`}
                className="group relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  borderColor: "var(--grey-200)",
                  background: "white",
                }}
              >
                {/* Accent */}
                <div
                  className="absolute left-0 top-5 h-8 w-0.5 rounded-r-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "var(--teal)" }}
                />

                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "var(--teal-light)",
                  }}
                  aria-hidden
                >
                  {service.icon}
                </div>

                <h3
                  className="mb-1.5 text-sm font-bold"
                  style={{ color: "var(--navy)" }}
                >
                  {service.name}
                </h3>

                <p
                  className="text-xs leading-5"
                  style={{ color: "var(--grey-500)" }}
                >
                  {service.short}
                </p>

                {service.badge && (
                  <div className="mt-3">
                    <Badge24 label={service.badge} />
                  </div>
                )}

                <div
                  className="mt-4 text-[11px] font-bold uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: "var(--teal)" }}
                >
                  Learn more →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INSURANCE */}
      <section
        className="px-6 py-14 sm:py-16"
        style={{ background: "var(--teal-light)" }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <div
            className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--teal-dark)" }}
          >
            Accepted coverage
          </div>

          <h2
            className="text-2xl font-normal sm:text-3xl"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--navy)",
            }}
          >
            We Accept Your{" "}
            <em className="italic" style={{ color: "var(--teal)" }}>
              Insurance
            </em>
          </h2>

          <p
            className="mb-7 mt-2 text-sm"
            style={{ color: "var(--grey-500)" }}
          >
            Direct facility — no referrals needed
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {HOSPITAL.insurers.map((insurer) => (
              <div
                key={insurer}
                className="rounded-xl px-6 py-3.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background: "white",
                  border: "1px solid var(--grey-200)",
                  color: "var(--navy)",
                }}
              >
                {insurer}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section
        className="px-6 py-16 sm:py-20"
        style={{ background: "var(--navy)" }}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center ${
                index !== 0 ? "md:border-l md:border-white/10" : ""
              }`}
            >
              <div
                className="text-4xl font-bold leading-none text-white sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stat.num}
                <span style={{ color: "var(--teal)" }}>{stat.unit}</span>
              </div>

              <div
                className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative overflow-hidden px-6 py-16 text-center sm:py-20"
        style={{ background: "var(--teal)" }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-10"
          style={{ background: "white" }}
        />

        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full opacity-10"
          style={{ background: "white" }}
        />

        <div className="relative z-10 mx-auto max-w-2xl">
          <div
            className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            We are here for you
          </div>

          <h2
            className="text-3xl font-normal text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to See a Doctor?
          </h2>

          <p
            className="mx-auto mb-8 mt-4 max-w-xl text-sm leading-6 sm:text-base"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            Book an appointment online or walk in anytime — we&apos;re open around
            the clock.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={BOOK_URL}
              className="rounded-lg px-8 py-3.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: "white",
                color: "var(--teal)",
              }}
            >
              Book Appointment
            </Link>

            <a
              href={`tel:${HOSPITAL.phoneTel}`}
              className="rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
              style={{
                border: "1.5px solid rgba(255,255,255,0.55)",
              }}
            >
              Call {HOSPITAL.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
