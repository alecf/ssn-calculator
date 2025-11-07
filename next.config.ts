import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static export for CDN deployment
  reactStrictMode: true,
};

export default nextConfig;
