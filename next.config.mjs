/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable Next.js built-in image optimization for faster loads
    unoptimized: false,
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel-storage.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com" },
    ],
  },
  // Compress responses
  compress: true,
  // Poweredby header removal
  poweredByHeader: false,
  // Experimental: faster page navigation
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-accordion", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/(.*)\\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

export default nextConfig
