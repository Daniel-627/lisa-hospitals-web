import type { Metadata } from "next";
import { PageHero, Section } from "@/components/public";
import ContactForm from "@/components/ContactForm";
import { HOSPITAL } from "@/lib/hospital";

export const metadata: Metadata = {
  title: "Contact Us — Lisa Hospitals",
  description: "Find Lisa Hospitals on Nairobi Highway, Kisumu. Call us 24/7 or send us a message.",
};

const q = encodeURIComponent(HOSPITAL.mapQuery);

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Get in touch" title="We're here to" accent="help" subtitle="Call us any time, visit us, or send a message and we'll reply as soon as we can." />
      <Section>
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: "📞", label: "Phone (24/7)", value: HOSPITAL.phoneDisplay, href: `tel:${HOSPITAL.phoneTel}` },
                { icon: "✉️", label: "Email", value: HOSPITAL.email, href: `mailto:${HOSPITAL.email}` },
                { icon: "📍", label: "Address", value: `${HOSPITAL.addressLines.join(", ")}`, href: `https://www.google.com/maps/dir/?api=1&destination=${q}` },
                { icon: "🕐", label: "Hours", value: HOSPITAL.hours },
              ].map((c) => (
                <div key={c.label} className="p-5 rounded-xl border" style={{ borderColor: "var(--grey-200)", background: "white" }}>
                  <div className="text-xl mb-2" aria-hidden>{c.icon}</div>
                  <div className="text-xs mb-1" style={{ color: "var(--grey-400)" }}>{c.label}</div>
                  {c.href ? (
                    <a href={c.href} {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-sm font-medium break-words hover:underline" style={{ color: "var(--navy)" }}>{c.value}</a>
                  ) : <div className="text-sm font-medium" style={{ color: "var(--navy)" }}>{c.value}</div>}
                </div>
              ))}
            </div>
            <p className="text-xs mb-6" style={{ color: "var(--grey-400)" }}>{HOSPITAL.poBox}</p>

            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--grey-200)" }}>
              <iframe title="Map showing Lisa Hospitals in Kisumu" src={`https://maps.google.com/maps?q=${q}&output=embed`} className="w-full h-72 border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-semibold" style={{ color: "var(--teal)" }}>Get directions →</a>
          </div>

          <div className="p-6 md:p-8 rounded-xl border h-fit" style={{ borderColor: "var(--grey-200)", background: "white" }}>
            <h2 className="text-2xl font-normal mb-5" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
