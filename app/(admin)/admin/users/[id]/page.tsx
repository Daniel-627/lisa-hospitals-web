"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell, { useMe } from "@/components/PortalShell";
import { Card, DetailRow, ErrorBox, Field, Pill, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { adminApi, departmentsApi } from "@/lib/api";
import { DAYS, ROLES, errMsg, fmtDate, hhmm, roleLabel, todayLocal } from "@/lib/format";

type Dept = { id: string; name: string };

function DeptSelect({ id, value, onChange, depts, required }: { id: string; value: string; onChange: (v: string) => void; depts: Dept[]; required?: boolean }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} className={inputCls} style={inputStyle}>
      <option value="">{required ? "Choose a department…" : "No department"}</option>
      {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  );
}

/** Saves, then tells the parent to reload. Shows its own error/success. */
function useAction(refresh: (msg?: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<any>, success: string) => {
    setBusy(true); setError("");
    try { await fn(); refresh(success); } catch (err) { setError(errMsg(err, "Something went wrong.")); } finally { setBusy(false); }
  };
  return { busy, error, run };
}

function AccountCard({ user, refresh }: { user: any; refresh: (msg?: string) => void }) {
  const me = useMe();
  const self = user.id === me.id;
  const { busy, error, run } = useAction(refresh);

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>{user.firstName} {user.lastName}</h2>
          <div className="flex gap-2 mt-2">{user.isActive ? <Pill tone="ok">Active</Pill> : <Pill tone="danger">Deactivated</Pill>}<Pill>{roleLabel(user.role)}</Pill></div>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Phone" value={user.phone?.startsWith("clerk-") ? "Not provided" : user.phone} />
        <DetailRow label="Joined" value={fmtDate(String(user.createdAt).slice(0, 10))} />
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Role" htmlFor="acct-role">
          <select id="acct-role" value={user.role} disabled={self || busy} className={inputCls} style={{ ...inputStyle, width: "auto" }}
            onChange={(e) => window.confirm(`Change ${user.firstName}'s role to ${roleLabel(e.target.value)}?`) && run(() => adminApi.updateUser(user.id, { role: e.target.value }), "Role updated.")}>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <button disabled={self || busy} onClick={() => window.confirm(user.isActive ? `Deactivate ${user.firstName}?` : `Reactivate ${user.firstName}?`) && run(() => adminApi.updateUser(user.id, { isActive: !user.isActive }), user.isActive ? "Account deactivated." : "Account reactivated.")}
          className="px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-50" style={user.isActive ? { background: "#fde8e8", color: "var(--danger)" } : { background: "var(--teal-light)", color: "var(--teal-dark)" }}>
          {user.isActive ? "Deactivate account" : "Reactivate account"}
        </button>
      </div>
      {self && <p className="text-xs" style={{ color: "var(--grey-400)" }}>You can&apos;t change your own role or deactivate yourself.</p>}
    </Card>
  );
}

function StaffCard({ user, staff, depts, refresh }: { user: any; staff: any; depts: Dept[]; refresh: (msg?: string) => void }) {
  const { busy, error, run } = useAction(refresh);
  const [dept, setDept] = useState(staff?.departmentId ?? "");
  const [qual, setQual] = useState(staff?.qualification ?? "");
  const [employed, setEmployed] = useState(todayLocal());

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Staff profile</h2>
      {error && <ErrorBox>{error}</ErrorBox>}
      {staff ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4"><DetailRow label="Staff number" value={staff.staffNumber} /><DetailRow label="Employed since" value={fmtDate(staff.employedAt)} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Department" htmlFor="st-dept"><DeptSelect id="st-dept" value={dept} onChange={setDept} depts={depts} /></Field>
            <Field label="Qualification" htmlFor="st-qual"><input id="st-qual" value={qual} maxLength={200} onChange={(e) => setQual(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          </div>
          <button disabled={busy} onClick={() => run(() => adminApi.updateStaffProfile(user.id, { departmentId: dept || null, qualification: qual.trim() || null }), "Staff profile saved.")}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Saving..." : "Save"}</button>
        </>
      ) : (
        <>
          <p className="text-sm" style={{ color: "var(--grey-500)" }}>This user has a staff role but no staff profile yet. A profile gives them a staff number and lets them issue invoices, upload documents and be credited on their work.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Department" htmlFor="st-dept"><DeptSelect id="st-dept" value={dept} onChange={setDept} depts={depts} /></Field>
            <Field label="Qualification" htmlFor="st-qual"><input id="st-qual" value={qual} maxLength={200} onChange={(e) => setQual(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. BSc Nursing" /></Field>
            <Field label="Employed since" htmlFor="st-emp"><input id="st-emp" type="date" value={employed} max={todayLocal()} onChange={(e) => setEmployed(e.target.value)} className={inputCls} style={inputStyle} /></Field>
          </div>
          <button disabled={busy} onClick={() => run(() => adminApi.createStaffProfile(user.id, { departmentId: dept || undefined, qualification: qual.trim() || undefined, employedAt: employed }), "Staff profile created.")}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Creating..." : "Create staff profile"}</button>
        </>
      )}
    </Card>
  );
}

function DoctorCard({ user, doctor, depts, refresh }: { user: any; doctor: any; depts: Dept[]; refresh: (msg?: string) => void }) {
  const { busy, error, run } = useAction(refresh);
  const [dept, setDept] = useState(doctor?.departmentId ?? "");
  const [speciality, setSpeciality] = useState(doctor?.speciality ?? "");
  const [bio, setBio] = useState(doctor?.bio ?? "");
  const [photo, setPhoto] = useState(doctor?.photoUrl ?? "");
  const [fee, setFee] = useState(doctor?.consultationFee ? String(Number(doctor.consultationFee)) : "");
  const [available, setAvailable] = useState(doctor?.isAvailable ?? true);
  const [localError, setLocalError] = useState("");

  const feeNumber = fee.trim() === "" ? null : Number(fee);
  const validate = () => {
    if (!dept) return "Choose a department.";
    if (speciality.trim().length < 2) return "Enter the doctor's speciality.";
    if (feeNumber !== null && (!Number.isFinite(feeNumber) || feeNumber < 0)) return "Enter a valid consultation fee, or leave it blank.";
    if (photo.trim() && !photo.trim().startsWith("https://")) return "The photo link must start with https://";
    return "";
  };

  const save = () => {
    const msg = validate();
    setLocalError(msg);
    if (msg) return;
    if (doctor) {
      run(() => adminApi.updateDoctor(doctor.id, {
        speciality: speciality.trim(), departmentId: dept, bio: bio.trim() || null, photoUrl: photo.trim() || null,
        consultationFee: feeNumber, isAvailable: available,
      }), "Doctor profile saved.");
    } else {
      run(() => adminApi.createDoctorProfile(user.id, {
        departmentId: dept, speciality: speciality.trim(), bio: bio.trim() || undefined, photoUrl: photo.trim() || undefined,
        consultationFee: feeNumber ?? undefined,
      }), "Doctor profile created. They now appear on the website.");
    }
  };

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Doctor profile <span className="font-normal" style={{ color: "var(--grey-400)" }}>(shown on the public Doctors page)</span></h2>
      {(localError || error) && <ErrorBox>{localError || error}</ErrorBox>}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Department" htmlFor="dr-dept"><DeptSelect id="dr-dept" value={dept} onChange={setDept} depts={depts} required /></Field>
        <Field label="Speciality" htmlFor="dr-spec"><input id="dr-spec" value={speciality} maxLength={200} onChange={(e) => setSpeciality(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Obstetrician & Gynaecologist" /></Field>
        <Field label="Consultation fee (KES)" htmlFor="dr-fee"><input id="dr-fee" type="number" min={0} step="50" value={fee} onChange={(e) => setFee(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="Photo link (https)" htmlFor="dr-photo" hint="Optional. Initials are shown if blank."><input id="dr-photo" type="url" value={photo} maxLength={500} onChange={(e) => setPhoto(e.target.value)} className={inputCls} style={inputStyle} placeholder="https://…" /></Field>
      </div>
      <Field label="Bio" htmlFor="dr-bio"><textarea id="dr-bio" rows={4} value={bio} maxLength={5000} onChange={(e) => setBio(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} /></Field>
      {doctor && (
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--navy)" }}>
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} /> Accepting appointments (uncheck to hide from the website and booking)
        </label>
      )}
      <button disabled={busy} onClick={save} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>
        {busy ? "Saving..." : doctor ? "Save doctor profile" : "Create doctor profile"}
      </button>
    </Card>
  );
}

type Slot = { dayOfWeek: number; startTime: string; endTime: string; maxSlots: number };

function AvailabilityCard({ doctor, initial, refresh }: { doctor: any; initial: any[]; refresh: (msg?: string) => void }) {
  const { busy, error, run } = useAction(refresh);
  const [slots, setSlots] = useState<Slot[]>(initial.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: hhmm(s.startTime), endTime: hhmm(s.endTime), maxSlots: s.maxSlots })));
  const [localError, setLocalError] = useState("");

  const update = (i: number, patch: Partial<Slot>) => setSlots(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const save = () => {
    if (slots.some((s) => !s.startTime || !s.endTime || s.endTime <= s.startTime)) return setLocalError("Each time slot must end after it starts.");
    setLocalError("");
    run(() => adminApi.setAvailability(doctor.id, slots), "Schedule saved.");
  };

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Weekly schedule</h2>
      {(localError || error) && <ErrorBox>{localError || error}</ErrorBox>}
      {slots.length === 0 && <p className="text-sm" style={{ color: "var(--grey-500)" }}>No clinic hours yet.</p>}
      <div className="space-y-3">
        {slots.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select aria-label="Day" value={s.dayOfWeek} onChange={(e) => update(i, { dayOfWeek: Number(e.target.value) })} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}>
              {DAYS.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
            </select>
            <input aria-label="Start time" type="time" value={s.startTime} onChange={(e) => update(i, { startTime: e.target.value })} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }} />
            <span style={{ color: "var(--grey-400)" }}>to</span>
            <input aria-label="End time" type="time" value={s.endTime} onChange={(e) => update(i, { endTime: e.target.value })} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }} />
            <button type="button" onClick={() => setSlots(slots.filter((_, idx) => idx !== i))} className="px-3 py-2 text-xs font-semibold" style={{ color: "var(--danger)" }}>Remove</button>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        <button type="button" onClick={() => setSlots([...slots, { dayOfWeek: 1, startTime: "08:00", endTime: "17:00", maxSlots: 20 }])} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>+ Add hours</button>
        <button disabled={busy} onClick={save} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{busy ? "Saving..." : "Save schedule"}</button>
      </div>
    </Card>
  );
}

function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const [dataVersion, setDataVersion] = useState(0); // bumps when FRESH data arrives, so forms remount with it
  const [flash, setFlash] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.user(id), departmentsApi.getAll()])
      .then(([u, d]) => { if (!cancelled) { setDetail(u.data.data); setDepts(d.data.data); setDataVersion((v) => v + 1); } })
      .catch((err) => { if (!cancelled) setError(err.response?.status === 404 ? "User not found." : errMsg(err, "Couldn't load this user.")); });
    return () => { cancelled = true; };
  }, [id, version]);

  const refresh = (msg?: string) => { setFlash(msg ?? ""); setVersion((v) => v + 1); };
  const back = <Link href="/admin/users" className="text-sm" style={{ color: "var(--teal)" }}>← All users</Link>;

  if (error) return <>{back}<div className="mt-4"><ErrorBox>{error}</ErrorBox></div></>;
  if (!detail) return <Spinner label="Loading user..." />;

  const { user, staff, doctor, availability } = detail;
  return (
    <div className="space-y-6 max-w-3xl">
      {back}
      {flash && <SuccessBox>{flash}</SuccessBox>}
      {/* key={dataVersion}: forms remount with fresh data after every save */}
      <AccountCard key={`a${dataVersion}`} user={user} refresh={refresh} />
      {user.role !== "patient" && <StaffCard key={`s${dataVersion}`} user={user} staff={staff} depts={depts} refresh={refresh} />}
      {user.role === "doctor" && <DoctorCard key={`d${dataVersion}`} user={user} doctor={doctor} depts={depts} refresh={refresh} />}
      {user.role === "doctor" && doctor && <AvailabilityCard key={`v${dataVersion}`} doctor={doctor} initial={availability} refresh={refresh} />}
    </div>
  );
}

export default function AdminUserPage() {
  return (
    <PortalShell audience="admin" title={<>Manage <em className="italic" style={{ color: "var(--teal)" }}>User</em></>}>
      <UserDetail />
    </PortalShell>
  );
}
