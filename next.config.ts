import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: { cpus: 2 },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
