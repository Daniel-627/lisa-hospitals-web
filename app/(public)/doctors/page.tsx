import type { Metadata } from "next";
import { PageHero, Section, Unavailable } from "@/components/public";
import DoctorsBrowser from "@/components/DoctorsBrowser";
import { apiGet } from "@/lib/serverApi";

export const metadata: Metadata = {
  title: "Our Doctors — Lisa Hospitals",
  description: "Meet the doctors and specialists at Lisa Hospitals in Kisumu.",
};
export const revalidate = 300;

export default async function DoctorsPage() {
  const { data } = await apiGet<any[]>("/api/doctors");

  return (
    <>
      <PageHero eyebrow="Our team" title="Meet Our" accent="Doctors" subtitle="Experienced doctors and specialists, ready to care for you and your family." />
      <Section>
        {data === null ? <Unavailable what="our doctors" /> : data.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "var(--grey-500)" }}>Our doctor profiles are being added. Please check back soon, or call us to book.</p>
        ) : <DoctorsBrowser doctors={data} />}
      </Section>
    </>
  );
}
