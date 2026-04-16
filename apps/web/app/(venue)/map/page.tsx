'use client';

import { useVenueStore } from '../../../store/venueStore';
import { MapPin, Users, Zap, Radio, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '../../../components/layout/PageContainer';

const MOCK_ZONES = [
  { id: 'z1', name: 'North Stand',    density: 78, trend: 'up'   },
  { id: 'z2', name: 'South Stand',    density: 42, trend: 'down' },
  { id: 'z3', name: 'East Wing',      density: 91, trend: 'up'   },
  { id: 'z4', name: 'West Wing',      density: 55, trend: 'flat' },
  { id: 'z5', name: 'Food Court A',   density: 85, trend: 'up'   },
  { id: 'z6', name: 'Food Court B',   density: 30, trend: 'down' },
  { id: 'z7', name: 'Main Entrance',  density: 66, trend: 'flat' },
  { id: 'z8', name: 'VIP Lounge',     density: 20, trend: 'down' },
];

function densityColor(d: number) {
  if (d >= 80) return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'High' };
  if (d >= 50) return { color: '#EAB308', bg: 'rgba(234,179,8,0.12)',  label: 'Med'  };
  return           { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: 'Low'  };
}

export default function MapPage() {
  const { venueName } = useVenueStore();
  const overall = Math.round(MOCK_ZONES.reduce((s, z) => s + z.density, 0) / MOCK_ZONES.length);

  return (
    <PageContainer>
      {/* Hero stat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-5 mb-4 mt-2"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Radio size={14} className="text-vf-accent-primary" />
          <span className="text-xs text-vf-text-secondary uppercase tracking-widest font-semibold">Live Occupancy</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-5xl font-bold text-vf-text-primary">{overall}<span className="text-2xl text-vf-text-secondary">%</span></p>
            <p className="text-sm text-vf-text-secondary mt-1">{venueName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-vf-text-muted">Crowd estimate</p>
            <p className="text-2xl font-semibold text-vf-accent-success">~38k</p>
          </div>
        </div>

        {/* Density bar */}
        <div className="mt-4 h-2 rounded-full bg-vf-bg-elevated overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overall}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
          />
        </div>
      </motion.div>

      {/* Zone grid */}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-vf-text-muted mb-3 px-1">Zone Status</h2>
      <div className="grid grid-cols-2 gap-3">
        {MOCK_ZONES.map((zone, i) => {
          const { color, bg, label } = densityColor(zone.density);
          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="vf-card p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-vf-text-secondary leading-tight">{zone.name}</p>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0"
                  style={{ color, background: bg }}
                >
                  {label}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold" style={{ color }}>{zone.density}<span className="text-sm text-vf-text-muted">%</span></p>
                <TrendingUp
                  size={14}
                  className="mb-1"
                  style={{
                    color: zone.trend === 'up' ? '#EF4444' : zone.trend === 'down' ? '#22C55E' : '#6B7280',
                    transform: zone.trend === 'down' ? 'scaleY(-1)' : undefined,
                    opacity: zone.trend === 'flat' ? 0.4 : 1,
                  }}
                />
              </div>
              {/* Mini bar */}
              <div className="mt-2 h-1.5 rounded-full bg-vf-bg-elevated overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${zone.density}%` }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.04, ease: 'easeOut' }}
                  style={{ backgroundColor: color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick stats row */}
      <div className="flex gap-3 mt-4">
        {[
          { icon: Users,  label: 'Attendees', value: '32,400' },
          { icon: MapPin, label: 'Hot Zones',  value: '3'      },
          { icon: Zap,    label: 'Alerts',     value: '1'      },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex-1 vf-card p-3 text-center">
            <Icon size={16} className="text-vf-accent-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-vf-text-primary">{value}</p>
            <p className="text-[10px] text-vf-text-muted">{label}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
