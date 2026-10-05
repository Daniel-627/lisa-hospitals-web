"use client";

import PortalShell from "@/components/PortalShell";
import NewsForm from "@/components/NewsForm";

export default function NewArticlePage() {
  return (
    <PortalShell audience="admin" title={<>New <em className="italic" style={{ color: "var(--teal)" }}>Article</em></>}>
      <NewsForm />
    </PortalShell>
  );
}
