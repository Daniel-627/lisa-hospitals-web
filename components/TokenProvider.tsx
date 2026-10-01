"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { registerTokenGetter } from "@/lib/tokenStore";

export default function TokenProvider() {
  const { getToken } = useAuth();
  useEffect(() => {
    registerTokenGetter((opts) => getToken(opts));
    return () => registerTokenGetter(null);
  }, [getToken]);
  return null;
}
