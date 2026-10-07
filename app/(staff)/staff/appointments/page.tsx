"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Card, ErrorBox, Spinner, StatusBadge, inputCls, inputStyle } from "@/components/ui";
import { appointmentsApi } from "@/lib/api";
import { errMsg, fmtDate, hhmm, todayLocal } from "@/lib/format";

const MANAGER_ROLES = ["admin", "receptionist", "doctor", "nurse"];

type Action = { label: string; to: string; danger?: boolean; confirm?: string };
const ACTIONS: Record<string, Action[]> = {
  pending: [
    { label: "Confirm", to: "confirmed" },
    { label: "Cancel", to: "cancelled", danger: true, confirm: "Cancel this appointment?" },
  ],
  confirmed: [
    { label: "Complete", to: "completed" },
    { label: "No-show", to: "no_show", confirm: "Mark this patient as a no-show?" },
    { label: "Cancel", to: "cancelled", danger: true, confirm: "Cancel this appointment?" },
  ],
};

function Manager() {
  const me = useMe();
  const canManage = MANAGER_ROLES.includes(me.role);

  const [date, setDate] = useState(todayLocal());
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Results remember which filters they were loaded for, so "loading" is derived (no setState in the effect).
  const key = `${date}|${status}`;
  const [result, setResult] = useState<{ key: string; rows: any[]; error: string } | null>(null);
  const loading = !result || result.key !== key;
  const rows = loading ? [] : result!.rows;
  const error = actionError || (loading ? "" : result!.error);

  useEffect(() => {
    let cancelled = false;
    appointmentsApi.getAll({ date: date || undefined, status: status || undefined, limit: 200 })
      .then(({ data }) => { if (!cancelled) setResult({ key, rows: data.data, error: "" }); })
      .catch((err) => {
        if (cancelled) return;
        const msg = err.response?.status === 403 ? "Your role doesn't have access to appointments." : errMsg(err, "Couldn't load appointments.");
        setResult({ key, rows: [], error: msg });
      });
    return () => { cancelled = true; };
  }, [key, date, status]);

  const change = async (id: string, a: Action) => {
    if (a.confirm && !window.confirm(a.confirm)) return;
    setBusyId(id);
    setActionError("");
    try {
      await appointmentsApi.updateStatus(id, a.to);
      setResult((r) => r && { ...r, rows: r.rows.map((x) => (x.id === id ? { ...x, status: a.to } : x)) });
    } catch (err) {
      setActionError(errMsg(err, "Couldn't update that appointment."));
    } finally {
      setBusyId(null);
    }
  };

  const pickDate = (v: string) => { setActionError(""); setDate(v); };
  const pickStatus = (v: string) => { setActionError(""); setStatus(v); };

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label htmlFor="date" className="block text-xs font-medium mb-1" style={{ color: "var(--grey-500)" }}>Date</label>
          <input id="date" type="date" value={date} onChange={(e) => pickDate(e.target.value)} className={inputCls} style={{ ...inputStyle, width: "auto" }} />
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium mb-1" style={{ color: "var(--grey-500)" }}>Status</label>
          <select id="status" value={status} onChange={(e) => pickStatus(e.target.value)} className={inputCls} style={{ ...inputStyle, width: "auto" }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-show</option>
          </select>
        </div>
        <button onClick={() => pickDate(todayLocal())} className="px-4 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Today</button>
        <button onClick={() => pickDate("")} className="px-4 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>All dates</button>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? <Spinner label="Loading appointments..." /> : rows.length === 0 && !error ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>No appointments match these filters.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <Card key={a.id} className="!p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-center shrink-0 w-16">
                  <div className="text-lg font-bold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>{hhmm(a.appointmentTime)}</div>
                  {!date && <div className="text-xs" style={{ color: "var(--grey-400)" }}>{fmtDate(a.appointmentDate, { day: "numeric", month: "short" })}</div>}
                </div>
                <div className="min-w-0">
                  <Link href={`/staff/patients/${a.patientId}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--navy)" }}>
                    {a.patientFirstName} {a.patientLastName}
                  </Link>
                  <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                    {a.department} · {a.patientNumber}{a.patientPhone && !a.patientPhone.startsWith("clerk-") ? ` · ${a.patientPhone}` : ""}
                  </div>
                  {a.reason && <div className="text-xs mt-0.5 truncate" style={{ color: "var(--grey-400)" }}>{a.reason}</div>}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={a.status} />
                {canManage && a.appointmentDate === todayLocal() && (a.status === "pending" || a.status === "confirmed") && (
                  <Link href={`/staff/checkin?patientId=${a.patientId}&appointmentId=${a.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--navy)" }}>Check in</Link>
                )}
                {canManage && (ACTIONS[a.status] ?? []).map((act) => (
                  <button key={act.to} onClick={() => change(a.id, act)} disabled={busyId === a.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={act.danger ? { background: "#fde8e8", color: "var(--danger)" } : { background: "var(--teal)", color: "white" }}>
                    {act.label}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function StaffAppointmentsPage() {
  return (
    <PortalShell audience="staff" title={<>Appointment <em className="italic" style={{ color: "var(--teal)" }}>Manager</em></>} subtitle="View, confirm and update appointments">
      <Manager />
    </PortalShell>
  );
}
