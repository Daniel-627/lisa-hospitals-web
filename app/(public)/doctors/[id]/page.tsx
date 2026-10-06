import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero, Section, Unavailable } from "@/components/public";
import { apiGet } from "@/lib/serverApi";
import { BOOK_URL } from "@/lib/hospital";
import { DAYS, fmtMoney, hhmm } from "@/lib/format";

export const revalidate = 60;
type Props = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Doctor not found" };
  const { data } = await apiGet<any>(`/api/doctors/${id}`);
  return data
    ? { title: `Dr. ${data.firstName} ${data.lastName} — Lisa Hospitals`, description: `${data.speciality} at Lisa Hospitals, Kisumu.` }
    : { title: "Doctor — Lisa Hospitals" };
}

export default async function DoctorPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [doc, avail] = await Promise.all([apiGet<any>(`/api/doctors/${id}`), apiGet<any[]>(`/api/doctors/${id}/availability`)]);
  if (doc.status === 404) notFound();
  const d = doc.data;
  if (!d) return <Section><Unavailable what="this doctor's profile" /></Section>;

  const slots = [...(avail.data ?? [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  const initials = `${d.firstName?.[0] ?? ""}${d.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <>
      <PageHero eyebrow={d.department} title={`Dr. ${d.firstName} ${d.lastName}`} subtitle={d.speciality} />
      <Section narrow>
        <div className="flex items-center gap-5 mb-8">
          {d.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.photoUrl} alt={`Dr. ${d.firstName} ${d.lastName}`} className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }} aria-hidden>{initials}</div>
          )}
          <div>
            <div className="text-sm" style={{ color: "var(--teal-dark)" }}>{d.speciality}</div>
            <Link href={`/services/${String(d.departmentSlug).replace(/_/g, "-")}`} className="text-sm hover:underline" style={{ color: "var(--grey-500)" }}>{d.department}</Link>
            {d.consultationFee && <div className="text-sm mt-1" style={{ color: "var(--navy)" }}>Consultation: <strong>{fmtMoney(d.consultationFee)}</strong></div>}
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--navy)" }}>About</h2>
        <p className="text-base leading-relaxed mb-8" style={{ color: "var(--grey-500)" }}>
          {d.bio || `${d.speciality} at Lisa Hospitals. Book an appointment to see Dr. ${d.lastName}.`}
        </p>

        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--navy)" }}>Weekly schedule</h2>
        {slots.length === 0 ? (
          <p className="text-sm mb-8" style={{ color: "var(--grey-500)" }}>Clinic hours aren&apos;t listed yet. Choose a time when you book and we&apos;ll confirm it.</p>
        ) : (
          <div className="rounded-xl border divide-y mb-8" style={{ borderColor: "var(--grey-200)", background: "white" }}>
            {slots.map((s) => (
              <div key={s.id} className="flex justify-between px-5 py-3 text-sm">
                <span style={{ color: "var(--navy)" }}>{DAYS[s.dayOfWeek]}</span>
                <span style={{ color: "var(--grey-500)" }}>{hhmm(s.startTime)} – {hhmm(s.endTime)}</span>
              </div>
            ))}
          </div>
        )}

        <Link href={`${BOOK_URL}?department=${d.departmentId}&doctor=${d.id}`} className="inline-block px-8 py-3.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--teal)" }}>
          Book with Dr. {d.lastName}
        </Link>
        <div className="mt-8"><Link href="/doctors" className="text-sm font-semibold" style={{ color: "var(--teal)" }}>← All doctors</Link></div>
      </Section>
    </>
  );
}
