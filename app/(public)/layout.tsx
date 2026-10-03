import type { ReactNode } from "react";

// The nav, emergency bar and footer now come from the ROOT layout (see components/SiteChrome.tsx).
export default function PublicGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
