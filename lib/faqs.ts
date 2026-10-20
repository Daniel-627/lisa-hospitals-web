import { HOSPITAL } from "@/lib/hospital";
import { DEPARTMENTS } from "@/lib/departments";

/**
 * Questions people (and AI assistants) ask about the hospital, answered in plain sentences that stand on their own.
 * Only facts that are true today belong here: if something changes (hours, insurers, phone), change lib/hospital.ts
 * and these answers follow. Do not add prices, visiting hours or services the hospital does not confirm.
 */
export type Faq = { q: string; a: string };

const deptNames = DEPARTMENTS.map((d) => d.name).join(", ");

export const FAQS: Faq[] = [
  {
    q: "Is Lisa Hospitals open 24 hours?",
    a: `Yes. ${HOSPITAL.name} is open 24 hours a day, 7 days a week. Accident & Emergency, Outpatient and Inpatient care, Maternity and the Critical Care Unit (ICU/HDU) are available day and night.`,
  },
  {
    q: "Where is Lisa Hospitals located?",
    a: `${HOSPITAL.name} is at ${HOSPITAL.addressLines[0]}, Kisumu, Kenya. Postal address: ${HOSPITAL.poBox}.`,
  },
  {
    q: "What is the phone number for Lisa Hospitals?",
    a: `Call ${HOSPITAL.phoneDisplay}, 24 hours a day. You can also email ${HOSPITAL.email}.`,
  },
  {
    q: "Do I need a referral to be seen at Lisa Hospitals?",
    a: "No. You can walk in without a referral, and in an emergency you should come straight to Accident & Emergency or call us.",
  },
  {
    q: "Which insurance schemes does Lisa Hospitals accept?",
    a: `${HOSPITAL.name} works with ${HOSPITAL.insurers.join(", ")}. Contact the hospital to confirm cover for your scheme before you come.`,
  },
  {
    q: "What services and departments does Lisa Hospitals have?",
    a: `${HOSPITAL.name} has ${DEPARTMENTS.length} departments: ${deptNames}.`,
  },
  {
    q: "How do I book an appointment at Lisa Hospitals?",
    a: "Create a patient account on this website and book a time with the doctor you choose, or call the hospital.",
  },
  {
    q: "Can I see my lab results and invoices online?",
    a: "Yes. Patients with an online account can see their results, hospital stays and invoices in the patient portal. Laboratory results are also shared with your doctor.",
  },
  {
    q: "Is my health information kept private?",
    a: "Yes. Your health information is handled with care and kept confidential. A doctor sees the medical record of patients they are treating, and access to a record is logged.",
  },
];
