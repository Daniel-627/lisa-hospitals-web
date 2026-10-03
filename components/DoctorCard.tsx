import Link from "next/link";

export type DoctorLite = {
  id: string; firstName: string; lastName: string; speciality: string;
  photoUrl?: string | null; department?: string;
};

export default function DoctorCard({ d }: { d: DoctorLite }) {
  const initials = `${d.firstName?.[0] ?? ""}${d.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <Link href={`/doctors/${d.id}`} className="block p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--grey-200)", background: "white" }}>
      <div className="flex items-center gap-4">
        {d.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.photoUrl} alt={`Dr. ${d.firstName} ${d.lastName}`} loading="lazy" className="w-16 h-16 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }} aria-hidden>
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>Dr. {d.firstName} {d.lastName}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--teal-dark)" }}>{d.speciality}</div>
          {d.department && <div className="text-xs mt-0.5" style={{ color: "var(--grey-400)" }}>{d.department}</div>}
        </div>
      </div>
    </Link>
  );
}
