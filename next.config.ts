import type { NextConfig } from "next";
import { SITE_HOSTS, SITE_URL } from "./lib/site";

// One address per page. Search engines treat lisahospitals.com, lisahospitals.co.ke and their www versions as separate
// sites, which splits ranking and creates duplicate pages. Every host that is not the main one is sent (permanently,
// 308) to the same path on the main address. The main address is NEXT_PUBLIC_SITE_URL (see lib/site.ts).
const mainHost = new URL(SITE_URL).host;

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/sso-callback",
        destination: "/patient/dashboard",
        permanent: false,
      },
      ...SITE_HOSTS.filter((host) => host !== mainHost).map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: `${SITE_URL}/:path*`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
