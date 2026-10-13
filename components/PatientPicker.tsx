"use client";

import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";
import { inputCls, inputStyle } from "@/components/ui";

export type PickedPatient = { id: string; name: string; number: string };

/** Search-as-you-type patient chooser. `value` is the chosen patient (or null). */
export default function PatientPicker({ value, onChange, id = "pp-search" }: { value: PickedPatient | null; onChange: (p: PickedPatient | null) => void; id?: string }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const term = search.trim();
  const shown = term.length >= 2 ? results : [];
  useEffect(() => {
    if (term.length < 2) return;
    const t = setTimeout(() => {
      staffApi.getPatients({ q: term, limit: 6 }).then(({ data }) => setResults(data.data)).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [term]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: "var(--teal-light)" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--teal-dark)" }}>{value.name} · {value.number}</span>
        <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold" style={{ color: "var(--teal-dark)" }}>Change</button>
      </div>
    );
  }
  return (
    <div>
      <input id={id} value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} style={inputStyle} placeholder="Search by name, phone or patient number" autoComplete="off" />
      {shown.length > 0 && (
        <ul className="mt-2 rounded-lg border overflow-hidden" style={{ borderColor: "var(--grey-200)" }}>
          {shown.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => { onChange({ id: r.id, name: `${r.firstName} ${r.lastName}`, number: r.patientNumber }); setSearch(""); setResults([]); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--grey-100)]" style={{ color: "var(--navy)" }}>
                {r.firstName} {r.lastName} <span style={{ color: "var(--grey-400)" }}>· {r.patientNumber}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
