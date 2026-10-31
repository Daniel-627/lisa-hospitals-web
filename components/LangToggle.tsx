"use client";

import { useLang, tr } from "@/lib/i18n";

/** Small English / Kiswahili switch for the public booking pages. */
export default function LangToggle() {
  const [lang, setLang] = useLang();
  return (
    <button type="button" onClick={() => setLang(lang === "sw" ? "en" : "sw")} lang={lang === "sw" ? "en" : "sw"}
      className="text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "white" }}>
      {tr(lang, "lang")}
    </button>
  );
}
