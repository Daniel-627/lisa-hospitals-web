"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Card, DetailRow, ErrorBox, Field, Spinner, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { patientsApi } from "@/lib/api";
import { INSURANCE, errMsg, todayLocal } from "@/lib/format";

const FIELDS = [
  "dateOfBirth", "gender", "bloodGroup", "nationalId", "address",
  "nextOfKinName", "nextOfKinPhone", "nextOfKinRelation",
  "insuranceScheme", "insuranceNumber", "allergies",
] as const;
type Form = Record<(typeof FIELDS)[number], string>;

const toForm = (p: any): Form => Object.fromEntries(FIELDS.map((k) => [k, p?.[k] ?? ""])) as Form;

function ProfileForm() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [initial, setInitial] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    patientsApi.getProfile()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data.data);
        setForm(toForm(data.data));
        setInitial(toForm(data.data));
      })
      .catch((err) => { if (!cancelled) setError(errMsg(err, "Couldn't load your profile.")); });
    return () => { cancelled = true; };
  }, []);

  if (error && !form) return <ErrorBox>{error}</ErrorBox>;
  if (!form || !initial) return <Spinner label="Loading your profile..." />;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setForm({ ...form, [k]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    // Send only fields that changed and aren't empty (the API validates each one).
    const payload: Record<string, string> = {};
    for (const k of FIELDS) if (form[k] !== initial[k] && form[k].trim() !== "") payload[k] = form[k].trim();

    if (Object.keys(payload).length === 0) return setError("No changes to save.");
    if (payload.nationalId && payload.nationalId.length < 5) return setError("National ID looks too short.");

    setSaving(true);
    try {
      await patientsApi.updateProfile(payload);
      setInitial({ ...form });
      setSaved(true);
    } catch (err) {
      setError(errMsg(err, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  };

  const needsDob = initial.dateOfBirth === "2000-01-01";

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      {error && <ErrorBox>{error}</ErrorBox>}
      {saved && <SuccessBox>Profile saved.</SuccessBox>}
      {needsDob && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "var(--gold-light)", color: "var(--gold-dark)" }}>
          Please confirm your date of birth — we&apos;ve used a placeholder until you do.
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Account</h2>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Name" value={`${profile.firstName} ${profile.lastName}`} />
          <DetailRow label="Patient number" value={profile.patientNumber} />
          <DetailRow label="Email" value={profile.email} />
          <DetailRow label="Phone" value={profile.phone} />
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--grey-400)" }}>Name and email are managed through your account menu (top right).</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Personal details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Date of birth" htmlFor="dob">
            <input id="dob" type="date" max={todayLocal()} value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Gender" htmlFor="gender">
            <select id="gender" value={form.gender} onChange={set("gender")} className={inputCls} style={inputStyle}>
              <option value="male">Male</option><option value="female">Female</option><option value="other">Other / prefer not to say</option>
            </select>
          </Field>
          <Field label="Blood group" htmlFor="bg">
            <select id="bg" value={form.bloodGroup} onChange={set("bloodGroup")} className={inputCls} style={inputStyle}>
              <option value="">Unknown</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="National ID" htmlFor="nid">
            <input id="nid" value={form.nationalId} maxLength={20} onChange={set("nationalId")} className={inputCls} style={inputStyle} />
          </Field>
        </div>
        <Field label="Address" htmlFor="addr">
          <input id="addr" value={form.address} maxLength={500} onChange={set("address")} className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Allergies" htmlFor="alg" hint="Medicines, foods or anything else we should know about.">
          <textarea id="alg" rows={3} value={form.allergies} maxLength={2000} onChange={set("allergies")} className={`${inputCls} resize-none`} style={inputStyle} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Next of kin</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Name" htmlFor="nokn"><input id="nokn" value={form.nextOfKinName} maxLength={200} onChange={set("nextOfKinName")} className={inputCls} style={inputStyle} /></Field>
          <Field label="Phone" htmlFor="nokp"><input id="nokp" type="tel" value={form.nextOfKinPhone} maxLength={20} onChange={set("nextOfKinPhone")} className={inputCls} style={inputStyle} /></Field>
          <Field label="Relationship" htmlFor="nokr"><input id="nokr" value={form.nextOfKinRelation} maxLength={50} onChange={set("nextOfKinRelation")} className={inputCls} style={inputStyle} /></Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Insurance</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Scheme" htmlFor="ins">
            <select id="ins" value={form.insuranceScheme} onChange={set("insuranceScheme")} className={inputCls} style={inputStyle}>
              <option value="">None on file</option>
              {INSURANCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Member / policy number" htmlFor="insn">
            <input id="insn" value={form.insuranceNumber} maxLength={100} onChange={set("insuranceNumber")} className={inputCls} style={inputStyle} />
          </Field>
        </div>
      </Card>

      <button type="submit" disabled={saving} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: saving ? "var(--teal-dark)" : "var(--teal)" }}>
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

export default function PatientProfilePage() {
  return (
    <PortalShell audience="patient" title={<>My <em className="italic" style={{ color: "var(--teal)" }}>Profile</em></>} subtitle="Keep your details up to date so we can serve you better">
      <ProfileForm />
    </PortalShell>
  );
}
