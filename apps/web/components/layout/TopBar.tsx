'use client';

import { memo, useEffect, useState } from 'react';
import { useVenueStore } from '../../store/venueStore';
import { MapPin, Eye, WifiOff, Accessibility } from 'lucide-react';
import { getSocket } from '../../lib/socket';

// IPL 2026 match colours
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

export const TopBar = memo(function TopBar() {
  const venueName                = useVenueStore(s => s.venueName);
  const toggleColourblindMode    = useVenueStore(s => s.toggleColourblindMode);
  const isColourblindModeEnabled = useVenueStore(s => s.isColourblindModeEnabled);
  const toggleTextMode           = useVenueStore(s => s.toggleTextMode);
  const isTextModeEnabled        = useVenueStore(s => s.isTextModeEnabled);
  const connected                = useConnectionStatus();
  const now                      = useClock();

  const timeStr = now?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex flex-col"
      style={{
        background: 'rgba(10,15,28,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
      role="banner"
    >
      {/* ── Matchday banner ── */}
      <div className="flex items-center justify-center gap-2 py-1 px-4"
        style={{ background: `linear-gradient(90deg, ${CSK}18, ${RCB}18)`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-[11px] font-black tracking-wide" style={{ color: CSK }}>CSK</span>
        <span className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>vs</span>
        <span className="text-[11px] font-black tracking-wide" style={{ color: RCB }}>RCB</span>
        <span className="text-[10px]" style={{ color: '#475569' }}>·</span>
        <span className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>IPL 2026</span>
        <span className="text-[10px]" style={{ color: '#475569' }}>·</span>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: RCB }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: RCB }} />
        </span>
        <span className="text-[10px] font-bold" style={{ color: RCB }}>LIVE</span>
      </div>

      {/* ── Main bar ── */}
      <div className="flex items-center justify-between px-4 h-[48px]">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
            style={{ background: `${CSK}22`, border: `1px solid ${CSK}44` }}>
            <MapPin size={12} style={{ color: CSK }} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: '#F1F5F9' }}>{venueName}</p>
            <p className="text-[9px] leading-tight" style={{ color: '#475569' }}>18 Apr 2026 · Bengaluru</p>
          </div>
          {/* Connection pill */}
          <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: connected ? 'rgba(34,197,94,0.12)' : 'rgba(71,85,105,0.15)',
              border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(71,85,105,0.25)'}`,
            }}>
            {connected ? (
              <span className="text-[9px] font-bold" style={{ color: '#22C55E' }}>LIVE</span>
            ) : (
              <WifiOff size={8} style={{ color: '#475569' }} />
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold tabular-nums" style={{ color: '#94A3B8' }}>{timeStr}</span>
          <button
            onClick={toggleColourblindMode}
            aria-pressed={isColourblindModeEnabled}
            aria-label="Toggle colourblind mode"
            className="touch-target rounded-xl"
            style={{ color: isColourblindModeEnabled ? CSK : '#475569' }}
          >
            <Eye size={16} aria-hidden />
          </button>
          <button
            onClick={toggleTextMode}
            aria-pressed={isTextModeEnabled}
            aria-label="Toggle accessibility mode"
            className="touch-target rounded-xl"
            style={{ color: isTextModeEnabled ? '#38BDF8' : '#475569' }}
            title="Accessibility mode — wheelchair routes"
          >
            <Accessibility size={16} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
});
