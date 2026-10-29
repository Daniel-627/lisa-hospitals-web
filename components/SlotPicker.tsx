"use client";

import { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api";
import { errMsg, todayLocal } from "@/lib/format";
import { inputCls, inputStyle } from "@/components/ui";

const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
type Opt = { time: string; doctors: { id: string; name: string }[] };

/**
 * Date input + free times for a department (optionally one doctor). Mount it with a `key` that changes with the
 * department/doctor so it starts fresh; it reports { date, time, doctorId } whenever the choice changes.
 */
export default function SlotPicker({ departmentId, doctorId, onChange }: {
  departmentId: string; doctorId?: string; onChange: (v: { date: string; time: string; doctorId?: string }) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [res, setRes] = useState<{ date: string; times: Opt[]; error: string } | null>(null);
  const loading = !!date && res?.date !== date;

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    bookingApi.slots({ departmentId, doctorId: doctorId || undefined, date })
      .then(({ data }) => { if (!cancelled) setRes({ date, times: data.data, error: "" }); })
      .catch((e) => { if (!cancelled) setRes({ date, times: [], error: errMsg(e, "Couldn't load times") }); });
    return () => { cancelled = true; };
  }, [date, departmentId, doctorId]);

  const times = res?.date === date ? res.times : null;
  return (
    <div className="space-y-3">
      <input type="date" aria-label="Date" min={todayLocal()} value={date}
        onChange={(e) => { setDate(e.target.value); setTime(""); onChange({ date: e.target.value, time: "", doctorId }); }} className={inputCls} style={inputStyle} />
      {res?.date === date && res.error && <p className="text-xs" style={{ color: "var(--danger)" }}>{res.error}</p>}
      {loading && <p className="text-xs" style={{ color: "var(--grey-500)" }}>Loading times...</p>}
      {times && !res?.error && times.length === 0 && <p className="text-xs" style={{ color: "var(--grey-500)" }}>No free times that day.</p>}
      {times && times.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {times.map((t) => (
            <button key={t.time} type="button" aria-pressed={t.time === time}
              onClick={() => { setTime(t.time); onChange({ date, time: t.time, doctorId: doctorId || t.doctors[0]?.id }); }}
              className="py-2 rounded-lg text-sm font-semibold border"
              style={{ background: t.time === time ? "var(--teal)" : "white", color: t.time === time ? "white" : "var(--navy)", borderColor: t.time === time ? "var(--teal)" : "var(--grey-200)" }}>
              {clock(t.time)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
