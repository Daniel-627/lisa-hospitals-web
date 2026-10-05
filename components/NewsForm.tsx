"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, ErrorBox, Field, inputCls, inputStyle } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

// Used for both "new article" (no `article`) and "edit article".
export default function NewsForm({ article }: { article?: any }) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [cover, setCover] = useState(article?.coverImage ?? "");
  const [published, setPublished] = useState(article?.isPublished ?? false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (title.trim().length < 3) return setError("Enter a title.");
    if (!body.trim()) return setError("Write the article text.");
    if (cover.trim() && !cover.trim().startsWith("https://")) return setError("The cover image link must start with https://");
    if (slug.trim() && !/^[a-z0-9][a-z0-9-]*$/.test(slug.trim())) return setError("Web address can only use lowercase letters, numbers and hyphens.");

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || null,
      body: body.trim(),
      coverImage: cover.trim() || null,
      isPublished: published,
    };
    setSaving(true);
    try {
      if (article) await adminApi.newsUpdate(article.id, payload);
      else await adminApi.newsCreate(payload);
      router.push("/admin/news");
    } catch (err) {
      setError(errMsg(err, "Couldn't save the article."));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this article permanently?")) return;
    setDeleting(true);
    setError("");
    try {
      await adminApi.newsDelete(article.id);
      router.push("/admin/news");
    } catch (err) {
      setError(errMsg(err, "Couldn't delete the article."));
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      {error && <ErrorBox>{error}</ErrorBox>}
      <Card className="space-y-5">
        <Field label="Title" htmlFor="n-title"><input id="n-title" value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} className={inputCls} style={inputStyle} /></Field>
        <Field label="Short summary" htmlFor="n-excerpt" hint="Shown on the news list. Optional."><textarea id="n-excerpt" rows={2} value={excerpt} maxLength={500} onChange={(e) => setExcerpt(e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} /></Field>
        <Field label="Article text" htmlFor="n-body" hint="Plain text. Leave a blank line between paragraphs.">
          <textarea id="n-body" rows={14} value={body} maxLength={50000} onChange={(e) => setBody(e.target.value)} className={inputCls} style={inputStyle} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Cover image link (https)" htmlFor="n-cover" hint="Optional."><input id="n-cover" type="url" value={cover} maxLength={500} onChange={(e) => setCover(e.target.value)} className={inputCls} style={inputStyle} placeholder="https://…" /></Field>
          <Field label="Web address" htmlFor="n-slug" hint={article ? "Changing this breaks old links." : "Leave blank to create it from the title."}>
            <input id="n-slug" value={slug} maxLength={300} onChange={(e) => setSlug(e.target.value)} className={inputCls} style={inputStyle} placeholder="my-article-title" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--navy)" }}>
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published (visible on the website)
        </label>
      </Card>

      <div className="flex gap-3 flex-wrap items-center">
        <button type="submit" disabled={saving || deleting} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: saving ? "var(--teal-dark)" : "var(--teal)" }}>
          {saving ? "Saving..." : published ? "Save & publish" : "Save draft"}
        </button>
        <button type="button" onClick={() => router.push("/admin/news")} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>Cancel</button>
        {article && (
          <button type="button" onClick={remove} disabled={saving || deleting} className="ml-auto px-5 py-3 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "#fde8e8", color: "var(--danger)" }}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </form>
  );
}
