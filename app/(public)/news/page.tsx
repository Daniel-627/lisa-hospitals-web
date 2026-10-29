import Link from "next/link";
import type { Metadata } from "next";
import { PageHero, Section, Unavailable } from "@/components/public";
import { apiGet } from "@/lib/serverApi";
import { fmtDate } from "@/lib/format";
import { Icon, Back, Next } from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, graph, pageMeta } from "@/lib/seo";
import { fit } from "@/lib/images";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const n = Math.max(1, parseInt((await searchParams).page ?? "1", 10) || 1);
  return pageMeta({
    title: n > 1 ? `News and Health Tips, page ${n}` : "News and Health Tips",
    description: "Health tips, advice and news from Lisa Hospitals, Kisumu: practical guidance for you and your family from our doctors and nurses.",
    path: n > 1 ? `/news?page=${n}` : "/news",
  });
}

const PAGE = 12;
type Props = { searchParams: Promise<{ page?: string }> };

export default async function NewsPage({ searchParams }: Props) {
  const page = Math.max(parseInt((await searchParams).page ?? "1", 10) || 1, 1);
  const { data } = await apiGet<any[]>(`/api/news?limit=${PAGE}&offset=${(page - 1) * PAGE}`, 60);
  const hasMore = (data?.length ?? 0) === PAGE;

  return (
    <>
      <JsonLd data={graph(breadcrumbJsonLd([{ name: "News", path: "/news" }]))} />
      <PageHero eyebrow="Stay informed" title="News &" accent="Health Tips" subtitle="Updates from the hospital and practical advice for you and your family." />
      <Section>
        {data === null ? <Unavailable what="the latest articles" /> : data.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "var(--grey-500)" }}>{page > 1 ? "No more articles." : "No articles yet — check back soon."}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((p) => (
              <Link key={p.id} href={`/news/${p.slug}`} className="block rounded-xl border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fit(p.coverImage, 600)} alt="" loading="lazy" className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 flex items-center justify-center text-4xl" style={{ background: "var(--teal-light)", color: "var(--teal)" }} aria-hidden><Icon name="news" /></div>
                )}
                <div className="p-5">
                  <div className="text-xs mb-2" style={{ color: "var(--grey-400)" }}>{fmtDate(p.publishedAt, { day: "numeric", month: "long", year: "numeric" })}</div>
                  <h2 className="text-base font-semibold mb-2 leading-snug" style={{ color: "var(--navy)" }}>{p.title}</h2>
                  {p.excerpt && <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--grey-500)" }}>{p.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {(page > 1 || hasMore) && (
          <div className="flex justify-between mt-10">
            {page > 1 ? <Link href={`/news?page=${page - 1}`} className="text-sm font-semibold" style={{ color: "var(--teal)" }}><Back />Newer</Link> : <span />}
            {hasMore && <Link href={`/news?page=${page + 1}`} className="text-sm font-semibold" style={{ color: "var(--teal)" }}>Older<Next /></Link>}
          </div>
        )}
      </Section>
    </>
  );
}
