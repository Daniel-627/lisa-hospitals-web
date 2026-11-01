"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PortalShell, { useMe } from "@/components/PortalShell";
import { useRouter } from "next/navigation";
import { Composer, MessageBody, TypingLine, clock, type Attachment } from "@/components/chat";
import { ErrorBox, Spinner } from "@/components/ui";
import { chatApi } from "@/lib/api";
import { acquireSocket, releaseSocket, useSocketConnected } from "@/lib/socket";
import { errMsg } from "@/lib/format";
import { HOSPITAL } from "@/lib/hospital";

type Msg = { id: string; from: "you" | "lisa"; body: string; attachment?: Attachment | null; createdAt: string };

function Chat() {
  const me = useMe();
  const router = useRouter();
  const connected = useSocketConnected();
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [lisaOnline, setLisaOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const latest = useRef<string | undefined>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTypingSent = useRef(0);
  const sockRef = useRef<ReturnType<typeof acquireSocket> | null>(null);

  // Staff who land here (e.g. from the public chat button) belong in the shared inbox instead.
  const isPatient = me.role === "patient";
  useEffect(() => { if (!isPatient) router.replace("/staff/messages"); }, [isPatient, router]);

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMsgs((cur) => {
      const have = new Set((cur ?? []).map((m) => m.id));
      const add = incoming.filter((m) => !have.has(m.id));
      return add.length || cur === null ? [...(cur ?? []), ...add] : cur;
    });
    latest.current = incoming[incoming.length - 1].createdAt;
  }, []);

  const pull = useCallback(async (first: boolean) => {
    try {
      const { data } = await chatApi.mine(first ? undefined : latest.current);
      if (first) setMsgs([]);
      merge(data.data.messages);
      setSeenAt(data.data.seenAt);
      if (data.data.messages.some((m: Msg) => m.from === "lisa") && !document.hidden) chatApi.markRead().catch(() => {});
    } catch (err) { if (first) setError(errMsg(err, "We couldn't load your messages. Please refresh.")); }
  }, [merge]);

  // Live connection; every event also works without it because the page polls whenever the socket is down.
  useEffect(() => {
    if (!isPatient) return;
    const first = setTimeout(() => pull(true), 0);
    const s = acquireSocket();
    sockRef.current = s;
    const onConnect = () => pull(false);                                  // catch up on anything missed while offline
    const onMessage = ({ message }: { message: Msg }) => {
      merge([message]);
      if (message.from === "lisa") { setTyping(false); if (!document.hidden) chatApi.markRead().catch(() => {}); }
    };
    const onRead = ({ by, at }: { by: string; at: string }) => { if (by === "lisa") setSeenAt(at); };
    const onOnline = ({ online }: { online: boolean }) => setLisaOnline(online);
    const onTypingEv = ({ from }: { from: string }) => {
      if (from !== "lisa") return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3500);
    };
    s.on("connect", onConnect); s.on("message", onMessage); s.on("read", onRead); s.on("lisa:online", onOnline); s.on("typing", onTypingEv);
    const onVisible = () => { if (!document.hidden) chatApi.markRead().catch(() => {}); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first); clearTimeout(typingTimer.current);
      document.removeEventListener("visibilitychange", onVisible);
      s.off("connect", onConnect); s.off("message", onMessage); s.off("read", onRead); s.off("lisa:online", onOnline); s.off("typing", onTypingEv);
      sockRef.current = null; releaseSocket();
    };
  }, [isPatient, merge, pull]);

  // Fallback: only while the live connection is down.
  useEffect(() => {
    if (!isPatient || connected) return;
    const t = setInterval(() => { if (!document.hidden) pull(false); }, 5000);
    return () => clearInterval(t);
  }, [isPatient, connected, pull]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs?.length, typing]);

  const onTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    sockRef.current?.emit("typing", {});
  };

  const send = async (body: string, file: { url: string; name: string } | null) => {
    setError("");
    try { const { data } = await chatApi.send(body, file); merge([data.data]); }
    catch (err) { setError(errMsg(err, "Your message didn't send. Please try again.")); throw err; }
  };

  if (!isPatient) return <Spinner />;
  const lastMine = msgs ? [...msgs].reverse().find((m) => m.from === "you") : undefined;
  const seen = !!(lastMine && seenAt && new Date(seenAt).getTime() >= new Date(lastMine.createdAt).getTime());

  return (
    <div className="max-w-3xl rounded-2xl border overflow-hidden flex flex-col h-[70vh] min-h-[420px]" style={{ borderColor: "var(--grey-200)", background: "var(--surface)" }}>
      <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--grey-200)" }}>
        <div className="relative">
          <div className="size-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: "var(--teal)" }} aria-hidden>L</div>
          {lisaOnline && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2" style={{ background: "var(--success)", borderColor: "var(--surface)" }} aria-hidden />}
        </div>
        <div className="flex-1">
          <div className="font-semibold" style={{ color: "var(--navy)" }}>Lisa</div>
          <div className="text-xs" style={{ color: "var(--grey-500)" }}>{lisaOnline ? "Online now" : `${HOSPITAL.name} front desk · we reply as soon as we can`}</div>
        </div>
        {!connected && <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>Reconnecting…</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {msgs === null ? <Spinner /> : msgs.length === 0 ? (
          <p className="text-sm text-center mt-10 px-6" style={{ color: "var(--grey-500)" }}>
            Hello {me.firstName}. Ask us about an appointment, a change to a booking, or anything else. You can also send a photo or PDF.
          </p>
        ) : msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%]">
              {m.from === "lisa" && <div className="text-[11px] mb-1 ml-1 font-semibold" style={{ color: "var(--teal-dark)" }}>Lisa</div>}
              <div className="px-4 py-2.5 rounded-2xl text-sm"
                style={m.from === "you" ? { background: "var(--teal)", color: "white", borderBottomRightRadius: 6 } : { background: "var(--grey-100)", color: "var(--navy)", borderBottomLeftRadius: 6 }}>
                <MessageBody body={m.body} attachment={m.attachment} />
              </div>
              <div className={`text-[11px] mt-1 mx-1 ${m.from === "you" ? "text-right" : ""}`} style={{ color: "var(--grey-400)" }}>
                {clock(m.createdAt)}{m.id === lastMine?.id && (seen ? " · Seen" : " · Sent")}
              </div>
            </div>
          </div>
        ))}
        <TypingLine who={typing ? "Lisa is typing…" : null} />
        <div ref={end} />
      </div>
      {error && <div className="px-4"><ErrorBox>{error}</ErrorBox></div>}
      <Composer text={text} setText={setText} onSend={send} onTyping={onTyping}
        hint={<>Not for emergencies. In an emergency call <a className="underline font-semibold" href={`tel:${HOSPITAL.phoneTel}`}>{HOSPITAL.phoneDisplay}</a> or come to Accident &amp; Emergency.</>} />
    </div>
  );
}

export default function Page() {
  return <PortalShell audience="patient" title="Messages" subtitle="Chat with Lisa, our front desk."><Chat /></PortalShell>;
}
