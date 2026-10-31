"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Lang = "en" | "sw";
const KEY = "lisa-lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "sw" || v === "en") return v;
    return navigator.language?.toLowerCase().startsWith("sw") ? "sw" : "en";
  } catch { return "en"; }
}

/** Current language for the booking pages (remembered in this browser). Server render and first paint are English. */
export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, read, () => "en" as Lang);
  const set = useCallback((l: Lang) => {
    try { localStorage.setItem(KEY, l); } catch { /* private mode: keep going */ }
    listeners.forEach((f) => f());
  }, []);
  return [lang, set];
}

const EN = {
  "at": "at",
  // headers
  "book.eyebrow": "Appointments", "book.title": "Book your", "book.accent": "appointment", "book.sub": "Choose a doctor and a time that suits you. No account needed.",
  "manage.eyebrow": "Appointments", "manage.title": "Manage your", "manage.accent": "booking", "manage.sub": "Change the time or cancel your appointment.",
  "book.emergency": "This is for planned visits. In an emergency, don't book online: call {phone} or come straight to Accident & Emergency, open 24 hours.",
  // flow
  "loading": "Loading the booking system...", "loadFail": "We couldn't load the booking system. Please try again or call us.",
  "closed": "Online booking isn't open yet. Please call us on {phone} to book.",
  "step1": "Who would you like to see?", "step2": "Pick a day and time", "step3": "Your details",
  "dept": "Department", "deptPick": "Choose a department", "service": "What do you need?", "servicePick": "Choose a service",
  "doctor": "Doctor", "doctorAny": "First available doctor", "doctorHint": "Pick “first available” if you don't mind who you see.",
  "prevMonth": "Previous month", "nextMonth": "Next month", "chooseDay": "Choose a day", "shaded": "Shaded days have free times. Kenya time (EAT).",
  "times": "Available times", "loadingTimes": "Loading times...", "noTimes": "No times left on this day. Please choose another.",
  "withDoctor": "With {doctor}", "autoDoctor": "A doctor will be assigned to you automatically",
  "closedDay": "Closed: {name}",
  "name": "Full name", "phone": "Phone number", "phoneHint": "We text your booking details here.", "email": "Email (optional)",
  "reason": "Reason for visit (optional)", "reasonHint": "Keep it general. Please don't include private medical details.",
  "sendCode": "Send code", "newCode": "Send a new code", "code": "6-digit code", "verifyNote": "We verify your number once so nobody can book in your name.",
  "needCode": "Tap “Send code” to verify your phone number", "pickFirst": "Choose a department, day and time first",
  "privacy": "We use your name and number only to manage this appointment. See our", "privacyLink": "privacy notice",
  "confirm": "Confirm appointment", "booking": "Booking...", "bookFail": "We couldn't complete your booking. Please try again.",
  // full / waiting list
  "full": "Nothing free that suits you?", "joinWait": "Join the waiting list", "waitIntro": "Leave your details and our reception will call you when a time opens up.",
  "waitFrom": "Earliest date you can come", "waitSend": "Add me to the list", "waitDone": "You're on the waiting list. We'll call you if a time opens up.", "waitSending": "Sending...",
  // done
  "doneBooked": "You're booked", "donePending": "Request received", "doneSmsConfirmed": "We've sent the details to your phone.", "doneSmsPending": "Our reception will confirm your appointment shortly.",
  "reference": "Reference", "arrive": "Please arrive 10 minutes early. Keep your reference; you'll need it to change or cancel.",
  "changeCancel": "Change or cancel", "addCal": "Add to calendar",
  // manage
  "m.ref": "Booking reference", "m.refHint": "Starts with LH- (in your confirmation SMS)", "m.phone": "Phone number used to book", "m.find": "Find my booking", "m.looking": "Looking...",
  "m.opening": "Opening your booking...", "m.changeTime": "Change time", "m.cancel": "Cancel appointment",
  "m.cancelAsk": "Cancel this appointment? The time will be released for other patients.", "m.yesCancel": "Yes, cancel it", "m.keep": "Keep it", "m.cancelling": "Cancelling...",
  "m.cancelled": "Your appointment has been cancelled.", "m.moved": "Your appointment has been moved.",
  "m.isStatus": "This appointment is {status}.", "m.bookNew": "Book a new one", "m.movedTwice": "This appointment has been moved twice. To change it again, call {phone}.",
  "m.pickNewDay": "Choose a new day with {doctor}", "m.noOther": "No other times are open with this doctor. Please call us.", "m.confirmNew": "Confirm new time", "m.saving": "Saving...", "m.back": "Back",
  "status.pending": "pending", "status.confirmed": "confirmed", "status.completed": "completed", "status.cancelled": "cancelled", "status.no_show": "missed",
  "lang": "Kiswahili",
} as const;

type Key = keyof typeof EN;

const SW: Partial<Record<Key, string>> = {
  "at": "saa",
  "book.eyebrow": "Miadi", "book.title": "Panga", "book.accent": "miadi yako", "book.sub": "Chagua daktari na wakati unaokufaa. Huhitaji akaunti.",
  "manage.eyebrow": "Miadi", "manage.title": "Simamia", "manage.accent": "miadi yako", "manage.sub": "Badilisha wakati au ghairi miadi yako.",
  "book.emergency": "Hii ni ya ziara zilizopangwa. Katika dharura, usipange mtandaoni: piga {phone} au uje moja kwa moja Idara ya Ajali na Dharura, iliyo wazi saa 24.",
  "loading": "Inapakia mfumo wa kupanga miadi...", "loadFail": "Hatukuweza kupakia mfumo. Tafadhali jaribu tena au tupigie simu.",
  "closed": "Kupanga miadi mtandaoni bado hakujaanza. Tafadhali tupigie {phone} kupanga.",
  "step1": "Ungependa kumwona nani?", "step2": "Chagua siku na wakati", "step3": "Maelezo yako",
  "dept": "Idara", "deptPick": "Chagua idara", "service": "Unahitaji nini?", "servicePick": "Chagua huduma",
  "doctor": "Daktari", "doctorAny": "Daktari yeyote aliye huru", "doctorHint": "Chagua “daktari yeyote” ikiwa huna upendeleo.",
  "prevMonth": "Mwezi uliopita", "nextMonth": "Mwezi ujao", "chooseDay": "Chagua siku", "shaded": "Siku zilizotiwa rangi zina nafasi. Saa za Kenya (EAT).",
  "times": "Nyakati zilizopo", "loadingTimes": "Inapakia nyakati...", "noTimes": "Hakuna nafasi iliyobaki siku hii. Tafadhali chagua nyingine.",
  "withDoctor": "Na {doctor}", "autoDoctor": "Utapangiwa daktari kiotomatiki",
  "closedDay": "Imefungwa: {name}",
  "name": "Jina kamili", "phone": "Nambari ya simu", "phoneHint": "Tutakutumia ujumbe wa miadi kwa nambari hii.", "email": "Barua pepe (si lazima)",
  "reason": "Sababu ya ziara (si lazima)", "reasonHint": "Andika kwa ufupi. Tafadhali usiandike siri za kitabibu.",
  "sendCode": "Tuma nambari", "newCode": "Tuma nambari mpya", "code": "Nambari ya tarakimu 6", "verifyNote": "Tunathibitisha nambari yako mara moja ili mtu asipange kwa jina lako.",
  "needCode": "Bonyeza “Tuma nambari” kuthibitisha simu yako", "pickFirst": "Chagua idara, siku na wakati kwanza",
  "privacy": "Tunatumia jina na nambari yako kusimamia miadi hii tu. Soma", "privacyLink": "taarifa yetu ya faragha",
  "confirm": "Thibitisha miadi", "booking": "Inapanga...", "bookFail": "Hatukuweza kukamilisha miadi yako. Tafadhali jaribu tena.",
  "full": "Hakuna nafasi inayokufaa?", "joinWait": "Jiunge na orodha ya kusubiri", "waitIntro": "Acha maelezo yako na mapokezi watakupigia nafasi ikipatikana.",
  "waitFrom": "Tarehe ya mapema unayoweza kuja", "waitSend": "Niweke kwenye orodha", "waitDone": "Uko kwenye orodha ya kusubiri. Tutakupigia nafasi ikipatikana.", "waitSending": "Inatuma...",
  "doneBooked": "Umepangiwa miadi", "donePending": "Ombi limepokelewa", "doneSmsConfirmed": "Tumetuma maelezo kwa simu yako.", "doneSmsPending": "Mapokezi watathibitisha miadi yako hivi karibuni.",
  "reference": "Nambari ya miadi", "arrive": "Tafadhali fika dakika 10 mapema. Hifadhi nambari yako; utaihitaji kubadilisha au kughairi.",
  "changeCancel": "Badilisha au ghairi", "addCal": "Ongeza kwenye kalenda",
  "m.ref": "Nambari ya miadi", "m.refHint": "Huanza na LH- (kwenye ujumbe wako)", "m.phone": "Nambari ya simu uliyotumia kupanga", "m.find": "Tafuta miadi yangu", "m.looking": "Inatafuta...",
  "m.opening": "Inafungua miadi yako...", "m.changeTime": "Badilisha wakati", "m.cancel": "Ghairi miadi",
  "m.cancelAsk": "Ghairi miadi hii? Wakati huo utaachiwa wagonjwa wengine.", "m.yesCancel": "Ndiyo, ighairi", "m.keep": "Iache", "m.cancelling": "Inaghairi...",
  "m.cancelled": "Miadi yako imeghairiwa.", "m.moved": "Miadi yako imehamishwa.",
  "m.isStatus": "Miadi hii ni: {status}.", "m.bookNew": "Panga mpya", "m.movedTwice": "Miadi hii imehamishwa mara mbili. Kuibadilisha tena, piga {phone}.",
  "m.pickNewDay": "Chagua siku mpya na {doctor}", "m.noOther": "Hakuna nyakati nyingine na daktari huyu. Tafadhali tupigie.", "m.confirmNew": "Thibitisha wakati mpya", "m.saving": "Inahifadhi...", "m.back": "Rudi",
  "status.pending": "inasubiri", "status.confirmed": "imethibitishwa", "status.completed": "imekamilika", "status.cancelled": "imeghairiwa", "status.no_show": "hukuhudhuria",
  "lang": "English",
};

/** Translate a key, filling {placeholders}. Swahili falls back to English if a string is missing. */
export function tr(lang: Lang, key: Key, vars: Record<string, string | number> = {}): string {
  const raw = (lang === "sw" ? SW[key] : undefined) ?? EN[key];
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
export type { Key as TrKey };

/** Service name in the chosen language. */
export const serviceName = (lang: Lang, s: { name: string; nameSw?: string | null }) => (lang === "sw" && s.nameSw ? s.nameSw : s.name);

export const dateLocale = (lang: Lang) => (lang === "sw" ? "sw-KE" : "en-GB");
