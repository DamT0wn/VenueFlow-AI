'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVenueStore } from '../../store/venueStore';
import { Eye, WifiOff, Accessibility, Zap } from 'lucide-react';
import { getSocket } from '../../lib/socket';

const CSK = '#FDB913';
const RCB = '#C8102E';

function useConnectionStatus() {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const s = getSocket();
    const on  = () => setConnected(true);
    const off = () => setConnected(false);
    s.on('connect', on);
    s.on('disconnect', off);
    setConnected(s.connected);
    return () => { s.off('connect', on); s.off('disconnect', off); };
  }, []);
  return connected;
}

function useClock() {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Score ticker items ────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '🏏 CSK vs RCB · IPL 2026',
  '📍 M. Chinnaswamy Stadium · Bengaluru',
  '👥 ~38,000 fans in attendance',
  '⚡ Innings break in ~10 min',
  '🔴 East Stand (B) at 91% — avoid',
  '✅ South Stand clear — 42%',
];

export const TopBar = memo(function TopBar() {
  const venueName                = useVenueStore(s => s.venueName);
  const toggleColourblindMode    = useVenueStore(s => s.toggleColourblindMode);
  const isColourblindModeEnabled = useVenueStore(s => s.isColourblindModeEnabled);
  const toggleTextMode           = useVenueStore(s => s.toggleTextMode);
  const isTextModeEnabled        = useVenueStore(s => s.isTextModeEnabled);
  const connected                = useConnectionStatus();
  const now                      = useClock();
  const [tickerIdx, setTickerIdx] = useState(0);

  const timeStr = now?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '';

  useEffect(() => {
    const id = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_ITEMS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex flex-col"
      style={{
        background: 'rgba(5,8,16,0.95)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
      role="banner"
    >
      {/* ── Matchday banner with animated ticker ── */}
      <div className="relative flex items-center justify-between px-4 py-1.5 overflow-hidden"
        style={{ background: `linear-gradient(90deg, ${CSK}14, rgba(99,102,241,0.08), ${RCB}14)`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

        {/* CSK badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
            style={{ background: `${CSK}22`, border: `1px solid ${CSK}44`, color: CSK }}>
            CSK
          </div>
        </div>

        {/* Animated ticker */}
        <div className="flex-1 mx-3 overflow-hidden text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={tickerIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] font-semibold truncate"
              style={{ color: '#94A3B8' }}
            >
              {TICKER_ITEMS[tickerIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* RCB badge + LIVE */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: RCB }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: RCB }} />
            </span>
            <span className="text-[10px] font-black" style={{ color: RCB }}>LIVE</span>
          </div>
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
            style={{ background: `${RCB}22`, border: `1px solid ${RCB}44`, color: RCB }}>
            RCB
          </div>
        </div>
      </div>

      {/* ── Main bar ── */}
      <div className="flex items-center justify-between px-4 h-[48px]">
        {/* Left — brand + venue */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo mark */}
          <motion.div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6366F1, #C8102E)' }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-sm">🏟️</span>
          </motion.div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold truncate leading-tight" style={{ color: '#F1F5F9' }}>
                Venue<span style={{ color: '#6366F1' }}>Flow</span>
              </p>
              {/* Connection pill */}
              <AnimatePresence mode="wait">
                {connected ? (
                  <motion.div
                    key="live"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
                  >
                    <Zap size={8} style={{ color: '#22C55E' }} />
                    <span className="text-[9px] font-bold" style={{ color: '#22C55E' }}>LIVE</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(71,85,105,0.15)', border: '1px solid rgba(71,85,105,0.25)' }}
                  >
                    <WifiOff size={8} style={{ color: '#475569' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[9px] leading-tight truncate" style={{ color: '#475569' }}>
              {venueName}
            </p>
          </div>
        </div>

        {/* Right — time + toggles */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold tabular-nums mr-1" style={{ color: '#94A3B8' }}>{timeStr}</span>

          <motion.button
            onClick={toggleColourblindMode}
            aria-pressed={isColourblindModeEnabled}
            aria-label="Toggle colourblind mode"
            whileTap={{ scale: 0.85 }}
            className="touch-target rounded-xl flex items-center justify-center"
            style={{
              color: isColourblindModeEnabled ? CSK : '#475569',
              background: isColourblindModeEnabled ? `${CSK}15` : 'transparent',
              border: isColourblindModeEnabled ? `1px solid ${CSK}33` : '1px solid transparent',
              width: 32, height: 32, minWidth: 32, minHeight: 32,
            }}
          >
            <Eye size={15} aria-hidden />
          </motion.button>

          <motion.button
            onClick={toggleTextMode}
            aria-pressed={isTextModeEnabled}
            aria-label="Toggle accessibility mode"
            whileTap={{ scale: 0.85 }}
            className="touch-target rounded-xl flex items-center justify-center"
            style={{
              color: isTextModeEnabled ? '#38BDF8' : '#475569',
              background: isTextModeEnabled ? 'rgba(56,189,248,0.12)' : 'transparent',
              border: isTextModeEnabled ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
              width: 32, height: 32, minWidth: 32, minHeight: 32,
            }}
          >
            <Accessibility size={15} aria-hidden />
          </motion.button>
        </div>
      </div>
    </header>
  );
});
