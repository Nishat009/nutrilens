import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
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
        source: "/api/progress/:path*",
        destination: `${apiUrl}/api/progress/:path*`,
      },
    ];
  },
};

export default nextConfig;
