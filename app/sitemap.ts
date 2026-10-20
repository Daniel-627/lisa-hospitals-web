import type { MetadataRoute } from "next";
import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";
import { apiGet } from "@/lib/serverApi";
import { abs } from "@/lib/site";

export const revalidate = 3600;

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/doctors", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/news", priority: 0.6, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [doctors, ...newsPages] = await Promise.all([
    apiGet<any[]>("/api/doctors", 3600),
    ...[0, 1, 2, 3].map((i) => apiGet<any[]>(`/api/news?limit=50&offset=${i * 50}`, 3600)), // up to 200 articles
  ]);

  return [
    ...STATIC.map((s) => ({ url: abs(s.path), changeFrequency: s.changeFrequency, priority: s.priority })),
    ...DEPARTMENTS.map((d) => ({ url: abs(`/services/${toUrlSlug(d.slug)}`), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...(doctors.data ?? []).map((d) => ({ url: abs(`/doctors/${d.id}`), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...newsPages.flatMap((p) => p.data ?? []).map((n) => ({
      url: abs(`/news/${n.slug}`), lastModified: n.publishedAt ? new Date(n.publishedAt) : undefined, changeFrequency: "yearly" as const, priority: 0.5,
    })),
  ];
}
