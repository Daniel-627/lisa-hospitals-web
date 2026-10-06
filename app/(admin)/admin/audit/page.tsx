"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Spinner, inputCls, inputStyle } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { errMsg, fmtDateTime } from "@/lib/format";

const PAGE = 50;
const ACTIONS = [
  "user.role_changed", "user.status_changed", "staff.created", "staff.updated", "doctor.created", "doctor.updated",
  "doctor.availability_set", "news.created", "news.published", "news.unpublished", "news.updated", "news.deleted", "enquiry.deleted",
  "patient.viewed", "patient.break_glass", "document.uploaded",
];
type Result = { key: string; rows: any[]; hasMore: boolean; error: string };

const pretty = (json?: string | null) => {
  if (!json) return null;
  try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; }
};

function AuditLog() {
  const [action, setAction] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [moreError, setMoreError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi.audit({ action: action || undefined, limit: PAGE, offset: 0 })
      .then(({ data }) => { if (!cancelled) setResult({ key: action, rows: data.data, hasMore: data.data.length === PAGE, error: "" }); })
      .catch((err) => { if (!cancelled) setResult({ key: action, rows: [], hasMore: false, error: errMsg(err, "Couldn't load the audit log.") }); });
    return () => { cancelled = true; };
  }, [action]);

  const loading = !result || result.key !== action;
  const rows = loading ? [] : result!.rows;

  const loadMore = async () => {
    if (!result) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const { data } = await adminApi.audit({ action: action || undefined, limit: PAGE, offset: result.rows.length });
      setResult((r) => r && { ...r, rows: [...r.rows, ...data.data], hasMore: data.data.length === PAGE });
    } catch (err) {
      setMoreError(errMsg(err, "Couldn't load more."));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <label htmlFor="a-action" className="sr-only">Filter by action</label>
        <select id="a-action" value={action} onChange={(e) => { setMoreError(""); setAction(e.target.value); }} className={inputCls} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {(result?.error || moreError) && <ErrorBox>{result?.error || moreError}</ErrorBox>}
      {loading ? <Spinner label="Loading..." /> : rows.length === 0 && !result?.error ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>Nothing recorded yet. Role changes, profile edits and news actions will appear here.</p>
      ) : (
        <div className="space-y-2 max-w-4xl">
          {rows.map((r) => {
            const who = r.userFirstName ? `${r.userFirstName} ${r.userLastName}` : "System";
            const oldV = pretty(r.oldValues), newV = pretty(r.newValues);
            return (
              <Card key={r.id} className="!p-0 overflow-hidden">
                <button onClick={() => setOpenId(openId === r.id ? null : r.id)} aria-expanded={openId === r.id} className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
                  <span>
                    <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{r.action}</span>
                    <span className="text-xs ml-2" style={{ color: "var(--grey-500)" }}>on {r.table} by {who}</span>
                  </span>
                  <span className="text-xs" style={{ color: "var(--grey-400)" }}>{fmtDateTime(r.createdAt)}</span>
                </button>
                {openId === r.id && (
                  <div className="px-5 pb-4 pt-1 border-t grid sm:grid-cols-2 gap-3 text-xs" style={{ borderColor: "var(--grey-100)" }}>
                    <div><div className="mb-1 font-semibold" style={{ color: "var(--grey-400)" }}>Before</div><pre className="whitespace-pre-wrap break-words p-3 rounded-lg" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>{oldV ?? "—"}</pre></div>
                    <div><div className="mb-1 font-semibold" style={{ color: "var(--grey-400)" }}>After</div><pre className="whitespace-pre-wrap break-words p-3 rounded-lg" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>{newV ?? "—"}</pre></div>
                    <div className="sm:col-span-2" style={{ color: "var(--grey-400)" }}>{r.recordId ? `Record ${r.recordId}` : ""}{r.ipAddress ? ` · IP ${r.ipAddress}` : ""}</div>
                  </div>
                )}
              </Card>
            );
          })}
          {result?.hasMore && (
            <div className="text-center pt-4">
              <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function AdminAuditPage() {
  return (
    <PortalShell audience="admin" title={<>Audit <em className="italic" style={{ color: "var(--teal)" }}>Log</em></>} subtitle="A record of sensitive actions taken by admins">
      <AuditLog />
    </PortalShell>
  );
}
