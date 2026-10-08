// Postgres `time` arrives as "09:30:00" — show "09:30".
export const hhmm = (t?: string | null) => (t ?? "").slice(0, 5);

// Parse YYYY-MM-DD as a LOCAL date (new Date("2026-10-05") is UTC and can shift the day).
export const localDate = (d: string) => new Date(`${d}T00:00:00`);

export const fmtDate = (
  d?: string | null,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) => (d ? localDate(d.slice(0, 10)).toLocaleDateString("en-KE", opts) : "—");

const pad = (n: number) => String(n).padStart(2, "0");
export const todayLocal = () => {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
};

export const errMsg = (err: any, fallback: string) => err?.response?.data?.error || fallback;

export const DOC_TYPES: [string, string][] = [
  ["lab_result", "Lab result"],
  ["radiology_report", "Radiology report"],
  ["prescription", "Prescription"],
  ["discharge_summary", "Discharge summary"],
  ["referral_letter", "Referral letter"],
  ["medical_certificate", "Medical certificate"],
  ["vaccination_record", "Vaccination record"],
  ["antenatal_card", "Antenatal card"],
  ["invoice", "Invoice"],
  ["insurance_claim", "Insurance claim"],
  ["admission_letter", "Admission letter"],
];
export const docLabel = (v: string) => DOC_TYPES.find(([k]) => k === v)?.[1] ?? v;

export const INSURANCE: [string, string][] = [
  ["cash", "Cash"], ["mpesa", "M-Pesa"], ["sha", "SHA"], ["maki", "Maki"],
  ["aon", "AON"], ["mtiba", "M-Tiba"], ["pesapal", "Pesapal"],
];
export const insuranceLabel = (v?: string | null) => INSURANCE.find(([k]) => k === v)?.[1] ?? "None on file";

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const fmtMoney = (v?: string | number | null) =>
  v == null || v === "" ? "" : `KES ${Number(v).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export const ROLES: [string, string][] = [
  ["patient", "Patient"], ["doctor", "Doctor"], ["nurse", "Nurse"], ["receptionist", "Receptionist"],
  ["lab_technician", "Lab technician"], ["radiographer", "Radiographer"], ["pharmacist", "Pharmacist"],
  ["billing_officer", "Billing officer"], ["admin", "Admin"],
];
export const roleLabel = (v: string) => ROLES.find(([k]) => k === v)?.[1] ?? v;

export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export const URGENCY: { value: string; label: string; hint: string; tone: "danger" | "warn" | "ok" | "muted" }[] = [
  { value: "1_critical",    label: "1 · Critical",    hint: "Life-threatening, needs immediate care", tone: "danger" },
  { value: "2_emergent",    label: "2 · Emergent",    hint: "Very urgent, minutes matter",             tone: "danger" },
  { value: "3_urgent",      label: "3 · Urgent",      hint: "Needs prompt attention",                  tone: "warn" },
  { value: "4_semi_urgent", label: "4 · Semi-urgent", hint: "Can wait a short while",                  tone: "ok" },
  { value: "5_non_urgent",  label: "5 · Non-urgent",  hint: "Routine",                                 tone: "muted" },
];
export const urgencyInfo = (v?: string | null) => URGENCY.find((u) => u.value === v);
