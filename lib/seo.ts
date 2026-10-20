import type { Metadata } from "next";
import { HOSPITAL } from "@/lib/hospital";
import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";
import { SITE_URL, abs } from "@/lib/site";
import type { Faq } from "@/lib/faqs";

export const SITE_NAME = HOSPITAL.name;
export const DEFAULT_DESCRIPTION =
  "Lisa Hospitals is a 24-hour hospital on Nairobi Highway, Kisumu, Kenya: emergency care, outpatient and inpatient, maternity, ICU, laboratory, pharmacy, radiology, dental, eye care and more.";

/** Title, description, canonical address and social card for one page. `path` is the page's own address, e.g. "/about". */
export function pageMeta(o: { title: string; description: string; path: string; type?: "website" | "article"; image?: string; publishedTime?: string }): Metadata {
  // A page that sets its own openGraph does not inherit the site picture, so it is named here. Relative to metadataBase.
  const image = o.image ?? "/opengraph-image";
  // Shared links (WhatsApp, Facebook, X) show the title on its own, so the hospital's name goes in it.
  const shareTitle = /lisa hospitals/i.test(o.title) ? o.title : `${o.title} | ${SITE_NAME}`;
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: {
      type: o.type ?? "website", siteName: SITE_NAME, locale: "en_KE", url: o.path, title: shareTitle, description: o.description,
      images: [{ url: image, ...(o.image ? {} : { width: 1200, height: 630, alt: `${HOSPITAL.name}: ${HOSPITAL.tagline}` }) }],
      ...(o.publishedTime ? { publishedTime: o.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: shareTitle, description: o.description, images: [image] },
  };
}

/** For every signed-in area (patient, staff, admin), sign-in and payment pages: tells search engines and AI crawlers to leave them out. */
export const PRIVATE_META: Metadata = { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } };

/** First sentence-ish chunk of a text, cut on a word, for use as a page description. */
export function summarize(text: string | null | undefined, max = 158): string {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

// ── Structured data (schema.org, as JSON-LD) ─────────────────────────────────
const phoneIntl = `+254${HOSPITAL.phoneTel.replace(/^0/, "")}`;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const hospitalId = `${SITE_URL}/#hospital`;
export const websiteId = `${SITE_URL}/#website`;

/** The hospital as a business: name, address, phone, hours (open 24/7), departments. Shown on every page. */
export function hospitalJsonLd() {
  return {
    "@type": "Hospital",
    "@id": hospitalId,
    name: HOSPITAL.name,
    alternateName: ["Lisa Hospital", "Lisa Hospitals Kisumu"],
    slogan: HOSPITAL.tagline,
    url: SITE_URL,
    image: abs("/opengraph-image"),
    description: DEFAULT_DESCRIPTION,
    telephone: phoneIntl,
    email: HOSPITAL.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: HOSPITAL.addressLines[0],
      addressLocality: "Kisumu",
      addressCountry: "KE",
      postOfficeBoxNumber: "3503",
      postalCode: "40100",
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HOSPITAL.mapQuery)}`,
    areaServed: { "@type": "City", name: "Kisumu" },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, opens: "00:00", closes: "23:59" }],
    paymentAccepted: `Cash, ${HOSPITAL.insurers.join(", ")}`,
    contactPoint: [{ "@type": "ContactPoint", contactType: "emergency and appointments", telephone: phoneIntl, email: HOSPITAL.email, areaServed: "KE" }],
    department: DEPARTMENTS.map((d) => ({
      "@type": "MedicalClinic", name: d.name, description: d.blurb, url: abs(`/services/${toUrlSlug(d.slug)}`),
      parentOrganization: { "@id": hospitalId },
    })),
  };
}

export function websiteJsonLd() {
  return { "@type": "WebSite", "@id": websiteId, url: SITE_URL, name: SITE_NAME, inLanguage: "en-KE", publisher: { "@id": hospitalId } };
}

/** One department page: a clinic that belongs to the hospital. */
export function departmentJsonLd(d: { name: string; description: string; path: string; is24: boolean }) {
  return {
    "@type": "MedicalClinic",
    "@id": `${abs(d.path)}#clinic`,
    name: d.name,
    description: d.description,
    url: abs(d.path),
    parentOrganization: { "@id": hospitalId },
    address: { "@type": "PostalAddress", streetAddress: HOSPITAL.addressLines[0], addressLocality: "Kisumu", addressCountry: "KE" },
    telephone: phoneIntl,
    ...(d.is24 ? { openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, opens: "00:00", closes: "23:59" }] } : {}),
  };
}

/** One doctor's page. Only what the public page already shows: name, speciality, department, photo. */
export function physicianJsonLd(d: { id: string; firstName: string; lastName: string; speciality?: string | null; department?: string | null; photoUrl?: string | null }) {
  return {
    "@type": "Physician",
    "@id": `${abs(`/doctors/${d.id}`)}#physician`,
    name: `Dr. ${d.firstName} ${d.lastName}`,
    url: abs(`/doctors/${d.id}`),
    ...(d.photoUrl ? { image: d.photoUrl } : {}),
    ...(d.speciality ? { jobTitle: d.speciality, description: `${d.speciality} at ${HOSPITAL.name}, Kisumu${d.department ? ` (${d.department})` : ""}.` } : {}),
    worksFor: { "@id": hospitalId },
    address: { "@type": "PostalAddress", streetAddress: HOSPITAL.addressLines[0], addressLocality: "Kisumu", addressCountry: "KE" },
  };
}

/** A news or health-tip article written by the hospital. */
export function articleJsonLd(a: { slug: string; title: string; description: string; image?: string | null; publishedAt?: string | null; updatedAt?: string | null }) {
  const url = abs(`/news/${a.slug}`);
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.title.slice(0, 110),
    description: a.description,
    url,
    mainEntityOfPage: url,
    inLanguage: "en-KE",
    ...(a.image ? { image: [a.image] } : { image: [abs("/opengraph-image")] }),
    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
    ...((a.updatedAt || a.publishedAt) ? { dateModified: a.updatedAt || a.publishedAt } : {}),
    author: { "@id": hospitalId },
    publisher: { "@id": hospitalId },
  };
}

/** A list of pages (departments, doctors) as search engines read it. */
export function itemListJsonLd(name: string, items: { name: string; path: string }[]) {
  return { "@type": "ItemList", name, numberOfItems: items.length, itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(it.path) })) };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: abs(t.path) })),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return { "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

/** Wraps one or more schema.org objects into a single JSON-LD document. */
export const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
