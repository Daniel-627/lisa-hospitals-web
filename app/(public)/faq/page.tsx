import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/public";
import FaqList from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { FAQS } from "@/lib/faqs";
import { BOOK_URL, HOSPITAL } from "@/lib/hospital";
import { breadcrumbJsonLd, faqJsonLd, graph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Frequently Asked Questions",
  description: "Opening hours, location, phone number, insurance, referrals, appointments and patient privacy at Lisa Hospitals, Kisumu.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={graph(faqJsonLd(FAQS), breadcrumbJsonLd([{ name: "FAQ", path: "/faq" }]))} />
      <PageHero eyebrow="Help" title="Frequently asked" accent="questions" subtitle={`Quick answers about ${HOSPITAL.name}.`} />
      <Section narrow>
        <FaqList faqs={FAQS} />
        <p className="mt-8 text-sm" style={{ color: "var(--grey-500)" }}>
          Something else? <Link href="/contact" className="font-semibold" style={{ color: "var(--teal)" }}>Contact us</Link> or{" "}
          <Link href={BOOK_URL} className="font-semibold" style={{ color: "var(--teal)" }}>book an appointment</Link>.
        </p>
      </Section>
    </>
  );
}
