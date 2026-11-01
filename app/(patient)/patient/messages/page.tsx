"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PortalShell, { useMe } from "@/components/PortalShell";
import { useRouter } from "next/navigation";
import { Composer, clock } from "@/components/chat";
import { ErrorBox, Spinner } from "@/components/ui";
import { chatApi } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { HOSPITAL } from "@/lib/hospital";

type Msg = { id: string; from: "you" | "lisa"; body: string; createdAt: string };

function Chat() {
  const me = useMe();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const latest = useRef<string | undefined>(undefined);

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

  useEffect(() => {
    if (!isPatient) return;
    let stop = false;
    const pull = async (first: boolean) => {
      if (!first && document.hidden) return;
      try {
        const { data } = await chatApi.mine(first ? undefined : latest.current);
        if (stop) return;
        if (first) setMsgs([]);
        merge(data.data);
        if (data.data.some((m: Msg) => m.from === "lisa")) chatApi.markRead().catch(() => {});
      } catch (err) { if (first && !stop) setError(errMsg(err, "We couldn't load your messages. Please refresh.")); }
    };
    pull(true);
    const t = setInterval(() => pull(false), 5000);
    return () => { stop = true; clearInterval(t); };
  }, [isPatient, merge]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs?.length]);

  const send = async (text: string) => {
    setError("");
    try { const { data } = await chatApi.send(text); merge([data.data]); }
    catch (err) { setError(errMsg(err, "Your message didn't send. Please try again.")); throw err; }
  };

  if (!isPatient) return <Spinner />;
  return (
    <div className="max-w-3xl rounded-2xl border overflow-hidden flex flex-col h-[70vh] min-h-[420px]" style={{ borderColor: "var(--grey-200)", background: "var(--surface)" }}>
      <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--grey-200)" }}>
        <div className="size-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: "var(--teal)" }} aria-hidden>L</div>
        <div>
          <div className="font-semibold" style={{ color: "var(--navy)" }}>Lisa</div>
          <div className="text-xs" style={{ color: "var(--grey-500)" }}>{HOSPITAL.name} front desk</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {msgs === null ? <Spinner /> : msgs.length === 0 ? (
          <p className="text-sm text-center mt-10 px-6" style={{ color: "var(--grey-500)" }}>
            Hello {me.firstName}. Ask us about an appointment, a change to a booking, or anything else. We reply as soon as we can.
          </p>
        ) : msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%]">
              {m.from === "lisa" && <div className="text-[11px] mb-1 ml-1 font-semibold" style={{ color: "var(--teal-dark)" }}>Lisa</div>}
              <div className="px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words"
                style={m.from === "you" ? { background: "var(--teal)", color: "white", borderBottomRightRadius: 6 } : { background: "var(--grey-100)", color: "var(--navy)", borderBottomLeftRadius: 6 }}>
                {m.body}
              </div>
              <div className={`text-[11px] mt-1 mx-1 ${m.from === "you" ? "text-right" : ""}`} style={{ color: "var(--grey-400)" }}>{clock(m.createdAt)}</div>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {error && <div className="px-4"><ErrorBox>{error}</ErrorBox></div>}
      <Composer onSend={send} hint={<>This is not for emergencies. In an emergency call <a className="underline font-semibold" href={`tel:${HOSPITAL.phoneTel}`}>{HOSPITAL.phoneDisplay}</a> or come to Accident &amp; Emergency.</>} />
    </div>
  );
}

export default function Page() {
  return <PortalShell audience="patient" title="Messages" subtitle="Chat with Lisa, our front desk."><Chat /></PortalShell>;
}
