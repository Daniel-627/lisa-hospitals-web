"use client";

import { useRef, useState, type ReactNode } from "react";
import { Send } from "lucide-react";

export const clock = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  const t = d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
  return same ? t : `${d.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}, ${t}`;
};

/** Message box: Enter sends, Shift+Enter makes a new line. */
export function Composer({ onSend, placeholder = "Type a message…", hint }: { onSend: (text: string) => Promise<void>; placeholder?: string; hint?: ReactNode }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const go = async () => {
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true);
    try { await onSend(v); setText(""); } finally { setBusy(false); ref.current?.focus(); }
  };
  return (
    <div className="border-t p-3" style={{ borderColor: "var(--grey-200)" }}>
      <div className="flex items-end gap-2">
        <textarea ref={ref} value={text} rows={1} maxLength={2000} aria-label="Message" placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } }}
          className="flex-1 resize-none px-4 py-3 rounded-lg border text-sm outline-none max-h-32"
          style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "var(--surface)" }} />
        <button onClick={go} disabled={busy || !text.trim()} aria-label="Send"
          className="h-11 px-4 rounded-lg text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50" style={{ background: "var(--teal)" }}>
          <Send className="size-4" aria-hidden /> <span className="hidden sm:inline">Send</span>
        </button>
      </div>
      {hint && <p className="mt-2 text-xs" style={{ color: "var(--grey-500)" }}>{hint}</p>}
    </div>
  );
}
