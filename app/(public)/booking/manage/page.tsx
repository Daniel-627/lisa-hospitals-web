import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero, Section } from "@/components/public";
import ManageBooking from "@/components/ManageBooking";
import { Spinner } from "@/components/ui";
import { PRIVATE_META } from "@/lib/seo";

// Personal booking links must never show up in search results.
export const metadata: Metadata = { title: "Manage your booking", ...PRIVATE_META };

export default function ManagePage() {
  return (
    <>
      <PageHero eyebrow="Appointments" title="Manage your" accent="booking" subtitle="Change the time or cancel your appointment." />
      <Section narrow><Suspense fallback={<Spinner />}><ManageBooking /></Suspense></Section>
    </>
  );
}
