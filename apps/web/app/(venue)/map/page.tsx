'use client';

import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Flame, TrendingUp, TrendingDown, Minus, X, MapPin, Navigation } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { useVenueStore } from '../../../store/venueStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { VENUE_ZONES } from '../../../components/map/VenueMap';
import type { MapZone } from '../../../components/map/VenueMap';
import { trackEvent } from '../../../lib/analytics';

// Lazy-load the heavy Google Maps component
const VenueMap = dynamic(
  () => import('../../../components/map/VenueMap').then(m => ({ default: m.VenueMap })),
  { ssr: false, loading: () => <div className="w-full h-full rounded-[20px] animate-pulse" style={{ background: '#161D35' }} /> },
);

/* ── Types ── */
interface Zone { id: string; name: string; density: number; trend: 'up' | 'down' | 'flat'; }

const SEED_ZONES: Zone[] = [
  { id: 'z1', name: 'North Stand',      density: 78, trend: 'up'   },
  { id: 'z2', name: 'East Stand (B)',   density: 91, trend: 'up'   },
  { id: 'z3', name: 'South Stand',      density: 42, trend: 'down' },
  { id: 'z4', name: 'West Stand (A)',   density: 55, trend: 'flat' },
  { id: 'z5', name: 'Club House',       density: 85, trend: 'up'   },
  { id: 'z6', name: 'Corporate Box',    density: 30, trend: 'down' },
];

// Surge prediction — based on match events (innings break in ~10 min)
function getSurgePrediction(zoneName: string, density: number): string | null {
  if (density >= 85) return 'Critical now';
  if (density >= 70) return 'Surging in ~5 min';
  if (zoneName.includes('Food') || zoneName.includes('Pavilion') || zoneName.includes('Restroom') || zoneName.includes('Block')) {
    return 'Surge at innings break';
  }
  if (density >= 55) return 'Filling up';
  return null;
}

function densityMeta(d: number) {
  if (d >= 80) return { label: 'High',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  glow: 'rgba(239,68,68,0.2)'  };
  if (d >= 50) return { label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', glow: ''                     };
  return              { label: 'Low',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)',  glow: ''                     };
}

/* ── Memoized sub-components ── */
const MiniHeatmap = memo(function MiniHeatmap({ zones }: { zones: Zone[] }) {
  // Stadium layout — 3 cols × 3 rows, corners empty = oval shape
  // [empty]  [North]  [empty]
  // [West]   [Pitch]  [East]
  // [FC-A]   [South]  [FC-B]
  const layout = [
    { id: '',   col: 1, row: 1, empty: true  },
    { id: 'z1', col: 2, row: 1, label: 'North'  },
    { id: '',   col: 3, row: 1, empty: true  },
    { id: 'z4', col: 1, row: 2, label: 'A Wing' },
    { id: '',   col: 2, row: 2, pitch: true  },
    { id: 'z2', col: 3, row: 2, label: 'B Wing' },
    { id: 'z5', col: 1, row: 3, label: 'Club'   },
    { id: 'z3', col: 2, row: 3, label: 'South'  },
    { id: 'z6', col: 3, row: 3, label: 'Corp'   },
  ] as const;

  return (
    <div className="w-full rounded-2xl p-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
          Stadium Heatmap
        </p>
        <div className="flex items-center gap-2.5">
          {([['#22C55E','Low'],['#F59E0B','Med'],['#EF4444','High']] as const).map(([c,l]) => (
            <div key={l} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              <span className="text-[9px]" style={{ color: '#475569' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3×3 grid using flex rows — avoids CSS grid column/row placement bugs */}
      <div className="flex flex-col gap-1.5">
        {[1, 2, 3].map(row => (
          <div key={row} className="flex gap-1.5">
            {layout.filter(c => c.row === row).map((cell, ci) => {
              if ('empty' in cell && cell.empty) {
                return <div key={ci} className="flex-1 h-10 rounded-xl opacity-0" />;
              }
              if ('pitch' in cell && cell.pitch) {
                return (
                  <div key={ci} className="flex-1 h-10 rounded-xl flex items-center justify-center text-base"
                    style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
                    🏏
                  </div>
                );
              }
              const zone = zones.find(z => z.id === cell.id);
              const d = zone?.density ?? 0;
              const { color, bg } = densityMeta(d);
              const cellLabel = 'label' in cell ? cell.label : '';
              return (
                <div key={cell.id} className="flex-1 h-10 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: bg, border: `1px solid ${color}44` }}>
                  <span className="text-[9px] font-semibold leading-none" style={{ color }}>{cellLabel}</span>
                  <span className="text-[11px] font-black leading-none mt-0.5" style={{ color }}>{d}%</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

const ZoneCard = memo(function ZoneCard({ zone, onClick }: { zone: Zone; onClick: (z: Zone) => void }) {
  const { label, color, bg, border, glow } = densityMeta(zone.density);
  const isHigh  = zone.density >= 80;
  const surge   = getSurgePrediction(zone.name, zone.density);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.22 }}
      onClick={() => onClick(zone)}
      className="vf-card p-4 text-left active:scale-95 transition-transform"
      style={isHigh ? { boxShadow: `0 0 20px ${glow}, 0 8px 32px rgba(0,0,0,0.4)` } : {}}
      aria-label={`${zone.name} ${zone.density}% ${label}`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-[12px] font-semibold leading-tight" style={{ color: '#94A3B8' }}>{zone.name}</p>
        <div className="flex items-center gap-1">
          {isHigh && <Flame size={11} style={{ color: '#EF4444' }} />}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ color, background: bg, border: `1px solid ${border}` }}>{label}</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 mb-2">
        <span className="text-[26px] font-black leading-none" style={{ color }}>{zone.density}</span>
        <span className="text-[13px] font-semibold mb-0.5" style={{ color: '#475569' }}>%</span>
        <span className="mb-0.5 ml-auto">
          {zone.trend === 'up'   && <TrendingUp   size={13} style={{ color: '#EF4444' }} />}
          {zone.trend === 'down' && <TrendingDown  size={13} style={{ color: '#22C55E' }} />}
          {zone.trend === 'flat' && <Minus         size={13} style={{ color: '#475569' }} />}
        </span>
      </div>
      <div className="relative h-5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-1.5"
          animate={{ width: `${zone.density}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, minWidth: zone.density > 15 ? undefined : '28px' }}
        >
          <span className="text-[9px] font-bold text-white">{zone.density}%</span>
        </motion.div>
      </div>
      {/* Surge prediction chip */}
      {surge && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: surge.includes('Critical') ? 'rgba(200,16,46,0.15)' : surge.includes('Surging') ? 'rgba(253,185,19,0.15)' : 'rgba(255,255,255,0.06)',
              color: surge.includes('Critical') ? '#C8102E' : surge.includes('Surging') ? '#FDB913' : '#475569',
              border: `1px solid ${surge.includes('Critical') ? 'rgba(200,16,46,0.3)' : surge.includes('Surging') ? 'rgba(253,185,19,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            ⚡ {surge}
          </span>
        </div>
      )}
    </motion.button>
  );
});

const ZoneSheet = memo(function ZoneSheet({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const { color, bg, label } = densityMeta(zone.density);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <motion.div className="relative w-full rounded-t-3xl p-6 pb-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zone-sheet-title"
        style={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }} aria-label="Close">
          <X size={16} style={{ color: '#94A3B8' }} />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: bg, border: `1px solid ${color}44` }}>
            <MapPin size={20} style={{ color }} />
          </div>
          <div>
            <h2 id="zone-sheet-title" className="text-lg font-bold" style={{ color: '#F1F5F9' }}>{zone.name}</h2>
            <span className="vf-badge" style={{ background: bg, color, border: `1px solid ${color}44`, fontSize: '11px' }}>{label} density</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Occupancy', value: `${zone.density}%`, c: color },
            { label: 'Advice', value: zone.density >= 80 ? 'Avoid' : zone.density >= 50 ? 'Moderate' : 'Clear', c: '#F1F5F9' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[11px] mb-1" style={{ color: '#475569' }}>{item.label}</p>
              <p className="text-2xl font-bold" style={{ color: item.c }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="vf-progress-track mb-4">
          <motion.div className="vf-progress-fill" initial={{ width: 0 }} animate={{ width: `${zone.density}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }} />
        </div>
        <Link href={`/navigate?to=${encodeURIComponent(zone.name)}`} className="vf-btn-primary" style={{ display: 'flex' }}>
          <Navigation size={16} /> Navigate here
        </Link>
      </motion.div>
    </motion.div>
  );
});

const FILTERS = [
  { key: 'all',  label: 'All',    color: '#6366F1', bg: 'rgba(99,102,241,0.12)'  },
  { key: 'high', label: 'High',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  { key: 'med',  label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  { key: 'low',  label: 'Low',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
] as const;

/* ── Page ── */
export default function MapPage() {
  const venueName      = useVenueStore(s => s.venueName);
  const crowdSnapshot  = useVenueStore(s => s.crowdSnapshot);
  const venueId        = useVenueStore(s => s.venueId);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [filter, setFilter]     = useState<'all' | 'high' | 'med' | 'low'>('all');

  // Track map load event once
  useEffect(() => {
    trackEvent({ name: 'venueflow_map_loaded', params: { venue_id: venueId } });
  }, [venueId]);

  // Derive zones from live snapshot or fall back to seed data
  const zones = useMemo<Zone[]>(() => {
    if (!crowdSnapshot) return SEED_ZONES;
    return crowdSnapshot.zones.map(z => ({
      id: z.id ?? String((z as unknown as { nodeId?: number }).nodeId ?? Math.random()),
      name: z.name,
      density: z.density,
      trend: 'flat' as const,
    }));
  }, [crowdSnapshot]);

  const lastUpdated = useMemo(() =>
    crowdSnapshot ? new Date(crowdSnapshot.capturedAt) : null,
  [crowdSnapshot]);

  const overall  = useMemo(() => Math.round(zones.reduce((s, z) => s + z.density, 0) / zones.length), [zones]);
  const hotCount = useMemo(() => zones.filter(z => z.density >= 80).length, [zones]);
  const clearCount = useMemo(() => zones.filter(z => z.density < 50).length, [zones]);

  const filtered = useMemo(() => zones.filter(z =>
    filter === 'high' ? z.density >= 80 :
    filter === 'med'  ? z.density >= 50 && z.density < 80 :
    filter === 'low'  ? z.density < 50 : true,
  ), [zones, filter]);

  // Map zones merged with positions
  const mapZones = useMemo<MapZone[]>(() =>
    zones.map(z => ({
      id: z.id,
      name: z.name,
      density: z.density,
      position: VENUE_ZONES.find(v => v.name === z.name)?.position ?? { lat: 51.5560, lng: -0.2796 },
    })),
  [zones]);

  const handleZoneClick = useCallback((zone: MapZone) => {
    setSelected({ id: zone.id, name: zone.name, density: zone.density, trend: 'flat' });
  }, []);

  const handleFilterClick = useCallback((key: typeof filter) => setFilter(key), []);

  return (
    <PageContainer>
      {/* ── Hero — dramatic crowd intelligence card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative mb-4 mt-2 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(15,22,41,0.95) 50%, rgba(200,16,46,0.12) 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 0 40px rgba(99,102,241,0.15), 0 16px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Animated gradient sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(99,102,241,0.06) 50%, transparent 60%)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        />

        <div className="relative p-5">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio size={14} style={{ color: '#6366F1' }} />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.3)' }}
                  animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6366F1' }}>
                Live Occupancy
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[10px] tabular-nums font-medium" style={{ color: '#475569' }}>
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                style={{ background: crowdSnapshot ? 'rgba(34,197,94,0.12)' : 'rgba(71,85,105,0.15)', border: `1px solid ${crowdSnapshot ? 'rgba(34,197,94,0.3)' : 'rgba(71,85,105,0.25)'}` }}>
                <span className="relative flex h-1.5 w-1.5">
                  {crowdSnapshot && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22C55E' }} />}
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: crowdSnapshot ? '#22C55E' : '#475569' }} />
                </span>
                <span className="text-[9px] font-bold" style={{ color: crowdSnapshot ? '#22C55E' : '#475569' }}>
                  {crowdSnapshot ? 'LIVE' : 'SEED'}
                </span>
              </div>
            </div>
          </div>

          {/* Big number */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <motion.div
                className="flex items-end gap-1"
                key={overall}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="font-display text-7xl font-black tracking-tight text-glow-purple"
                  style={{ color: '#F1F5F9', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {overall}
                </span>
                <span className="text-3xl font-black mb-1.5" style={{ color: '#6366F1' }}>%</span>
              </motion.div>
              <p className="text-[12px] font-medium mt-1" style={{ color: '#94A3B8' }}>{venueName}</p>
            </div>

            {/* Crowd count ring */}
            <div className="relative flex items-center justify-center">
              <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <motion.circle
                  cx="36" cy="36" r="28" fill="none"
                  stroke="url(#crowdGrad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - overall / 100) }}
                  transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="crowdGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FDB913" />
                    <stop offset="100%" stopColor="#C8102E" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <p className="text-[11px] font-black" style={{ color: '#FDB913' }}>38K</p>
                <p className="text-[8px]" style={{ color: '#475569' }}>fans</p>
              </div>
            </div>
          </div>

          {/* Progress bar — gradient */}
          <div className="relative h-2.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              animate={{ width: `${overall}%` }}
              transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ background: 'linear-gradient(90deg, #6366F1, #FDB913, #C8102E)', minWidth: '24px' }}
            />
            {/* Shimmer on bar */}
            <motion.div
              className="absolute inset-y-0 rounded-full"
              style={{ width: '40px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
              animate={{ left: ['-10%', `${overall + 5}%`] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Hot zones',   value: String(hotCount),   color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  icon: '🔥' },
              { label: 'Clear',       value: String(clearCount), color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  icon: '✅' },
              { label: 'Avg density', value: `${overall}%`,      color: '#FDB913', bg: 'rgba(253,185,19,0.1)', icon: '📊' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-2xl py-2.5 px-2 text-center"
                style={{ background: s.bg, border: `1px solid ${s.color}22` }}
              >
                <p className="text-base mb-0.5">{s.icon}</p>
                <p className="text-[15px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] mt-0.5 font-medium" style={{ color: '#475569' }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Mini heatmap */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-4">
        <MiniHeatmap zones={zones} />
      </motion.div>

      {/* Google Map */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="mb-4 rounded-[20px] overflow-hidden" style={{ height: '200px', border: '1px solid rgba(255,255,255,0.08)' }} role="region" aria-label="Interactive venue map">
        <VenueMap zones={mapZones} onZoneClick={handleZoneClick} height="200px" zoom={15} />
      </motion.div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const active = filter === f.key;
          const count  = f.key === 'all' ? zones.length : zones.filter(z =>
            f.key === 'high' ? z.density >= 80 : f.key === 'med' ? z.density >= 50 && z.density < 80 : z.density < 50
          ).length;
          return (
            <button key={f.key} onClick={() => handleFilterClick(f.key)}
              aria-pressed={active}
              aria-label={`Filter ${f.label} zones (${count})`}
              className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
              style={{ background: active ? f.color : f.bg, color: active ? '#fff' : f.color, border: `1px solid ${active ? f.color : 'transparent'}` }}>
              {f.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Zone grid */}
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-0.5" style={{ color: '#475569' }}>Zone Status</p>
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(zone => (
            <ZoneCard key={zone.id} zone={zone} onClick={setSelected} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && <ZoneSheet zone={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {/* ARIA live region — announces crowd updates to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {crowdSnapshot
          ? `Crowd update: ${overall}% overall occupancy at ${venueName}. ${hotCount} high-density zones.`
          : `Showing estimated crowd data for ${venueName}.`}
      </div>
    </PageContainer>
  );
}
