"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Spinner } from "@/components/ui";
import { patientsApi } from "@/lib/api";
import { errMsg, fmtDate } from "@/lib/format";

function Results() {
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    patientsApi.getResults()
      .then(({ data }) => { if (!cancelled) setItems(data.data); })
      .catch((err) => { if (!cancelled) { setItems([]); setError(errMsg(err, "Couldn't load your results.")); } });
    return () => { cancelled = true; };
  }, []);

  if (!items) return <Spinner label="Loading your results..." />;
  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      <p className="text-sm mb-6 max-w-2xl" style={{ color: "var(--grey-500)" }}>Your doctor reviews each result before it appears here. If anything worries you, please speak to your doctor rather than relying on the numbers alone.</p>
      {items.length === 0 && !error ? (
        <div className="p-8 rounded-xl border text-center max-w-2xl" style={{ borderColor: "var(--grey-200)" }}>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>No results yet. Results from your tests will appear here once your doctor has reviewed them.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {items.map((o) => (
            <Card key={`${o.kind}-${o.id}`} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{o.name}</div>
                <div className="text-xs" style={{ color: "var(--grey-400)" }}>{fmtDate(String(o.releasedAt).slice(0, 10))}</div>
              </div>
              {o.kind === "lab" ? (
                <div className="space-y-1.5">
                  {o.results.map((r: any, i: number) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 text-sm" style={{ color: r.isAbnormal ? "var(--danger)" : "var(--navy)" }}>
                      <span>{r.analyte}</span>
                      <span><strong>{r.result}</strong> {r.unit ?? ""}{r.referenceRange ? <span className="text-xs" style={{ color: "var(--grey-400)" }}> (normal {r.referenceRange})</span> : null}</span>
                    </div>
                  ))}
                </div>
              ) : (
                o.results.map((r: any, i: number) => (
                  <div key={i} className="text-sm space-y-1" style={{ color: "var(--navy)" }}>
                    {r.impression && <p><strong>Summary:</strong> {r.impression}</p>}
                    {r.findings && <p className="whitespace-pre-line">{r.findings}</p>}
                    <div className="flex gap-3">
                      {r.imageUrl && <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "var(--teal)" }}>Open image</a>}
                      {r.reportUrl && <a href={r.reportUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "var(--teal)" }}>Open report</a>}
                    </div>
                  </div>
                ))
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function PatientResultsPage() {
  return (
    <PortalShell audience="patient" title={<>My <em className="italic" style={{ color: "var(--teal)" }}>Results</em></>} subtitle="Lab and imaging results released by your doctor">
      <Results />
    </PortalShell>
  );
}
