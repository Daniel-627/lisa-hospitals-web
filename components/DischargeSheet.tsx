import { HOSPITAL } from "@/lib/hospital";
import { fmtDate, fmtDateTime } from "@/lib/format";

type Props = {
  patient: { firstName: string; lastName: string; patientNumber: string; dateOfBirth?: string; gender?: string };
  stay: { ward?: string | null; bedNumber?: string | null; department?: string | null; admittedAt: string; dischargedAt?: string | null; doctor?: string | null };
  summary: { finalDiagnosis?: string | null; treatmentGiven?: string | null; conditionOnDischarge?: string | null; followUpInstructions?: string | null; followUpDate?: string | null };
  dischargedBy?: string | null;
};

const Block = ({ label, children }: { label: string; children?: string | null }) =>
  children ? (
    <div className="mb-5">
      <div className="text-xs font-semibold mb-1" style={{ color: "var(--grey-500)" }}>{label.toUpperCase()}</div>
      <p className="text-sm whitespace-pre-line" style={{ color: "var(--navy)" }}>{children}</p>
    </div>
  ) : null;

/** Printable discharge summary: used by staff and by the patient. */
export default function DischargeSheet({ patient, stay, summary, dischargedBy }: Props) {
  return (
    <div className="print-sheet p-6 sm:p-8 rounded-xl border bg-white" style={{ borderColor: "var(--grey-200)" }}>
      <div className="mb-6">
        <div className="text-lg font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>{HOSPITAL.name}</div>
        <div className="text-xs" style={{ color: "var(--grey-500)" }}>{HOSPITAL.addressLines.join(", ")} · {HOSPITAL.phoneDisplay}</div>
        <h2 className="text-base font-bold mt-4" style={{ color: "var(--navy)" }}>Discharge summary</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-6" style={{ color: "var(--navy)" }}>
        <div><span style={{ color: "var(--grey-400)" }}>Patient: </span><strong>{patient.firstName} {patient.lastName}</strong>{patient.patientNumber ? ` (${patient.patientNumber})` : ""}</div>
        {patient.dateOfBirth && <div><span style={{ color: "var(--grey-400)" }}>Date of birth: </span>{fmtDate(patient.dateOfBirth)}{patient.gender ? ` · ${patient.gender}` : ""}</div>}
        <div><span style={{ color: "var(--grey-400)" }}>Admitted: </span>{fmtDateTime(stay.admittedAt)}</div>
        <div><span style={{ color: "var(--grey-400)" }}>Discharged: </span>{fmtDateTime(stay.dischargedAt)}</div>
        <div><span style={{ color: "var(--grey-400)" }}>Ward: </span>{stay.ward ?? "—"}{stay.bedNumber ? `, bed ${stay.bedNumber}` : ""}</div>
        {stay.department && <div><span style={{ color: "var(--grey-400)" }}>Department: </span>{stay.department}</div>}
      </div>

      <Block label="Final diagnosis">{summary.finalDiagnosis}</Block>
      <Block label="Treatment given">{summary.treatmentGiven}</Block>
      <Block label="Condition on discharge">{summary.conditionOnDischarge}</Block>
      <Block label="Follow-up instructions">{summary.followUpInstructions}</Block>
      {summary.followUpDate && <Block label="Follow-up date">{fmtDate(summary.followUpDate)}</Block>}

      <div className="mt-8 pt-4 border-t text-xs" style={{ borderColor: "var(--grey-200)", color: "var(--grey-500)" }}>
        {dischargedBy ? `Discharged by ${dischargedBy}. ` : ""}Please bring this summary to any follow-up visit.
      </div>
    </div>
  );
}
