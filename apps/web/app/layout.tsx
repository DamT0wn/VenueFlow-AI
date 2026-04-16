import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

// ──────────────────────────────────────────────────────────────────────────────
// Font
// ──────────────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://venueflow.app'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google services */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-vf-bg-base text-vf-text-primary font-display antialiased">
        {/* Skip to main content — accessibility first element */}
        <a
          href="#main-content"
          className="
            sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
            focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-xl
            focus:bg-vf-accent-primary focus:text-white focus:font-semibold
          "
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
