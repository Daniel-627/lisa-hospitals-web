"use client";

import { useState } from "react";
import { Card, ErrorBox, Field, inputCls, inputStyle } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { errMsg, fmtKes, owed } from "@/lib/format";

const MAX_PER_PAYMENT = 150_000; // M-Pesa limit per transaction

/**
 * "Pay now" for an invoice: M-Pesa or card through Paystack. Used by the patient on their own invoice and by the
 * billing desk for a patient standing in front of them. The payer is sent to Paystack and comes back to /pay/callback.
 */
export default function PayOnline({ inv, title = "Pay now" }: { inv: { id: string; totalAmount: string; paidAmount: string; paymentStatus: string }; title?: string }) {
  const due = owed(inv);
  const [amount, setAmount] = useState(String(Math.min(due, MAX_PER_PAYMENT)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (due <= 0 || inv.paymentStatus === "waived") return null;

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const a = Number(amount);
    if (!(a > 0)) return setError("Enter the amount you want to pay.");
    if (a > due) return setError(`That is more than the balance of ${fmtKes(due)}.`);
    if (a > MAX_PER_PAYMENT) return setError("M-Pesa allows at most KES 150,000 per payment. Pay in parts.");
    setBusy(true);
    try {
      const { data } = await billingApi.pay(inv.id, a);
      window.location.assign(data.data.authorizationUrl); // leave for Paystack's secure page
    } catch (err) {
      setError(errMsg(err, "Couldn't start the payment. Please try again."));
      setBusy(false);
    }
  };

  return (
    <Card className="no-print">
      <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>{title}</h2>
      <p className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>Pay by M-Pesa or card. You will be taken to Paystack&apos;s secure page, then brought back here.</p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={go} className="space-y-3">
        <Field label={`Amount (KES) · ${fmtKes(due)} due`} htmlFor="po-amount">
          <input id="po-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} style={inputStyle} inputMode="decimal" />
        </Field>
        <button type="submit" disabled={busy} className="px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>
          {busy ? "Opening Paystack..." : "Pay with M-Pesa or card"}
        </button>
      </form>
    </Card>
  );
}
