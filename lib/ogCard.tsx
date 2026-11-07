import { ImageResponse } from "next/og";
import { HOSPITAL } from "@/lib/hospital";
import { BRAND } from "@/lib/brand";

export const OG_SIZE = { width: 1200, height: 630 };

/** The picture shown when a page is shared on WhatsApp, Facebook, X, LinkedIn or Slack, and the hospital's image in search. */
export function ogCard() {
  const h = 340, w = Math.round(h * BRAND.ratio);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 90px", background: "#12163a", color: "white" }}>
        <svg width={w} height={h} viewBox={BRAND.viewBox}>
          {BRAND.cross.map((d, i) => <path key={`c${i}`} d={d} fill={BRAND.blue} />)}
          {BRAND.figure.map((d, i) => <path key={`f${i}`} d={d} fill="#ffffff" />)}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>{HOSPITAL.name}</div>
          <div style={{ fontSize: 34, marginTop: 20, color: BRAND.blue, letterSpacing: 4 }}>KISUMU, KENYA</div>
          <div style={{ fontSize: 30, marginTop: 36, color: "rgba(255,255,255,0.8)" }}>{HOSPITAL.tagline}</div>
          <div style={{ fontSize: 28, marginTop: 10, color: "rgba(255,255,255,0.65)" }}>{`${HOSPITAL.phoneDisplay} · Book online`}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
