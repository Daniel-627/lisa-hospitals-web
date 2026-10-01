"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { authApi } from "@/lib/api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AuthCallback() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const run = useCallback(async (isCancelled: () => boolean) => {
    try {
      // The webhook that creates our DB row may lag a moment behind sign-up: retry 404s briefly.
      let user: any = null;
      for (let i = 0; i < 4 && !user; i++) {
        try {
          const { data } = await authApi.me();
          user = data.data;
        } catch (err: any) {
          if (err.response?.status !== 404) throw err;
          await sleep(750);
          if (isCancelled()) return;
        }
      }
      if (isCancelled()) return;

      // Still no row (or placeholder phone) → the user needs to complete their profile.
      if (!user || !user.phone || user.phone.startsWith("clerk-")) {
        router.replace("/complete-profile");
        return;
      }
      router.replace(user.role === "patient" ? "/patient/dashboard" : "/staff/dashboard");
    } catch (err: any) {
      if (isCancelled()) return;
      if (err.response?.status === 401) { router.replace("/login"); return; }
      // Network / server problem: don't bounce the user into the wrong flow — let them retry.
      setError("We couldn't load your account. Please check your connection and try again.");
    }
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/login"); return; }
    let cancelled = false;
    run(() => cancelled);
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router, run, attempt]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
      <div className="text-center px-6">
        {error ? (
          <>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>{error}</p>
            <button onClick={() => { setError(""); setAttempt((n) => n + 1); }}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-3"
              style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Setting up your account...</p>
          </>
        )}
      </div>
    </div>
  );
}
