import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: 'dist',
  reactStrictMode: false,
  experimental: {
    // Extend API route timeout to 2 minutes (120 seconds)
    serverComponentsExternalPackages: [],
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
    apiTimeout: 120000,
  },
};

export default nextConfig;
