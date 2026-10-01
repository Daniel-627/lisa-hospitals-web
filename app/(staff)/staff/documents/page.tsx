"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { DOC_TYPES, errMsg } from "@/lib/format";

type Picked = { id: string; name: string; number: string };

function UploadForm() {
  const preId = useSearchParams().get("patientId");

  const [patient, setPatient] = useState<Picked | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [documentType, setDocumentType] = useState("lab_result");
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Picked | null>(null);

  // Prefill when arriving from a patient's file (?patientId=…).
  useEffect(() => {
    if (!preId) return;
    staffApi.getPatientById(preId)
      .then(({ data }) => setPatient({ id: data.data.id, name: `${data.data.firstName} ${data.data.lastName}`, number: data.data.patientNumber }))
      .catch(() => {});
  }, [preId]);

  // Debounced patient search.
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      staffApi.getPatients({ q: term, limit: 6 }).then(({ data }) => setResults(data.data)).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone(null);
    if (!patient) return setError("Choose a patient first.");
    if (!title.trim()) return setError("Enter a title for the document.");
    if (!/^https:\/\/.+/i.test(fileUrl.trim())) return setError("The file link must start with https://");

    setSaving(true);
    try {
      await staffApi.uploadDocument({ patientId: patient.id, documentType, title: title.trim(), fileUrl: fileUrl.trim() });
      setDone(patient);
      setTitle("");
      setFileUrl("");
    } catch (err) {
      setError(errMsg(err, "Couldn't save the document."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      {error && <ErrorBox>{error}</ErrorBox>}
      {done && (
        <SuccessBox>
          Document saved for {done.name}.{" "}
          <Link href={`/staff/patients/${done.id}`} className="font-semibold underline">View patient file</Link>
        </SuccessBox>
      )}

      <form onSubmit={submit}>
        <Card className="space-y-5">
          <Field label="Patient">
            {patient ? (
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--teal-light)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--teal-dark)" }}>{patient.name} <span className="font-normal">· {patient.number}</span></div>
                <button type="button" onClick={() => { setPatient(null); setDone(null); }} className="text-xs font-semibold" style={{ color: "var(--teal-dark)" }}>Change</button>
              </div>
            ) : (
              <>
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, patient number or phone…" className={inputCls} style={inputStyle} />
                {results.length > 0 && (
                  <ul className="mt-2 rounded-lg border divide-y" style={{ borderColor: "var(--grey-200)" }}>
                    {results.map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => { setPatient({ id: r.id, name: `${r.firstName} ${r.lastName}`, number: r.patientNumber }); setSearch(""); setResults([]); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: "var(--navy)" }}>
                          {r.firstName} {r.lastName} <span style={{ color: "var(--grey-400)" }}>· {r.patientNumber}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Field>

          <Field label="Document type" htmlFor="type">
            <select id="type" value={documentType} onChange={(e) => setDocumentType(e.target.value)} className={inputCls} style={inputStyle}>
              {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>

          <Field label="Title" htmlFor="title">
            <input id="title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full blood count — 5 Oct 2026" className={inputCls} style={inputStyle} />
          </Field>

          <Field label="File link (https)" htmlFor="url" hint="Paste a link to the file. Direct file uploads will be added with storage setup.">
            <input id="url" type="url" value={fileUrl} maxLength={500} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" className={inputCls} style={inputStyle} />
          </Field>

          <button type="submit" disabled={saving} className="w-full py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: saving ? "var(--teal-dark)" : "var(--teal)" }}>
            {saving ? "Saving..." : "Save document"}
          </button>
        </Card>
      </form>
    </div>
  );
}

export default function StaffDocumentsPage() {
  return (
    <PortalShell audience="staff" title={<>Upload <em className="italic" style={{ color: "var(--teal)" }}>Document</em></>} subtitle="Attach a result or report to a patient's file">
      {/* useSearchParams needs a Suspense boundary for production builds */}
      <Suspense fallback={<Spinner />}><UploadForm /></Suspense>
    </PortalShell>
  );
}
