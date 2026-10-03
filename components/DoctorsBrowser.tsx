"use client";

import { useMemo, useState } from "react";
import DoctorCard, { type DoctorLite } from "@/components/DoctorCard";

type Doc = DoctorLite & { departmentSlug: string };

export default function DoctorsBrowser({ doctors }: { doctors: Doc[] }) {
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");

  const departments = useMemo(() => {
    const m = new Map<string, string>();
    doctors.forEach((d) => d.department && m.set(d.departmentSlug, d.department));
    return Array.from(m, ([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [doctors]);

  const term = q.trim().toLowerCase();
  const shown = doctors.filter((d) =>
    (dept === "all" || d.departmentSlug === dept) &&
    (!term || `${d.firstName} ${d.lastName} ${d.speciality}`.toLowerCase().includes(term)));

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8">
        <label htmlFor="doc-search" className="sr-only">Search doctors</label>
        <input id="doc-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or speciality…"
          className="w-full md:w-72 px-4 py-3 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "white" }} />
        <div className="flex gap-2 flex-wrap">
          {[{ slug: "all", name: "All" }, ...departments].map((d) => (
            <button key={d.slug} type="button" onClick={() => setDept(d.slug)} aria-pressed={dept === d.slug}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: dept === d.slug ? "var(--navy)" : "var(--grey-100)", color: dept === d.slug ? "white" : "var(--navy)" }}>
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>No doctors match your search.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{shown.map((d) => <DoctorCard key={d.id} d={d} />)}</div>
      )}
    </>
  );
}
