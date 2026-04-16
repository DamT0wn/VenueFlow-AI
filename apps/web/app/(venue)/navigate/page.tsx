'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation, Search, MapPin, ArrowRight, ChevronRight, Footprints } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';

const LOCATIONS = [
  'Main Entrance', 'North Stand', 'South Stand', 'East Wing', 'West Wing',
  'Food Court A', 'Food Court B', 'VIP Lounge', 'First Aid',
  'Restrooms Block A', 'Restrooms Block B', 'Exit Gate 1', 'Exit Gate 2',
];

const MOCK_ROUTE = [
  { step: 1, instruction: 'Head north through Gate 3',     distance: '80m',  icon: '⬆️' },
  { step: 2, instruction: 'Turn right at the Food Court',  distance: '45m',  icon: '➡️' },
  { step: 3, instruction: 'Pass through the concourse',    distance: '120m', icon: '⬆️' },
  { step: 4, instruction: 'Arrive at North Stand Block A', distance: '—',    icon: '📍' },
];

export default function NavigatePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showRoute, setShowRoute] = useState(false);
  const [focusFrom, setFocusFrom] = useState(false);
  const [focusTo, setFocusTo] = useState(false);

  const accent = '#6366F1';

  const handleGo = () => {
    if (from && to) setShowRoute(true);
  };

  const filteredFrom = LOCATIONS.filter(l => from && l.toLowerCase().includes(from.toLowerCase()) && l !== to);
  const filteredTo   = LOCATIONS.filter(l => to   && l.toLowerCase().includes(to.toLowerCase())   && l !== from);

  return (
    <PageContainer>
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-4">
          <Navigation size={20} className="text-vf-accent-primary" />
          <h1 className="text-lg font-bold text-vf-text-primary">Navigate</h1>
        </div>

        {/* From/To inputs */}
        <div className="vf-card p-4 mb-3 relative">
          <div className="flex flex-col gap-3">
            {/* From */}
            <div className="relative">
              <label className="text-[10px] uppercase tracking-widest text-vf-text-muted mb-1 block">From</label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-vf-accent-success shrink-0" />
                <input
                  className="flex-1 bg-vf-bg-elevated rounded-xl px-3 py-2 text-sm text-vf-text-primary outline-none border border-vf-border"
                  style={{ '--tw-ring-color': accent } as React.CSSProperties}
                  placeholder="Your location"
                  value={from}
                  onChange={e => { setFrom(e.target.value); setShowRoute(false); }}
                  onFocus={() => setFocusFrom(true)}
                  onBlur={() => setTimeout(() => setFocusFrom(false), 150)}
                />
              </div>
              {focusFrom && filteredFrom.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-vf-bg-elevated border border-vf-border rounded-xl overflow-hidden z-10 shadow-xl">
                  {filteredFrom.slice(0, 4).map(loc => (
                    <li key={loc}>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-vf-text-primary hover:bg-vf-bg-base flex items-center gap-2"
                        onClick={() => { setFrom(loc); setFocusFrom(false); }}>
                        <MapPin size={12} className="text-vf-accent-primary" /> {loc}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="h-px bg-vf-border" />

            {/* To */}
            <div className="relative">
              <label className="text-[10px] uppercase tracking-widest text-vf-text-muted mb-1 block">To</label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-vf-accent-primary shrink-0" />
                <input
                  className="flex-1 bg-vf-bg-elevated rounded-xl px-3 py-2 text-sm text-vf-text-primary outline-none border border-vf-border"
                  placeholder="Destination"
                  value={to}
                  onChange={e => { setTo(e.target.value); setShowRoute(false); }}
                  onFocus={() => setFocusTo(true)}
                  onBlur={() => setTimeout(() => setFocusTo(false), 150)}
                />
              </div>
              {focusTo && filteredTo.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-vf-bg-elevated border border-vf-border rounded-xl overflow-hidden z-10 shadow-xl">
                  {filteredTo.slice(0, 4).map(loc => (
                    <li key={loc}>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-vf-text-primary hover:bg-vf-bg-base flex items-center gap-2"
                        onClick={() => { setTo(loc); setFocusTo(false); }}>
                        <MapPin size={12} className="text-vf-accent-primary" /> {loc}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleGo}
          disabled={!from || !to}
          className="w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 mb-4"
          style={{ backgroundColor: accent }}
        >
          <Search size={16} /> Find Route
        </button>

        {/* Quick destinations */}
        {!showRoute && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-vf-text-muted mb-3">Quick Destinations</h2>
            <div className="space-y-2">
              {['Food Court A', 'Nearest Restroom', 'Exit Gate 1', 'First Aid', 'VIP Lounge'].map((dest, i) => (
                <motion.button
                  key={dest}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => { setTo(dest); }}
                  className="w-full vf-card p-3 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className="text-vf-accent-primary" />
                    <span className="text-sm text-vf-text-primary">{dest}</span>
                  </div>
                  <ChevronRight size={14} className="text-vf-text-muted group-hover:text-vf-accent-primary transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Route result */}
        {showRoute && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-vf-text-muted">Estimated walk</span>
                <span className="text-sm font-bold text-vf-accent-primary">~6 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Footprints size={14} className="text-vf-text-secondary" />
                <span className="text-xs text-vf-text-secondary">Avoiding crowded zones</span>
              </div>
            </div>

            <h2 className="text-xs font-semibold uppercase tracking-widest text-vf-text-muted mb-3">Turn-by-Turn</h2>
            <div className="space-y-2">
              {MOCK_ROUTE.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="vf-card p-3 flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)', color: accent }}
                  >
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-vf-text-primary">{step.instruction}</p>
                    <p className="text-xs text-vf-text-muted">{step.distance}</p>
                  </div>
                  <ArrowRight size={14} className="text-vf-text-muted shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageContainer>
  );
}
