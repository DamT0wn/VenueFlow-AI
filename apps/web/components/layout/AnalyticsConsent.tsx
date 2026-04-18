'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, X, Check } from 'lucide-react';
import { grantAnalyticsConsent, denyAnalyticsConsent, initAnalytics } from '../../lib/analytics';

const CONSENT_KEY = 'vf_analytics_consent';

/**
 * GDPR/privacy-compliant analytics consent banner.
 * Implements GA4 Consent Mode v2 — analytics_storage is denied by default
 * until the user explicitly accepts.
 *
 * Shown once; decision persisted to localStorage.
 */
export function AnalyticsConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === null) {
      // No decision yet — show banner after a short delay
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }
    // Already decided — initialise analytics if granted
    if (stored === 'granted') {
      initAnalytics();
      grantAnalyticsConsent();
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    initAnalytics();
    grantAnalyticsConsent();
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    denyAnalyticsConsent();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="dialog"
          aria-modal="false"
          aria-label="Analytics consent"
          className="fixed z-[60] left-3 right-3 rounded-3xl p-4"
          style={{
            bottom: 'calc(76px + env(safe-area-inset-bottom) + 8px)',
            background: 'rgba(15,22,41,0.97)',
            border: '1px solid rgba(99,102,241,0.25)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          }}
        >
          {/* Dismiss */}
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 p-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#475569' }}
            aria-label="Decline analytics and close"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <BarChart2 size={16} style={{ color: '#6366F1' }} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold mb-0.5" style={{ color: '#F1F5F9' }}>
                Help us improve VenueFlow
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: '#94A3B8' }}>
                We use Google Analytics to understand how the app is used. No personal data is collected.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAccept}
              className="flex-1 h-10 rounded-2xl flex items-center justify-center gap-1.5 text-[13px] font-semibold"
              style={{ background: '#6366F1', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
            >
              <Check size={13} aria-hidden="true" /> Accept
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 h-10 rounded-2xl text-[13px] font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
