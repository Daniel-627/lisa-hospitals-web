import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/public";
import { ManageHero } from "@/components/BookingHeros";
import ManageBooking from "@/components/ManageBooking";
import { Spinner } from "@/components/ui";
import { PRIVATE_META } from "@/lib/seo";

// Personal booking links must never show up in search results.
export const metadata: Metadata = { title: "Manage your booking", ...PRIVATE_META };

export default function ManagePage() {
  return (
    <>
      <ManageHero />
      <Section narrow><Suspense fallback={<Spinner />}><ManageBooking /></Suspense></Section>
    </>
  );
}
