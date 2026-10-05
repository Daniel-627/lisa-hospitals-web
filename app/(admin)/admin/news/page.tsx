"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Pill, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { errMsg, fmtDate } from "@/lib/format";

function NewsList() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi.newsList({ limit: 100 })
      .then(({ data }) => { if (!cancelled) setRows(data.data); })
      .catch((err) => { if (!cancelled) { setRows([]); setError(errMsg(err, "Couldn't load articles.")); } });
    return () => { cancelled = true; };
  }, []);

  const remove = async (p: any) => {
    if (!window.confirm(`Delete "${p.title}" permanently?`)) return;
    setBusyId(p.id);
    setError("");
    try {
      await adminApi.newsDelete(p.id);
      setRows((r) => r && r.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(errMsg(err, "Couldn't delete that article."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="mb-6"><Link href="/admin/news/new" className="inline-block px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>+ New article</Link></div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!rows ? <Spinner label="Loading articles..." /> : rows.length === 0 && !error ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>No articles yet. Write the first one.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((p) => (
            <Card key={p.id} className="!p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{p.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--grey-400)" }}>
                  {p.isPublished ? `Published ${fmtDate(String(p.publishedAt).slice(0, 10))}` : `Edited ${fmtDate(String(p.updatedAt).slice(0, 10))}`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.isPublished ? <Pill tone="ok">Published</Pill> : <Pill tone="warn">Draft</Pill>}
                {p.isPublished && <Link href={`/news/${p.slug}`} target="_blank" className="px-3 py-2 text-xs font-semibold" style={{ color: "var(--teal)" }}>View</Link>}
                <Link href={`/admin/news/${p.id}`} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>Edit</Link>
                <button onClick={() => remove(p)} disabled={busyId === p.id} className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "#fde8e8", color: "var(--danger)" }}>Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminNewsPage() {
  return (
    <PortalShell audience="admin" title={<>News &amp; <em className="italic" style={{ color: "var(--teal)" }}>Articles</em></>} subtitle="Write and publish articles for the website">
      <NewsList />
    </PortalShell>
  );
}
