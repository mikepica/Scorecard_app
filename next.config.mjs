/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    FEATURE_FLAG_USE_DATABASE: process.env.FEATURE_FLAG_USE_DATABASE,
  },
}

export default nextConfig
