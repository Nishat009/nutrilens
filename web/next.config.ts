import type { NextConfig } from "next";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
const apiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    if (!apiUrl) return [];
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${apiUrl}/api/users/:path*`,
      },
      {
        source: "/api/meals/:path*",
        destination: `${apiUrl}/api/meals/:path*`,
      },
      {
        source: "/api/foods/:path*",
        destination: `${apiUrl}/api/foods/:path*`,
      },
      {
        source: "/api/scans/:path*",
        destination: `${apiUrl}/api/scans/:path*`,
      },
      {
        source: "/api/scan/:path*",
        destination: `${apiUrl}/api/scan/:path*`,
      },
      {
        source: "/api/progress/:path*",
        destination: `${apiUrl}/api/progress/:path*`,
      },
      {
        source: "/api/health",
        destination: `${apiUrl}/api/health`,
      },
    ];
  },
};

export default nextConfig;

