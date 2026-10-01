import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/shorts", destination: "/hues", permanent: false },
      { source: "/shorts/:path*", destination: "/hues/:path*", permanent: false },
      { source: "/trips", destination: "/plans", permanent: false },
      { source: "/trips/:path*", destination: "/plans/:path*", permanent: false },
      { source: "/glimpse", destination: "/hues", permanent: false },
      { source: "/glimpse/new", destination: "/hues/new", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4001",
      },
      {
        protocol: "http",
        hostname: "65.2.235.120",
        port: "4000",
      },
      {
        protocol: "https",
        hostname: "65.2.235.120.sslip.io",
      },
    ],
  },
};

export default nextConfig;
