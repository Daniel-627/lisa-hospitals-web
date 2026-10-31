"use client";

import { PageHero } from "@/components/public";
import { HOSPITAL } from "@/lib/hospital";
import { tr, useLang } from "@/lib/i18n";

export function BookHero() {
  const [lang] = useLang();
  return <PageHero eyebrow={tr(lang, "book.eyebrow")} title={tr(lang, "book.title")} accent={tr(lang, "book.accent")} subtitle={tr(lang, "book.sub")} />;
}

export function ManageHero() {
  const [lang] = useLang();
  return <PageHero eyebrow={tr(lang, "manage.eyebrow")} title={tr(lang, "manage.title")} accent={tr(lang, "manage.accent")} subtitle={tr(lang, "manage.sub")} />;
}

export function EmergencyNote() {
  const [lang] = useLang();
  const parts = tr(lang, "book.emergency", { phone: "§" }).split("§");
  return (
    <p className="text-xs mt-8" style={{ color: "var(--grey-500)" }}>
      {parts[0]}<a className="font-semibold underline" href={`tel:${HOSPITAL.phoneTel}`}>{HOSPITAL.phoneDisplay}</a>{parts[1]}
    </p>
  );
}
