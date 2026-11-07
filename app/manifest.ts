import type { MetadataRoute } from "next";
import { HOSPITAL } from "@/lib/hospital";

// Lets phones "Add to Home screen" with the hospital's icon and colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: HOSPITAL.name,
    short_name: "Lisa Hospitals",
    description: HOSPITAL.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B2545",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
