'use client';

import { useVenueStore } from '../../store/venueStore';
import { useUserStore } from '../../store/userStore';
import { MapPin, Settings, Eye } from 'lucide-react';
import Link from 'next/link';

/**
 * Fixed top bar with venue name, colourblind toggle, and admin link.
 * Uses blur-backdrop for map page overlay.
 */
export function TopBar() {
  const { venueName, toggleColourblindMode, isColourblindModeEnabled } = useVenueStore();
  const { role } = useUserStore();

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-30
        flex items-center justify-between
        h-14 px-4
        bg-vf-bg-surface/80 backdrop-blur-md
        border-b border-vf-border
        pt-[env(safe-area-inset-top)]
      "
      role="banner"
    >
      {/* Left: venue name */}
      <div className="flex items-center gap-2 min-w-0">
        <MapPin size={16} className="text-vf-accent-primary shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-vf-text-primary truncate">
          {venueName}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleColourblindMode}
          aria-pressed={isColourblindModeEnabled}
          aria-label={
            isColourblindModeEnabled
              ? 'Disable colourblind mode'
              : 'Enable colourblind mode (shows density as numbers)'
          }
          className="
            touch-target rounded-lg transition-colors
            hover:bg-vf-bg-elevated
            text-vf-text-secondary hover:text-vf-text-primary
          "
          title="Toggle colourblind mode"
        >
          <Eye size={18} aria-hidden="true" />
        </button>

        {role === 'admin' && (
          <Link
            href="/admin/dashboard"
            aria-label="Admin dashboard"
            className="
              touch-target rounded-lg transition-colors
              hover:bg-vf-bg-elevated
              text-vf-text-secondary hover:text-vf-accent-primary
            "
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}
