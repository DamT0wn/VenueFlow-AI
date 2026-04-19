import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const APP_URL = process.env['NEXT_PUBLIC_APP_URL']?.trim() || 'https://venueflow.app';

// ──────────────────────────────────────────────────────────────────────────────
// Global Metadata
// ──────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'VenueFlow AI',
    template: '%s | VenueFlow AI',
  },
  description:
    'Real-time intelligent venue companion — crowd heatmaps, smart navigation, queue estimates, and live alerts.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VenueFlow AI',
  },
  openGraph: {
    title: 'VenueFlow AI',
    description: 'Navigate large venues smarter with real-time crowd intelligence.',
    type: 'website',
    siteName: 'VenueFlow AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VenueFlow AI',
    description: 'Navigate large venues smarter with real-time crowd intelligence.',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(APP_URL),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0A0E1A',
  colorScheme: 'dark',
};

// ──────────────────────────────────────────────────────────────────────────────
// Root Layout
// ──────────────────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google services */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased" style={{ background: 'var(--vf-bg-base)', color: 'var(--vf-text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Skip to main content — must be the very first focusable element */}
        <a
          href="#main-content"
          className="vf-skip-link"
        >
          Skip to main content
        </a>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
