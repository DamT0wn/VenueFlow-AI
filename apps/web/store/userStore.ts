import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from 'firebase/auth';

// ──────────────────────────────────────────────────────────────────────────────
// User Store — Firebase auth state and user preferences
// ──────────────────────────────────────────────────────────────────────────────

interface UserState {
  /** Firebase User object or null if not signed in */
  user: User | null;
  /** Firebase ID token (refreshed automatically) */
  idToken: string | null;
  /** Custom claim role: 'admin' | 'user' | undefined */
  role: string | undefined;
  /** Whether the user has granted notification permission */
  hasNotificationPermission: boolean;
  /** Whether the user has seen the notification permission prompt */
  hasSeenNotificationPrompt: boolean;
  /** Whether the user has consented to analytics */
  analyticsConsent: boolean | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setUser: (user: User | null) => void;
  setIdToken: (token: string | null) => void;
  setRole: (role: string | undefined) => void;
  setNotificationPermission: (granted: boolean) => void;
  markNotificationPromptSeen: () => void;
  setAnalyticsConsent: (consent: boolean) => void;
  signOut: () => void;
}

/**
 * Zustand store for Firebase authentication state and user preferences.
 * Persists non-sensitive preferences to localStorage.
 */
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        idToken: null,
        role: undefined,
        hasNotificationPermission: false,
        hasSeenNotificationPrompt: false,
        analyticsConsent: null,

        setUser: (user) => set({ user }, false, 'setUser'),
        setIdToken: (idToken) => set({ idToken }, false, 'setIdToken'),
        setRole: (role) => set({ role }, false, 'setRole'),
        setNotificationPermission: (granted) =>
          set({ hasNotificationPermission: granted }, false, 'setNotificationPermission'),
        markNotificationPromptSeen: () =>
          set({ hasSeenNotificationPrompt: true }, false, 'markNotificationPromptSeen'),
        setAnalyticsConsent: (consent) =>
          set({ analyticsConsent: consent }, false, 'setAnalyticsConsent'),
        signOut: () =>
          set(
            {
              user: null,
              idToken: null,
              role: undefined,
              hasNotificationPermission: false,
            },
            false,
            'signOut',
          ),
      }),
      {
        name: 'venueflow-user',
        // Only persist non-sensitive preferences — never persist tokens
        partialize: (state) => ({
          hasSeenNotificationPrompt: state.hasSeenNotificationPrompt,
          analyticsConsent: state.analyticsConsent,
        }),
      },
    ),
    { name: 'UserStore' },
  ),
);
