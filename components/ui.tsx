import type { CSSProperties, ReactNode } from "react";
import { urgencyInfo } from "@/lib/format";

export const inputCls = "w-full px-4 py-3 rounded-lg border text-sm outline-none";
export const inputStyle: CSSProperties = { borderColor: "var(--grey-200)", color: "var(--navy)", background: "white" };

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: "var(--teal)" }}>
      <svg width={size * 0.44} height={size * 0.44} viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="8" y="1" width="4" height="18" rx="2" fill="white" />
        <rect x="1" y="8" width="18" height="4" rx="2" fill="white" />
      </svg>
    </div>
  );
}

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} />
      <p className="text-sm" style={{ color: "var(--grey-500)" }}>{label}</p>
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="mb-6 p-3 rounded-lg text-sm" style={{ background: "#fde8e8", color: "var(--danger)" }}>{children}</div>
  );
}

export function SuccessBox({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="mb-6 p-3 rounded-lg text-sm" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>{children}</div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: "var(--gold-light)", fg: "var(--gold-dark)" },
  confirmed: { bg: "var(--teal-light)", fg: "var(--teal-dark)" },
  completed: { bg: "#e6f4ea", fg: "#1e6b34" },
  cancelled: { bg: "#fde8e8", fg: "var(--danger)" },
  no_show:   { bg: "var(--grey-100)", fg: "var(--grey-500)" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.no_show;
  return (
    <span className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-5 rounded-xl border ${className}`} style={{ borderColor: "var(--grey-200)", background: "white" }}>{children}</div>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium mb-1.5" style={{ color: "var(--navy)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>{hint}</p>}
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <div className="text-xs mb-0.5" style={{ color: "var(--grey-400)" }}>{label}</div>
      <div className="text-sm font-medium break-words" style={{ color: "var(--navy)" }}>{value || "—"}</div>
    </div>
  );
}

const PILL: Record<string, { bg: string; fg: string }> = {
  ok:     { bg: "var(--teal-light)", fg: "var(--teal-dark)" },
  warn:   { bg: "var(--gold-light)", fg: "var(--gold-dark)" },
  muted:  { bg: "var(--grey-100)", fg: "var(--grey-500)" },
  danger: { bg: "#fde8e8", fg: "var(--danger)" },
};

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "ok" | "warn" | "muted" | "danger" }) {
  const t = PILL[tone];
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: t.bg, color: t.fg }}>{children}</span>;
}

export function UrgencyPill({ level }: { level?: string | null }) {
  const u = urgencyInfo(level);
  return u ? <Pill tone={u.tone}>{u.label}</Pill> : null;
}
