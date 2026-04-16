import type { MetadataRoute } from 'next';

/**
 * PWA manifest for VenueFlow AI.
 * Enables "Add to Home Screen" on mobile browsers.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VenueFlow AI',
    short_name: 'VenueFlow',
    description:
      'Real-time intelligent venue companion — crowd heatmaps, smart navigation, and live alerts.',
    start_url: '/map',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0A0E1A',
    theme_color: '#0A0E1A',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['navigation', 'sports'],
    shortcuts: [
      {
        name: 'View Map',
        short_name: 'Map',
        description: 'Open the live crowd heatmap',
        url: '/map',
        icons: [{ src: '/icons/shortcut-map.png', sizes: '96x96' }],
      },
      {
        name: 'Browse Queues',
        short_name: 'Queues',
        description: 'Check real-time queue wait times',
        url: '/queues',
        icons: [{ src: '/icons/shortcut-queue.png', sizes: '96x96' }],
      },
    ],
  };
}
