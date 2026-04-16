'use client';

import { motion } from 'framer-motion';
import { Bell, AlertOctagon, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';

const ALERTS = [
  {
    id: 'a1',
    type: 'evacuation',
    title: 'Crowd density critical',
    body: 'East Wing has reached 91% capacity. Please use alternative routes via West Wing.',
    time: '2 min ago',
    expired: false,
  },
  {
    id: 'a2',
    type: 'congestion',
    title: 'Food Court A — long queues',
    body: 'Estimated 18-minute wait. Food Court B is nearly empty — 2 min walk.',
    time: '8 min ago',
    expired: false,
  },
  {
    id: 'a3',
    type: 'info',
    title: 'Half-time in 15 minutes',
    body: 'Restroom queues expected to spike. Consider visiting before the break.',
    time: '12 min ago',
    expired: false,
  },
  {
    id: 'a4',
    type: 'congestion',
    title: 'Exit Gate 2 cleared',
    body: 'Wait time has dropped to under 2 minutes.',
    time: '25 min ago',
    expired: true,
  },
];

const ALERT_STYLES = {
  evacuation: { icon: AlertOctagon,  color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  label: 'Critical' },
  congestion: { icon: AlertTriangle, color: '#EAB308', bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.3)',  label: 'Warning'  },
  info:       { icon: Info,          color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', label: 'Info'     },
} as const;

export default function AlertsPage() {
  const active = ALERTS.filter(a => !a.expired);
  const past   = ALERTS.filter(a =>  a.expired);

  return (
    <PageContainer>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-vf-accent-primary" />
            <h1 className="text-lg font-bold text-vf-text-primary">Alerts</h1>
          </div>
          {active.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-vf-accent-danger text-white">
              {active.length} active
            </span>
          )}
        </div>

        {/* Active alerts */}
        <div className="space-y-3 mb-6">
          {active.map((alert, i) => {
            const { icon: Icon, color, bg, border, label } = ALERT_STYLES[alert.type as keyof typeof ALERT_STYLES];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-4"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <div className="flex items-start gap-3">
                  <Icon size={18} style={{ color }} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-vf-text-primary">{alert.title}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0"
                        style={{ color, background: `${color}22` }}>
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-vf-text-secondary leading-relaxed">{alert.body}</p>
                    <p className="text-[10px] text-vf-text-muted mt-2">{alert.time}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Past alerts */}
        {past.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-vf-text-muted mb-3">Resolved</h2>
            <div className="space-y-2">
              {past.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="vf-card p-3 opacity-60 flex items-center gap-3"
                >
                  <CheckCircle2 size={16} className="text-vf-accent-success shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-vf-text-secondary">{alert.title}</p>
                    <p className="text-[10px] text-vf-text-muted">{alert.time} · Resolved</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
