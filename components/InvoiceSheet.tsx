import { Pill } from "@/components/ui";
import { HOSPITAL } from "@/lib/hospital";
import { PAY_STATUS, fmtDateTime, fmtKes, insuranceLabel, owed, payMethodLabel } from "@/lib/format";

/** The printable invoice / receipt: used by staff and by the patient. */
export default function InvoiceSheet({ inv }: { inv: any }) {
  const st = PAY_STATUS[inv.paymentStatus];
  return (
    <div className="print-sheet p-6 sm:p-8 rounded-xl border bg-white" style={{ borderColor: "var(--grey-200)" }}>
      <div className="flex justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-lg font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>{HOSPITAL.name}</div>
          <div className="text-xs" style={{ color: "var(--grey-500)" }}>{HOSPITAL.addressLines.join(", ")}</div>
          <div className="text-xs" style={{ color: "var(--grey-500)" }}>{HOSPITAL.phoneDisplay}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold" style={{ color: "var(--navy)" }}>Invoice {inv.invoiceNumber}</div>
          <div className="text-xs mb-1" style={{ color: "var(--grey-500)" }}>{fmtDateTime(inv.createdAt)}</div>
          <Pill tone={st.tone}>{st.label}</Pill>
        </div>
      </div>

      {inv.patient && (
        <div className="mb-6 text-sm" style={{ color: "var(--navy)" }}>
          <div className="text-xs" style={{ color: "var(--grey-400)" }}>Billed to</div>
          <div className="font-semibold">{inv.patient.firstName} {inv.patient.lastName} · {inv.patient.patientNumber}</div>
          {inv.patient.insuranceScheme && inv.patient.insuranceScheme !== "cash" && (
            <div className="text-xs" style={{ color: "var(--grey-500)" }}>{insuranceLabel(inv.patient.insuranceScheme)}{inv.patient.insuranceNumber ? ` · ${inv.patient.insuranceNumber}` : ""}</div>
          )}
        </div>
      )}

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="text-left text-xs" style={{ color: "var(--grey-400)" }}>
            <th className="py-2 font-medium">Description</th><th className="py-2 font-medium text-right">Qty</th>
            <th className="py-2 font-medium text-right">Unit</th><th className="py-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((i: any) => (
            <tr key={i.id} className="border-t" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}>
              <td className="py-2 pr-2">{i.description}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              {i.needsPrice
                ? <td colSpan={2} className="py-2 text-right text-xs font-semibold" style={{ color: "var(--warn, #b45309)" }}>Price to be confirmed</td>
                : <><td className="py-2 text-right">{fmtKes(i.unitPrice)}</td><td className="py-2 text-right">{fmtKes(i.totalPrice)}</td></>}
            </tr>
          ))}
        </tbody>
      </table>

      {inv.needsPriceCount > 0 && (
        <p className="text-xs mb-3" style={{ color: "var(--grey-500)" }}>
          {inv.needsPriceCount} item{inv.needsPriceCount > 1 ? "s are" : " is"} still waiting for a price, so the total may go up.
        </p>
      )}
      <div className="ml-auto max-w-xs space-y-1 text-sm" style={{ color: "var(--navy)" }}>
        <div className="flex justify-between"><span>Total</span><strong>{fmtKes(inv.totalAmount)}</strong></div>
        <div className="flex justify-between"><span>Paid</span><span>{fmtKes(inv.paidAmount)}</span></div>
        <div className="flex justify-between border-t pt-1" style={{ borderColor: "var(--grey-200)" }}>
          <span>{inv.paymentStatus === "waived" ? "Waived" : "Balance due"}</span>
          <strong style={{ color: owed(inv) > 0 ? "var(--danger)" : "var(--navy)" }}>{fmtKes(owed(inv))}</strong>
        </div>
      </div>

      {inv.payments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--grey-500)" }}>PAYMENTS RECEIVED</h3>
          <ul className="space-y-1 text-sm" style={{ color: "var(--navy)" }}>
            {inv.payments.map((p: any) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>{fmtDateTime(p.paidAt)} · {payMethodLabel(p.paymentMethod)}{p.referenceNumber ? ` · ${p.referenceNumber}` : ""}</span>
                <span>{fmtKes(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {inv.notes && <p className="mt-6 text-xs whitespace-pre-line" style={{ color: "var(--grey-500)" }}>{inv.notes}</p>}
    </div>
  );
}
