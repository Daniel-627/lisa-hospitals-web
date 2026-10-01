"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/lib/api";

/** 0712345678 / 712 345 678 / +254712345678 → +254712345678, or null if invalid. */
const normalizePhone = (raw: string): string | null => {
  const d = raw.replace(/[\s\-()]/g, "").replace(/^\+?254/, "").replace(/^0/, "");
  return /^[17]\d{8}$/.test(d) ? `+254${d}` : null;
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  // Only what the user types is stored. Clerk's name is shown until they edit it (derived — no effect needed).
  const [edits, setEdits] = useState<{ phone?: string; firstName?: string; lastName?: string }>({});
  const form = {
    phone: edits.phone ?? "",
    firstName: edits.firstName ?? user?.firstName ?? "",
    lastName: edits.lastName ?? user?.lastName ?? "",
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) router.replace("/login");
  }, [isLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const phone = normalizePhone(form.phone);
    if (!phone) {
      setError("Enter a valid Kenyan mobile number, e.g. 712 345 678");
      return;
    }

    setLoading(true);
    try {
      // The axios interceptor attaches a fresh Clerk token automatically.
      await api.post("/api/auth/complete-profile", {
        phone,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      router.push("/auth/callback");
    } catch (err: any) {
      if (err.response?.status === 401) { setError("The server couldn't verify your session. Please sign out and sign in again."); return; }
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
              <rect x="8" y="1" width="4" height="18" rx="2" fill="white" />
              <rect x="1" y="8" width="18" height="4" rx="2" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>
            Complete Your Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--grey-500)" }}>Just a few more details to get started</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fde8e8", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>First name</label>
              <input id="firstName" type="text" required value={form.firstName}
                onChange={(e) => setEdits({ ...edits, firstName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--grey-200)" }} />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>Last name</label>
              <input id="lastName" type="text" required value={form.lastName}
                onChange={(e) => setEdits({ ...edits, lastName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--grey-200)" }} />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>
              Phone number <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <div className="flex">
              <span className="px-3 py-3 rounded-l-lg border border-r-0 text-sm font-medium"
                style={{ borderColor: "var(--grey-200)", background: "var(--grey-100)", color: "var(--navy)" }}>
                +254
              </span>
              <input id="phone" type="tel" required inputMode="tel" autoComplete="tel-national"
                value={form.phone} onChange={(e) => setEdits({ ...edits, phone: e.target.value })}
                className="flex-1 px-4 py-3 rounded-r-lg border text-sm outline-none"
                style={{ borderColor: "var(--grey-200)" }} placeholder="7XX XXX XXX" />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--grey-400)" }}>
              We&apos;ll send appointment confirmations to this number
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-70"
            style={{ background: loading ? "var(--teal-dark)" : "var(--teal)" }}>
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}