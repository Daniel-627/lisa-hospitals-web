import type { ComponentType, SVGProps } from "react";
import {
  ArrowLeft, ArrowRight, BedDouble, CalendarDays, Check, CircleCheck, CircleX, ClipboardCheck, Clock, CreditCard, Eye, FileText,
  FlaskConical, Handshake, Info, Hospital, HeartPulse, Hourglass, Lock, LockOpen, Mail, MapPin, Menu, Newspaper, Phone, Pill, Receipt,
  Siren, Stethoscope, Microscope, Target, TriangleAlert, UserRound, Users, X, FilePenLine, ListOrdered, ShieldCheck,
} from "lucide-react";
import { FaBaby, FaPersonBreastfeeding, FaPersonWalking, FaTooth, FaUserDoctor, FaXRay } from "react-icons/fa6";

/**
 * Every icon in the app, by name. Data files (departments, dashboard tiles) hold these names instead of emoji, so the
 * look is changed in one place. Lucide for general interface icons, react-icons (Font Awesome 6) where it has a
 * clearer medical symbol (teeth, X-ray, newborn, doctor).
 */
const ICONS = {
  // departments
  hospital: Hospital, emergency: Siren, specialist: Stethoscope, laboratory: Microscope, pharmacy: Pill,
  radiology: FaXRay, physiotherapy: FaPersonWalking, dental: FaTooth, maternity: FaBaby, eye: Eye,
  motherChild: FaPersonBreastfeeding, icu: HeartPulse,
  // portals
  checkin: ClipboardCheck, queue: ListOrdered, patients: Users, appointments: CalendarDays, documents: FileText,
  admissions: BedDouble, billing: CreditCard, invoices: Receipt, results: FlaskConical, profile: UserRound,
  doctor: FaUserDoctor, news: Newspaper, draft: FilePenLine, pending: Hourglass, confirmed: CircleCheck,
  // contact / about
  mail: Mail, phone: Phone, location: MapPin, clock: Clock, compassion: Handshake, excellence: Target,
  access: LockOpen, trust: Lock, secure: ShieldCheck,
  // states
  info: Info, success: CircleCheck, failed: CircleX, warning: TriangleAlert, check: Check, close: X, menu: Menu,
} as const;

export type IconName = keyof typeof ICONS;
type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

/** Sized in `em`, so it follows the surrounding text size and colour (put it in a text-2xl box to make it bigger). */
export function Icon({ name, className = "", ...rest }: { name: IconName | (string & {}); className?: string } & SVGProps<SVGSVGElement>) {
  const C = ICONS[name as IconName] as IconComp | undefined;
  if (!C) return null; // an unknown name draws nothing rather than breaking the page
  return <C aria-hidden="true" className={`inline-block size-[1em] shrink-0 ${className}`} {...rest} />;
}

/** Small arrows for "← Back" and "Learn more →" links. */
export const Back = () => <ArrowLeft aria-hidden="true" className="inline-block size-4 -mt-0.5 mr-1" />;
export const Next = () => <ArrowRight aria-hidden="true" className="inline-block size-4 -mt-0.5 ml-1" />;
