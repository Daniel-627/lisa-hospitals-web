"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { api } from "@/lib/api";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [form, setForm]       = useState({ phone: "", firstName: user?.firstName || "", lastName: user?.lastName || "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    // Get and store token FIRST
    const token = await getToken();
    if (!token) {
      setError("Session expired — please sign in again");
      router.push("/login");
      return;
    }
    localStorage.setItem("accessToken", token);

    // Small delay to ensure token is stored
    await new Promise(r => setTimeout(r, 100));

    await api.post("/api/auth/complete-profile", {
      phone:     form.phone.startsWith("+254") ? form.phone : `+254${form.phone}`,
      firstName: form.firstName,
      lastName:  form.lastName,
    });

    router.push("/auth/callback");
  } catch (err: any) {
    console.error("Complete profile error:", err.response?.data || err.message);
    setError(err.response?.data?.error || "Something went wrong — please try again");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
      <div className="w-full max-w-md p-8 rounded-xl" style={{ background: "white" }}>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: "var(--teal)" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="1" width="4" height="18" rx="2" fill="white"/>
              <rect x="1" y="8" width="18" height="4" rx="2" fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>
            Complete Your Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--grey-500)" }}>
            Just a few more details to get started
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fde8e8", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>First name</label>
              <input
                type="text" required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--grey-200)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>Last name</label>
              <input
                type="text" required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--grey-200)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>
              Phone number <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <div className="flex">
              <span className="px-3 py-3 rounded-l-lg border border-r-0 text-sm font-medium" style={{ borderColor: "var(--grey-200)", background: "var(--grey-100)", color: "var(--navy)" }}>
                +254
              </span>
              <input
                type="tel" required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="flex-1 px-4 py-3 rounded-r-lg border text-sm outline-none"
                style={{ borderColor: "var(--grey-200)" }}
                placeholder="7XX XXX XXX"
              />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>
              We&apos;ll send appointment confirmations to this number
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm"
            style={{ background: loading ? "var(--teal-dark)" : "var(--teal)" }}
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}