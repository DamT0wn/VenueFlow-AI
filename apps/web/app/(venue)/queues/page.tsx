'use client';

import { motion } from 'framer-motion';
import { Clock, Users, TrendingDown } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';

const QUEUES = [
  { id: 'q1', name: 'Food Court A',      wait: 18, density: 85, status: 'high'   },
  { id: 'q2', name: 'Beer Garden',        wait: 12, density: 72, status: 'high'   },
  { id: 'q3', name: 'Main Restrooms',     wait: 8,  density: 61, status: 'medium' },
  { id: 'q4', name: 'Exit Gate 1',        wait: 6,  density: 55, status: 'medium' },
  { id: 'q5', name: 'Merch Stand',        wait: 5,  density: 48, status: 'medium' },
  { id: 'q6', name: 'Food Court B',       wait: 2,  density: 30, status: 'low'    },
  { id: 'q7', name: 'VIP Entrance',       wait: 1,  density: 20, status: 'low'    },
  { id: 'q8', name: 'Restrooms Block B',  wait: 0,  density: 10, status: 'low'    },
];

const STATUS = {
  high:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Busy'   },
  medium: { color: '#EAB308', bg: 'rgba(234,179,8,0.12)',  label: 'Moderate' },
  low:    { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  label: 'Clear'  },
} as const;

export default function QueuesPage() {
  const avgWait = Math.round(QUEUES.reduce((s, q) => s + q.wait, 0) / QUEUES.length);

  return (
    <PageContainer>
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-vf-accent-primary" />
          <h1 className="text-lg font-bold text-vf-text-primary">Queue Times</h1>
        </div>

        {/* Summary banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 mb-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <div>
            <p className="text-xs text-vf-text-muted uppercase tracking-widest mb-1">Average Wait</p>
            <p className="text-4xl font-bold text-vf-text-primary">{avgWait}<span className="text-lg text-vf-text-secondary"> min</span></p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-vf-accent-success text-sm mb-1">
              <TrendingDown size={14} />
              <span className="font-semibold">Improving</span>
            </div>
            <p className="text-xs text-vf-text-muted">{QUEUES.filter(q => q.status === 'low').length} zones clear</p>
          </div>
        </motion.div>

        {/* Status filter pills */}
        <div className="flex gap-2 mb-4">
          {(['high', 'medium', 'low'] as const).map(s => (
            <div
              key={s}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ color: STATUS[s].color, background: STATUS[s].bg }}
            >
              {STATUS[s].label} · {QUEUES.filter(q => q.status === s).length}
            </div>
          ))}
        </div>

        {/* Queue list */}
        <div className="space-y-2">
          {QUEUES.map((q, i) => {
            const { color, bg, label } = STATUS[q.status];
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="vf-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-vf-text-primary">{q.name}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color, background: bg }}
                  >
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-vf-text-muted" />
                    <span className="text-sm font-bold" style={{ color }}>
                      {q.wait === 0 ? 'No wait' : `~${q.wait} min`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-vf-text-muted" />
                    <span className="text-xs text-vf-text-secondary">{q.density}% full</span>
                  </div>
                </div>

                {/* Density bar */}
                <div className="mt-3 h-1.5 rounded-full bg-vf-bg-elevated overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${q.density}%` }}
                    transition={{ delay: 0.2 + i * 0.04, duration: 0.7, ease: 'easeOut' }}
                    style={{ backgroundColor: color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
