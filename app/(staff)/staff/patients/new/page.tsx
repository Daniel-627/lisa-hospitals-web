"use client";

import PortalShell from "@/components/PortalShell";
import PatientForm from "@/components/PatientForm";

export default function RegisterPatientPage() {
  return (
    <PortalShell audience="staff" title={<>Register <em className="italic" style={{ color: "var(--teal)" }}>Patient</em></>} subtitle="For walk-ins and anyone without an online account">
      <PatientForm />
    </PortalShell>
  );
}
