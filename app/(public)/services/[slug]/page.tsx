import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge24, PageHero, Section } from "@/components/public";
import DoctorCard from "@/components/DoctorCard";
import { apiGet } from "@/lib/serverApi";
import { DEPARTMENTS, deptMeta, toApiSlug, toUrlSlug } from "@/lib/departments";
import { BOOK_URL, HOSPITAL } from "@/lib/hospital";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DEPARTMENTS.map((d) => ({ slug: toUrlSlug(d.slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const meta = deptMeta(toApiSlug((await params).slug));
  return meta ? { title: `${meta.name} — Lisa Hospitals`, description: meta.blurb } : { title: "Service not found" };
}

export default async function ServicePage({ params }: Props) {
  const apiSlug = toApiSlug((await params).slug);
  const meta = deptMeta(apiSlug);
  if (!meta) notFound();

  const [dept, docs] = await Promise.all([
    apiGet<any>(`/api/departments/${apiSlug}`),
    apiGet<any[]>(`/api/departments/${apiSlug}/doctors`),
  ]);
  const d = dept.data;
  const doctors = (docs.data ?? []).filter((x) => x.isAvailable !== false);
  const is24 = d?.isOpen24hrs ?? meta.is24;
  const bookHref = d?.id ? `${BOOK_URL}?department=${d.id}` : BOOK_URL;

  return (
    <>
      <PageHero eyebrow={`${meta.icon}  Department`} title={d?.name ?? meta.name} subtitle={meta.short} />
      <Section>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-normal mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>About this service</h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--grey-500)" }}>{d?.description || meta.blurb}</p>

            <div className="p-5 rounded-xl" style={{ background: "var(--teal-light)" }}>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--teal-dark)" }}>We accept</div>
              <div className="text-sm" style={{ color: "var(--navy)" }}>{HOSPITAL.insurers.join(" · ")} — direct facility, no referrals needed.</div>
            </div>
          </div>

          <aside className="p-6 rounded-xl border h-fit" style={{ borderColor: "var(--grey-200)", background: "white" }}>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--grey-400)" }}>Hours</div>
                <div className="font-medium" style={{ color: "var(--navy)" }}>
                  {is24 ? <>Open 24 hours <Badge24 /></> : <>Call us to confirm today&apos;s hours</>}
                </div>
              </div>
              {d?.floor && <div><div className="text-xs mb-1" style={{ color: "var(--grey-400)" }}>Location</div><div className="font-medium" style={{ color: "var(--navy)" }}>{d.floor}</div></div>}
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--grey-400)" }}>Phone</div>
                <a href={`tel:${(d?.phone || HOSPITAL.phoneTel).replace(/\s/g, "")}`} className="font-medium" style={{ color: "var(--navy)" }}>{d?.phone || HOSPITAL.phoneDisplay}</a>
              </div>
            </div>
            <Link href={bookHref} className="mt-6 block text-center py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>Book an appointment</Link>
          </aside>
        </div>

        {doctors.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-normal mb-5" style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Our doctors in {meta.name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((x) => <DoctorCard key={x.id} d={x} />)}
            </div>
          </div>
        )}

        <div className="mt-10"><Link href="/services" className="text-sm font-semibold" style={{ color: "var(--teal)" }}>← All services</Link></div>
      </Section>
    </>
  );
}
