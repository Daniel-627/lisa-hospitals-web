"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function RegisterPage() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm]       = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await authApi.register(form);
      localStorage.setItem("accessToken",  data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      setUser(data.data.user);
      router.push("/patient/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ background: "var(--navy)" }}>
      <div className="w-full max-w-md p-8 rounded-xl" style={{ background: "white" }}>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: "var(--teal)" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="1" width="4" height="18" rx="2" fill="white"/>
              <rect x="1" y="8" width="18" height="4" rx="2" fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>
            Lisa Hospitals
          </h1>
        </div>

        <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--navy)" }}>
          Create your account
        </h2>

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
                placeholder="John"
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
                placeholder="Otieno"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>Email address</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--grey-200)" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>Phone number</label>
            <input
              type="tel" required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--grey-200)" }}
              placeholder="0712 345 678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>Password</label>
            <input
              type="password" required minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--grey-200)" }}
              placeholder="Min. 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm"
            style={{ background: loading ? "var(--teal-dark)" : "var(--teal)" }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--grey-500)" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--teal)" }} className="font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}