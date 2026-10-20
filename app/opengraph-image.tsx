import { ImageResponse } from "next/og";
import { HOSPITAL } from "@/lib/hospital";

// The picture shown when a page is shared on WhatsApp, Facebook, X, LinkedIn or Slack, and the hospital's image in search.
export const alt = `${HOSPITAL.name}: ${HOSPITAL.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "#0B2545", color: "white" }}>
        <div style={{ display: "flex", width: 96, height: 8, background: "#00969A", marginBottom: 36 }} />
        <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>{HOSPITAL.name}</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#5cdde0" }}>{HOSPITAL.tagline}</div>
        <div style={{ fontSize: 30, marginTop: 56, color: "rgba(255,255,255,0.75)" }}>24-hour hospital · Nairobi Highway, Kisumu, Kenya</div>
        <div style={{ fontSize: 30, marginTop: 12, color: "rgba(255,255,255,0.75)" }}>{HOSPITAL.phoneDisplay}</div>
      </div>
    ),
    size,
  );
}
