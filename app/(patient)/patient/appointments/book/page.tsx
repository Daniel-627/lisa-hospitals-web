"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import PortalShell from "@/components/PortalShell";
import { departmentsApi, appointmentsApi, doctorsApi } from "@/lib/api";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function BookForm() {
  const router = useRouter();
  const search = useSearchParams();
  const preDept = search.get("department") ?? "";
  const preDoctor = search.get("doctor") ?? "";
  const { isLoaded, isSignedIn } = useAuth();
  const [step, setStep] = useState(preDept ? 2 : 1); // arriving from a department/doctor page skips step 1
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [doctor, setDoctor] = useState<any>(null);

  // Arriving from a doctor's profile (?doctor=…): load their name for display.
  useEffect(() => {
    if (!preDoctor) return;
    let cancelled = false;
    doctorsApi.getById(preDoctor)
      .then(({ data }) => { if (!cancelled) setDoctor(data.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [preDoctor]);

  const [form, setForm] = useState({
    departmentId: preDept, departmentName: "", doctorId: preDoctor, appointmentDate: "", appointmentTime: "", reason: "",
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/login"); return; }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await departmentsApi.getAll();
        if (!cancelled) setDepartments(data.data);
      } catch {
        if (!cancelled) setError("Failed to load departments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router]);

  // Local (browser) date — toISOString() is UTC and shows "yesterday" for early-morning users in Kenya.
  const today = toLocalISODate(new Date());

  // Hide slots that have already passed when booking for today.
  const availableSlots = useMemo(() => {
    if (form.appointmentDate !== today) return TIME_SLOTS;
    const now = new Date();
    const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return TIME_SLOTS.filter((t) => t > current);
  }, [form.appointmentDate, today]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await appointmentsApi.create({
        departmentId: form.departmentId,
        doctorId: form.doctorId || undefined,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        reason: form.reason.trim() || undefined,
      });
      router.push("/patient/dashboard?booked=true");
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) { router.replace("/login"); return; }
      if (status === 409) setStep(2); // slot clash → let them pick another time
      setError(err.response?.data?.error || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const goToConfirm = () => {
    if (!form.appointmentDate || !form.appointmentTime) { setError("Please select a date and time"); return; }
    if (!availableSlots.includes(form.appointmentTime)) { setError("That time has already passed — pick another"); return; }
    setError("");
    setStep(3);
  };

  const deptName = form.departmentName || departments.find((d) => d.id === form.departmentId)?.name || "";
  const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "";

  if (!isLoaded) return null;

  return (
    <PortalShell
      audience="patient"
      title={<>Book an <em className="italic" style={{ color: "var(--teal)" }}>Appointment</em></>}
      subtitle="Complete the steps below to book your appointment."
    >
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-10">
          {["Select Department", "Pick Date & Time", "Confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  background: step > i + 1 ? "var(--teal)" : step === i + 1 ? "var(--navy)" : "var(--grey-200)",
                  color: step >= i + 1 ? "white" : "var(--grey-400)",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-xs font-medium hidden md:block" style={{ color: step === i + 1 ? "var(--navy)" : "var(--grey-400)" }}>{s}</span>
              </div>
              {i < 2 && <div className="w-8 h-px" style={{ background: "var(--grey-200)" }} />}
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-6 p-3 rounded-lg text-sm" style={{ background: "#fde8e8", color: "var(--danger)" }}>{error}</div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--navy)" }}>Select a Department</h2>
            {loading ? (
              <p className="text-sm" style={{ color: "var(--grey-500)" }}>Loading departments...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept) => (
                  <button key={dept.id}
                    onClick={() => { setForm({ ...form, departmentId: dept.id, departmentName: dept.name, doctorId: dept.id === form.departmentId ? form.doctorId : "" }); setError(""); setStep(2); }}
                    className="p-4 rounded-xl border text-left transition-all hover:shadow-md"
                    style={{
                      borderColor: form.departmentId === dept.id ? "var(--teal)" : "var(--grey-200)",
                      background: form.departmentId === dept.id ? "var(--teal-light)" : "white",
                    }}>
                    <div className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>{dept.name}</div>
                    {dept.isOpen24hrs && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fde8e8", color: "var(--danger)" }}>24HR</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--navy)" }}>Pick Date & Time</h2>
            <p className="text-sm mb-6" style={{ color: "var(--grey-500)" }}>Department: <strong>{deptName}</strong>{doctorName && <> · Doctor: <strong>{doctorName}</strong></>}</p>

            <div className="mb-6">
              <label htmlFor="date" className="block text-sm font-medium mb-2" style={{ color: "var(--navy)" }}>Date</label>
              <input id="date" type="date" min={today} value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value, appointmentTime: "" })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }} />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--navy)" }}>Time</label>
              {form.appointmentDate && availableSlots.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--grey-500)" }}>No slots left today — please choose another date.</p>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((t) => (
                    <button key={t} type="button" aria-pressed={form.appointmentTime === t}
                      onClick={() => setForm({ ...form, appointmentTime: t })}
                      className="py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: form.appointmentTime === t ? "var(--navy)" : "var(--grey-100)",
                        color: form.appointmentTime === t ? "white" : "var(--navy)",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-8">
              <label htmlFor="reason" className="block text-sm font-medium mb-2" style={{ color: "var(--navy)" }}>
                Reason for visit <span style={{ color: "var(--grey-400)" }}>(optional)</span>
              </label>
              <textarea id="reason" rows={3} maxLength={1000} value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none"
                style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}
                placeholder="Describe your symptoms or reason for visit..." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setError(""); setStep(1); }} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Back</button>
              <button onClick={goToConfirm} className="flex-1 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--navy)" }}>Confirm Appointment</h2>

            <div className="p-6 rounded-xl border mb-6" style={{ borderColor: "var(--grey-200)", background: "white" }}>
              <div className="space-y-4">
                <Row label="Department" value={deptName} />
                {doctorName && <Row label="Doctor" value={doctorName} />}
                <Row label="Date" value={new Date(`${form.appointmentDate}T00:00:00`).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
                <Row label="Time" value={form.appointmentTime} />
                {form.reason && <Row label="Reason" value={form.reason} />}
              </div>
            </div>

            <div className="p-4 rounded-lg mb-6 text-sm" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>
              ℹ️ You will receive an SMS confirmation on your registered phone number.
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setError(""); setStep(2); }} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Back</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70"
                style={{ background: submitting ? "var(--teal-dark)" : "var(--teal)" }}>
                {submitting ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm" style={{ color: "var(--grey-500)" }}>{label}</span>
      <span className="text-sm font-semibold max-w-xs text-right" style={{ color: "var(--navy)" }}>{value}</span>
    </div>
  );
}

export default function BookAppointmentPage() {
  // useSearchParams needs a Suspense boundary for production builds
  return <Suspense fallback={null}><BookForm /></Suspense>;
}
