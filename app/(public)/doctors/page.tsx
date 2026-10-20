import type { Metadata } from "next";
import { PageHero, Section, Unavailable } from "@/components/public";
import DoctorsBrowser from "@/components/DoctorsBrowser";
import { apiGet } from "@/lib/serverApi";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, graph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Doctors and Specialists in Kisumu",
  description: "Meet the doctors and specialists at Lisa Hospitals, Nairobi Highway, Kisumu. See each doctor's department and speciality, and book an appointment online.",
  path: "/doctors",
});
export const revalidate = 60;

export default async function DoctorsPage() {
  const { data } = await apiGet<any[]>("/api/doctors");

  return (
    <>
      <JsonLd data={graph(breadcrumbJsonLd([{ name: "Doctors", path: "/doctors" }]))} />
      <PageHero eyebrow="Our team" title="Meet Our" accent="Doctors" subtitle="Experienced doctors and specialists, ready to care for you and your family." />
      <Section>
        {data === null ? <Unavailable what="our doctors" /> : data.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "var(--grey-500)" }}>Our doctor profiles are being added. Please check back soon, or call us to book.</p>
        ) : <DoctorsBrowser doctors={data} />}
      </Section>
    </>
  );
}
