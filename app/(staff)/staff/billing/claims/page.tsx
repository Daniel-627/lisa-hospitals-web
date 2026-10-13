"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { errMsg, fmtDate, fmtKes, insuranceLabel } from "@/lib/format";

const TABS: [string, string][] = [["open", "Open"], ["paid", "Paid"], ["rejected", "Rejected"], ["", "All"]];
const TONE: Record<string, "ok" | "warn" | "muted" | "danger"> = { submitted: "warn", approved: "ok", paid: "ok", rejected: "danger" };

function Claims() {
  const [tab, setTab] = useState("open");
  const [res, setRes] = useState<{ tab: string; list: any[]; error: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    billingApi.claims(tab || undefined)
      .then(({ data }) => { if (!cancelled) setRes({ tab, list: data.data, error: "" }); })
      .catch((err) => { if (!cancelled) setRes({ tab, list: [], error: errMsg(err, "Couldn't load claims.") }); });
    return () => { cancelled = true; };
  }, [tab]);

  const loading = !res || res.tab !== tab;
  return (
    <>
      <div className="flex gap-1 p-1 rounded-lg w-fit mb-5" style={{ background: "var(--grey-200)" }} role="tablist">
        {TABS.map(([v, l]) => (
          <button key={l} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className="px-4 py-1.5 rounded-md text-sm font-medium" style={{ background: tab === v ? "white" : "transparent", color: "var(--navy)" }}>{l}</button>
        ))}
      </div>
      {!loading && res!.error && <ErrorBox>{res!.error}</ErrorBox>}
      {loading ? <Spinner label="Loading claims..." /> : res!.list.length === 0 && !res!.error ? <p className="text-sm py-6" style={{ color: "var(--grey-500)" }}>No claims here.</p> : (
        <div className="space-y-2">
          {res!.list.map((c) => (
            <Link key={c.id} href={`/staff/billing/${c.invoiceId}`} className="block">
              <Card className="!p-4 flex items-center justify-between gap-4 flex-wrap hover:shadow-md transition-shadow">
                <div className="min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{insuranceLabel(c.scheme)} · {c.firstName} {c.lastName}</div>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>{c.invoiceNumber}{c.claimNumber ? ` · ${c.claimNumber}` : ""} · submitted {fmtDate(String(c.submittedAt).slice(0, 10))}</div>
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{fmtKes(c.claimAmount)}</div>
                <Pill tone={TONE[c.status] ?? "muted"}>{c.status}</Pill>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function ClaimsPage() {
  return (
    <PortalShell audience="staff" title={<>Insurance <em className="italic" style={{ color: "var(--teal)" }}>Claims</em></>} subtitle="Open a claim to approve it, record the insurer's payment or reject it">
      <Claims />
    </PortalShell>
  );
}
