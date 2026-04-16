'use client';

import { motion } from 'framer-motion';
import { Star, Utensils, Toilet, Zap, MapPin, ChevronRight, Clock } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';

const RECOMMENDATIONS = [
  {
    id: 'r1',
    category: 'food',
    title: 'Food Court B',
    subtitle: 'Only 2 min wait right now',
    reason: 'Low crowd · 30% capacity',
    badge: 'Best Pick',
    badgeColor: '#22C55E',
    walk: '4 min walk',
    icon: Utensils,
    accent: '#22C55E',
  },
  {
    id: 'r2',
    category: 'restroom',
    title: 'Restrooms Block B',
    subtitle: 'No queue detected',
    reason: 'Nearest low-density option',
    badge: 'Quick Stop',
    badgeColor: '#6366F1',
    walk: '2 min walk',
    icon: Toilet,
    accent: '#6366F1',
  },
  {
    id: 'r3',
    category: 'exit',
    title: 'Exit via Gate 3',
    subtitle: 'Fastest route to car parks',
    reason: 'Avoid East Wing congestion',
    badge: 'Smart Route',
    badgeColor: '#3B82F6',
    walk: '6 min walk',
    icon: MapPin,
    accent: '#3B82F6',
  },
  {
    id: 'r4',
    category: 'alert',
    title: 'Leave now for half-time',
    subtitle: 'Beat the rush in 15 mins',
    reason: 'Predicted surge — head out early',
    badge: 'Heads Up',
    badgeColor: '#EAB308',
    walk: 'Act now',
    icon: Zap,
    accent: '#EAB308',
  },
];

const SPOT_PICKS = [
  { name: 'Craft Beer Bar',   wait: 3,  density: 35, icon: '🍺' },
  { name: 'Burger Stand',     wait: 7,  density: 58, icon: '🍔' },
  { name: 'Nachos Corner',    wait: 1,  density: 22, icon: '🌮' },
  { name: 'Coffee Kiosk',     wait: 4,  density: 41, icon: '☕' },
];

export default function RecommendationsPage() {
  return (
    <PageContainer>
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1">
          <Star size={20} className="text-vf-accent-primary" />
          <h1 className="text-lg font-bold text-vf-text-primary">For You</h1>
        </div>
        <p className="text-xs text-vf-text-muted mb-5">AI-powered suggestions based on live conditions</p>

        {/* Top recommendations */}
        <div className="space-y-3 mb-6">
          {RECOMMENDATIONS.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="vf-card p-4 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${rec.accent}20` }}
                  >
                    <Icon size={18} style={{ color: rec.accent }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold text-vf-text-primary">{rec.title}</p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0"
                        style={{ color: rec.badgeColor, background: `${rec.badgeColor}22` }}
                      >
                        {rec.badge}
                      </span>
                    </div>
                    <p className="text-xs text-vf-text-secondary mb-1">{rec.subtitle}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-vf-text-muted">{rec.reason}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-vf-border">
                  <div className="flex items-center gap-1 text-vf-text-muted">
                    <Clock size={11} />
                    <span className="text-[11px]">{rec.walk}</span>
                  </div>
                  <span className="text-[11px] text-vf-accent-primary font-medium flex items-center gap-1">
                    Navigate <ChevronRight size={11} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Spot picks */}
        <h2 className="text-xs font-semibold uppercase tracking-widest text-vf-text-muted mb-3">Low-Wait Food Spots</h2>
        <div className="grid grid-cols-2 gap-3">
          {SPOT_PICKS.map((spot, i) => (
            <motion.div
              key={spot.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="vf-card p-3 cursor-pointer"
            >
              <p className="text-2xl mb-1">{spot.icon}</p>
              <p className="text-xs font-semibold text-vf-text-primary">{spot.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-vf-accent-success font-bold">~{spot.wait}min</span>
                <span className="text-[10px] text-vf-text-muted">{spot.density}% full</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
