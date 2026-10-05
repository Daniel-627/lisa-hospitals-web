"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { errMsg, fmtDateTime } from "@/lib/format";

type Result = { key: string; rows: any[]; error: string };

function Inbox() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const key = unreadOnly ? "unread" : "all";
  useEffect(() => {
    let cancelled = false;
    adminApi.enquiries({ unread: unreadOnly || undefined, limit: 100 })
      .then(({ data }) => { if (!cancelled) setResult({ key, rows: data.data, error: "" }); })
      .catch((err) => { if (!cancelled) setResult({ key, rows: [], error: errMsg(err, "Couldn't load messages.") }); });
    return () => { cancelled = true; };
  }, [key, unreadOnly]);

  const loading = !result || result.key !== key;
  const rows = loading ? [] : result!.rows;
  const error = actionError || (loading ? "" : result!.error);

  const setRead = async (m: any, isRead: boolean) => {
    setActionError("");
    try {
      await adminApi.setEnquiryRead(m.id, isRead);
      setResult((r) => r && { ...r, rows: r.rows.map((x) => (x.id === m.id ? { ...x, isRead } : x)) });
    } catch (err) {
      setActionError(errMsg(err, "Couldn't update that message."));
    }
  };

  const toggle = (m: any) => {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && !m.isRead) setRead(m, true); // opening a message marks it read
  };

  const remove = async (m: any) => {
    if (!window.confirm("Delete this message permanently?")) return;
    setActionError("");
    try {
      await adminApi.deleteEnquiry(m.id);
      setResult((r) => r && { ...r, rows: r.rows.filter((x) => x.id !== m.id) });
    } catch (err) {
      setActionError(errMsg(err, "Couldn't delete that message."));
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-6">
        {[["All", false], ["Unread", true]].map(([label, val]) => (
          <button key={String(label)} onClick={() => { setActionError(""); setUnreadOnly(val as boolean); }} aria-pressed={unreadOnly === val}
            className="px-4 py-2 rounded-full text-xs font-semibold" style={{ background: unreadOnly === val ? "var(--navy)" : "var(--grey-200)", color: unreadOnly === val ? "white" : "var(--navy)" }}>
            {label as string}
          </button>
        ))}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? <Spinner label="Loading messages..." /> : rows.length === 0 && !error ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>{unreadOnly ? "No unread messages." : "No messages yet."}</p>
      ) : (
        <div className="space-y-2 max-w-3xl">
          {rows.map((m) => (
            <Card key={m.id} className="!p-0 overflow-hidden">
              <button onClick={() => toggle(m)} aria-expanded={openId === m.id} className="w-full text-left px-5 py-4 flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: m.isRead ? "transparent" : "var(--teal)", border: m.isRead ? "1px solid var(--grey-200)" : "none" }} aria-label={m.isRead ? "Read" : "Unread"} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold truncate" style={{ color: "var(--navy)" }}>{m.subject}</span>
                  <span className="block text-xs" style={{ color: "var(--grey-500)" }}>{m.name} · {fmtDateTime(m.createdAt)}</span>
                </span>
              </button>
              {openId === m.id && (
                <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: "var(--grey-100)" }}>
                  <p className="text-sm whitespace-pre-line leading-relaxed my-4" style={{ color: "var(--navy)" }}>{m.message}</p>
                  <div className="text-xs mb-4" style={{ color: "var(--grey-500)" }}>
                    {m.email}{m.phone ? ` · ${m.phone}` : ""}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--teal)" }}>Reply by email</a>
                    {m.phone && <a href={`tel:${m.phone}`} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Call</a>}
                    <button onClick={() => setRead(m, !m.isRead)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>{m.isRead ? "Mark unread" : "Mark read"}</button>
                    <button onClick={() => remove(m)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "#fde8e8", color: "var(--danger)" }}>Delete</button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminEnquiriesPage() {
  return (
    <PortalShell audience="admin" title={<>Contact <em className="italic" style={{ color: "var(--teal)" }}>Messages</em></>} subtitle="Messages sent through the website contact form">
      <Inbox />
    </PortalShell>
  );
}
