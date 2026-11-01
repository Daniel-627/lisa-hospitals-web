"use client";

import { useRef, useState, type ReactNode } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";
import { uploadChatFile } from "@/lib/chatUpload";

export type Attachment = { url: string; name: string; kind: string };

export const clock = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  const t = d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
  return same ? t : `${d.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}, ${t}`;
};

/** Text plus an optional picture / file. */
export function MessageBody({ body, attachment, light }: { body: string; attachment?: Attachment | null; light?: boolean }) {
  return (
    <>
      {attachment && (attachment.kind === "image" ? (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment.url} alt={attachment.name} className="rounded-lg max-h-56 w-auto" loading="lazy" />
        </a>
      ) : (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline mb-1 break-all">
          <FileText className="size-4 shrink-0" aria-hidden /> {attachment.name}
        </a>
      ))}
      {body && <div className="whitespace-pre-wrap break-words" style={light ? undefined : undefined}>{body}</div>}
    </>
  );
}

export function TypingLine({ who }: { who: string | null }) {
  if (!who) return <div className="h-5" />;
  return <div className="h-5 px-1 text-xs flex items-center gap-1.5" style={{ color: "var(--grey-500)" }} aria-live="polite">
    <span className="inline-flex gap-0.5" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full animate-bounce" style={{ background: "var(--grey-400)", animationDelay: `${i * 120}ms` }} />)}</span>
    {who}
  </div>;
}

/** Message box: Enter sends, Shift+Enter makes a new line. Optional paperclip, typing signal and quick-reply insertion. */
export function Composer({ onSend, onTyping, placeholder = "Type a message…", hint, text, setText, extra, files = true }: {
  onSend: (text: string, file: { url: string; name: string } | null) => Promise<void>;
  onTyping?: () => void; placeholder?: string; hint?: ReactNode; extra?: ReactNode; files?: boolean;
  text: string; setText: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<"idle" | "busy">("idle");
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const pick = useRef<HTMLInputElement>(null);

  const go = async () => {
    const v = text.trim();
    if ((!v && !file) || busy || upload === "busy") return;
    setBusy(true);
    try { await onSend(v, file); setText(""); setFile(null); } catch { /* the page shows the error and keeps the draft */ } finally { setBusy(false); ref.current?.focus(); }
  };
  const choose = async (f?: File) => {
    if (!f) return;
    setErr(""); setUpload("busy");
    try { setFile(await uploadChatFile(f)); } catch (e: any) { setErr(e?.message || "The upload failed."); } finally { setUpload("idle"); if (pick.current) pick.current.value = ""; }
  };

  return (
    <div className="border-t p-3" style={{ borderColor: "var(--grey-200)" }}>
      {(file || upload === "busy" || err) && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          {upload === "busy" && <span style={{ color: "var(--grey-500)" }}>Uploading…</span>}
          {file && <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}><Paperclip className="size-3.5" aria-hidden />{file.name}
            <button onClick={() => setFile(null)} aria-label="Remove file"><X className="size-3.5" aria-hidden /></button></span>}
          {err && <span style={{ color: "var(--danger)" }}>{err}</span>}
        </div>
      )}
      <div className="flex items-end gap-2">
        {files && (<>
          <input ref={pick} type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => choose(e.target.files?.[0])} />
          <button type="button" onClick={() => pick.current?.click()} disabled={upload === "busy"} aria-label="Attach a photo or PDF" title="Attach a photo or PDF"
            className="size-11 shrink-0 rounded-lg border flex items-center justify-center disabled:opacity-50" style={{ borderColor: "var(--grey-200)", color: "var(--grey-600)" }}>
            <Paperclip className="size-5" aria-hidden />
          </button>
        </>)}
        {extra}
        <textarea ref={ref} value={text} rows={1} maxLength={2000} aria-label="Message" placeholder={placeholder}
          onChange={(e) => { setText(e.target.value); onTyping?.(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } }}
          className="flex-1 min-w-0 resize-none px-4 py-3 rounded-lg border text-sm outline-none max-h-32"
          style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "var(--surface)" }} />
        <button onClick={go} disabled={busy || upload === "busy" || (!text.trim() && !file)} aria-label="Send"
          className="h-11 px-4 rounded-lg text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50" style={{ background: "var(--teal)" }}>
          <Send className="size-4" aria-hidden /> <span className="hidden sm:inline">Send</span>
        </button>
      </div>
      {hint && <p className="mt-2 text-xs" style={{ color: "var(--grey-500)" }}>{hint}</p>}
    </div>
  );
}
