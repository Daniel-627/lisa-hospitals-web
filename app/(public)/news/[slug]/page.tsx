import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, Unavailable } from "@/components/public";
import { apiGet } from "@/lib/serverApi";
import { fmtDate } from "@/lib/format";
import { Back } from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, graph, pageMeta, summarize } from "@/lib/seo";
import { fit } from "@/lib/images";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await apiGet<any>(`/api/news/${encodeURIComponent(slug)}`, 60);
  return data
    ? pageMeta({ title: data.title, description: summarize(data.excerpt || data.body), path: `/news/${slug}`, type: "article", image: data.coverImage || undefined, publishedTime: data.publishedAt || undefined })
    : { title: "Article", robots: { index: false } };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { data, status } = await apiGet<any>(`/api/news/${encodeURIComponent(slug)}`, 60);
  if (status === 404) notFound();
  if (!data) return <Section narrow><Unavailable what="this article" /></Section>;

  // Posts are plain text: blank lines separate paragraphs. React escapes everything, so no HTML is ever injected.
  const paragraphs = String(data.body).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <article>
      <JsonLd data={graph(
        articleJsonLd({ slug, title: data.title, description: summarize(data.excerpt || data.body), image: data.coverImage, publishedAt: data.publishedAt, updatedAt: data.updatedAt }),
        breadcrumbJsonLd([{ name: "News", path: "/news" }, { name: data.title, path: `/news/${slug}` }]),
      )} />
      <div className="px-6 pt-12 pb-8 text-center" style={{ background: "var(--navy)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#5cdde0" }}>
            {fmtDate(data.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <h1 className="text-3xl md:text-4xl font-normal text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>{data.title}</h1>
        </div>
      </div>

      <Section narrow>
        {data.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fit(data.coverImage, 1200)} alt="" className="w-full max-h-96 object-cover rounded-xl mb-8" />
        )}
        <div className="space-y-5">
          {paragraphs.map((p, i) => <p key={i} className="text-base leading-relaxed whitespace-pre-line" style={{ color: "var(--navy)" }}>{p}</p>)}
        </div>
        <div className="mt-12"><Link href="/news" className="text-sm font-semibold" style={{ color: "var(--teal)" }}><Back />All articles</Link></div>
      </Section>
    </article>
  );
}
