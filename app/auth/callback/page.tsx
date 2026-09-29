"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { authApi } from "@/lib/api";

export default function AuthCallback() {
  const router  = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/login"); return; }

    const redirect = async () => {
      try {
        const token = await getToken();
        if (token) localStorage.setItem("accessToken", token);

        const { data } = await authApi.me();
        const user = data.data;

        // Check if profile is complete
        if (!user.phone || user.phone.startsWith("clerk-")) {
          router.push("/complete-profile");
          return;
        }

        // Redirect based on role
        if (user.role === "patient") {
          router.push("/patient/dashboard");
        } else {
          router.push("/staff/dashboard");
        }
      } catch {
        // User not in DB yet — webhook hasn't fired
        router.push("/complete-profile");
      }
    };

    redirect();
  }, [isLoaded, isSignedIn, getToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }}/>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Setting up your account...</p>
      </div>
    </div>
  );
}