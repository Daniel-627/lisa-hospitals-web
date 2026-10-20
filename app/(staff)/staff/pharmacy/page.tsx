"use client";

import { useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { useWorklist } from "@/lib/useWorklist";
import { Icon } from "@/components/Icon";

const ageOf = (dob?: string) => (dob ? `${new Date().getFullYear() - Number(dob.slice(0, 4))}y` : "");
const tokens = (a?: string | null) => (a ?? "").split(/[,;\n/]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length >= 3);
const hit = (drug: string, toks: string[]) => { const d = drug.trim().toLowerCase(); return d.length >= 3 ? toks.find((t) => d.includes(t) || t.includes(d)) ?? null : null; };

function PharmacyBoard() {
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const { rows, loading, error, reload } = useWorklist(() => staffApi.pharmacyWorklist({ done: showDone || undefined }), String(showDone));

  // One card per patient, listing everything waiting to be dispensed to them.
  const groups: Record<string, { p: any; items: any[] }> = {};
  rows.forEach((r: any) => { (groups[r.patientId] ??= { p: r, items: [] }).items.push(r); });

  const dispenseMany = async (items: any[]) => {
    setActionError("");
    setBusy(items[0].patientId);
    try {
      for (const it of items.filter((i) => !i.isDispensed)) await staffApi.dispense(it.id);
    } catch (err) {
      setActionError(errMsg(err, "Couldn't dispense that item."));
    }
    setBusy(null);
    reload();
  };

  return (
    <>
      <label className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--navy)" }}>
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show dispensed today
      </label>
      {(actionError || error) && <ErrorBox>{actionError || error}</ErrorBox>}
      {loading ? <Spinner label="Loading prescriptions..." /> : Object.keys(groups).length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>No prescriptions waiting.</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {Object.values(groups).map(({ p, items }) => {
            const toks = tokens(p.allergies);
            const pending = items.filter((i) => !i.isDispensed);
            return (
              <Card key={p.patientId} className="!p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{p.firstName} {p.lastName}</div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>{[ageOf(p.dateOfBirth), p.gender, p.patientNumber].filter(Boolean).join(" · ")} · prescribed by Dr. {p.doctorLast}</div>
                  </div>
                  {pending.length > 0 && (
                    <button disabled={busy === p.patientId} onClick={() => dispenseMany(items)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>
                      {busy === p.patientId ? "Dispensing..." : `Dispense all (${pending.length})`}
                    </button>
                  )}
                </div>
                {p.allergies && <div className="p-2.5 rounded-lg text-xs font-medium" style={{ background: "#fde8e8", color: "var(--danger)" }}><Icon name="warning" className="mr-1 -mt-0.5" />Allergies: {p.allergies}</div>}
                <div className="space-y-2">
                  {items.map((it) => {
                    const flag = hit(it.drugName, toks);
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg" style={{ background: flag ? "#fde8e8" : "var(--grey-100)" }}>
                        <div className="text-sm min-w-0" style={{ color: "var(--navy)" }}>
                          <strong>{it.drugName}</strong> · {it.dosage} · {it.frequency} · {it.duration}
                          {it.instructions && <div className="text-xs" style={{ color: "var(--grey-500)" }}>{it.instructions}</div>}
                          {flag && <div className="text-xs font-semibold" style={{ color: "var(--danger)" }}><Icon name="warning" className="mr-1 -mt-0.5" />May match a recorded allergy ({flag}). Check with the doctor before dispensing.</div>}
                        </div>
                        {it.isDispensed ? <Pill tone="ok">Dispensed</Pill> : (
                          <button disabled={busy === p.patientId} onClick={() => dispenseMany([it])} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>Dispense</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function PharmacyPage() {
  return (
    <PortalShell audience="staff" title={<>Pharmacy <em className="italic" style={{ color: "var(--teal)" }}>Counter</em></>} subtitle="Prescriptions from completed consultations. Updates every 30 seconds.">
      <PharmacyBoard />
    </PortalShell>
  );
}
