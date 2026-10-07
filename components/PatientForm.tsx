"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, ErrorBox, Field, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { INSURANCE, errMsg, fmtDate, todayLocal } from "@/lib/format";

type Match = { id: string; patientNumber: string; firstName: string; lastName: string; dateOfBirth: string; phone: string | null };

// One form for both "register a new patient" (no `patient`) and "edit details" (existing `patient`).
export default function PatientForm({ patient }: { patient?: any }) {
  const router = useRouter();
  const edit = !!patient;
  const linked = edit && !!patient.hasAccount; // name/phone/email belong to the patient's online account
  const init = (k: string) => (edit ? String(patient?.[k] ?? "") : "");
  const yearsOld = patient?.dobIsEstimated ? String(new Date().getFullYear() - Number(String(patient.dateOfBirth).slice(0, 4))) : "";

  const [unidentified, setUnidentified] = useState(false);
  const [firstName, setFirstName] = useState(init("firstName"));
  const [lastName, setLastName] = useState(init("lastName"));
  const [dobMode, setDobMode] = useState<"dob" | "age">(patient?.dobIsEstimated ? "age" : "dob");
  const [dob, setDob] = useState(patient?.dateOfBirth ?? "");
  const [age, setAge] = useState(yearsOld);
  const [gender, setGender] = useState(init("gender"));
  const [phone, setPhone] = useState(init("phone").startsWith("clerk-") ? "" : init("phone"));
  const [email, setEmail] = useState(init("email"));
  const [nationalId, setNationalId] = useState(init("nationalId"));
  const [address, setAddress] = useState(init("address"));
  const [nokName, setNokName] = useState(init("nextOfKinName"));
  const [nokPhone, setNokPhone] = useState(init("nextOfKinPhone"));
  const [nokRelation, setNokRelation] = useState(init("nextOfKinRelation"));
  const [scheme, setScheme] = useState(init("insuranceScheme"));
  const [schemeNo, setSchemeNo] = useState(init("insuranceNumber"));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dup, setDup] = useState<{ code: string; matches: Match[] } | null>(null);

  const submit = async (confirmNotDuplicate = false) => {
    setError("");
    setDup(null);

    const t = (v: string) => v.trim();
    if (!edit) {
      if (!unidentified && (!t(firstName) || !t(lastName))) return setError("Enter the patient's first and last name.");
      if (!gender) return setError("Choose the patient's gender.");
    }
    if (dobMode === "dob" ? (!edit && !dob) : (!edit && !t(age))) return setError("Enter a date of birth or an approximate age.");
    if (dobMode === "age" && t(age) && !(Number(age) >= 0 && Number(age) <= 120)) return setError("Age must be between 0 and 120.");

    const out: Record<string, any> = {};
    const put = (key: string, value: string) => { if (t(value) && t(value) !== t(init(key))) out[key] = t(value); };
    if (!linked) {
      if (!unidentified) { put("firstName", firstName); put("lastName", lastName); }
      put("phone", phone);
      put("email", email);
    }
    put("gender", gender);
    put("nationalId", nationalId);
    put("address", address);
    put("nextOfKinName", nokName);
    put("nextOfKinPhone", nokPhone);
    put("nextOfKinRelation", nokRelation);
    put("insuranceScheme", scheme);
    put("insuranceNumber", schemeNo);
    if (dobMode === "dob" && dob && dob !== patient?.dateOfBirth) out.dateOfBirth = dob;
    if (dobMode === "age" && t(age) && (!edit || t(age) !== yearsOld)) out.approxAge = Number(age);
    if (!edit) { if (unidentified) out.unidentified = true; if (confirmNotDuplicate) out.confirmNotDuplicate = true; }

    if (edit && Object.keys(out).length === 0) return setError("No changes to save.");

    setSaving(true);
    try {
      if (edit) {
        await staffApi.updatePatient(patient.id, out);
        router.push(`/staff/patients/${patient.id}`);
      } else {
        const { data } = await staffApi.registerPatient(out);
        router.push(`/staff/patients/${data.data.id}`);
      }
    } catch (err: any) {
      const d = err.response?.data;
      if (err.response?.status === 409 && (d?.code === "POSSIBLE_DUPLICATE" || d?.code === "DUPLICATE_ID")) setDup({ code: d.code, matches: d.matches ?? [] });
      else setError(errMsg(err, "Couldn't save the patient. Please try again."));
      setSaving(false);
    }
  };

  const text = (id: string, value: string, set: (v: string) => void, extra: Record<string, any> = {}) => (
    <input id={id} value={value} onChange={(e) => set(e.target.value)} className={inputCls} style={inputStyle} {...extra} />
  );
  const cancelHref = edit ? `/staff/patients/${patient.id}` : "/staff/patients";

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="max-w-3xl space-y-6" noValidate>
      {error && <ErrorBox>{error}</ErrorBox>}

      {dup && (
        <div className="p-4 rounded-xl border" style={{ background: "var(--gold-light)", borderColor: "var(--gold)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>
            {dup.code === "DUPLICATE_ID" ? "A patient with this national ID is already registered:" : "This person may already be registered. Please check before creating a second record:"}
          </p>
          <div className="space-y-2 mb-4">
            {dup.matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white text-sm">
                <span style={{ color: "var(--navy)" }}>
                  <strong>{m.firstName} {m.lastName}</strong> · {m.patientNumber} · born {fmtDate(m.dateOfBirth)}{m.phone ? ` · ${m.phone}` : ""}
                </span>
                <Link href={`/staff/patients/${m.id}`} className="font-semibold shrink-0" style={{ color: "var(--teal)" }}>Open</Link>
              </div>
            ))}
          </div>
          {dup.code === "POSSIBLE_DUPLICATE" && (
            <button type="button" onClick={() => submit(true)} disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--navy)" }}>
              None of these, register as a new patient
            </button>
          )}
        </div>
      )}

      <Card className="space-y-5">
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Who is the patient?</h2>
        {!edit && (
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--navy)" }}>
            <input type="checkbox" checked={unidentified} onChange={(e) => setUnidentified(e.target.checked)} />
            Unidentified emergency patient (register now, add the name later)
          </label>
        )}
        {linked && <p className="text-xs" style={{ color: "var(--grey-500)" }}>Name, phone and email are managed by the patient in their online account.</p>}
        {!unidentified && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name" htmlFor="p-first">{text("p-first", firstName, setFirstName, { disabled: linked, maxLength: 100, autoComplete: "off" })}</Field>
            <Field label="Last name" htmlFor="p-last">{text("p-last", lastName, setLastName, { disabled: linked, maxLength: 100, autoComplete: "off" })}</Field>
          </div>
        )}

        <div>
          <div className="flex gap-2 mb-2">
            {([["dob", "Date of birth"], ["age", "Approximate age"]] as const).map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => setDobMode(mode)} aria-pressed={dobMode === mode}
                className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: dobMode === mode ? "var(--navy)" : "var(--grey-200)", color: dobMode === mode ? "white" : "var(--navy)" }}>
                {label}
              </button>
            ))}
          </div>
          {dobMode === "dob"
            ? <input aria-label="Date of birth" type="date" max={todayLocal()} value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} style={inputStyle} />
            : <input aria-label="Approximate age in years" type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} style={inputStyle} placeholder="Age in years" />}
          {dobMode === "age" && <p className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>Saved as an estimate and marked that way on the patient file.</p>}
        </div>

        <Field label="Gender" htmlFor="p-gender">
          <select id="p-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls} style={inputStyle}>
            <option value="">Choose…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone" htmlFor="p-phone" hint="e.g. 0712 345 678">{text("p-phone", phone, setPhone, { type: "tel", disabled: linked, maxLength: 30 })}</Field>
          <Field label="Email (optional)" htmlFor="p-email">{text("p-email", email, setEmail, { type: "email", disabled: linked, maxLength: 255 })}</Field>
        </div>
        <Field label="Address" htmlFor="p-address">{text("p-address", address, setAddress, { maxLength: 500 })}</Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Identification &amp; insurance</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="National ID (optional)" htmlFor="p-nid" hint="Stops the same person being registered twice.">{text("p-nid", nationalId, setNationalId, { maxLength: 20 })}</Field>
          <span />
          <Field label="Insurance scheme" htmlFor="p-scheme">
            <select id="p-scheme" value={scheme} onChange={(e) => setScheme(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">None / pays cash</option>
              {INSURANCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Member / policy number" htmlFor="p-schemeno">{text("p-schemeno", schemeNo, setSchemeNo, { maxLength: 100 })}</Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Next of kin</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Name" htmlFor="p-nokn">{text("p-nokn", nokName, setNokName, { maxLength: 200 })}</Field>
          <Field label="Phone" htmlFor="p-nokp">{text("p-nokp", nokPhone, setNokPhone, { type: "tel", maxLength: 20 })}</Field>
          <Field label="Relationship" htmlFor="p-nokr">{text("p-nokr", nokRelation, setNokRelation, { maxLength: 50 })}</Field>
        </div>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: saving ? "var(--teal-dark)" : "var(--teal)" }}>
          {saving ? "Saving..." : edit ? "Save changes" : "Register patient"}
        </button>
        <Link href={cancelHref} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Cancel</Link>
      </div>
    </form>
  );
}
