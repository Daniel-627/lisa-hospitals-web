"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Spinner } from "@/components/ui";
import { patientsApi } from "@/lib/api";
import { docLabel, errMsg, fmtDate } from "@/lib/format";

function Documents() {
  const [docs, setDocs] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    patientsApi.getDocuments()
      .then(({ data }) => { if (!cancelled) setDocs(data.data); })
      .catch((err) => { if (!cancelled) { setDocs([]); setError(errMsg(err, "Couldn't load your documents.")); } });
    return () => { cancelled = true; };
  }, []);

  if (!docs) return <Spinner label="Loading your documents..." />;

  return (
    <>
      {error && <ErrorBox>{error}</ErrorBox>}
      {docs.length === 0 && !error ? (
        <div className="p-8 rounded-xl border text-center" style={{ borderColor: "var(--grey-200)" }}>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>
            No documents yet. Lab results, prescriptions and other records will appear here once the hospital uploads them.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {docs.map((d) => (
            <Card key={d.id} className="!p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: "var(--navy)" }}>{d.title}</div>
                <div className="text-xs" style={{ color: "var(--grey-500)" }}>{docLabel(d.documentType)} · {fmtDate(String(d.createdAt).slice(0, 10))}</div>
              </div>
              {String(d.fileUrl).startsWith("https://") && (
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0" style={{ background: "var(--teal)" }}>
                  Open
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function PatientDocumentsPage() {
  return (
    <PortalShell audience="patient" title={<>My <em className="italic" style={{ color: "var(--teal)" }}>Documents</em></>} subtitle="Results, prescriptions and reports from your visits">
      <Documents />
    </PortalShell>
  );
}
