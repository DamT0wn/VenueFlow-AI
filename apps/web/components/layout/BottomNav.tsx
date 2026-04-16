'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Navigation, Clock, Bell, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

// ──────────────────────────────────────────────────────────────────────────────
// Bottom Navigation — Radix Tabs pattern with keyboard navigation
// ──────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/map',             label: 'Map',        Icon: Map        },
  { href: '/navigate',        label: 'Navigate',   Icon: Navigation },
  { href: '/queues',          label: 'Queues',     Icon: Clock      },
  { href: '/alerts',          label: 'Alerts',     Icon: Bell       },
  { href: '/recommendations', label: 'For You',    Icon: Star       },
] as const;

/**
 * Fixed-bottom primary navigation bar.
 * Meets WCAG 2.1 AA: 48px height items, keyboard navigable, aria-label on nav.
 */
export function BottomNav() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Main navigation"
      className="
        fixed bottom-0 left-0 right-0 z-40
        flex items-center justify-around
        bg-vf-bg-surface border-t border-vf-border
        h-16 pb-[env(safe-area-inset-bottom)]
        px-1
      "
      role="tablist"
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            className="
              relative flex flex-col items-center justify-center gap-0.5
              min-h-[48px] min-w-[48px] flex-1
              rounded-xl transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-vf-accent-primary focus-visible:ring-offset-2
              focus-visible:ring-offset-vf-bg-surface
            "
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.75}
              className={isActive ? 'text-vf-accent-primary' : 'text-vf-text-secondary'}
              aria-hidden="true"
            />
            <span
              className={`
                text-[10px] font-medium leading-none transition-colors duration-150
                ${isActive ? 'text-vf-accent-primary' : 'text-vf-text-secondary'}
              `}
            >
              {label}
            </span>
            {isActive && (
              <motion.span
                layoutId="bottom-nav-indicator"
                className="absolute bottom-0.5 h-0.5 w-8 rounded-full bg-vf-accent-primary"
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
