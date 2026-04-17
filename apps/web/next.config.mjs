/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Compiler optimizations ────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ── Optimize specific package imports (tree-shaking) ─────────────────────
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      // NOTE: @vis.gl/react-google-maps excluded — optimizePackageImports
      // breaks its internal Google Maps script loader
      'firebase',
    ],
  },

  // ── Image optimization ────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'maps.gstatic.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  // ── Dev proxy ─────────────────────────────────────────────────────────────
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    if (process.env.NODE_ENV === 'production') return [];
    return [{ source: '/api/v1/:path*', destination: `${API_URL}/api/:path*` }];
  },

  // ── Transpile workspace packages ──────────────────────────────────────────
  transpilePackages: ['@venueflow/shared-types'],
};

export default nextConfig;
