'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Stadium SVG paths ─────────────────────────────────────────────────────────
// Outer oval → inner oval → pitch rectangle → stumps → crowd dots

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'stadium' | 'morph' | 'logo' | 'done'>('stadium');

  useEffect(() => {
    // Phase timeline
    const t1 = setTimeout(() => setPhase('morph'),   1400);
    const t2 = setTimeout(() => setPhase('logo'),    2200);
    const t3 = setTimeout(() => setPhase('done'),    3400);
    const t4 = setTimeout(() => onComplete(),        3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#050810' }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Ambient radial glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'stadium' ? 0.4 : phase === 'morph' ? 0.7 : 0.9 }}
            transition={{ duration: 0.8 }}
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.25) 0%, rgba(200,16,46,0.1) 50%, transparent 100%)',
            }}
          />

          {/* Orbiting ring 1 */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 320, height: 320,
              border: '1px solid rgba(99,102,241,0.15)',
              top: '50%', left: '50%',
              marginTop: -160, marginLeft: -160,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          {/* Orbiting ring 2 */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 420, height: 420,
              border: '1px solid rgba(253,185,19,0.08)',
              top: '50%', left: '50%',
              marginTop: -210, marginLeft: -210,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />

          {/* Stadium SVG */}
          <AnimatePresence mode="wait">
            {(phase === 'stadium' || phase === 'morph') && (
              <motion.div
                key="stadium-svg"
                initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
                animate={{
                  scale: phase === 'morph' ? 0.6 : 1,
                  opacity: phase === 'morph' ? 0 : 1,
                  rotate: phase === 'morph' ? 15 : 0,
                  y: phase === 'morph' ? -40 : 0,
                }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative"
              >
                <StadiumSVG />
              </motion.div>
            )}

            {phase === 'logo' && (
              <motion.div
                key="logo"
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex flex-col items-center gap-4"
              >
                {/* App icon */}
                <motion.div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #C8102E 100%)',
                    boxShadow: '0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(200,16,46,0.3)',
                  }}
                  animate={{ boxShadow: ['0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(200,16,46,0.3)', '0 0 80px rgba(99,102,241,0.7), 0 0 160px rgba(200,16,46,0.5)', '0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(200,16,46,0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-4xl">🏟️</span>
                  {/* Shimmer overlay */}
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.div>

                {/* Brand name */}
                <motion.div className="text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h1 className="text-4xl font-black tracking-tight" style={{ color: '#F1F5F9', letterSpacing: '-0.02em' }}>
                    Venue<span style={{ color: '#6366F1' }}>Flow</span>
                  </h1>
                  <p className="text-sm font-semibold mt-1 tracking-widest uppercase" style={{ color: '#FDB913' }}>
                    AI · IPL 2026
                  </p>
                </motion.div>

                {/* Loading bar */}
                <motion.div
                  className="w-48 h-0.5 rounded-full overflow-hidden mt-2"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366F1, #FDB913, #C8102E)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.0, ease: 'easeInOut', delay: 0.1 }}
                  />
                </motion.div>

                <motion.p
                  className="text-xs font-medium"
                  style={{ color: '#475569' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Real-time venue intelligence
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Crowd dots — scattered particles */}
          <CrowdParticles active={phase === 'stadium'} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Stadium SVG ───────────────────────────────────────────────────────────────
function StadiumSVG() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer stadium oval */}
      <motion.ellipse
        cx="100" cy="80" rx="95" ry="72"
        stroke="rgba(99,102,241,0.6)" strokeWidth="2"
        fill="rgba(99,102,241,0.04)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {/* Inner stands */}
      <motion.ellipse
        cx="100" cy="80" rx="72" ry="52"
        stroke="rgba(253,185,19,0.4)" strokeWidth="1.5"
        fill="rgba(253,185,19,0.03)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      />
      {/* Pitch rectangle */}
      <motion.rect
        x="82" y="62" width="36" height="36" rx="4"
        stroke="rgba(34,197,94,0.6)" strokeWidth="1.5"
        fill="rgba(34,197,94,0.08)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: '100px 80px' }}
      />
      {/* Cricket stumps */}
      {[88, 100, 112].map((x, i) => (
        <motion.line
          key={x}
          x1={x} y1="66" x2={x} y2="94"
          stroke="rgba(253,185,19,0.8)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 + i * 0.08 }}
          style={{ transformOrigin: `${x}px 80px` }}
        />
      ))}
      {/* Crowd dots — stands */}
      {CROWD_DOTS.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x} cy={dot.y} r={dot.r}
          fill={dot.color}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: dot.opacity }}
          transition={{ duration: 0.3, delay: 0.4 + i * 0.015 }}
          style={{ transformOrigin: `${dot.x}px ${dot.y}px` }}
        />
      ))}
      {/* Floodlight towers */}
      {[
        { x: 14, y: 20 }, { x: 186, y: 20 },
        { x: 14, y: 140 }, { x: 186, y: 140 },
      ].map((pos, i) => (
        <motion.g key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 + i * 0.05 }}
          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
        >
          <circle cx={pos.x} cy={pos.y} r="5" fill="rgba(253,185,19,0.9)" />
          <circle cx={pos.x} cy={pos.y} r="10" fill="rgba(253,185,19,0.15)" />
          <circle cx={pos.x} cy={pos.y} r="16" fill="rgba(253,185,19,0.06)" />
        </motion.g>
      ))}
    </svg>
  );
}

// ── Crowd dot positions (pre-computed around the oval) ────────────────────────
const CROWD_DOTS = Array.from({ length: 48 }, (_, i) => {
  const angle = (i / 48) * Math.PI * 2;
  const radiusX = 83 + (Math.random() - 0.5) * 10;
  const radiusY = 62 + (Math.random() - 0.5) * 8;
  const colors = ['#FDB913', '#C8102E', '#6366F1', '#22C55E', '#F1F5F9'];
  return {
    x: 100 + Math.cos(angle) * radiusX,
    y: 80 + Math.sin(angle) * radiusY,
    r: 1.5 + Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 0.4 + Math.random() * 0.5,
  };
});

// ── Floating crowd particles ──────────────────────────────────────────────────
function CrowdParticles({ active }: { active: boolean }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 20 + Math.random() * 60,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 1.2,
    color: ['#FDB913', '#C8102E', '#6366F1', '#22C55E'][Math.floor(Math.random() * 4)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={active ? {
            opacity: [0, 0.8, 0],
            y: [-20, -60],
            x: [(Math.random() - 0.5) * 30],
          } : { opacity: 0 }}
          transition={{
            duration: 2 + Math.random(),
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
