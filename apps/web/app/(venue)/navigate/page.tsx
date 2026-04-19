'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Search, MapPin, ChevronRight, Footprints,
  ArrowUpDown, LocateFixed, X, Toilet, DoorOpen, HeartPulse, Star, Accessibility,
} from 'lucide-react';
import { useVenueStore } from '../../../store/venueStore';
import { useSearchParams } from 'next/navigation';
import { VenueMap, VENUE_ZONES } from '../../../components/map/VenueMap';
import type { MapZone } from '../../../components/map/VenueMap';
import { trackEvent } from '../../../lib/analytics';

const LOCATIONS = [
  'Main Entrance', 'North Stand', 'South Stand', 'East Stand (B)', 'West Stand (A)',
  'Club House', 'Corporate Box', 'Pavilion Food Court', 'Corporate Lounge Bar',
  'KSCA Refreshment Zone', 'North Block Restrooms', 'South Block Restrooms',
  'Gate 5 (MG Road)', 'First Aid Bay',
];

const QUICK_DESTS = [
  { name: 'Club House',           walk: '3 min', icon: Star,       color: '#FDB913' },
  { name: 'Gate 5 (MG Road)',     walk: '5 min', icon: DoorOpen,   color: '#22C55E' },
  { name: 'North Block Restrooms',walk: '2 min', icon: Toilet,     color: '#38BDF8' },
  { name: 'First Aid Bay',        walk: '2 min', icon: HeartPulse, color: '#EF4444' },
];

function NavigateContent() {
  const searchParams = useSearchParams();
  const isAccessibilityMode = useVenueStore(s => s.isTextModeEnabled);
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');
  const [showRoute, setShowRoute] = useState(false);
  const [focusFrom, setFocusFrom] = useState(false);
  const [focusTo, setFocusTo]     = useState(false);
  const [duration, setDuration]   = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);

  useEffect(() => {
    const dest = searchParams.get('to');
    if (dest) setTo(decodeURIComponent(dest));
  }, [searchParams]);

  const filteredFrom = LOCATIONS.filter(
    l => from && l.toLowerCase().includes(from.toLowerCase()) && l !== to,
  );
  const filteredTo = LOCATIONS.filter(
    l => to && l.toLowerCase().includes(to.toLowerCase()) && l !== from,
  );

  const swap = () => { setFrom(to); setTo(from); setShowRoute(false); setDuration(null); };

  const handleDuration = useCallback((d: string) => {
    setDuration(d);
    // Track route calculation in GA4
    const etaMinutes = parseInt(d.replace(/[^0-9]/g, ''), 10) || 0;
    trackEvent({ name: 'venueflow_route_calculated', params: { from, to, eta: etaMinutes } });
  }, [from, to]);

  const handleZoneClick = useCallback((zone: MapZone) => {
    setSelectedZone(zone);
    setTo(zone.name);
  }, []);

  const findRoute = () => {
    if (from && to) { setShowRoute(true); setDuration(null); }
  };

  return (
    <main id="main-content" className="flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'calc(60px + env(safe-area-inset-top))', paddingBottom: 'calc(68px + env(safe-area-inset-bottom))' }}>

      {/* ── Live Map ── */}
      <div className="relative mx-4 mt-3 mb-3 rounded-[20px] overflow-hidden" style={{ height: '240px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <VenueMap
          zones={VENUE_ZONES}
          {...(showRoute && from ? { routeFrom: from } : {})}
          {...(showRoute && to   ? { routeTo: to }     : {})}
          onDuration={handleDuration}
          onZoneClick={handleZoneClick}
          height="240px"
          zoom={16}
        />
        {/* Map overlay label */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(10,15,28,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22C55E' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#22C55E' }} />
          </span>
          <span className="text-[11px] font-semibold" style={{ color: '#F1F5F9' }}>Stadium One</span>
        </div>
        {/* Tap hint */}
        {!showRoute && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-medium" style={{ background: 'rgba(10,15,28,0.8)', color: '#94A3B8', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
            Tap a zone marker to set destination
          </div>
        )}
        {/* Duration badge */}
        {duration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.5)' }}
          >
            <span className="text-[12px] font-bold text-white">🚶 {duration}</span>
          </motion.div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Navigation size={17} style={{ color: '#6366F1' }} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-tight" style={{ color: '#F1F5F9' }}>Navigate</h1>
            <p className="text-[11px]" style={{ color: '#475569' }}>Crowd-aware routing</p>
          </div>
        </div>

        {/* Accessibility mode banner */}
        {isAccessibilityMode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <Accessibility size={14} style={{ color: '#38BDF8' }} />
            <span className="text-[12px] font-semibold" style={{ color: '#38BDF8' }}>Accessibility mode</span>
            <span className="text-[11px]" style={{ color: '#475569' }}>— showing wheelchair-accessible routes only</span>
          </div>
        )}

        {/* Zone selected toast */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <MapPin size={13} style={{ color: '#6366F1' }} />
              <span className="text-[12px] font-medium flex-1" style={{ color: '#94A3B8' }}>
                Destination set to <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{selectedZone.name}</span>
              </span>
              <button onClick={() => setSelectedZone(null)} style={{ color: '#475569' }}>
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input card */}
        <div className="vf-card p-4 mb-3">
          {/* From */}
          <div className="mb-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#475569' }}>From</label>
            <div className="relative flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
              <input
                id="route-from"
                aria-label="Route start location"
                autoComplete="off"
                className="vf-input flex-1 py-2.5 text-[14px]"
                placeholder="Your location"
                value={from}
                onChange={e => { setFrom(e.target.value); setShowRoute(false); }}
                onFocus={() => setFocusFrom(true)}
                onBlur={() => setTimeout(() => setFocusFrom(false), 150)}
              />
              <button
                onClick={() => { setFrom('My Location (GPS)'); setShowRoute(false); }}
                className="shrink-0 p-1.5 rounded-lg"
                style={{ color: '#475569' }}
                aria-label="Use GPS"
              >
                <LocateFixed size={15} />
              </button>
            </div>
            <AnimatePresence>
              {focusFrom && filteredFrom.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-1 rounded-xl overflow-hidden z-20 shadow-xl relative"
                  style={{ background: '#161D35', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {filteredFrom.slice(0, 4).map(loc => (
                    <li key={loc}>
                      <button
                        className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 hover:bg-white/5"
                        style={{ color: '#F1F5F9' }}
                        onClick={() => { setFrom(loc); setFocusFrom(false); }}
                      >
                        <MapPin size={11} style={{ color: '#6366F1' }} />{loc}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Swap */}
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={swap}
              disabled={!from && !to}
              className="p-1.5 rounded-full disabled:opacity-30"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366F1' }}
              aria-label="Swap"
            >
              <ArrowUpDown size={13} />
            </button>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* To */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: '#475569' }}>To</label>
            <div className="relative flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#6366F1', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
              <input
                id="route-to"
                aria-label="Route destination"
                autoComplete="off"
                className="vf-input flex-1 py-2.5 text-[14px]"
                placeholder="Destination"
                value={to}
                onChange={e => { setTo(e.target.value); setShowRoute(false); }}
                onFocus={() => setFocusTo(true)}
                onBlur={() => setTimeout(() => setFocusTo(false), 150)}
              />
              {to && (
                <button onClick={() => { setTo(''); setShowRoute(false); setSelectedZone(null); }} className="shrink-0 p-1" style={{ color: '#475569' }} aria-label="Clear">
                  <X size={13} />
                </button>
              )}
            </div>
            <AnimatePresence>
              {focusTo && filteredTo.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-1 rounded-xl overflow-hidden z-20 shadow-xl relative"
                  style={{ background: '#161D35', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {filteredTo.slice(0, 4).map(loc => (
                    <li key={loc}>
                      <button
                        className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 hover:bg-white/5"
                        style={{ color: '#F1F5F9' }}
                        onClick={() => { setTo(loc); setFocusTo(false); }}
                      >
                        <MapPin size={11} style={{ color: '#6366F1' }} />{loc}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Find Route */}
        <button onClick={findRoute} disabled={!from || !to} className="vf-btn-primary mb-4">
          <Search size={16} /> Find Route
        </button>

        {/* Route summary */}
        <AnimatePresence>
          {showRoute && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
              <div className="vf-card-accent p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Footprints size={14} style={{ color: '#94A3B8' }} />
                    <span className="text-[12px]" style={{ color: '#94A3B8' }}>Avoiding crowded zones</span>
                  </div>
                  <span className="text-[14px] font-bold" style={{ color: '#6366F1' }}>
                    {duration ?? '~6 min'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="truncate max-w-[40%] font-semibold" style={{ color: '#F1F5F9' }}>{from}</span>
                  <ChevronRight size={12} style={{ color: '#475569' }} />
                  <span className="truncate max-w-[40%] font-semibold" style={{ color: '#6366F1' }}>{to}</span>
                </div>
              </div>
              <button
                onClick={() => { setShowRoute(false); setDuration(null); }}
                className="w-full h-11 rounded-2xl text-[13px] font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}
              >
                Clear route
              </button>
            </motion.div>
          )}
        </AnimatePresence>

          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {showRoute && duration ? `Route from ${from} to ${to}. Estimated time ${duration}.` : 'Set start and destination to find a route.'}
          </div>

        {/* Quick destinations */}
        {!showRoute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Quick Destinations</p>
            <div className="space-y-2">
              {QUICK_DESTS.map((dest, i) => {
                const Icon = dest.icon;
                return (
                  <motion.button
                    key={dest.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    onClick={() => setTo(dest.name)}
                    className="vf-card w-full p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${dest.color}18`, border: `1px solid ${dest.color}33` }}>
                      <Icon size={17} style={{ color: dest.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[14px] font-semibold" style={{ color: '#F1F5F9' }}>{dest.name}</p>
                      <p className="text-[11px]" style={{ color: '#475569' }}>{dest.walk} walk</p>
                    </div>
                    <ChevronRight size={15} style={{ color: '#475569' }} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', paddingTop: 'calc(60px + env(safe-area-inset-top))', paddingBottom: 'calc(68px + env(safe-area-inset-bottom))' }}>
        <div className="mx-4 mt-3 mb-3 rounded-[20px] animate-pulse" style={{ height: '240px', background: '#161D35' }} />
        <div className="px-4 space-y-3">
          <div className="h-10 rounded-2xl animate-pulse" style={{ background: '#161D35' }} />
          <div className="h-36 rounded-2xl animate-pulse" style={{ background: '#161D35' }} />
          <div className="h-12 rounded-2xl animate-pulse" style={{ background: '#161D35' }} />
        </div>
      </div>
    }>
      <NavigateContent />
    </Suspense>
  );
}
