import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: 'dist',
  reactStrictMode: false,
  transpilePackages: ["@era/ui"],
  serverExternalPackages: [],
  turbopack: {
    root: process.cwd(),
  },
  // Configure API route timeouts
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  // Override default timeouts
  serverRuntimeConfig: {
    // API routes timeout in milliseconds (2 minutes)
    apiTimeout: 300000,
  },
};

export default nextConfig;
