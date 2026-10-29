import type { Metadata } from "next";
import { PageHero, Section } from "@/components/public";
import { pageMeta } from "@/lib/seo";
import { HOSPITAL } from "@/lib/hospital";

export const metadata: Metadata = pageMeta({
  title: "Privacy Notice",
  description: "How Lisa Hospitals collects and uses your details when you book an appointment online.",
  path: "/privacy",
});

const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl mt-8 mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{children}</h2>;

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Your data" title="Privacy" accent="notice" subtitle="What we collect when you book online, why, and your rights." />
      <Section narrow>
        <div className="text-sm leading-relaxed space-y-3" style={{ color: "var(--grey-600, #4b5563)" }}>
          <p>{HOSPITAL.name} (&quot;we&quot;) is the data controller for the information you give us when you book an appointment on this website. We handle it in line with the Kenya Data Protection Act, 2019.</p>
          <H>What we collect</H>
          <p>Your name, phone number, the appointment you choose and, only if you wish, an email address and a short reason for your visit. Please don&apos;t put private medical details in the reason box. Medical records are kept in the hospital&apos;s clinical system, not on this website.</p>
          <H>Why we collect it</H>
          <p>To reserve your time with a doctor, to text you the booking details and any change, and to let our reception contact you about the appointment. We do not use it for marketing and we do not sell it.</p>
          <H>Phone verification</H>
          <p>We may send a one-time code by SMS to check the number is yours. Codes expire after 10 minutes.</p>
          <H>Who sees it</H>
          <p>Our reception and administration staff see your name, phone and appointment. Doctors see only your name and appointment time. Our SMS provider and hosting providers process data for us under agreements that protect it.</p>
          <H>How long we keep it</H>
          <p>Booking records are kept for a limited period after your appointment for scheduling and audit purposes, then deleted or anonymised.</p>
          <H>Your rights</H>
          <p>You can ask to see, correct or delete your booking details, or object to their use. Contact us at <a className="underline" href={`mailto:${HOSPITAL.email}`}>{HOSPITAL.email}</a> or <a className="underline" href={`tel:${HOSPITAL.phoneTel}`}>{HOSPITAL.phoneDisplay}</a>. You may also complain to the Office of the Data Protection Commissioner (odpc.go.ke).</p>
        </div>
      </Section>
    </>
  );
}
