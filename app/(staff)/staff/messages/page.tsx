"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Composer, MessageBody, TypingLine, clock, type Attachment } from "@/components/chat";
import { PhoneLink } from "@/components/BookingDeskParts";
import { ErrorBox, Pill, Spinner } from "@/components/ui";
import { chatApi } from "@/lib/api";
import { acquireSocket, releaseSocket, useSocketConnected } from "@/lib/socket";
import { QUICK_REPLIES } from "@/lib/quickReplies";
import { errMsg, fmtDate, hhmm } from "@/lib/format";
import { ArrowLeft, MessageSquarePlus, Search, Zap } from "lucide-react";

type Thread = { id: string; patientUserId: string; patientName: string; phone: string; preview: string; lastMessageAt: string; lastSender: string; unread: boolean };
type Msg = { id: string; from: "patient" | "staff"; body: string; attachment?: Attachment | null; createdAt: string; by: { name: string; role: string; id: string } | null };
type Open = { patient: { userId: string; name: string; phone: string; email: string }; patientReadAt: string | null; visits: { id: string; reference: string; date: string; time: string; status: string }[]; messages: Msg[] };
type Found = { id: string; name: string; phone: string };

function Inbox() {
  const me = useMe();
  const connected = useSocketConnected();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState<{ threadId: string; text: string } | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [finder, setFinder] = useState(false);
  const [fq, setFq] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [newFor, setNewFor] = useState<Found | null>(null);
  const [quick, setQuick] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const selRef = useRef<string | null>(null);
  const qRef = useRef(q);
  const lastTyped = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sockRef = useRef<ReturnType<typeof acquireSocket> | null>(null);
  useEffect(() => { qRef.current = q; }, [q]);
  useEffect(() => { selRef.current = sel; }, [sel]);

  const loadThreads = useCallback(async () => {
    try { const { data } = await chatApi.threads(qRef.current.trim() || undefined); setThreads(data.data); }
    catch (e) { setError(errMsg(e, "We couldn't load the inbox.")); setThreads((t) => t ?? []); }
  }, []);
  const loadOpen = useCallback(async (id: string, peek = false) => {
    try { const { data } = await chatApi.open(id, peek); if (selRef.current === id) setOpen(data.data); }
    catch (e) { if (selRef.current === id) setError(errMsg(e, "We couldn't open that conversation.")); }
  }, []);

  useEffect(() => { const t = setTimeout(loadThreads, q ? 250 : 0); return () => clearTimeout(t); }, [q, loadThreads]);

  // Live updates.
  useEffect(() => {
    const s = acquireSocket();
    sockRef.current = s;
    const onConnect = () => { loadThreads(); if (selRef.current) loadOpen(selRef.current); };
    const onList = ({ userIds }: { userIds: string[] }) => setOnline(new Set(userIds));
    const onPresence = ({ userId, online: on }: { userId: string; online: boolean }) => setOnline((cur) => { const n = new Set(cur); if (on) n.add(userId); else n.delete(userId); return n; });
    const onMessage = (e: { threadId: string; patientUserId: string; patientName: string; preview: string; message: Msg }) => {
      const viewing = selRef.current === e.threadId && !document.hidden;
      setThreads((cur) => {
        const list = cur ?? [];
        const existing = list.find((t) => t.id === e.threadId);
        const row: Thread = {
          id: e.threadId, patientUserId: e.patientUserId, patientName: e.patientName, phone: existing?.phone ?? "", preview: e.preview,
          lastMessageAt: e.message.createdAt, lastSender: e.message.from, unread: e.message.from === "patient" && !viewing,
        };
        if (!existing && !qRef.current) setTimeout(loadThreads, 0);   // a brand-new conversation: get its phone etc.
        return [row, ...list.filter((t) => t.id !== e.threadId)];
      });
      if (selRef.current === e.threadId) {
        setOpen((cur) => (cur && !cur.messages.some((m) => m.id === e.message.id) ? { ...cur, messages: [...cur.messages, e.message] } : cur));
        setTyping(null);
        if (viewing && e.message.from === "patient") chatApi.seen(e.threadId).catch(() => {});
      }
    };
    const onRead = (e: { threadId: string; by: string; at: string }) => {
      if (e.by === "staff") setThreads((cur) => cur && cur.map((t) => (t.id === e.threadId ? { ...t, unread: false } : t)));
      if (e.by === "patient" && selRef.current === e.threadId) setOpen((cur) => (cur ? { ...cur, patientReadAt: e.at } : cur));
    };
    const onTypingEv = (e: { threadId: string; from: string; name: string }) => {
      if (e.threadId !== selRef.current) return;
      if (e.from === "staff" && !e.name) return;
      setTyping({ threadId: e.threadId, text: e.from === "patient" ? `${e.name} is typing…` : `${e.name} (colleague) is typing…` });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 3500);
    };
    s.on("connect", onConnect); s.on("presence:list", onList); s.on("presence", onPresence); s.on("message", onMessage); s.on("read", onRead); s.on("typing", onTypingEv);
    return () => {
      clearTimeout(typingTimer.current);
      s.off("connect", onConnect); s.off("presence:list", onList); s.off("presence", onPresence); s.off("message", onMessage); s.off("read", onRead); s.off("typing", onTypingEv);
      sockRef.current = null; releaseSocket();
    };
  }, [loadThreads, loadOpen]);

  // Fallback polling, only while the live connection is down.
  useEffect(() => {
    if (connected) return;
    const t = setInterval(() => { if (document.hidden) return; loadThreads(); if (selRef.current) loadOpen(selRef.current, false); }, 6000);
    return () => clearInterval(t);
  }, [connected, loadThreads, loadOpen]);

  useEffect(() => { if (!sel) return; const t = setTimeout(() => loadOpen(sel), 0); return () => clearTimeout(t); }, [sel, loadOpen]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [open?.messages.length, sel, typing]);

  useEffect(() => {
    if (!finder || fq.trim().length < 2) return;
    let stale = false;
    const t = setTimeout(() => { chatApi.findPatients(fq.trim()).then((r) => { if (!stale) setFound(r.data.data); }).catch(() => {}); }, 250);
    return () => { stale = true; clearTimeout(t); };
  }, [fq, finder]);

  const choose = (id: string) => {
    setError(""); setOpen(null); setText(""); setQuick(false); setNewFor(null); setTyping(null); setSel(id);
    setThreads((l) => l && l.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  };
  const startWith = (p: Found) => {
    setFinder(false); setFq(""); setFound([]);
    const existing = threads?.find((t) => t.patientUserId === p.id);
    if (existing) return choose(existing.id);
    setSel(null); setOpen(null); setText(""); setNewFor(p);
  };

  const onTyping = () => {
    if (!sel) return;
    const now = Date.now();
    if (now - lastTyped.current < 2000) return;
    lastTyped.current = now;
    sockRef.current?.emit("typing", { threadId: sel });
  };

  const reply = async (body: string, file: { url: string; name: string } | null) => {
    setError("");
    try {
      if (newFor) {
        const { data } = await chatApi.start(newFor.id, body, file);
        setNewFor(null); await loadThreads(); choose(data.data.threadId);
      } else if (sel) {
        await chatApi.reply(sel, body, file);
        await loadOpen(sel); loadThreads();
      }
    } catch (e) { setError(errMsg(e, "Your reply didn't send. Please try again.")); throw e; }
  };

  const patientFirst = (open?.patient.name ?? newFor?.name ?? "").split(" ")[0];
  const lastStaff = open ? [...open.messages].reverse().find((m) => m.from === "staff") : undefined;
  const seenByPatient = !!(lastStaff && open?.patientReadAt && new Date(open.patientReadAt).getTime() >= new Date(lastStaff.createdAt).getTime());
  const patientOnline = !!(open && online.has(open.patient.userId));
  const showConv = !!(sel || newFor);

  return (
    <div className="rounded-2xl border overflow-hidden grid lg:grid-cols-[330px_1fr] h-[75vh] min-h-[480px]" style={{ borderColor: "var(--grey-200)", background: "var(--surface)" }}>
      <section className={`${showConv ? "hidden lg:flex" : "flex"} flex-col min-h-0 border-r`} style={{ borderColor: "var(--grey-200)" }} aria-label="Conversations">
        <div className="p-3 border-b space-y-2" style={{ borderColor: "var(--grey-200)" }}>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--grey-400)" }} aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" aria-label="Search conversations"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "var(--surface)" }} />
          </div>
          <button onClick={() => setFinder((f) => !f)} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border hover:bg-[var(--grey-100)]" style={{ borderColor: "var(--grey-200)", color: "var(--teal-dark)" }}>
            <MessageSquarePlus className="size-4" aria-hidden /> New chat
          </button>
          {finder && (
            <div>
              <input autoFocus value={fq} onChange={(e) => setFq(e.target.value)} placeholder="Patient name or phone (2+ letters)" aria-label="Find a patient"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "var(--surface)" }} />
              <ul className="mt-1 rounded-lg border max-h-48 overflow-y-auto" style={{ borderColor: "var(--grey-200)" }}>
                {fq.trim().length >= 2 && found.length === 0 && <li className="px-3 py-2 text-xs" style={{ color: "var(--grey-500)" }}>No patient account matches. Only patients with an account can be messaged.</li>}
                {found.map((p) => (
                  <li key={p.id}><button onClick={() => startWith(p)} className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--grey-100)]" style={{ color: "var(--navy)" }}>{p.name} <span className="text-xs" style={{ color: "var(--grey-500)" }}>{p.phone}</span></button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto">
          {threads === null && <li><Spinner /></li>}
          {threads?.length === 0 && <li className="p-6 text-sm text-center" style={{ color: "var(--grey-500)" }}>{q ? "No one matches that." : "No conversations yet. Patients who message Lisa appear here."}</li>}
          {threads?.map((t) => (
            <li key={t.id}>
              <button onClick={() => choose(t.id)} aria-current={sel === t.id}
                className="w-full text-left px-4 py-3 border-b hover:bg-[var(--grey-100)]" style={{ borderColor: "var(--grey-200)", background: sel === t.id ? "var(--teal-light)" : undefined }}>
                <div className="flex items-center gap-2">
                  {online.has(t.patientUserId) && <span className="size-2 rounded-full shrink-0" style={{ background: "var(--success)" }} aria-label="Online" />}
                  <span className={`flex-1 truncate text-sm ${t.unread ? "font-bold" : "font-medium"}`} style={{ color: "var(--navy)" }}>{t.patientName}</span>
                  {t.unread && <span className="size-2.5 rounded-full shrink-0" style={{ background: "var(--danger)" }} aria-label="Unread" />}
                  <span className="text-[11px] shrink-0" style={{ color: "var(--grey-400)" }}>{clock(t.lastMessageAt)}</span>
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: "var(--grey-500)" }}>{t.lastSender === "staff" ? "Lisa: " : ""}{t.preview}</div>
              </button>
            </li>
          ))}
        </ul>
        {!connected && <div className="px-4 py-2 text-[11px]" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>Live updates are reconnecting. Refreshing every few seconds meanwhile.</div>}
      </section>

      <section className={`${showConv ? "flex" : "hidden lg:flex"} flex-col min-h-0`} aria-label="Conversation">
        {!showConv ? (
          <div className="m-auto text-sm px-6 text-center" style={{ color: "var(--grey-500)" }}>Choose a conversation or start a new chat. Everyone on the front desk sees the same chat, and the patient only ever sees “Lisa”.</div>
        ) : sel && !open ? <Spinner /> : (
          <>
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--grey-200)" }}>
              <button onClick={() => { setSel(null); setOpen(null); setNewFor(null); loadThreads(); }} className="lg:hidden size-9 rounded-lg border flex items-center justify-center" style={{ borderColor: "var(--grey-200)", color: "var(--grey-600)" }} aria-label="Back to conversations">
                <ArrowLeft className="size-4" aria-hidden />
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate flex items-center gap-2" style={{ color: "var(--navy)" }}>
                  {open?.patient.name ?? newFor?.name}
                  {patientOnline && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>Online</span>}
                </div>
                <div className="text-xs"><PhoneLink phone={open?.patient.phone ?? newFor?.phone} /></div>
              </div>
            </div>
            {open && open.visits.length > 0 && (
              <div className="px-4 py-2 border-b flex gap-2 overflow-x-auto" style={{ borderColor: "var(--grey-200)" }} aria-label="Recent visits">
                {open.visits.slice(0, 4).map((v) => (
                  <span key={v.id} className="shrink-0 text-xs px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: "var(--grey-100)", color: "var(--grey-600)" }}>
                    {fmtDate(v.date)} {hhmm(v.time)} · {v.status.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" aria-live="polite">
              {newFor && <p className="text-sm text-center mt-8" style={{ color: "var(--grey-500)" }}>Start a conversation with {newFor.name}. They will see your message from “Lisa”.</p>}
              {open?.messages.map((m) => {
                const mine = m.from === "staff";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[82%]">
                      <div className={`text-[11px] mb-1 mx-1 flex items-center gap-1.5 ${mine ? "justify-end" : ""}`} style={{ color: "var(--grey-500)" }}>
                        {mine ? (<><span className="font-semibold" style={{ color: "var(--navy)" }}>{m.by?.id === me.id ? "You" : m.by?.name}</span><Pill tone="muted">{m.by?.role}</Pill></>) : <span className="font-semibold" style={{ color: "var(--navy)" }}>{open.patient.name}</span>}
                      </div>
                      <div className="px-4 py-2.5 rounded-2xl text-sm"
                        style={mine ? { background: "var(--teal)", color: "white", borderBottomRightRadius: 6 } : { background: "var(--grey-100)", color: "var(--navy)", borderBottomLeftRadius: 6 }}>
                        <MessageBody body={m.body} attachment={m.attachment} />
                      </div>
                      <div className={`text-[11px] mt-1 mx-1 ${mine ? "text-right" : ""}`} style={{ color: "var(--grey-400)" }}>
                        {clock(m.createdAt)}{m.id === lastStaff?.id && (seenByPatient ? " · Seen by patient" : " · Delivered")}
                      </div>
                    </div>
                  </div>
                );
              })}
              <TypingLine who={typing && typing.threadId === sel ? typing.text : null} />
              <div ref={end} />
            </div>
            {error && <div className="px-4"><ErrorBox>{error}</ErrorBox></div>}
            {quick && (
              <ul className="mx-3 mb-2 rounded-lg border max-h-44 overflow-y-auto" style={{ borderColor: "var(--grey-200)", background: "var(--surface)" }} aria-label="Quick replies">
                {QUICK_REPLIES.map((r) => (
                  <li key={r.label}><button onClick={() => { setText(r.text.replace("{name}", patientFirst)); setQuick(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--grey-100)]" style={{ color: "var(--navy)" }}>
                    <span className="font-semibold">{r.label}</span> <span className="text-xs" style={{ color: "var(--grey-500)" }}>{r.text.replace("{name}", patientFirst).slice(0, 60)}…</span></button></li>
                ))}
              </ul>
            )}
            <Composer text={text} setText={setText} onSend={reply} onTyping={onTyping} placeholder="Reply as Lisa…"
              extra={<button type="button" onClick={() => setQuick((v) => !v)} aria-label="Quick replies" title="Quick replies" aria-expanded={quick}
                className="size-11 shrink-0 rounded-lg border flex items-center justify-center" style={{ borderColor: "var(--grey-200)", color: "var(--teal-dark)" }}><Zap className="size-5" aria-hidden /></button>}
              hint="The patient sees this as “Lisa”. Your name and role are shown to colleagues only." />
          </>
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return <PortalShell audience="staff" title="Lisa chat" subtitle="Live messages from signed-in patients, shared by the whole front desk."><Inbox /></PortalShell>;
}
