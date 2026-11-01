"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { MessageCircle, Send, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { GREETING, QUICK, botReply, type BotAction } from "@/lib/bot";

type Line = { who: "bot" | "you"; text: string; actions?: BotAction[] };
const MAX_TURNS = 8;   // after this the helper stops and asks the visitor to sign in

/** "Talk to Lisa" on the public site. Signed-out visitors get the helper; signed-in people go straight to the real chat. */
export default function LisaWidget() {
  const { isSignedIn } = useAuth();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [turns, setTurns] = useState(0);
  const [misses, setMisses] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  const full = turns >= MAX_TURNS;
  const sw = lang === "sw";

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [lines.length, open]);

  const say = (raw: string) => {
    const v = raw.trim().slice(0, 300);
    if (!v || full) return;
    const r = botReply(v, lang, turns + 1, misses);
    setTurns((n) => n + 1);
    if (r.miss) setMisses((n) => n + 1);
    setLines((l) => [...l, { who: "you", text: v }, { who: "bot", text: r.text, actions: r.actions }]);
    setText("");
  };

  if (isSignedIn) {
    return (
      <Link href="/patient/messages" className="no-print fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-5 h-12 rounded-full text-white text-sm font-semibold shadow-lg" style={{ background: "var(--teal)" }}>
        <MessageCircle className="size-5" aria-hidden /> {sw ? "Ongea na Lisa" : "Talk to Lisa"}
      </Link>
    );
  }

  return (
    <div className="no-print">
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-5 h-12 rounded-full text-white text-sm font-semibold shadow-lg" style={{ background: "var(--teal)" }}>
          <MessageCircle className="size-5" aria-hidden /> {sw ? "Ongea na Lisa" : "Talk to Lisa"}
        </button>
      )}
      {open && (
        <div role="dialog" aria-label="Chat with Lisa" className="fixed z-50 bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[380px] h-[85dvh] sm:h-[560px] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col bg-white sm:rounded-2xl shadow-2xl border overflow-hidden" style={{ borderColor: "var(--grey-200)" }}>
          <div className="px-4 py-3 flex items-center gap-3 text-white" style={{ background: "var(--teal)" }}>
            <div className="size-9 rounded-full bg-white/20 flex items-center justify-center font-semibold" aria-hidden>L</div>
            <div className="flex-1 leading-tight">
              <div className="font-semibold">Lisa</div>
              <div className="text-xs opacity-90">{sw ? "Msaidizi wa mtandaoni" : "Online helper"}</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label={sw ? "Funga" : "Close chat"} className="size-9 rounded-lg hover:bg-white/15 flex items-center justify-center"><X className="size-5" aria-hidden /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm" aria-live="polite" style={{ background: "#f9fafb" }}>
            <Bubble who="bot" text={sw ? GREETING.sw : GREETING.en} />
            {lines.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK.map((q) => (
                  <button key={q.en} onClick={() => say(sw ? q.sw : q.en)} className="px-3 py-1.5 rounded-full border text-xs font-medium bg-white" style={{ borderColor: "var(--grey-200)", color: "var(--teal-dark)" }}>{sw ? q.sw : q.en}</button>
                ))}
              </div>
            )}
            {lines.map((l, i) => <Bubble key={i} who={l.who} text={l.text} actions={l.actions} />)}
            {full && (
              <Bubble who="bot" text={sw ? "Tumepiga gumzo kwa muda. Ili kuendelea na timu yetu, tafadhali ingia au fungua akaunti bure." : "We've chatted for a while. To carry on with our team, please sign in or create a free account."}
                actions={[{ label: sw ? "Ingia" : "Sign in", href: "/login" }, { label: sw ? "Fungua akaunti" : "Create account", href: "/register" }]} />
            )}
            <div ref={end} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); say(text); }} className="p-3 border-t flex gap-2 bg-white" style={{ borderColor: "var(--grey-200)" }}>
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} disabled={full} aria-label={sw ? "Ujumbe" : "Message"}
              placeholder={full ? (sw ? "Ingia ili kuendelea" : "Sign in to continue") : (sw ? "Andika ujumbe…" : "Type a message…")}
              className="flex-1 px-4 py-2.5 rounded-full border text-sm outline-none disabled:bg-gray-100" style={{ borderColor: "var(--grey-200)" }} />
            <button type="submit" disabled={full || !text.trim()} aria-label={sw ? "Tuma" : "Send"} className="size-11 rounded-full text-white flex items-center justify-center disabled:opacity-50" style={{ background: "var(--teal)" }}>
              <Send className="size-4" aria-hidden />
            </button>
          </form>
          <p className="px-4 pb-3 text-[11px] bg-white" style={{ color: "var(--grey-500)" }}>
            {sw ? "Hii ni msaidizi wa kiotomatiki. Usiandike taarifa za kitabibu hapa. Dharura: piga " : "Automated helper: please don't share medical details here. Emergency: call "}
            <a className="underline font-semibold" href="tel:0784388734">0784 388 734</a>.
          </p>
        </div>
      )}
    </div>
  );
}

function Bubble({ who, text, actions }: { who: "bot" | "you"; text: string; actions?: BotAction[] }) {
  const you = who === "you";
  return (
    <div className={`flex ${you ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[88%]">
        <div className="px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap break-words"
          style={you ? { background: "var(--teal)", color: "white", borderBottomRightRadius: 6 } : { background: "white", color: "var(--navy)", border: "1px solid var(--grey-200)", borderBottomLeftRadius: 6 }}>{text}</div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {actions.map((a) => {
              const ext = a.href.startsWith("http") || a.href.startsWith("tel:");
              const cls = "px-3.5 py-1.5 rounded-full text-xs font-semibold border";
              const st = { borderColor: "var(--teal)", color: "var(--teal-dark)", background: "white" };
              return ext ? <a key={a.label} href={a.href} {...(a.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cls} style={st}>{a.label}</a>
                : <Link key={a.label} href={a.href} className={cls} style={st}>{a.label}</Link>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
