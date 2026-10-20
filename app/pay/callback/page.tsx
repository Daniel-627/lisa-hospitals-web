"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { errMsg, fmtKes } from "@/lib/format";
import { Icon } from "@/components/Icon";

type Result = { status: "success" | "pending" | "failed" | "review"; invoiceNumber?: string; amount?: string };

// Where Paystack sends the payer back to. The server asks Paystack what really happened, so this page can't be tricked
// by editing the address. M-Pesa can take a few seconds, so a "pending" answer is re-checked a handful of times.
function Callback() {
  const sp = useSearchParams();
  const reference = sp.get("reference") ?? sp.get("trxref") ?? "";
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    billingApi.verifyPayment(reference)
      .then(({ data }) => {
        if (cancelled) return;
        setResult(data.data); setError("");
        if (data.data.status === "pending" && tries < 8) timer = setTimeout(() => setTries((n) => n + 1), 4000);
      })
      .catch((err) => { if (!cancelled) setError(errMsg(err, "We couldn't check your payment right now.")); });
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [reference, tries]);

  const box = "max-w-md mx-auto text-center p-8 rounded-xl border bg-white";
  const wrap = { borderColor: "var(--grey-200)" };

  if (!reference) return <div className={box} style={wrap}><p className="text-sm" style={{ color: "var(--grey-500)" }}>No payment to check. <Link href="/patient/invoices" style={{ color: "var(--teal)" }}>Go to my invoices</Link></p></div>;
  if (error && !result) return <div className={box} style={wrap}><p className="text-sm mb-4" style={{ color: "var(--danger)" }}>{error}</p><button onClick={() => setTries((n) => n + 1)} className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Check again</button></div>;
  if (!result) return <Spinner label="Checking your payment..." />;

  const view =
    result.status === "success" ? { icon: "success", title: "Payment received", body: `Thank you. ${fmtKes(result.amount)} has been added to invoice ${result.invoiceNumber}.`, color: "var(--success)" }
    : result.status === "pending" ? { icon: "pending", title: "Waiting for confirmation", body: "If you were sent an M-Pesa prompt, enter your PIN on your phone. This page updates by itself.", color: "var(--gold-dark)" }
    : result.status === "review" ? { icon: "warning", title: "We received your payment", body: "It needs a quick check by our billing desk before it shows on your invoice. You won't be charged twice. Please keep your reference below.", color: "var(--gold-dark)" }
    : { icon: "failed", title: "Payment not completed", body: "No money was taken. You can try again from your invoice.", color: "var(--danger)" };

  return (
    <div className={box} style={wrap}>
      <div className="text-5xl mb-3 flex justify-center" style={{ color: view.color }} aria-hidden><Icon name={view.icon} /></div>
      <h1 className="text-xl font-semibold mb-2" style={{ color: view.color, fontFamily: "var(--font-display)" }}>{view.title}</h1>
      <p className="text-sm mb-4" style={{ color: "var(--grey-500)" }}>{view.body}</p>
      <p className="text-xs mb-6 break-all" style={{ color: "var(--grey-400)" }}>Reference: {reference}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        {result.status === "pending" && <button onClick={() => setTries((n) => n + 1)} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Check now</button>}
        <Link href="/patient/invoices" className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>My invoices</Link>
        <Link href="/staff/billing" className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Billing desk (staff)</Link>
      </div>
    </div>
  );
}

export default function PayCallbackPage() {
  return (
    <main className="px-6 py-16 min-h-[60vh]" style={{ background: "var(--white)" }}>
      <Suspense fallback={<Spinner label="Checking your payment..." />}><Callback /></Suspense>
    </main>
  );
}
