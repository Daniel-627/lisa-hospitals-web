import type { Faq } from "@/lib/faqs";

/** Questions and answers as native <details>: works without JavaScript, and the full text is in the page for crawlers. */
export default function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y rounded-xl border bg-white" style={{ borderColor: "var(--grey-200)" }}>
      {faqs.map((f) => (
        <details key={f.q} className="group px-5 py-4" style={{ borderColor: "var(--grey-200)" }}>
          <summary className="cursor-pointer list-none text-sm font-semibold flex justify-between gap-4" style={{ color: "var(--navy)" }}>
            <h3 className="text-sm font-semibold">{f.q}</h3>
            <span className="text-lg leading-none transition-transform group-open:rotate-45" style={{ color: "var(--teal)" }} aria-hidden="true">+</span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--grey-500)" }}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
