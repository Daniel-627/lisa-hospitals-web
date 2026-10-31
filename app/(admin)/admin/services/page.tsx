"use client";

import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Pill, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { Sheet } from "@/components/BookingDeskParts";
import { bookingApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

type Doc = { id: string; departmentId: string; department: string; firstName: string; lastName: string };
type Svc = { id: string; departmentId: string; name: string; nameSw: string | null; durationMin: number; sortOrder: number; isActive: boolean; doctorIds: string[] };
const blank = { departmentId: "", name: "", nameSw: "", durationMin: 20, sortOrder: 0, isActive: true, doctorIds: [] as string[] };

function Editor({ initial, id, docs, onClose, onDone }: { initial: typeof blank; id?: string; docs: Doc[]; onClose: () => void; onDone: (m: string) => void }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const depts = useMemo(() => { const m = new Map<string, string>(); docs.forEach((d) => m.set(d.departmentId, d.department)); return [...m.entries()]; }, [docs]);
  const deptDocs = docs.filter((d) => d.departmentId === f.departmentId);
  const toggle = (docId: string) => setF({ ...f, doctorIds: f.doctorIds.includes(docId) ? f.doctorIds.filter((x) => x !== docId) : [...f.doctorIds, docId] });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await bookingApi.saveService({ ...f, durationMin: +f.durationMin, sortOrder: +f.sortOrder }, id); onDone("Saved."); }
    catch (err) { setError(errMsg(err, "Couldn't save")); setBusy(false); }
  }
  return (
    <Sheet title={id ? "Edit service" : "New service"} onClose={onClose}>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={save} className="space-y-4">
        <Field label="Department" htmlFor="sv-dept">
          <select id="sv-dept" required disabled={!!id} className={inputCls} style={inputStyle} value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value, doctorIds: [] })}>
            <option value="">Choose…</option>{depts.map(([i, n]) => <option key={i} value={i}>{n}</option>)}
          </select>
        </Field>
        <Field label="Name (English)" htmlFor="sv-name"><input id="sv-name" required minLength={2} maxLength={120} className={inputCls} style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Dental check-up" /></Field>
        <Field label="Name (Kiswahili, optional)" htmlFor="sv-sw"><input id="sv-sw" maxLength={120} className={inputCls} style={inputStyle} value={f.nameSw ?? ""} onChange={(e) => setF({ ...f, nameSw: e.target.value })} placeholder="e.g. Uchunguzi wa meno" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Visit length (minutes)" htmlFor="sv-min"><input id="sv-min" type="number" min={5} max={240} step={5} required className={inputCls} style={inputStyle} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: +e.target.value })} /></Field>
          <Field label="Order in list" htmlFor="sv-ord" hint="Smaller shows first"><input id="sv-ord" type="number" min={0} max={999} className={inputCls} style={inputStyle} value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: +e.target.value })} /></Field>
        </div>
        {f.departmentId && (
          <fieldset>
            <legend className="text-sm font-medium mb-1.5" style={{ color: "var(--navy)" }}>Doctors who do this</legend>
            <p className="text-xs mb-2" style={{ color: "var(--grey-400)" }}>Leave all unticked to offer it with every doctor in the department.</p>
            <div className="space-y-1.5">
              {deptDocs.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm" style={{ color: "var(--navy)" }}>
                  <input type="checkbox" checked={f.doctorIds.includes(d.id)} onChange={() => toggle(d.id)} /> Dr. {d.firstName} {d.lastName}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--navy)" }}><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> Available for booking</label>
        <button disabled={busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--teal)" }}>{busy ? "Saving..." : "Save"}</button>
      </form>
    </Sheet>
  );
}

function Content() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [rows, setRows] = useState<Svc[] | null>(null);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState(""); const [flash, setFlash] = useState("");
  const [edit, setEdit] = useState<{ id?: string; v: typeof blank } | null>(null);

  useEffect(() => {
    Promise.all([bookingApi.doctors(), bookingApi.adminServices()])
      .then(([d, s]) => { setDocs(d.data.data); setRows(s.data.data); })
      .catch((e) => setError(errMsg(e, "Couldn't load services")));
  }, [tick]);

  const deptName = (id: string) => docs.find((d) => d.departmentId === id)?.department ?? "Department";
  const grouped = useMemo(() => {
    const m = new Map<string, Svc[]>();
    (rows ?? []).forEach((r) => m.set(r.departmentId, [...(m.get(r.departmentId) ?? []), r]));
    return [...m.entries()];
  }, [rows]);

  async function remove(s: Svc) {
    if (!window.confirm(`Remove "${s.name}"? If it has past bookings it is switched off instead.`)) return;
    try { const { data } = await bookingApi.deleteService(s.id); setFlash(data.message); setTick((n) => n + 1); }
    catch (e) { setError(errMsg(e, "Couldn't remove")); }
  }

  if (!rows) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />;
  return (
    <div className="space-y-5 max-w-3xl">
      <Card>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>What are services?</h2>
        <p className="text-xs" style={{ color: "var(--grey-500)" }}>
          A service is a type of visit with its own length, for example “Tooth extraction, 60 min”. When a department has services, patients choose one first and only see doctors who offer it and times long enough for it. A department with no services books by doctor as before.
        </p>
        <button onClick={() => { setEdit({ v: blank }); setFlash(""); }} className="mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>+ New service</button>
      </Card>
      {flash && <SuccessBox>{flash}</SuccessBox>}{error && <ErrorBox>{error}</ErrorBox>}
      {grouped.length === 0 && <Card><p className="text-sm" style={{ color: "var(--grey-500)" }}>No services yet.</p></Card>}
      {grouped.map(([dept, list]) => (
        <section key={dept}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>{deptName(dept)}</h2>
          <div className="space-y-2">
            {list.map((s) => (
              <Card key={s.id} className="!p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[12rem]">
                    <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{s.name} <span className="font-normal" style={{ color: "var(--grey-500)" }}>· {s.durationMin} min</span></div>
                    <div className="text-xs" style={{ color: "var(--grey-500)" }}>
                      {s.nameSw ? `${s.nameSw} · ` : ""}{s.doctorIds.length ? s.doctorIds.map((i) => { const d = docs.find((x) => x.id === i); return d ? `Dr. ${d.lastName}` : ""; }).filter(Boolean).join(", ") : "All doctors in the department"}
                    </div>
                  </div>
                  {!s.isActive && <Pill tone="muted">Off</Pill>}
                  <button onClick={() => { setEdit({ id: s.id, v: { departmentId: s.departmentId, name: s.name, nameSw: s.nameSw ?? "", durationMin: s.durationMin, sortOrder: s.sortOrder, isActive: s.isActive, doctorIds: s.doctorIds } }); setFlash(""); }} className="text-xs font-semibold" style={{ color: "var(--teal-dark)" }}>Edit</button>
                  <button onClick={() => remove(s)} className="text-xs font-semibold" style={{ color: "var(--danger)" }}>Remove</button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
      {edit && <Editor key={edit.id ?? "new"} id={edit.id} initial={edit.v} docs={docs} onClose={() => setEdit(null)} onDone={(m) => { setEdit(null); setFlash(m); setTick((n) => n + 1); }} />}
    </div>
  );
}

export default function AdminServicesPage() {
  return (
    <PortalShell audience="admin" title={<>Visit <em className="italic" style={{ color: "var(--teal)" }}>services</em></>} subtitle="Types of visit, their length and who does them">
      <Content />
    </PortalShell>
  );
}
