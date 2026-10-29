import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero, Section } from "@/components/public";
import BookingFlow from "@/components/BookingFlow";
import { Spinner } from "@/components/ui";
import { pageMeta } from "@/lib/seo";
import { HOSPITAL } from "@/lib/hospital";

export const metadata: Metadata = pageMeta({
  title: "Book an Appointment",
  description: "Book a doctor's appointment at Lisa Hospitals in Kisumu online. Choose a department, doctor, day and time. No account needed.",
  path: "/book",
});

export default function BookPage() {
  return (
    <>
      <PageHero eyebrow="Appointments" title="Book your" accent="appointment" subtitle="Choose a doctor and a time that suits you. No account needed." />
      <Section narrow>
        <Suspense fallback={<Spinner />}><BookingFlow /></Suspense>
        <p className="text-xs mt-8" style={{ color: "var(--grey-500)" }}>
          This is for planned visits. In an emergency, don&apos;t book online: call <a className="font-semibold underline" href={`tel:${HOSPITAL.phoneTel}`}>{HOSPITAL.phoneDisplay}</a> or come straight to Accident &amp; Emergency, open 24 hours.
        </p>
      </Section>
    </>
  );
}
