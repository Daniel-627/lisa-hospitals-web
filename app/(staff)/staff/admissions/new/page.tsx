"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Field, Spinner, inputCls, inputStyle } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

function Admit() {
  const router = useRouter();
  const visitId = useSearchParams().get("visitId");
  const [ward, setWard] = useState("");
  const [bed, setBed] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [wards, setWards] = useState<string[]>([]); // wards from the price list: the daily bed charge is looked up from the ward name
  useEffect(() => { staffApi.catalog().then(({ data }) => setWards(data.data?.ward ?? [])).catch(() => {}); }, []);

  if (!visitId) return <ErrorBox>Open this page from the patient&apos;s consultation (“Admit to ward”).</ErrorBox>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!ward.trim()) return setError("Enter the ward.");
    if (!window.confirm("Admit this patient to the ward?")) return;
    setSaving(true);
    try {
      const { data } = await staffApi.admit({ visitId, ward: ward.trim(), bedNumber: bed.trim() || undefined });
      router.push(`/staff/admissions/${data.data.id}`);
    } catch (err) {
      setError(errMsg(err, "Couldn't admit the patient."));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl">
      {error && <ErrorBox>{error}</ErrorBox>}
      <Card className="space-y-4">
        <Field label="Ward" htmlFor="adm-ward"><input id="adm-ward" list="wards" value={ward} onChange={(e) => setWard(e.target.value)} className={inputCls} style={inputStyle} placeholder="Choose or type the ward" maxLength={100} /><datalist id="wards">{wards.map((w) => <option key={w} value={w} />)}</datalist></Field>
        <Field label="Bed number (optional)" htmlFor="adm-bed"><input id="adm-bed" value={bed} onChange={(e) => setBed(e.target.value)} className={inputCls} style={inputStyle} maxLength={20} /></Field>
        <button type="submit" disabled={saving} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>{saving ? "Admitting..." : "Admit patient"}</button>
      </Card>
    </form>
  );
}

export default function AdmitPage() {
  return (
    <PortalShell audience="staff" title={<>Admit to <em className="italic" style={{ color: "var(--teal)" }}>Ward</em></>} subtitle="Only the doctor treating the patient can admit them">
      <Suspense fallback={<Spinner />}><Admit /></Suspense>
    </PortalShell>
  );
}
