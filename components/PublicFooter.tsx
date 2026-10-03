import Link from "next/link";
import { HOSPITAL } from "@/lib/hospital";
import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";

const col = "text-xs font-bold tracking-widest uppercase mb-4";
const link = "text-xs hover:underline";

export default function PublicFooter() {
  return (
    <footer className="px-6 py-12" style={{ background: "#061624" }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "18px" }}>{HOSPITAL.name}</div>
          <div className="text-xs mb-3 tracking-widest" style={{ color: "var(--teal)" }}>{HOSPITAL.tagline.toUpperCase()}</div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            {HOSPITAL.addressLines[0]}, Kisumu.<br />
            {HOSPITAL.poBox}.<br />
            <a href={`mailto:${HOSPITAL.email}`} className="hover:underline">{HOSPITAL.email}</a>
          </p>
        </div>

        <div>
          <div className={col} style={{ color: "rgba(255,255,255,0.35)" }}>Services</div>
          <ul className="space-y-2">
            {DEPARTMENTS.filter((d) => ["accident_emergency", "maternity", "laboratory", "pharmacy", "critical_care_icu"].includes(d.slug)).map((d) => (
              <li key={d.slug}><Link href={`/services/${toUrlSlug(d.slug)}`} className={link} style={{ color: "rgba(255,255,255,0.5)" }}>{d.name}</Link></li>
            ))}
            <li><Link href="/services" className={link} style={{ color: "var(--teal)" }}>All services →</Link></li>
          </ul>
        </div>

        <div>
          <div className={col} style={{ color: "rgba(255,255,255,0.35)" }}>Hospital</div>
          <ul className="space-y-2">
            {[["/about", "About us"], ["/doctors", "Our doctors"], ["/about#insurance", "Insurance"], ["/news", "News & health tips"], ["/contact", "Contact us"]].map(([href, label]) => (
              <li key={href}><Link href={href} className={link} style={{ color: "rgba(255,255,255,0.5)" }}>{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <div className={col} style={{ color: "rgba(255,255,255,0.35)" }}>Patients</div>
          <ul className="space-y-2">
            {[["/patient/appointments/book", "Book appointment"], ["/auth/callback", "Patient portal"], ["/contact", "Get in touch"]].map(([href, label]) => (
              <li key={href}><Link href={href} className={link} style={{ color: "rgba(255,255,255,0.5)" }}>{label}</Link></li>
            ))}
            <li><a href={`tel:${HOSPITAL.phoneTel}`} className={link} style={{ color: "rgba(255,255,255,0.5)" }}>Call {HOSPITAL.phoneDisplay}</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} {HOSPITAL.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
