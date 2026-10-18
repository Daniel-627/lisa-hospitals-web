"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner, inputCls, inputStyle } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { PAY_STATUS, errMsg, fmtDate, fmtKes, owed } from "@/lib/format";

const TABS: [string, string][] = [["unpaid", "Unpaid"], ["paid", "Paid"], ["waived", "Waived"], ["", "All"]];

function Desk() {
  const [tab, setTab] = useState("unpaid");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<{ key: string; list: any[]; error: string } | null>(null);

  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { billingApi.summary().then(({ data }) => setSummary(data.data)).catch(() => {}); }, []);

  const key = `${tab}|${term}`;
  useEffect(() => {
    let cancelled = false;
    billingApi.list({ status: tab || undefined, q: term || undefined, limit: 100 })
      .then(({ data }) => { if (!cancelled) setRows({ key, list: data.data, error: "" }); })
      .catch((err) => { if (!cancelled) setRows({ key, list: [], error: errMsg(err, "Couldn't load invoices.") }); });
    return () => { cancelled = true; };
  }, [key, tab, term]);

  const loading = !rows || rows.key !== key;
  const tiles = [
    { label: "Outstanding", value: summary ? fmtKes(summary.outstanding) : "…", sub: summary ? `${summary.openInvoices} open invoices` : "" },
    { label: "Collected today", value: summary ? fmtKes(summary.collectedToday) : "…", sub: summary ? `${summary.paymentsToday} payments` : "" },
    { label: "Insurance claims open", value: summary ? String(summary.claimsOpen) : "…", sub: summary ? fmtKes(summary.claimsOpenAmount) : "" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {tiles.map((t) => (
          <Card key={t.label} className="!p-5">
            <div className="text-xs mb-1" style={{ color: "var(--grey-500)" }}>{t.label}</div>
            <div className="text-2xl font-bold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>{t.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>{t.sub}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--grey-200)" }} role="tablist">
          {TABS.map(([v, l]) => (
            <button key={l} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className="px-4 py-1.5 rounded-md text-sm font-medium"
              style={{ background: tab === v ? "white" : "transparent", color: "var(--navy)" }}>{l}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} !w-64`} style={inputStyle} placeholder="Invoice no., patient name or number" aria-label="Search invoices" />
        <div className="ml-auto flex gap-2">
          <Link href="/staff/billing/prices" className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Price list</Link>
          <Link href="/staff/billing/claims"className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Insurance claims</Link>
          <Link href="/staff/billing/new" className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>New invoice</Link>
        </div>
      </div>

      {!loading && rows!.error && <ErrorBox>{rows!.error}</ErrorBox>}
      {loading ? <Spinner label="Loading invoices..." /> : rows!.list.length === 0 && !rows!.error ? (
        <p className="text-sm py-6" style={{ color: "var(--grey-500)" }}>No invoices match.</p>
      ) : (
        <div className="space-y-2">
          {rows!.list.map((i) => {
            const st = PAY_STATUS[i.paymentStatus];
            return (
              <Link key={i.id} href={`/staff/billing/${i.id}`} className="block">
                <Card className="!p-4 flex items-center justify-between gap-4 flex-wrap hover:shadow-md transition-shadow">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{i.invoiceNumber} · {i.firstName} {i.lastName}</div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>{i.patientNumber} · {fmtDate(String(i.createdAt).slice(0, 10))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{fmtKes(i.totalAmount)}</div>
                    {owed(i) > 0 && <div className="text-xs" style={{ color: "var(--danger)" }}>{fmtKes(owed(i))} owed</div>}
                  </div>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function BillingPage() {
  return (
    <PortalShell audience="staff" title={<>Billing <em className="italic" style={{ color: "var(--teal)" }}>Desk</em></>} subtitle="Invoices, payments and insurance claims">
      <Desk />
    </PortalShell>
  );
}
