import type { ReactNode } from "react";
import JsonLd from "@/components/JsonLd";
import { graph, hospitalJsonLd, websiteJsonLd } from "@/lib/seo";

// The nav, emergency bar and footer come from the ROOT layout (see components/SiteChrome.tsx).
// Every public page also carries the hospital's details as structured data, so search engines and AI assistants
// can read the name, address, phone, 24-hour opening and departments without guessing.
export default function PublicGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={graph(hospitalJsonLd(), websiteJsonLd())} />
      {children}
    </>
  );
}
