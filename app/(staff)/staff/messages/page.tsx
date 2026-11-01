"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Composer, clock } from "@/components/chat";
import { PhoneLink } from "@/components/BookingDeskParts";
import { ErrorBox, Pill, Spinner } from "@/components/ui";
import { chatApi } from "@/lib/api";
import { errMsg, fmtDate, hhmm } from "@/lib/format";
import { ArrowLeft, Search } from "lucide-react";

type Thread = { id: string; patientName: string; phone: string; preview: string; lastMessageAt: string; lastSender: string; unread: boolean };
type Msg = { id: string; from: "patient" | "staff"; body: string; createdAt: string; by: { name: string; role: string; id: string } | null };
type Open = { patient: { name: string; phone: string; email: string }; visits: { id: string; reference: string; date: string; time: string; status: string; doctor: string; department: string }[]; messages: Msg[] };

function Inbox() {
  const me = useMe();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const qRef = useRef(q);
  useEffect(() => { qRef.current = q; }, [q]);

  const loadThreads = useCallback(async () => {
    try { const { data } = await chatApi.threads(qRef.current.trim() || undefined); setThreads(data.data); }
    catch (e) { setError(errMsg(e, "We couldn't load the inbox.")); setThreads((t) => t ?? []); }
  }, []);

  useEffect(() => {
    const first = setTimeout(loadThreads, q ? 250 : 0);   // small delay while typing a search
    return () => clearTimeout(first);
  }, [q, loadThreads]);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) loadThreads(); }, 10_000);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (!sel) return;
    let stop = false;
    const pull = async () => {
      if (document.hidden) return;
      try { const { data } = await chatApi.open(sel); if (!stop) { setOpen((cur) => (cur && cur.messages.length === data.data.messages.length && cur.patient.name === data.data.patient.name ? cur : data.data)); } }
      catch (e) { if (!stop) setError(errMsg(e, "We couldn't open that conversation.")); }
    };
    pull();
    const t = setInterval(pull, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [sel]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [open?.messages.length, sel]);

  const choose = (id: string) => { setError(""); setOpen(null); setSel(id); setThreads((l) => l && l.map((t) => (t.id === id ? { ...t, unread: false } : t))); };
  const reply = async (text: string) => {
    if (!sel) return;
    setError("");
    try { await chatApi.reply(sel, text); const { data } = await chatApi.open(sel); setOpen(data.data); loadThreads(); }
    catch (e) { setError(errMsg(e, "Your reply didn't send. Please try again.")); throw e; }
  };

  return (
    <div className="rounded-2xl border overflow-hidden grid lg:grid-cols-[320px_1fr] h-[75vh] min-h-[480px]" style={{ borderColor: "var(--grey-200)", background: "var(--surface)" }}>
      {/* Conversations: on a phone this is the whole screen until one is opened */}
      <section className={`${sel ? "hidden lg:flex" : "flex"} flex-col min-h-0 border-r`} style={{ borderColor: "var(--grey-200)" }} aria-label="Conversations">
        <div className="p-3 border-b" style={{ borderColor: "var(--grey-200)" }}>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--grey-400)" }} aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" aria-label="Search conversations"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "var(--surface)" }} />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {threads === null && <li><Spinner /></li>}
          {threads?.length === 0 && <li className="p-6 text-sm text-center" style={{ color: "var(--grey-500)" }}>{q ? "No one matches that." : "No conversations yet. Patients who message Lisa appear here."}</li>}
          {threads?.map((t) => (
            <li key={t.id}>
              <button onClick={() => choose(t.id)} aria-current={sel === t.id}
                className="w-full text-left px-4 py-3 border-b hover:bg-[var(--grey-100)]" style={{ borderColor: "var(--grey-200)", background: sel === t.id ? "var(--teal-light)" : undefined }}>
                <div className="flex items-center gap-2">
                  <span className={`flex-1 truncate text-sm ${t.unread ? "font-bold" : "font-medium"}`} style={{ color: "var(--navy)" }}>{t.patientName}</span>
                  {t.unread && <span className="size-2.5 rounded-full shrink-0" style={{ background: "var(--danger)" }} aria-label="Unread" />}
                  <span className="text-[11px] shrink-0" style={{ color: "var(--grey-400)" }}>{clock(t.lastMessageAt)}</span>
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: "var(--grey-500)" }}>{t.lastSender === "staff" ? "Lisa: " : ""}{t.preview}</div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${sel ? "flex" : "hidden lg:flex"} flex-col min-h-0`} aria-label="Conversation">
        {!sel ? (
          <div className="m-auto text-sm px-6 text-center" style={{ color: "var(--grey-500)" }}>Choose a conversation. Everyone on the front desk sees the same chat, and the patient only ever sees “Lisa”.</div>
        ) : !open ? <Spinner /> : (
          <>
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--grey-200)" }}>
              <button onClick={() => { setSel(null); setOpen(null); loadThreads(); }} className="lg:hidden size-9 rounded-lg border flex items-center justify-center" style={{ borderColor: "var(--grey-200)", color: "var(--grey-600)" }} aria-label="Back to conversations">
                <ArrowLeft className="size-4" aria-hidden />
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate" style={{ color: "var(--navy)" }}>{open.patient.name}</div>
                <div className="text-xs"><PhoneLink phone={open.patient.phone} /></div>
              </div>
            </div>
            {open.visits.length > 0 && (
              <div className="px-4 py-2 border-b flex gap-2 overflow-x-auto" style={{ borderColor: "var(--grey-200)" }} aria-label="Recent visits">
                {open.visits.slice(0, 4).map((v) => (
                  <span key={v.id} className="shrink-0 text-xs px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: "var(--grey-100)", color: "var(--grey-600)" }}>
                    {fmtDate(v.date)} {hhmm(v.time)} · {v.status.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" aria-live="polite">
              {open.messages.map((m) => {
                const mine = m.from === "staff";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[82%]">
                      <div className={`text-[11px] mb-1 mx-1 flex items-center gap-1.5 ${mine ? "justify-end" : ""}`} style={{ color: "var(--grey-500)" }}>
                        {mine ? (<><span className="font-semibold" style={{ color: "var(--navy)" }}>{m.by?.id === me.id ? "You" : m.by?.name}</span><Pill tone="muted">{m.by?.role}</Pill></>) : <span className="font-semibold" style={{ color: "var(--navy)" }}>{open.patient.name}</span>}
                      </div>
                      <div className="px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words"
                        style={mine ? { background: "var(--teal)", color: "white", borderBottomRightRadius: 6 } : { background: "var(--grey-100)", color: "var(--navy)", borderBottomLeftRadius: 6 }}>
                        {m.body}
                      </div>
                      <div className={`text-[11px] mt-1 mx-1 ${mine ? "text-right" : ""}`} style={{ color: "var(--grey-400)" }}>{clock(m.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={end} />
            </div>
            {error && <div className="px-4"><ErrorBox>{error}</ErrorBox></div>}
            <Composer onSend={reply} placeholder="Reply as Lisa…" hint="The patient sees this as “Lisa”. Your name and role are shown to colleagues only." />
          </>
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return <PortalShell audience="staff" title="Lisa chat" subtitle="Messages from signed-in patients, shared by the whole front desk."><Inbox /></PortalShell>;
}
