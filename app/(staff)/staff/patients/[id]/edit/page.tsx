"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import PatientForm from "@/components/PatientForm";
import { ErrorBox, Spinner } from "@/components/ui";
import { staffApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

function Editor() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    staffApi.getPatientById(id)
      .then(({ data }) => { if (!cancelled) setPatient(data.data); })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.status === 403 ? "You are not currently assigned to this patient." : err.response?.status === 404 ? "Patient not found." : errMsg(err, "Couldn't load this patient."));
      });
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <><Link href={`/staff/patients/${id}`} className="text-sm" style={{ color: "var(--teal)" }}>← Back</Link><div className="mt-4"><ErrorBox>{error}</ErrorBox></div></>;
  if (!patient) return <Spinner label="Loading patient..." />;
  return <PatientForm patient={patient} />;
}

export default function EditPatientPage() {
  return (
    <PortalShell audience="staff" title={<>Edit <em className="italic" style={{ color: "var(--teal)" }}>Details</em></>}>
      <Editor />
    </PortalShell>
  );
}
