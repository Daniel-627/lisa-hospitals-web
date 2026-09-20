import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/sso-callback",
        destination: "/patient/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;