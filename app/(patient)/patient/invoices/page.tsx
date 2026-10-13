"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { PAY_STATUS, errMsg, fmtDate, fmtKes, owed } from "@/lib/format";

function Invoices() {
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    billingApi.getMyInvoices()
      .then(({ data }) => { if (!cancelled) setList(data.data); })
      .catch((err) => { if (!cancelled) { setList([]); setError(errMsg(err, "Couldn't load your invoices.")); } });
    return () => { cancelled = true; };
  }, []);

  if (!list) return <Spinner label="Loading your invoices..." />;
  const due = list.reduce((s, i) => s + owed(i), 0);

  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      {due > 0 && <div className="mb-6 p-4 rounded-xl max-w-3xl" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}><span className="text-sm font-semibold">Balance due: {fmtKes(due)}</span> <span className="text-sm">· pay at the hospital&apos;s billing desk and quote the invoice number.</span></div>}
      {list.length === 0 && !error ? (
        <div className="p-8 rounded-xl border text-center" style={{ borderColor: "var(--grey-200)" }}>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>No invoices yet. Your bills will appear here after your visits.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {list.map((i) => (
            <Link key={i.id} href={`/patient/invoices/${i.id}`} className="block">
              <Card className="!p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{i.invoiceNumber}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>{fmtDate(String(i.createdAt).slice(0, 10))}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{fmtKes(i.totalAmount)}</div>
                  {owed(i) > 0 && <div className="text-xs" style={{ color: "var(--danger)" }}>{fmtKes(owed(i))} due</div>}
                </div>
                <Pill tone={PAY_STATUS[i.paymentStatus].tone}>{PAY_STATUS[i.paymentStatus].label}</Pill>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function PatientInvoicesPage() {
  return (
    <PortalShell audience="patient" title={<>My <em className="italic" style={{ color: "var(--teal)" }}>Invoices</em></>} subtitle="Your bills and payments">
      <Invoices />
    </PortalShell>
  );
}
