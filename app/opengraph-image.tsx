import { HOSPITAL } from "@/lib/hospital";
import { OG_SIZE, ogCard } from "@/lib/ogCard";

// The picture shown when a page is shared on WhatsApp, Facebook, X, LinkedIn or Slack, and the hospital's image in search.
export const alt = `${HOSPITAL.name}: ${HOSPITAL.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard();
}
