'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, TrendingDown, ArrowUpDown, Utensils, Beer, Toilet, DoorOpen, ShoppingBag, Star } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';

interface QueueItem {
  id: string;
  name: string;
  wait: number;
  density: number;
  status: 'high' | 'medium' | 'low';
  icon: React.ElementType;
  personalEst: number;
}

const INITIAL: QueueItem[] = [
  { id: 'q1', name: 'Pavilion Food Court',     wait: 18, density: 85, status: 'high',   icon: Utensils,   personalEst: 11 },
  { id: 'q2', name: 'KSCA Refreshment Zone',   wait: 12, density: 72, status: 'high',   icon: Beer,       personalEst: 14 },
  { id: 'q3', name: 'North Block Restrooms',   wait: 8,  density: 61, status: 'medium', icon: Toilet,     personalEst: 9  },
  { id: 'q4', name: 'Gate 5 (MG Road)',         wait: 6,  density: 55, status: 'medium', icon: DoorOpen,   personalEst: 7  },
  { id: 'q5', name: 'Merch & Fan Zone',         wait: 5,  density: 48, status: 'medium', icon: ShoppingBag,personalEst: 6  },
  { id: 'q6', name: 'Corporate Lounge Bar',     wait: 2,  density: 30, status: 'low',    icon: Utensils,   personalEst: 2  },
  { id: 'q7', name: 'Club House Entrance',      wait: 1,  density: 20, status: 'low',    icon: Star,       personalEst: 1  },
  { id: 'q8', name: 'South Block Restrooms',   wait: 0,  density: 10, status: 'low',    icon: Toilet,     personalEst: 0  },
];

const STATUS_META = {
  high:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  label: 'Busy'     },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Moderate' },
  low:    { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)',  label: 'Clear'    },
} as const;

type FilterKey = 'all' | 'high' | 'medium' | 'low';
type SortKey   = 'wait' | 'density';

export default function QueuesPage() {
  const [queues, setQueues] = useState<QueueItem[]>(INITIAL);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort,   setSort]   = useState<SortKey>('wait');

  useEffect(() => {
    const id = setInterval(() => {
      setQueues(prev => prev.map(q => {
        const drift = Math.round((Math.random() - 0.5) * 4);
        const w = Math.max(0, q.wait + drift);
        const d = Math.min(100, Math.max(0, q.density + drift * 2));
        const s: QueueItem['status'] = d >= 70 ? 'high' : d >= 45 ? 'medium' : 'low';
        return { ...q, wait: w, density: d, status: s };
      }));
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const avgWait  = useMemo(() => Math.round(queues.reduce((s, q) => s + q.wait, 0) / queues.length), [queues]);
  const clearCnt = useMemo(() => queues.filter(q => q.status === 'low').length, [queues]);

  const displayed = useMemo(() =>
    queues
      .filter(q => filter === 'all' || q.status === filter)
      .sort((a, b) => sort === 'wait' ? b.wait - a.wait : b.density - a.density),
  [queues, filter, sort]);

  const FILTERS: { key: FilterKey; label: string; color: string; bg: string }[] = [
    { key: 'all',    label: 'All',      color: '#FDB913', bg: 'rgba(253,185,19,0.12)'  },
    { key: 'high',   label: 'Busy',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
    { key: 'medium', label: 'Moderate', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
    { key: 'low',    label: 'Clear',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  ];

  return (
    <PageContainer>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(253,185,19,0.12)', border: '1px solid rgba(253,185,19,0.3)' }}>
              <Clock size={17} style={{ color: '#FDB913' }} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold leading-tight" style={{ color: '#F1F5F9' }}>Queue Times</h1>
              <p className="text-[11px]" style={{ color: '#475569' }}>M. Chinnaswamy Stadium</p>
            </div>
          </div>
          <button onClick={() => setSort(s => s === 'wait' ? 'density' : 'wait')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
            <ArrowUpDown size={12} />
            {sort === 'wait' ? 'By wait' : 'By density'}
          </button>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(253,185,19,0.12), rgba(200,16,46,0.08))', border: '1px solid rgba(253,185,19,0.2)' }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#94A3B8' }}>Average Wait</p>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-black" style={{ color: '#F1F5F9', lineHeight: 1 }}>{avgWait}</span>
              <span className="text-xl font-bold mb-1" style={{ color: '#FDB913' }}>min</span>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-1.5"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <TrendingDown size={12} style={{ color: '#22C55E' }} />
              <span className="text-[12px] font-bold" style={{ color: '#22C55E' }}>Improving</span>
            </div>
            <p className="text-[11px]" style={{ color: '#475569' }}>{clearCnt} zones clear</p>
          </div>
        </motion.div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map(f => {
            const active = filter === f.key;
            const cnt = f.key === 'all' ? queues.length : queues.filter(q => q.status === f.key).length;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                style={{ background: active ? f.color : f.bg, color: active ? '#fff' : f.color, border: `1px solid ${active ? f.color : 'transparent'}` }}>
                {f.label} · {cnt}
              </button>
            );
          })}
        </div>

        {/* Queue list */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-2.5">
            {displayed.map((q, i) => {
              const { color, bg, border, label } = STATUS_META[q.status];
              const Icon = q.icon;
              return (
                <motion.div key={q.id} layout
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }} className="vf-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: bg, border: `1px solid ${border}` }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold truncate" style={{ color: '#F1F5F9' }}>{q.name}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0"
                          style={{ color, background: bg, border: `1px solid ${border}` }}>{label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Clock size={11} style={{ color: '#475569' }} />
                          <span className="text-[13px] font-bold" style={{ color }}>
                            {q.wait === 0 ? 'No wait' : `~${q.wait} min`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={11} style={{ color: '#475569' }} />
                          <span className="text-[12px]" style={{ color: '#94A3B8' }}>{q.density}% full</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-6 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-2"
                      animate={{ width: `${q.density}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{ background: `linear-gradient(90deg, ${color}77, ${color})`, minWidth: q.density > 12 ? undefined : '32px' }}>
                      <span className="text-[10px] font-bold text-white">{q.density}%</span>
                    </motion.div>
                  </div>
                  <p className="text-[11px]" style={{ color: '#475569' }}>
                    Your estimated time: <span className="font-semibold" style={{ color: '#94A3B8' }}>{q.personalEst === 0 ? 'No wait' : `${q.personalEst} min`}</span>
                  </p>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
        {displayed.length === 0 && (
          <div className="vf-card p-8 text-center mt-2">
            <p className="text-[14px]" style={{ color: '#475569' }}>No queues match this filter</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
