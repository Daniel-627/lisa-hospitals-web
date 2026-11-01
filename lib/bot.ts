import { HOSPITAL } from "@/lib/hospital";
import { DEPARTMENTS } from "@/lib/departments";
import type { Lang } from "@/lib/i18n";

/**
 * "Lisa" for visitors who are not signed in. A small rule-based helper: it answers only what the hospital has already
 * published (hours, place, phone, how to book) and never gives medical advice. It runs entirely in the browser, so
 * nothing a visitor types is stored or sent anywhere. Anything personal or advanced is handed to the signed-in chat.
 */
export type BotAction = { label: string; href: string };
export type BotReply = { text: string; actions?: BotAction[]; needsAccount?: boolean };

type T = { en: string; sw: string };
const t = (lang: Lang, v: T) => (lang === "sw" ? v.sw : v.en);

const SIGN_IN: BotAction[] = [{ label: "Sign in", href: "/login" }, { label: "Create account", href: "/register" }];
const CALL: BotAction = { label: `Call ${HOSPITAL.phoneDisplay}`, href: `tel:${HOSPITAL.phoneTel}` };

// Match at the start of a word, so "hi" does not fire inside "which" and "sha" not inside "shall".
// A trailing "!" means the whole word only ("sha!" must not match "shall").
const has = (s: string, words: string[]) => words.some((w) => (w.endsWith("!") ? ` ${s} `.includes(` ${w.slice(0, -1)} `) : ` ${s}`.includes(` ${w}`)));
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim();

export const GREETING: T = {
  en: `Hello, I'm Lisa from ${HOSPITAL.name}. I can help with opening hours, where we are, our departments and booking. How can I help?`,
  sw: `Habari, mimi ni Lisa wa ${HOSPITAL.name}. Naweza kusaidia kuhusu saa za kazi, mahali tulipo, idara zetu na kuweka miadi. Nikusaidieje?`,
};
export const QUICK: { en: string; sw: string }[] = [
  { en: "Book an appointment", sw: "Weka miadi" },
  { en: "Opening hours", sw: "Saa za kazi" },
  { en: "Where are you?", sw: "Mko wapi?" },
  { en: "Insurance", sw: "Bima" },
];

/** Replies to one visitor message. `userTurns` counts messages so far; `misses` counts answers we could not give. */
export function botReply(raw: string, lang: Lang, userTurns: number, misses: number): BotReply & { miss?: boolean } {
  const s = norm(raw);

  if (has(s, ["emergency", "urgent", "bleeding", "accident", "unconscious", "chest pain", "cant breathe", "can't breathe", "not breathing", "seizure", "poison", "dharura", "ajali", "damu inatoka", "kupumua"])) {
    return { text: t(lang, {
      en: `If this is an emergency, please call us now on ${HOSPITAL.phoneDisplay} or come straight to Accident & Emergency. We are open 24 hours. I can't give medical advice in this chat.`,
      sw: `Ikiwa ni dharura, tafadhali piga simu sasa ${HOSPITAL.phoneDisplay} au uje moja kwa moja Kitengo cha Dharura. Tuko wazi saa 24. Siwezi kutoa ushauri wa kitabibu hapa.` }), actions: [CALL] };
  }

  // Personal or clinical matters need an account and a person: hand over.
  if (has(s, ["result", "results", "record", "prescription", "medicine", "drug", "diagnos", "symptom", "treatment", "my bill", "invoice", "refund", "complain", "insurance claim", "vipimo", "matokeo", "dawa", "malipo yangu", "lalamiko", "ugonjwa"])) {
    return { needsAccount: true, text: t(lang, {
      en: "That's something our front desk should handle personally. Please sign in or create a free account and message Lisa there. A member of our team will reply.",
      sw: "Hilo linahitaji timu yetu ya mapokezi. Tafadhali ingia au fungua akaunti bure kisha tuma ujumbe kwa Lisa. Mmoja wa timu yetu atakujibu." }), actions: SIGN_IN };
  }

  if (has(s, ["cancel", "reschedule", "move my", "change my", "change appointment", "ghairi", "badilisha", "ahirisha"])) {
    return { text: t(lang, {
      en: "You can cancel or move a booking with your reference (it starts with LH-) and the phone number you booked with.",
      sw: "Unaweza kughairi au kubadilisha miadi kwa kutumia namba yako ya kumbukumbu (inaanza na LH-) na namba ya simu uliyotumia kuweka miadi." }),
      actions: [{ label: lang === "sw" ? "Simamia miadi" : "Manage my booking", href: "/booking/manage" }] };
  }

  if (has(s, ["book", "appointment", "schedule", "see a doctor", "see doctor", "reserve", "miadi", "weka", "kuona daktari"])) {
    return { text: t(lang, {
      en: "You can book online in a minute, with no account needed. Pick a department, a doctor and a time that suits you. We will confirm by SMS.",
      sw: "Unaweza kuweka miadi mtandaoni kwa dakika moja bila akaunti. Chagua idara, daktari na muda unaokufaa. Tutathibitisha kwa SMS." }),
      actions: [{ label: lang === "sw" ? "Weka miadi" : "Book an appointment", href: "/book" }] };
  }

  if (has(s, ["hour", "open", "close", "time are", "what time", "24", "saa", "fungua", "funga", "wazi"])) {
    return { text: t(lang, { en: `${HOSPITAL.hours}. Accident & Emergency never closes. Clinic appointments are booked into time slots online.`, sw: `Tuko wazi saa 24, siku 7 za wiki. Kitengo cha Dharura hakifungi kamwe. Miadi ya kliniki huwekwa kwa muda maalum mtandaoni.` }) };
  }

  if (has(s, ["where", "location", "address", "direction", "map!", "find you", "wapi", "mahali", "anwani", "kufika"])) {
    return { text: t(lang, { en: `We are at ${HOSPITAL.addressLines.join(", ")}. Postal address: ${HOSPITAL.poBox}.`, sw: `Tuko ${HOSPITAL.addressLines.join(", ")}. Anwani ya posta: ${HOSPITAL.poBox}.` }),
      actions: [{ label: lang === "sw" ? "Fungua ramani" : "Open in Maps", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HOSPITAL.mapQuery)}` }] };
  }

  if (has(s, ["phone", "call", "number", "contact", "email", "reach", "simu", "namba", "wasiliana", "barua pepe"])) {
    return { text: t(lang, { en: `Call ${HOSPITAL.phoneDisplay} any time, or email ${HOSPITAL.email}.`, sw: `Piga simu ${HOSPITAL.phoneDisplay} wakati wowote, au tuandikie ${HOSPITAL.email}.` }), actions: [CALL] };
  }

  if (has(s, ["insurance", "sha!", "nhif!", "maki", "aon!", "m-tiba", "mtiba", "bima", "cover"])) {
    return { text: t(lang, { en: `We work with ${HOSPITAL.insurers.join(", ")}. For what your own cover includes, please ask our reception.`, sw: `Tunafanya kazi na ${HOSPITAL.insurers.join(", ")}. Kuhusu unachogharamiwa na bima yako, tafadhali uliza mapokezi.` }), actions: [CALL] };
  }

  if (has(s, ["price", "cost", "how much", "fee!", "charge", "pay", "bei", "gharama", "kiasi gani", "ada"])) {
    return { needsAccount: true, text: t(lang, {
      en: "Prices depend on the service, so I don't quote them here. Our front desk can tell you. Sign in to message Lisa, or call us.",
      sw: "Bei hutegemea huduma, kwa hivyo sitaji hapa. Mapokezi wanaweza kukuambia. Ingia kutuma ujumbe kwa Lisa, au tupigie simu." }), actions: [...SIGN_IN, CALL] };
  }

  if (has(s, ["doctor", "specialist", "daktari", "madaktari"])) {
    return { text: t(lang, { en: "You can see our doctors, their departments and their available times on the website.", sw: "Unaweza kuona madaktari wetu, idara zao na nyakati wanazopatikana kwenye tovuti." }),
      actions: [{ label: lang === "sw" ? "Madaktari wetu" : "Our doctors", href: "/doctors" }, { label: lang === "sw" ? "Weka miadi" : "Book", href: "/book" }] };
  }

  if (has(s, ["service", "department", "clinic", "lab!", "pharmacy", "maternity", "dental", "eye!", "radiology", "x-ray", "xray!", "icu!", "physio", "huduma", "idara", "kliniki", "wodi"])) {
    return { text: t(lang, { en: `Our departments: ${DEPARTMENTS.map((d) => d.name).join(", ")}.`, sw: `Idara zetu: ${DEPARTMENTS.map((d) => d.name).join(", ")}.` }),
      actions: [{ label: lang === "sw" ? "Huduma zetu" : "Our services", href: "/services" }] };
  }

  if (has(s, ["thank", "asante", "shukran"])) return { text: t(lang, { en: "You're welcome. Is there anything else I can help with?", sw: "Karibu. Kuna lingine ninaloweza kusaidia?" }) };
  if (has(s, ["hello", "hi!", "hey!", "habari", "jambo", "mambo", "good morning", "good afternoon", "hujambo"])) return { text: t(lang, GREETING) };
  if (has(s, ["bye", "kwaheri"])) return { text: t(lang, { en: "Take care, and thank you for contacting Lisa Hospitals.", sw: "Kwaheri, na asante kwa kuwasiliana na Lisa Hospitals." }) };

  // Not understood. After a couple of misses, or a long chat, hand over to a person.
  if (misses >= 1 || userTurns >= 6) {
    return { miss: true, needsAccount: true, text: t(lang, {
      en: "I'm only a simple helper, and I'd rather not guess. Sign in or create a free account and message Lisa, and our team will reply. Or call us.",
      sw: "Mimi ni msaidizi rahisi tu, na sipendi kukisia. Ingia au fungua akaunti bure kisha umtumie Lisa ujumbe, timu yetu itakujibu. Au tupigie simu." }), actions: [...SIGN_IN, CALL] };
  }
  return { miss: true, text: t(lang, {
    en: "I'm not sure I understood. I can help with opening hours, location, departments, insurance and booking. What would you like to know?",
    sw: "Sina uhakika nimeelewa. Naweza kusaidia kuhusu saa za kazi, mahali, idara, bima na kuweka miadi. Ungependa kujua nini?" }) };
}
