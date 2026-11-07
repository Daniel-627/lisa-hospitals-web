import { BRAND } from "@/lib/brand";

/**
 * The Lisa Hospitals mark. `height` sets the size (the width follows the artwork's proportions).
 * - tone "color": navy figure + blue cross, for white / light backgrounds
 * - tone "light": white figure + blue cross, for the navy header and other dark backgrounds
 * Inside the portal's dark mode the figure turns white by itself (see .portal.dark .logo-figure in globals.css).
 */
export default function Logo({ height = 40, tone = "color", title }: { height?: number; tone?: "color" | "light"; title?: string }) {
  return (
    <svg width={height * BRAND.ratio} height={height} viewBox={BRAND.viewBox} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className="shrink-0">
      {title && <title>{title}</title>}
      <g fill={BRAND.blue}>{BRAND.cross.map((d, i) => <path key={i} d={d} />)}</g>
      <g className="logo-figure" fill={tone === "light" ? "#ffffff" : BRAND.navy}>{BRAND.figure.map((d, i) => <path key={i} d={d} />)}</g>
    </svg>
  );
}
