'use client';

import { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Navigation, Clock, Bell, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getSocket } from '../../lib/socket';

const NAV_ITEMS = [
  { href: '/map',             label: 'Map',      Icon: Map        },
  { href: '/navigate',        label: 'Navigate', Icon: Navigation },
  { href: '/queues',          label: 'Queues',   Icon: Clock      },
  { href: '/alerts',          label: 'Alerts',   Icon: Bell       },
  { href: '/recommendations', label: 'For You',  Icon: Star       },
] as const;

export const BottomNav = memo(function BottomNav() {
  const pathname          = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const onAlert = () => setAlertCount(c => c + 1);
    socket.on('alert:new', onAlert);
    return () => { socket.off('alert:new', onAlert); };
  }, []);

  useEffect(() => {
    if (pathname === '/alerts') setAlertCount(0);
  }, [pathname]);

  return (
    <nav
      aria-label="Main navigation"
      role="tablist"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2"
      style={{
        height: '68px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(10,15,28,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive  = pathname === href || pathname.startsWith(`${href}/`);
        const isAlerts  = href === '/alerts';
        const showBadge = isAlerts && alertCount > 0;

        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={isActive}
            aria-label={showBadge ? `${label} — ${alertCount} new` : label}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[48px] rounded-2xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vf-accent-primary"
          >
            {isActive && (
              <motion.span
                layoutId="nav-bg"
                className="absolute inset-x-1 inset-y-1 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                aria-hidden
              />
            )}
            <div className="relative z-10">
              <Icon
                size={21}
                strokeWidth={isActive ? 2.5 : 1.75}
                style={{ color: isActive ? '#6366F1' : '#475569' }}
                aria-hidden
              />
              {showBadge && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#EF4444', fontSize: '9px', fontWeight: 700 }}
                  aria-hidden
                >
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </div>
            <span className="relative z-10 text-[10px] font-medium leading-none"
              style={{ color: isActive ? '#6366F1' : '#475569' }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
});
