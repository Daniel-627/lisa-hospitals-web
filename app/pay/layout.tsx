import type { ReactNode } from "react";
import type { Metadata } from "next";
import { PRIVATE_META } from "@/lib/seo";

// Signed-in and payment pages are never indexed, by search engines or AI crawlers.
export const metadata: Metadata = { title: "Payment", ...PRIVATE_META };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
