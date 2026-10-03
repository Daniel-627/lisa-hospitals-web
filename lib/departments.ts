// Static copy for the 12 departments. Used for icons, short descriptions and as a fallback
// when the API is asleep, so the public site never looks empty. Live data (names, 24hr flag,
// description, floor, phone, doctors) is layered on top by the pages.
export type DeptMeta = { slug: string; name: string; icon: string; is24: boolean; badge?: string; short: string; blurb: string };

export const DEPARTMENTS: DeptMeta[] = [
  { slug: "outpatient_inpatient", name: "Outpatient & Inpatient", icon: "🏥", is24: true, badge: "24HR",
    short: "Round-the-clock general care",
    blurb: "General medical care for walk-in patients and those admitted to our wards, available day and night." },
  { slug: "accident_emergency", name: "Accident & Emergency", icon: "🚨", is24: true, badge: "URGENT",
    short: "Immediate trauma response",
    blurb: "Immediate assessment and treatment for emergencies and trauma. No referral is needed. Walk in or call our emergency line." },
  { slug: "specialist_clinics", name: "Specialist Clinics", icon: "🩺", is24: false,
    short: "Expert consultations",
    blurb: "Consultations with specialist doctors for conditions that need focused expertise." },
  { slug: "laboratory", name: "Laboratory", icon: "🔬", is24: false,
    short: "Full diagnostic testing",
    blurb: "Diagnostic tests to support accurate diagnosis and treatment. Results are shared with your doctor and in your patient portal." },
  { slug: "pharmacy", name: "Pharmacy", icon: "💊", is24: false,
    short: "In-house dispensary",
    blurb: "An in-house dispensary so you can collect your prescribed medicines before you leave." },
  { slug: "radiology", name: "Radiology & X-Ray", icon: "📡", is24: false,
    short: "Ultrasound, X-ray imaging",
    blurb: "Ultrasound and X-ray imaging to help your doctor see what is happening inside the body." },
  { slug: "physiotherapy", name: "Physiotherapy", icon: "🤸", is24: false,
    short: "Rehabilitation programs",
    blurb: "Rehabilitation and movement therapy to help you recover from injury, surgery or illness." },
  { slug: "dental", name: "Dental Unit", icon: "🦷", is24: false,
    short: "Complete oral care",
    blurb: "Care for your teeth and gums, from check-ups to treatment." },
  { slug: "maternity", name: "Maternity", icon: "👶", is24: true, badge: "24HR",
    short: "Safe births & antenatal",
    blurb: "Antenatal care and safe delivery, with our maternity team available around the clock." },
  { slug: "eye_care", name: "Eye Care Clinic", icon: "👁️", is24: false,
    short: "Vision & eye health",
    blurb: "Eye examinations and care for vision and eye health." },
  { slug: "mother_child_health", name: "Mother & Child Health", icon: "🤱", is24: false,
    short: "MCH & immunisation",
    blurb: "Immunisation and health services that support mothers and children from birth onwards." },
  { slug: "critical_care_icu", name: "Critical Care Unit", icon: "❤️", is24: true, badge: "ICU",
    short: "ICU & HDU",
    blurb: "Intensive and high-dependency care for patients who need close, continuous monitoring." },
];

export const deptMeta = (apiSlug: string) => DEPARTMENTS.find((d) => d.slug === apiSlug);

// URLs read better with hyphens (/services/accident-emergency); the API/database use underscores.
export const toUrlSlug = (apiSlug: string) => apiSlug.replace(/_/g, "-");
export const toApiSlug = (urlSlug: string) => urlSlug.replace(/-/g, "_");
