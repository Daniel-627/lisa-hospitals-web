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
