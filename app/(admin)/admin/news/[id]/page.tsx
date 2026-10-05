"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import NewsForm from "@/components/NewsForm";
import { ErrorBox, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

function Editor() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi.newsGet(id)
      .then(({ data }) => { if (!cancelled) setArticle(data.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.status === 404 ? "Article not found." : errMsg(err, "Couldn't load the article.")); });
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <><Link href="/admin/news" className="text-sm" style={{ color: "var(--teal)" }}>← All articles</Link><div className="mt-4"><ErrorBox>{error}</ErrorBox></div></>;
  if (!article) return <Spinner label="Loading article..." />;
  return <NewsForm article={article} />;
}

export default function EditArticlePage() {
  return (
    <PortalShell audience="admin" title={<>Edit <em className="italic" style={{ color: "var(--teal)" }}>Article</em></>}>
      <Editor />
    </PortalShell>
  );
}
