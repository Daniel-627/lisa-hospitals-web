import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--white)" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16" style={{ background: "var(--navy)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--teal)" }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="1" width="4" height="18" rx="2" fill="white"/>
              <rect x="1" y="8" width="18" height="4" rx="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">Lisa Hospitals</div>
            <div className="text-xs leading-tight" style={{ color: "var(--teal)", letterSpacing: "1px" }}>KISUMU, KENYA</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="tel:0784388734" className="text-sm font-medium hidden md:block" style={{ color: "rgba(255,255,255,0.7)" }}>
            0784 388 734
          </a>
          <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: "var(--teal)" }}>
            Book Appointment
          </Link>
        </div>
      </nav>

      {/* EMERGENCY BAR */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold flex-wrap" style={{ background: "var(--gold)", color: "var(--navy)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <span>24-Hour Emergency Line</span>
        <strong className="text-base">0784 388 734</strong>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Walk-ins welcome · No referrals needed</span>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden px-6 py-24 text-center" style={{ background: "var(--navy)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "var(--teal)", transform: "translate(30%, -30%)" }}/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5" style={{ background: "var(--teal)", transform: "translate(-30%, 30%)" }}/>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-widest uppercase" style={{ background: "rgba(0,150,154,0.15)", border: "1px solid rgba(0,150,154,0.3)", color: "#5cdde0" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00969A" }}/>
            Open 24 Hours · Namba Okana, Kisumu
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Your Health Is<br />
            <em className="italic" style={{ color: "#5cdde0" }}>Our Priority</em>
          </h1>
          <p className="text-lg mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Comprehensive medical care for you and your family — from emergency response and specialist clinics to maternity and critical care.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="px-8 py-3.5 rounded-lg text-white font-semibold text-sm" style={{ background: "var(--teal)" }}>
              Book an Appointment
            </Link>
            <Link href="/services" className="px-8 py-3.5 rounded-lg font-semibold text-sm" style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)", color: "white" }}>
              Our Services
            </Link>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--teal)" }}>What we offer</div>
          <h2 className="text-4xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
            Our Medical <em className="italic" style={{ color: "var(--teal)" }}>Services</em>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <div key={s.name} className="p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer" style={{ borderColor: "var(--grey-200)", background: "white" }}>
              <div className="text-2xl mb-3">{s.icon}</div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>{s.name}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--grey-500)" }}>{s.desc}</p>
              {s.badge && (
                <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fde8e8", color: "var(--danger)" }}>{s.badge}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* INSURANCE */}
      <section className="px-6 py-12 text-center" style={{ background: "var(--teal-light)" }}>
        <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--teal-dark)" }}>Accepted coverage</div>
        <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          We Accept Your <em className="italic">Insurance</em>
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--grey-500)" }}>Direct facility — no referrals needed</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {["SHA", "Maki", "AON", "M-Tiba"].map((ins) => (
            <div key={ins} className="px-6 py-3 rounded-lg font-bold text-sm" style={{ background: "white", border: "1.5px solid var(--grey-200)", color: "var(--navy)" }}>
              {ins}
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 py-16" style={{ background: "var(--navy)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
                {s.num}<span style={{ color: "var(--teal)" }}>{s.unit}</span>
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center relative overflow-hidden" style={{ background: "var(--teal)" }}>
        <h2 className="text-4xl font-normal text-white mb-3 relative z-10" style={{ fontFamily: "var(--font-display)" }}>
          Ready to See a Doctor?
        </h2>
        <p className="text-base mb-8 relative z-10" style={{ color: "rgba(255,255,255,0.8)" }}>
          Book an appointment online or walk in anytime — we&apos;re open around the clock.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap relative z-10">
          <Link href="/register" className="px-8 py-3.5 rounded-lg font-bold text-sm" style={{ background: "white", color: "var(--teal)" }}>
            Book Appointment
          </Link>
          <a href="tel:0784388734" className="px-8 py-3.5 rounded-lg font-semibold text-sm text-white" style={{ border: "2px solid rgba(255,255,255,0.5)" }}>
            Call 0784 388 734
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-12" style={{ background: "#061624" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "18px" }}>Lisa Hospitals</div>
            <div className="text-xs mb-3 tracking-widest" style={{ color: "var(--teal)" }}>YOUR HEALTH, OUR PRIORITY</div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Namba Okana along Nairobi Highway, Kisumu.<br />
              P.O Box 3503-40100.<br />
              lisahospitals2023@gmail.com
            </p>
          </div>
          {footerLinks.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}><Link href="#" className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t pt-6 flex items-center justify-between flex-wrap gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 Lisa Hospitals. All rights reserved.</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Privacy Policy · Terms of Service</p>
        </div>
      </footer>

    </div>
  );
}

const services = [
  { name: "Outpatient & Inpatient", icon: "🏥", desc: "Round-the-clock general care", badge: "24HR" },
  { name: "Accident & Emergency",   icon: "🚨", desc: "Immediate trauma response",   badge: "URGENT" },
  { name: "Specialist Clinics",     icon: "🩺", desc: "Expert consultations" },
  { name: "Laboratory",             icon: "🔬", desc: "Full diagnostic testing" },
  { name: "Pharmacy",               icon: "💊", desc: "In-house dispensary" },
  { name: "Radiology & X-Ray",      icon: "📡", desc: "Ultrasound, X-ray imaging" },
  { name: "Physiotherapy",          icon: "🤸", desc: "Rehabilitation programs" },
  { name: "Dental Unit",            icon: "🦷", desc: "Complete oral care" },
  { name: "Maternity",              icon: "👶", desc: "Safe births & antenatal",    badge: "24HR" },
  { name: "Eye Care Clinic",        icon: "👁️", desc: "Vision & eye health" },
  { name: "Mother & Child Health",  icon: "🤱", desc: "MCH & immunisation" },
  { name: "Critical Care Unit",     icon: "❤️", desc: "ICU & HDU",                  badge: "ICU" },
];

const stats = [
  { num: "24", unit: "/7", label: "Emergency Access" },
  { num: "12", unit: "+",  label: "Departments" },
  { num: "4",  unit: "+",  label: "Insurance Partners" },
  { num: "1",  unit: "",   label: "ICU Unit" },
];

const footerLinks = [
  { title: "Services",  links: ["Emergency Care", "Maternity", "Laboratory", "Pharmacy", "Critical Care"] },
  { title: "Hospital",  links: ["About Us", "Our Doctors", "Insurance", "Careers", "News"] },
  { title: "Patients",  links: ["Book Appointment", "Patient Portal", "Download Forms", "Contact Us"] },
];