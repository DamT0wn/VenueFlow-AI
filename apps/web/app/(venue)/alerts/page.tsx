'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertOctagon, AlertTriangle, Info, CheckCircle2, X, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { useVenueStore } from '../../../store/venueStore';
import { connectToVenue } from '../../../lib/socket';
import { useRouter } from 'next/navigation';

interface AlertItem {
  id: string;
  type: 'evacuation' | 'congestion' | 'info';
  title: string;
  body: string;
  time: string;
  expired: boolean;
  isNew?: boolean;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'a1', type: 'evacuation',
    title: 'Club House End at 94% capacity',
    body: 'Club House End has reached 94% capacity. Use North Stand entrances via Gate 2 or Gate 3.',
    time: '2 min ago', expired: false,
  },
  {
    id: 'a2', type: 'congestion',
    title: 'Pavilion Food Court — 18 min wait',
    body: 'Corporate Lounge Bar is nearly empty — only 2 min walk from Section B.',
    time: '8 min ago', expired: false,
  },
  {
    id: 'a3', type: 'info',
    title: 'Innings break in 10 minutes',
    body: 'Restroom queues expected to spike at innings break. Consider visiting North Block Restrooms now.',
    time: '12 min ago', expired: false,
  },
  {
    id: 'a4', type: 'congestion',
    title: 'Gate 5 (MG Road) cleared',
    body: 'Wait time has dropped to under 2 minutes.',
    time: '25 min ago', expired: true,
  },
];

const ALERT_META = {
  evacuation: { Icon: AlertOctagon,  color: '#C8102E', bg: 'rgba(200,16,46,0.08)',   border: 'rgba(200,16,46,0.25)',  glow: 'rgba(200,16,46,0.15)',  label: 'Critical', showNavigate: true  },
  congestion: { Icon: AlertTriangle, color: '#FDB913', bg: 'rgba(253,185,19,0.08)',  border: 'rgba(253,185,19,0.25)', glow: '',                      label: 'Warning',  showNavigate: true  },
  info:       { Icon: Info,          color: '#38BDF8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)', glow: '',                      label: 'Info',     showNavigate: false },
} as const;

export default function AlertsPage() {
  const { venueId } = useVenueStore();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [resolvedOpen, setResolvedOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const socket = connectToVenue(venueId);
    const onNew = (alert: Omit<AlertItem, 'time' | 'isNew'>) => {
      setAlerts(prev => [{ ...alert, time: 'just now', expired: false, isNew: true }, ...prev]);
      setLastUpdated(new Date());
    };
    socket.on('alert:new', onNew);
    return () => { socket.off('alert:new', onNew); };
  }, [venueId]);

  const dismiss = (id: string) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, expired: true, isNew: false } : a));

  const active   = alerts.filter(a => !a.expired);
  const resolved = alerts.filter(a =>  a.expired);

  return (
    <PageContainer>
      <div className="mt-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
              <Bell size={17} style={{ color: '#C8102E' }} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold leading-tight" style={{ color: '#F1F5F9' }}>Alerts</h1>
              <p className="text-[11px]" style={{ color: '#475569' }}>
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · 18 Apr 2026
              </p>
            </div>
          </div>
          {active.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#C8102E' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#C8102E' }} />
              </span>
              <span className="text-[12px] font-bold" style={{ color: '#C8102E' }}>{active.length} active</span>
            </div>
          )}
        </div>

        {active.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="vf-card p-10 text-center mb-5">
            <CheckCircle2 size={40} style={{ color: '#22C55E', margin: '0 auto 12px' }} />
            <p className="text-[15px] font-semibold" style={{ color: '#F1F5F9' }}>All clear</p>
            <p className="text-[13px]" style={{ color: '#475569' }}>No active alerts at Chinnaswamy</p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          <div className="space-y-3 mb-5">
            {active.map((alert, i) => {
              const { Icon, color, bg, border, glow, label, showNavigate } = ALERT_META[alert.type];
              return (
                <motion.div key={alert.id} layout
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.95 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl p-4 relative"
                  style={{ background: bg, border: `1px solid ${border}`, boxShadow: glow ? `0 0 24px ${glow}` : undefined }}>
                  {alert.isNew && (
                    <span className="absolute top-3 right-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: color }}>NEW</span>
                  )}
                  <button onClick={() => dismiss(alert.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }} aria-label="Dismiss">
                    <X size={13} style={{ color: '#94A3B8' }} />
                  </button>
                  <div className="flex items-start gap-3 pr-8">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] font-bold" style={{ color: '#F1F5F9' }}>{alert.title}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ color, background: `${color}18`, border: `1px solid ${color}33` }}>{label}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed mb-2" style={{ color: '#94A3B8' }}>{alert.body}</p>
                      <p className="text-[11px]" style={{ color: '#475569' }}>{alert.time}</p>
                    </div>
                  </div>
                  {showNavigate && (
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${color}22` }}>
                      <button onClick={() => router.push('/navigate')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold active:scale-95"
                        style={{ background: color, color: '#fff', boxShadow: `0 4px 12px ${color}44` }}>
                        <Navigation size={12} /> Navigate now
                      </button>
                      <button onClick={() => dismiss(alert.id)}
                        className="px-3 py-2 rounded-xl text-[12px] font-medium"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {resolved.length > 0 && (
          <div>
            <button onClick={() => setResolvedOpen(o => !o)}
              className="w-full flex items-center justify-between px-1 py-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
                Resolved · {resolved.length}
              </span>
              {resolvedOpen ? <ChevronUp size={14} style={{ color: '#475569' }} /> : <ChevronDown size={14} style={{ color: '#475569' }} />}
            </button>
            <AnimatePresence>
              {resolvedOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                  {resolved.map((alert, i) => (
                    <motion.div key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={{ delay: i * 0.04 }}
                      className="vf-card p-3 flex items-center gap-3">
                      <CheckCircle2 size={16} style={{ color: '#22C55E' }} className="shrink-0" />
                      <div className="flex-1">
                        <p className="text-[13px]" style={{ color: '#94A3B8' }}>{alert.title}</p>
                        <p className="text-[11px]" style={{ color: '#475569' }}>{alert.time} · Resolved</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
