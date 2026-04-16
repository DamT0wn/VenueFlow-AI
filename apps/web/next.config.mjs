/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Strict mode for React 18 ──────────────────────────────────────────────
  reactStrictMode: true,

  // ── Image domains ─────────────────────────────────────────────────────────
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
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },

  // ── Dev proxy — rewrites /api/v1/* → backend :3001 ───────────────────────
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    if (process.env.NODE_ENV === 'production') return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },

  // ── Transpile workspace packages ──────────────────────────────────────────
  transpilePackages: ['@venueflow/shared-types'],
};

export default nextConfig;
