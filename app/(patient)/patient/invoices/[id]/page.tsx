"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import InvoiceSheet from "@/components/InvoiceSheet";
import { ErrorBox, Spinner } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

function Detail() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    billingApi.getById(id)
      .then(({ data }) => { if (!cancelled) setInv(data.data); })
      .catch((err) => { if (!cancelled) setError(errMsg(err, "Couldn't load this invoice.")); });
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!inv) return <Spinner label="Loading invoice..." />;
  return (
    <div className="max-w-3xl">
      <Link href="/patient/invoices" className="text-sm no-print" style={{ color: "var(--teal)" }}>← My invoices</Link>
      <div className="mt-4"><InvoiceSheet inv={inv} /></div>
      <button onClick={() => window.print()} className="no-print mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Print / save as PDF</button>
    </div>
  );
}

export default function PatientInvoicePage() {
  return (
    <PortalShell audience="patient" title={<>Invoice</>}>
      <Detail />
    </PortalShell>
  );
}
