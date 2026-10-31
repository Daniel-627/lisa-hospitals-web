import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/public";
import { BookHero, EmergencyNote } from "@/components/BookingHeros";
import BookingFlow from "@/components/BookingFlow";
import { Spinner } from "@/components/ui";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Book an Appointment",
  description: "Book a doctor's appointment at Lisa Hospitals in Kisumu online. Choose a department, doctor, day and time. No account needed.",
  path: "/book",
});

export default function BookPage() {
  return (
    <>
      <BookHero />
      <Section narrow>
        <Suspense fallback={<Spinner />}><BookingFlow /></Suspense>
        <EmergencyNote />
      </Section>
    </>
  );
}
