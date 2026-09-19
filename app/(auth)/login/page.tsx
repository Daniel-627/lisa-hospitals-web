"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

export default function LoginPage() {
  const router   = useRouter();
  const setUser  = useAuthStore((s) => s.setUser);
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await authApi.login(form);
      localStorage.setItem("accessToken",  data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      setUser(data.data.user);

      const role = data.data.user.role;
      if (role === "patient") {
        router.push("/patient/dashboard");
      } else {
        router.push("/staff/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
      <div className="w-full max-w-md p-8 rounded-xl" style={{ background: "white" }}>
        
        {/* Logo */}
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
          <p className="text-sm mt-1" style={{ color: "var(--grey-500)" }}>
            Your Health, Our Priority
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--navy)" }}>
          Sign in to your account
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fde8e8", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>
              Email address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
              style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--navy)" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--grey-200)", color: "var(--navy)" }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all"
            style={{ background: loading ? "var(--teal-dark)" : "var(--teal)" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--grey-500)" }}>
          Don&apos;t have an account?{" "}
          <a href="/register" style={{ color: "var(--teal)" }} className="font-medium">
            Register here
          </a>
        </p>

        <div className="mt-6 pt-6 border-t text-center">
          <Link href="/" className="text-sm" style={{ color: "var(--grey-400)" }}>
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
