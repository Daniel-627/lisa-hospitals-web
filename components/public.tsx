import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, accent, subtitle }: { eyebrow?: string; title: string; accent?: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden px-6 py-16 text-center" style={{ background: "var(--navy)" }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: "var(--teal)", transform: "translate(30%, -30%)" }} />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto">
        {eyebrow && <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#5cdde0" }}>{eyebrow}</div>}
        <h1 className="text-4xl md:text-5xl font-normal text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          {title}{accent && <> <em className="italic" style={{ color: "#5cdde0" }}>{accent}</em></>}
        </h1>
        {subtitle && <p className="mt-4 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export function Section({ children, className = "", narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <section className={`px-6 py-14 mx-auto ${narrow ? "max-w-3xl" : "max-w-6xl"} ${className}`}>{children}</section>;
}

export function Unavailable({ what }: { what: string }) {
  return (
    <div className="p-8 rounded-xl border text-center" style={{ borderColor: "var(--grey-200)", background: "white" }}>
      <p className="text-sm" style={{ color: "var(--grey-500)" }}>
        We couldn&apos;t load {what} just now. Please refresh in a moment, or call us on the number above.
      </p>
    </div>
  );
}

export function Badge24({ label = "24HR" }: { label?: string }) {
  return <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fde8e8", color: "var(--danger)" }}>{label}</span>;
}
