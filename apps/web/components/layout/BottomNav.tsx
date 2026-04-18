'use client';

import { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Navigation, Clock, Bell, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getSocket } from '../../lib/socket';

const NAV_ITEMS = [
  { href: '/map',             label: 'Map',      Icon: Map,        color: '#6366F1' },
  { href: '/navigate',        label: 'Navigate', Icon: Navigation, color: '#38BDF8' },
  { href: '/queues',          label: 'Queues',   Icon: Clock,      color: '#FDB913' },
  { href: '/alerts',          label: 'Alerts',   Icon: Bell,       color: '#EF4444' },
  { href: '/recommendations', label: 'For You',  Icon: Star,       color: '#22C55E' },
] as const;

export const BottomNav = memo(function BottomNav() {
  const pathname           = usePathname();
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
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1"
      style={{
        height: '68px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(5,8,16,0.95)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, Icon, color }) => {
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
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vf-accent-primary"
          >
            {/* Active background pill */}
            {isActive && (
              <motion.span
                layoutId="nav-bg"
                className="absolute inset-x-1 inset-y-1 rounded-2xl"
                style={{
                  background: `${color}14`,
                  border: `1px solid ${color}28`,
                  boxShadow: shouldReduceMotion ? 'none' : `0 0 16px ${color}20`,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                aria-hidden
              />
            )}

            {/* Icon container */}
            <div className="relative z-10 flex items-center justify-center">
              {/* Glow ring on active */}
              {isActive && !shouldReduceMotion && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 32, height: 32,
                    background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <motion.div
                animate={isActive && !shouldReduceMotion ? { y: -2 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  style={{ color: isActive ? color : '#475569' }}
                  aria-hidden
                />
              </motion.div>

              {/* Alert badge */}
              {showBadge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#EF4444', fontSize: '9px', fontWeight: 700, boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
                  aria-hidden
                >
                  {alertCount > 9 ? '9+' : alertCount}
                </motion.span>
              )}
            </div>

            {/* Label */}
            <motion.span
              className="relative z-10 text-[10px] font-semibold leading-none"
              animate={{ color: isActive ? color : '#475569' }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
});
