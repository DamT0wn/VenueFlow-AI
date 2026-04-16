'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithRedirect,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, LogIn, Zap, FlaskConical } from 'lucide-react';
import { getClientAuth } from '../../../lib/firebase';

// ──────────────────────────────────────────────────────────────────────────────
// Form schema
// ──────────────────────────────────────────────────────────────────────────────

const EmailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type EmailLoginValues = z.infer<typeof EmailLoginSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Design tokens
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
  success:   '#22C55E',
};

const USE_EMULATOR = process.env['NEXT_PUBLIC_USE_EMULATOR'] === 'true';
const DEV_EMAIL    = 'dev@venueflow.local';
const DEV_PASSWORD = 'devpass123';

// ──────────────────────────────────────────────────────────────────────────────
// Login Page
// ──────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/map';
  const shouldReduceMotion = useReducedMotion();

  const [isLoading, setIsLoading] = useState<'google' | 'email' | 'anon' | 'dev' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginValues>({ resolver: zodResolver(EmailLoginSchema) });

  /**
   * Writes the session cookie immediately after sign-in, then navigates.
   *
   * We must write the cookie BEFORE calling router.replace() so the middleware
   * sees it on the very first request to the destination page.
   * We poll `currentUser` briefly to handle the async emulator sign-in delay.
   */
  const onSuccess = async (destination = callbackUrl): Promise<void> => {
    const auth = getClientAuth();
    if (!auth) {
      router.replace(destination);
      return;
    }

    // The emulator can take a tick to populate currentUser after signIn resolves.
    // Wait up to 500 ms for the user object to appear.
    let attempts = 0;
    while (!auth.currentUser && attempts < 10) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      attempts++;
    }

    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        const claims = await auth.currentUser.getIdTokenResult();
        const role = claims.claims['role'] as string | undefined;
        // SameSite=Lax so the cookie survives redirect-based flows
        document.cookie = `__session=${token}; path=/; SameSite=Lax; max-age=3600`;
        document.cookie = `__role=${role ?? 'user'}; path=/; SameSite=Lax; max-age=3600`;
      } catch {
        // Non-fatal — the AuthProvider will sync on the next tick
      }
    }

    router.replace(destination);
  };

  // ── Google — uses redirect to avoid emulator popup/ERR_EMPTY_RESPONSE bug ───
  const handleGoogleSignIn = async (): Promise<void> => {
    setIsLoading('google');
    setErrorMessage(null);
    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      if (!auth) throw new Error('Firebase not initialised');
      await signInWithRedirect(auth, provider);
      // Page navigates away; result handled by getRedirectResult in providers
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed';
      setErrorMessage(
        msg.includes('config') || msg.includes('api-key')
          ? 'Firebase is not configured. Add credentials to apps/web/.env.local'
          : `Google sign-in failed: ${msg}`,
      );
      setIsLoading(null);
    }
  };

  // ── Email / Password — auto-creates account in emulator mode ────────────────
  const handleEmailSignIn = async (values: EmailLoginValues): Promise<void> => {
    setIsLoading('email');
    setErrorMessage(null);
    try {
      const auth = getClientAuth();
      if (!auth) throw new Error('Firebase not initialised');
      await signInWithEmailAndPassword(auth, values.email, values.password);
      await onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (USE_EMULATOR && (code === 'auth/user-not-found' || code === 'auth/invalid-credential')) {
        try {
          const auth = getClientAuth();
          if (!auth) throw new Error('Firebase not initialised');
          await createUserWithEmailAndPassword(auth, values.email, values.password);
          await onSuccess();
          return;
        } catch {
          /* fall through */
        }
      }
      setErrorMessage('Invalid email or password. In emulator mode entering a new email will auto-create an account.');
    } finally {
      setIsLoading(null);
    }
  };

  // ── Anonymous ────────────────────────────────────────────────────────────────
  const handleAnonymousSignIn = async (): Promise<void> => {
    setIsLoading('anon');
    setErrorMessage(null);
    try {
      const auth = getClientAuth();
      if (!auth) throw new Error('Firebase not initialised');
      await signInAnonymously(auth);
      await onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setErrorMessage(
        msg.includes('emulator') || msg.includes('network') || msg.includes('fetch')
          ? 'Firebase emulator not reachable at :9099. Check: docker compose ps'
          : `Anonymous sign-in failed: ${msg}`,
      );
    } finally {
      setIsLoading(null);
    }
  };

  // ── Dev Quick Login — bypasses OAuth entirely using Firebase SDK ─────────────
  const handleDevLogin = async (): Promise<void> => {
    setIsLoading('dev');
    setErrorMessage(null);
    try {
      const auth = getClientAuth();
      if (!auth) throw new Error('Firebase not initialised');

      // 1. Try sign-in with existing dev account
      try {
        await signInWithEmailAndPassword(auth, DEV_EMAIL, DEV_PASSWORD);
        await onSuccess();
        return;
      } catch {
        /* user doesn't exist yet — create it */
      }

      // 2. Create a new dev account via the Firebase SDK
      try {
        await createUserWithEmailAndPassword(auth, DEV_EMAIL, DEV_PASSWORD);
        await onSuccess();
        return;
      } catch (createErr: unknown) {
        // If email already exists with different password, fall back to anonymous
        const code = (createErr as { code?: string }).code;
        if (code === 'auth/email-already-in-use') {
          setErrorMessage('Dev account exists but wrong password. Check Firebase Emulator UI at http://localhost:4000/auth');
          return;
        }
        throw createErr;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(
        msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('network')
          ? 'Cannot reach Firebase emulator at :9099. Is Docker running? Run: docker compose up -d'
          : `Dev login failed: ${msg}`,
      );
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

          {/* ── Dev Quick Login (only shown in emulator mode) ── */}
          {USE_EMULATOR && (
            <>
              <button
                id="btn-dev-login"
                onClick={() => void handleDevLogin()}
                disabled={isLoading !== null}
                className="w-full h-12 rounded-xl mb-2 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.2))',
                  border: `1px solid rgba(34,197,94,0.35)`,
                  color: css.success,
                }}
              >
                {isLoading === 'dev' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FlaskConical size={16} />
                )}
                Quick Dev Login
              </button>
              <p className={`text-center text-xs mb-5 ${css.muted}`}>
                Creates{' '}
                <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {DEV_EMAIL}
                </code>{' '}
                in the local emulator
              </p>

              <div className="relative flex items-center gap-3 mb-3">
                <div className={`flex-1 h-px ${css.border} border-t`} />
                <span className={`text-xs ${css.muted}`}>other options</span>
                <div className={`flex-1 h-px ${css.border} border-t`} />
              </div>
            </>
          )}

          {/* Google */}
          <button
            id="btn-google-signin"
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
              id="btn-email-signin"
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
            id="btn-anon-signin"
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

          {/* Footer */}
          <p className={`mt-6 text-center text-xs ${css.muted}`}>
            {USE_EMULATOR
              ? '🔧 Emulator mode — all auth is local & safe'
              : 'Sign in to access real-time venue intelligence'}
          </p>
        </div>
      </motion.div>
    </main>
  );
}
