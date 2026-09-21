import type { NextConfig } from "next";

const apiOrigin = process.env.QURAN_FEHAM_API_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@quran-feham/contracts",
    "@quran-feham/design-tokens",
    "@quran-feham/quran-content",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
