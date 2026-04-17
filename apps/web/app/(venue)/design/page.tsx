'use client';

import { motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertTriangle, Info, AlertOctagon, Navigation, Star, Clock, Map } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';

const PALETTE = [
  { name: 'Base',      hex: '#0A0F1C', text: '#fff' },
  { name: 'Surface',   hex: '#0F1629', text: '#fff' },
  { name: 'Elevated',  hex: '#161D35', text: '#fff' },
  { name: 'Primary',   hex: '#6366F1', text: '#fff' },
  { name: 'Success',   hex: '#22C55E', text: '#fff' },
  { name: 'Warning',   hex: '#F59E0B', text: '#000' },
  { name: 'Danger',    hex: '#EF4444', text: '#fff' },
  { name: 'Info',      hex: '#38BDF8', text: '#000' },
];

const TYPE_SCALE = [
  { label: 'Display',   size: '32px', weight: '800', sample: 'Stadium One' },
  { label: 'Heading',   size: '22px', weight: '700', sample: 'Live Occupancy' },
  { label: 'Title',     size: '18px', weight: '600', sample: 'Queue Times' },
  { label: 'Body',      size: '14px', weight: '400', sample: 'East Wing has reached 91% capacity.' },
  { label: 'Caption',   size: '12px', weight: '500', sample: 'Updated 2 min ago' },
  { label: 'Micro',     size: '10px', weight: '600', sample: 'LIVE · HIGH · 3 ACTIVE' },
];

const STATUS_ICONS = [
  { label: 'Critical', Icon: AlertOctagon, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { label: 'Warning',  Icon: AlertTriangle,color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { label: 'Info',     Icon: Info,         color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  { label: 'Success',  Icon: CheckCircle2, color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
];

const NAV_ICONS = [
  { label: 'Map',      Icon: Map        },
  { label: 'Navigate', Icon: Navigation },
  { label: 'Queues',   Icon: Clock      },
  { label: 'Alerts',   Icon: Bell       },
  { label: 'For You',  Icon: Star       },
];

export default function DesignSystemPage() {
  return (
    <PageContainer>
      <div className="mt-2 space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-vf-text-primary mb-0.5">Design System</h1>
          <p className="text-[12px]" style={{ color: '#475569' }}>VenueFlow AI · Stadium One · v2.0</p>
        </div>

        {/* Color palette */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Color Palette</p>
          <div className="grid grid-cols-4 gap-2">
            {PALETTE.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="h-12" style={{ background: c.hex }} />
                <div className="px-2 py-1.5" style={{ background: '#0F1629' }}>
                  <p className="text-[10px] font-semibold" style={{ color: '#F1F5F9' }}>{c.name}</p>
                  <p className="text-[9px] font-mono" style={{ color: '#475569' }}>{c.hex}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Typography — Inter</p>
          <div className="vf-card p-4 space-y-3">
            {TYPE_SCALE.map(t => (
              <div key={t.label} className="flex items-baseline gap-3">
                <span className="text-[10px] w-14 shrink-0 font-semibold" style={{ color: '#475569' }}>{t.label}</span>
                <span style={{ fontSize: t.size, fontWeight: t.weight, color: '#F1F5F9', lineHeight: 1.2 }}>{t.sample}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Button Styles</p>
          <div className="space-y-2.5">
            <button className="vf-btn-primary">Primary — Find Route</button>
            <button className="vf-btn-secondary w-full h-11 rounded-2xl">Secondary — Dismiss</button>
            <div className="flex gap-2">
              {['#EF4444','#F59E0B','#22C55E','#38BDF8'].map(c => (
                <button key={c} className="flex-1 h-10 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95"
                  style={{ background: c, boxShadow: `0 4px 12px ${c}44` }}>
                  Act
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Status icons */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Status Icons</p>
          <div className="grid grid-cols-4 gap-2">
            {STATUS_ICONS.map(s => {
              const Icon = s.Icon;
              return (
                <div key={s.label} className="vf-card p-3 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                    <Icon size={18} style={{ color: s.color }} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Glassmorphism card example */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Glassmorphism Card</p>
          <div className="vf-card-accent p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22C55E' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22C55E' }} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#94A3B8' }}>Live Occupancy</span>
            </div>
            <div className="flex items-end gap-1 mb-3">
              <span className="text-5xl font-black" style={{ color: '#F1F5F9', lineHeight: 1 }}>58</span>
              <span className="text-2xl font-bold mb-1" style={{ color: '#6366F1' }}>%</span>
            </div>
            <div className="relative h-7 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-2"
                initial={{ width: 0 }} animate={{ width: '58%' }}
                transition={{ duration: 1.2, ease: [0.4,0,0.2,1], delay: 0.3 }}
                style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
              >
                <span className="text-[11px] font-bold text-white">58%</span>
              </motion.div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px]" style={{ color: '#94A3B8' }}>backdrop-blur: 20px</span>
              <span className="text-[12px]" style={{ color: '#94A3B8' }}>border: 1px rgba(255,255,255,0.08)</span>
            </div>
          </div>
        </section>

        {/* Nav bar preview */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Navigation Bar</p>
          <div className="rounded-2xl flex items-center justify-around py-3 px-2"
            style={{ background: 'rgba(10,15,28,0.92)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>
            {NAV_ICONS.map(({ label, Icon }, i) => {
              const active = i === 0;
              return (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`relative p-2 rounded-xl ${active ? '' : ''}`}
                    style={active ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' } : {}}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.75} style={{ color: active ? '#6366F1' : '#475569' }} />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: active ? '#6366F1' : '#475569' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Progress bar variants */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Progress Bars</p>
          <div className="vf-card p-4 space-y-3">
            {[
              { label: 'Low 30%',    pct: 30, color: '#22C55E' },
              { label: 'Medium 55%', pct: 55, color: '#F59E0B' },
              { label: 'High 85%',   pct: 85, color: '#EF4444' },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px]" style={{ color: '#94A3B8' }}>{b.label}</span>
                </div>
                <div className="relative h-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-2"
                    initial={{ width: 0 }} animate={{ width: `${b.pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    style={{ background: `linear-gradient(90deg, ${b.color}88, ${b.color})` }}
                  >
                    <span className="text-[10px] font-bold text-white">{b.pct}%</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-4" />
      </div>
    </PageContainer>
  );
}
