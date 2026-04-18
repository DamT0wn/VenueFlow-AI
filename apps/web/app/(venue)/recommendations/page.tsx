'use client';

import { motion } from 'framer-motion';
import { Star, MapPin, Zap, Clock, ChevronRight, Navigation, Sparkles, DoorOpen, Utensils } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { useRouter } from 'next/navigation';

const SMART_CARDS = [
  {
    id: 'r1',
    title: 'Pavilion Food Court',
    subtitle: 'Best Pick',
    desc: 'Only 2 min wait · 28% capacity',
    walk: '3 min walk',
    badge: 'Best Pick',
    badgeColor: '#22C55E',
    badgeBg: 'rgba(34,197,94,0.15)',
    icon: Utensils,
    accent: '#22C55E',
    navigateTo: 'Pavilion Food Court',
    stat: { label: 'Wait', value: '2 min' },
  },
  {
    id: 'r2',
    title: 'South Block Restrooms',
    subtitle: 'No queue detected',
    desc: 'Nearest low-density option',
    walk: '2 min walk',
    badge: 'Quick Stop',
    badgeColor: '#FDB913',
    badgeBg: 'rgba(253,185,19,0.15)',
    icon: MapPin,
    accent: '#FDB913',
    navigateTo: 'South Block Restrooms',
    stat: { label: 'Wait', value: 'None' },
  },
  {
    id: 'r3',
    title: 'Exit via Gate 5 (MG Road)',
    subtitle: 'Smart Route',
    desc: 'Avoid Club House End congestion',
    walk: '5 min walk',
    badge: 'Smart Route',
    badgeColor: '#38BDF8',
    badgeBg: 'rgba(56,189,248,0.15)',
    icon: DoorOpen,
    accent: '#38BDF8',
    navigateTo: 'Gate 5 (MG Road)',
    stat: { label: 'Saves', value: '7 min' },
  },
] as const;

const SPOT_PICKS = [
  { name: 'Biryani Corner',    wait: 3, density: 32, emoji: '🍛', navigateTo: 'Pavilion Food Court' },
  { name: 'Masala Chai Stall', wait: 1, density: 18, emoji: '☕', navigateTo: 'Pavilion Food Court' },
  { name: 'Vada Pav Express',  wait: 2, density: 25, emoji: '🥙', navigateTo: 'Corporate Lounge Bar' },
  { name: 'IPL Fan Grill',     wait: 5, density: 44, emoji: '🍔', navigateTo: 'Corporate Lounge Bar' },
];

const PROACTIVE = [
  {
    id: 'p1',
    icon: Zap,
    color: '#C8102E',
    title: 'Head out before innings break',
    body: 'Predicted surge in 10 mins — restroom queues will spike at Chinnaswamy',
    badge: 'Heads Up',
    navigateTo: 'Gate 5 (MG Road)',
  },
];

export default function RecommendationsPage() {
  const router = useRouter();
  const nav = (dest: string) => router.push(`/navigate?to=${encodeURIComponent(dest)}`);

  return (
    <PageContainer>
      <div className="mt-2">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(253,185,19,0.15)', border: '1px solid rgba(253,185,19,0.3)' }}>
            <Star size={17} style={{ color: '#FDB913' }} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-tight" style={{ color: '#F1F5F9' }}>For You</h1>
            <div className="flex items-center gap-1">
              <Sparkles size={10} style={{ color: '#FDB913' }} />
              <p className="text-[11px]" style={{ color: '#475569' }}>AI-powered · IPL 2026 matchday</p>
            </div>
          </div>
        </div>
        <p className="text-[12px] mb-5 px-0.5" style={{ color: '#475569' }}>
          Live suggestions for CSK vs RCB at M. Chinnaswamy Stadium
        </p>

        {/* Carousel */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-5 -mx-4 px-4" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
          {SMART_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="shrink-0 rounded-2xl p-5 flex flex-col"
                style={{
                  width: '240px', scrollSnapAlign: 'start',
                  background: `linear-gradient(145deg, ${card.accent}18 0%, rgba(15,22,41,0.9) 100%)`,
                  border: `1px solid ${card.accent}33`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${card.accent}15`,
                }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: `${card.accent}20`, border: `1px solid ${card.accent}33` }}>
                    <Icon size={20} style={{ color: card.accent }} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ color: card.badgeColor, background: card.badgeBg, border: `1px solid ${card.badgeColor}33` }}>
                    {card.badge}
                  </span>
                </div>
                <p className="text-[16px] font-bold mb-0.5" style={{ color: '#F1F5F9' }}>{card.title}</p>
                <p className="text-[12px] mb-1" style={{ color: card.accent }}>{card.subtitle}</p>
                <p className="text-[12px] mb-3 flex-1" style={{ color: '#94A3B8' }}>{card.desc}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-xl px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] uppercase tracking-widest" style={{ color: '#475569' }}>{card.stat.label}</p>
                    <p className="text-[14px] font-bold" style={{ color: card.accent }}>{card.stat.value}</p>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: '#475569' }}>
                    <Clock size={11} />
                    <span className="text-[11px]">{card.walk}</span>
                  </div>
                </div>
                <button onClick={() => nav(card.navigateTo)}
                  className="w-full h-10 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold active:scale-95"
                  style={{ background: card.accent, color: '#fff', boxShadow: `0 4px 14px ${card.accent}44` }}>
                  <Navigation size={13} /> Navigate
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Proactive */}
        {PROACTIVE.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07 }}
              className="vf-card p-4 mb-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}33` }}>
                <Icon size={18} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-bold" style={{ color: '#F1F5F9' }}>{item.title}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}33` }}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: '#94A3B8' }}>{item.body}</p>
              </div>
              <button onClick={() => nav(item.navigateTo)} className="shrink-0 p-2 rounded-xl"
                style={{ background: `${item.color}18`, color: item.color }}>
                <ChevronRight size={15} />
              </button>
            </motion.div>
          );
        })}

        {/* Food spots */}
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-0.5" style={{ color: '#475569' }}>
          Low-Wait Food Spots
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SPOT_PICKS.map((spot, i) => (
            <motion.button key={spot.name}
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.06 }}
              onClick={() => nav(spot.navigateTo)}
              className="vf-card p-4 text-left active:scale-95 transition-transform">
              <p className="text-2xl mb-2">{spot.emoji}</p>
              <p className="text-[13px] font-semibold mb-1" style={{ color: '#F1F5F9' }}>{spot.name}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-bold" style={{ color: '#22C55E' }}>~{spot.wait}min</span>
                <span className="text-[11px]" style={{ color: '#475569' }}>{spot.density}% full</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: '#FDB913' }}>
                <Navigation size={11} />
                <span className="text-[11px] font-semibold">Navigate</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
