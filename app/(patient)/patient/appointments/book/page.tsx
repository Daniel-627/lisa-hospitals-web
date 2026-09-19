"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { departmentsApi, appointmentsApi } from "@/lib/api";

export default function BookAppointmentPage() {
  const router = useRouter();
  const [step, setStep]               = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  const [form, setForm] = useState({
    departmentId:    "",
    departmentName:  "",
    appointmentDate: "",
    appointmentTime: "",
    reason:          "",
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await departmentsApi.getAll();
        setDepartments(data.data);
      } catch {
        setError("Failed to load departments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await appointmentsApi.create({
        departmentId:    form.departmentId,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        reason:          form.reason,
      });
      router.push("/patient/dashboard?booked=true");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
    "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
  ];

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--white)" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16" style={{ background: "var(--navy)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--teal)" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="1" width="4" height="18" rx="2" fill="white"/>
              <rect x="1" y="8" width="18" height="4" rx="2" fill="white"/>
            </svg>
          </div>
          <span className="text-white font-bold text-sm">Lisa Hospitals</span>
        </div>
        <Link href="/patient/dashboard" className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          ← Back to dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-normal mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          Book an <em className="italic" style={{ color: "var(--teal)" }}>Appointment</em>
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--grey-500)" }}>
          Complete the steps below to book your appointment.
        </p>

        {/* STEPS */}
        <div className="flex items-center gap-2 mb-10">
          {["Select Department", "Pick Date & Time", "Confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  background: step > i + 1 ? "var(--teal)" : step === i + 1 ? "var(--navy)" : "var(--grey-200)",
                  color:      step >= i + 1 ? "white" : "var(--grey-400)",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-xs font-medium hidden md:block" style={{ color: step === i + 1 ? "var(--navy)" : "var(--grey-400)" }}>
                  {s}
                </span>
              </div>
              {i < 2 && <div className="w-8 h-px" style={{ background: "var(--grey-200)" }}/>}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "#fde8e8", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {/* STEP 1 — DEPARTMENT */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--navy)" }}>Select a Department</h2>
            {loading ? (
              <p className="text-sm" style={{ color: "var(--grey-500)" }}>Loading departments...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      setForm({ ...form, departmentId: dept.id, departmentName: dept.name });
                      setStep(2);
                    }}
                    className="p-4 rounded-xl border text-left transition-all hover:shadow-md"
                    style={{
                      borderColor: form.departmentId === dept.id ? "var(--teal)" : "var(--grey-200)",
                      background:  form.departmentId === dept.id ? "var(--teal-light)" : "white",
                    }}
                  >
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

        {/* STEP 2 — DATE & TIME */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--navy)" }}>Pick Date & Time</h2>
            <p className="text-sm mb-6" style={{ color: "var(--grey-500)" }}>Department: <strong>{form.departmentName}</strong></p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--navy)" }}>Date</label>
              <input
                type="date"
                min={today}
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--navy)" }}>Time</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, appointmentTime: t })}
                    className="py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background:  form.appointmentTime === t ? "var(--navy)" : "var(--grey-100)",
                      color:       form.appointmentTime === t ? "white" : "var(--navy)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--navy)" }}>
                Reason for visit <span style={{ color: "var(--grey-400)" }}>(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none"
                style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}
                placeholder="Describe your symptoms or reason for visit..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>
                Back
              </button>
              <button
                onClick={() => {
                  if (!form.appointmentDate || !form.appointmentTime) {
                    setError("Please select a date and time");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
                className="flex-1 py-3 rounded-lg text-sm font-semibold text-white"
                style={{ background: "var(--teal)" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — CONFIRM */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--navy)" }}>Confirm Appointment</h2>

            <div className="p-6 rounded-xl border mb-6" style={{ borderColor: "var(--grey-200)", background: "white" }}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--grey-500)" }}>Department</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{form.departmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--grey-500)" }}>Date</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                    {new Date(form.appointmentDate).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--grey-500)" }}>Time</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{form.appointmentTime}</span>
                </div>
                {form.reason && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "var(--grey-500)" }}>Reason</span>
                    <span className="text-sm font-semibold max-w-xs text-right" style={{ color: "var(--navy)" }}>{form.reason}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg mb-6 text-sm" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>
              ℹ️ You will receive an SMS confirmation on your registered phone number.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-lg text-sm font-semibold text-white"
                style={{ background: submitting ? "var(--teal-dark)" : "var(--teal)" }}
              >
                {submitting ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
