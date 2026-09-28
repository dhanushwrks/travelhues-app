import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
