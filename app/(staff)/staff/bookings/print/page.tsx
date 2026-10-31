"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PortalShell, { useMe } from "@/components/PortalShell";
import { ErrorBox, Spinner } from "@/components/ui";
import { clock, nice, type Booking } from "@/components/BookingDeskParts";
import { bookingApi } from "@/lib/api";
import { errMsg, todayLocal } from "@/lib/format";

function Sheet() {
  const me = useMe();
  const sp = useSearchParams();
  const date = sp.get("date") || todayLocal();
  const doctorId = sp.get("doctorId") || "";
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    bookingApi.staffList({ date, doctorId: doctorId || undefined })
      .then(({ data }) => setRows(data.data))
      .catch((e) => setError(errMsg(e, "Couldn't load the list")));
  }, [date, doctorId]);

  const byDoctor = useMemo(() => {
    const m = new Map<string, Booking[]>();
    (rows ?? []).filter((r) => r.status !== "cancelled").forEach((r) => m.set(r.doctorName, [...(m.get(r.doctorName) ?? []), r]));
    return [...m.entries()];
  }, [rows]);
  const showPhone = me.role !== "doctor";

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!rows) return <Spinner label="Preparing the list..." />;
  return (
    <div className="max-w-3xl">
      <div className="no-print flex gap-3 mb-6">
        <button onClick={() => window.print()} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Print</button>
        <button onClick={() => window.close()} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Close</button>
      </div>
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--navy)" }}>Lisa Hospitals · Appointments</h1>
      <p className="text-sm mb-6" style={{ color: "var(--grey-500)" }}>{nice(date)} · printed {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
      {byDoctor.length === 0 && <p className="text-sm">No appointments for this day.</p>}
      {byDoctor.map(([doctor, list]) => (
        <section key={doctor} className="mb-8" style={{ breakInside: "avoid" }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--navy)" }}>{doctor} <span className="font-normal text-sm" style={{ color: "var(--grey-500)" }}>· {list.length} patient{list.length === 1 ? "" : "s"}</span></h2>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left text-xs" style={{ color: "var(--grey-500)" }}>
              <th className="py-1.5 pr-3 border-b w-20">Time</th><th className="pr-3 border-b">Patient</th>{showPhone && <th className="pr-3 border-b">Phone</th>}<th className="pr-3 border-b w-24">Status</th><th className="border-b w-32">Notes</th>
            </tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} style={{ color: "var(--navy)" }}>
                  <td className="py-2 pr-3 border-b font-semibold">{clock(b.slotTime)}</td>
                  <td className="pr-3 border-b">{b.guestName}</td>
                  {showPhone && <td className="pr-3 border-b">{b.guestPhone}</td>}
                  <td className="pr-3 border-b text-xs">{b.checkedInAt ? "Arrived" : b.status.replace("_", " ")}</td>
                  <td className="border-b">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

export default function PrintDayPage() {
  return (
    <PortalShell audience="staff" title={<>Day <em className="italic" style={{ color: "var(--teal)" }}>list</em></>} subtitle="Print for the clinic door or the doctor's desk">
      <Suspense fallback={<Spinner />}><Sheet /></Suspense>
    </PortalShell>
  );
}
