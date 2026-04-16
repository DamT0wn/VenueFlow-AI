'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, LogIn, Zap } from 'lucide-react';
import { firebaseAuth } from '../../../lib/firebase';

// ──────────────────────────────────────────────────────────────────────────────
// Form schema
// ──────────────────────────────────────────────────────────────────────────────

const EmailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type EmailLoginValues = z.infer<typeof EmailLoginSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Design tokens as CSS values (resolved from globals.css vars where needed)
// ──────────────────────────────────────────────────────────────────────────────

const css = {
  bg:        'bg-[#0A0E1A]',
  surface:   'bg-[#111827]',
  elevated:  'bg-[#1F2937]',
  border:    'border-[#374151]',
  primary:   'text-[#F9FAFB]',
  secondary: 'text-[#9CA3AF]',
  muted:     'text-[#6B7280]',
  accent:    '#6366F1',
  danger:    '#EF4444',
};

// ──────────────────────────────────────────────────────────────────────────────
// Login Page
// ──────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/map';
  const shouldReduceMotion = useReducedMotion();

  const [isLoading, setIsLoading] = useState<'google' | 'email' | 'anon' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginValues>({ resolver: zodResolver(EmailLoginSchema) });

  const onSuccess = (): void => {
    router.replace(callbackUrl);
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setIsLoading('google');
    setErrorMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      if (!firebaseAuth) throw new Error('Firebase not initialised');
      await signInWithPopup(firebaseAuth, provider);
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed';
      setErrorMessage(msg.includes('config') ? 'Firebase is not configured. Add Firebase credentials to .env.local.' : 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleEmailSignIn = async (values: EmailLoginValues): Promise<void> => {
    setIsLoading('email');
    setErrorMessage(null);
    try {
      if (!firebaseAuth) throw new Error('Firebase not initialised');
      await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
      onSuccess();
    } catch {
      setErrorMessage('Invalid email or password.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleAnonymousSignIn = async (): Promise<void> => {
    setIsLoading('anon');
    setErrorMessage(null);
    try {
      if (!firebaseAuth) throw new Error('Firebase not initialised');
      await signInAnonymously(firebaseAuth);
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setErrorMessage(msg.includes('emulator') || msg.includes('network') ? 'Firebase emulator not running. Start it with: firebase emulators:start' : 'Could not connect. Please check your network.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <main
      id="main-content"
      className={`min-h-screen flex flex-col items-center justify-center px-6 py-12 ${css.bg}`}
    >
      <motion.div
        className="w-full max-w-sm"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Card */}
        <div
          className={`rounded-2xl p-8 border ${css.surface} ${css.border}`}
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
        >
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap size={28} style={{ color: css.accent }} aria-hidden="true" />
              <h1 className={`text-2xl font-bold tracking-tight ${css.primary}`}>
                VenueFlow AI
              </h1>
            </div>
            <p className={`text-sm ${css.secondary}`}>Your real-time venue companion</p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(239,68,68,0.12)',
                border: `1px solid rgba(239,68,68,0.3)`,
                color: css.danger,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Google */}
          <button
            onClick={() => void handleGoogleSignIn()}
            disabled={isLoading !== null}
            className="w-full h-12 rounded-xl mb-3 bg-white font-semibold text-sm text-gray-800 flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading === 'google' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-3">
            <div className={`flex-1 h-px ${css.border} border-t`} />
            <span className={`text-xs ${css.muted}`}>or</span>
            <div className={`flex-1 h-px ${css.border} border-t`} />
          </div>

          {/* Email form */}
          <form onSubmit={(e) => { void handleSubmit(handleEmailSignIn)(e); }} noValidate>
            <div className="space-y-3 mb-3">
              <div>
                <label htmlFor="email" className={`text-xs mb-1 block ${css.secondary}`}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                  className={`w-full h-11 rounded-xl px-4 text-sm border ${css.elevated} ${css.border} ${css.primary} placeholder:text-[#6B7280] outline-none`}
                  style={{ transition: 'border-color 0.15s' }}
                  onFocus={(e) => { e.target.style.borderColor = css.accent; }}
                  onBlur={(e) => { e.target.style.borderColor = '#374151'; }}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p role="alert" className="text-xs mt-1" style={{ color: css.danger }}>
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className={`text-xs mb-1 block ${css.secondary}`}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                  className={`w-full h-11 rounded-xl px-4 text-sm border ${css.elevated} ${css.border} ${css.primary} placeholder:text-[#6B7280] outline-none`}
                  style={{ transition: 'border-color 0.15s' }}
                  onFocus={(e) => { e.target.style.borderColor = css.accent; }}
                  onBlur={(e) => { e.target.style.borderColor = '#374151'; }}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p role="alert" className="text-xs mt-1" style={{ color: css.danger }}>
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading !== null}
              className="w-full h-11 rounded-xl mb-3 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              style={{ backgroundColor: css.accent }}
            >
              {isLoading === 'email' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              Sign in with Email
            </button>
          </form>

          {/* Anonymous */}
          <button
            onClick={() => void handleAnonymousSignIn()}
            disabled={isLoading !== null}
            className={`w-full h-11 rounded-xl bg-transparent border text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 ${css.border} ${css.secondary}`}
            style={{ transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = css.accent;
              (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151';
              (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
            }}
          >
            {isLoading === 'anon' && <Loader2 size={16} className="animate-spin" />}
            Continue as Guest
          </button>

          {/* Demo note */}
          <p className={`mt-6 text-center text-xs ${css.muted}`}>
            Demo mode: start Firebase emulators for auth to work
          </p>
        </div>
      </motion.div>
    </main>
  );
}
