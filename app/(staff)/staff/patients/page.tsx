"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { ErrorBox, Spinner, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg, fmtDate, insuranceLabel } from "@/lib/format";

const PAGE = 25;

function PatientsList() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Reload from the top whenever the search term changes (stale responses are ignored).
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    staffApi.getPatients({ q: term || undefined, limit: PAGE, offset: 0 })
      .then(({ data }) => {
        if (id !== reqId.current) return;
        setRows(data.data);
        setHasMore(data.data.length === PAGE);
      })
      .catch((err) => { if (id === reqId.current) setError(errMsg(err, "Couldn't load patients.")); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [term]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await staffApi.getPatients({ q: term || undefined, limit: PAGE, offset: rows.length });
      setRows((r) => [...r, ...data.data]);
      setHasMore(data.data.length === PAGE);
    } catch (err) {
      setError(errMsg(err, "Couldn't load more patients."));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div className="mb-6 max-w-md">
        <label htmlFor="search" className="sr-only">Search patients</label>
        <input id="search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, patient number or phone…" className={inputCls} style={inputStyle} />
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? <Spinner label="Loading patients..." /> : rows.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>
          {term ? `No patients match “${term}”.` : "No patients yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((p) => (
            <Link key={p.id} href={`/staff/patients/${p.id}`}
              className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 items-center p-4 rounded-xl border transition-all hover:shadow-md"
              style={{ borderColor: "var(--grey-200)", background: "white" }}>
              <div className="col-span-2 md:col-span-2">
                <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{p.firstName} {p.lastName}</div>
                <div className="text-xs" style={{ color: "var(--grey-400)" }}>{p.patientNumber}</div>
              </div>
              <div className="text-xs" style={{ color: "var(--grey-500)" }}>{p.phone?.startsWith("clerk-") ? "No phone yet" : p.phone}</div>
              <div className="text-xs" style={{ color: "var(--grey-500)" }}>{insuranceLabel(p.insuranceScheme)}</div>
              <div className="text-xs md:text-right" style={{ color: "var(--grey-400)" }}>Joined {fmtDate(String(p.createdAt).slice(0, 10))}</div>
            </Link>
          ))}
          {hasMore && (
            <div className="text-center pt-4">
              <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function StaffPatientsPage() {
  return (
    <PortalShell audience="staff" title={<>Patient <em className="italic" style={{ color: "var(--teal)" }}>Records</em></>} subtitle="Search and open a patient's file">
      <PatientsList />
    </PortalShell>
  );
}
