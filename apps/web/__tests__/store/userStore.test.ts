import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from '../../store/userStore';

describe('userStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      idToken: null,
      role: undefined,
      hasNotificationPermission: false,
      hasSeenNotificationPrompt: false,
      analyticsConsent: null,
    });
  });

  it('updates user, token and role', () => {
    useUserStore.getState().setUser({ uid: 'u1' } as any);
    useUserStore.getState().setIdToken('token-1');
    useUserStore.getState().setRole('admin');

    const state = useUserStore.getState();
    expect(state.user?.uid).toBe('u1');
    expect(state.idToken).toBe('token-1');
    expect(state.role).toBe('admin');
  });

  it('tracks notification and analytics preferences', () => {
    useUserStore.getState().setNotificationPermission(true);
    useUserStore.getState().markNotificationPromptSeen();
    useUserStore.getState().setAnalyticsConsent(true);

    const state = useUserStore.getState();
    expect(state.hasNotificationPermission).toBe(true);
    expect(state.hasSeenNotificationPrompt).toBe(true);
    expect(state.analyticsConsent).toBe(true);
  });

  it('signOut clears auth-sensitive state', () => {
    useUserStore.setState({
      user: { uid: 'u2' } as any,
      idToken: 't2',
      role: 'admin',
      hasNotificationPermission: true,
      hasSeenNotificationPrompt: true,
      analyticsConsent: true,
    });

    useUserStore.getState().signOut();
    const state = useUserStore.getState();

    expect(state.user).toBeNull();
    expect(state.idToken).toBeNull();
    expect(state.role).toBeUndefined();
    expect(state.hasNotificationPermission).toBe(false);
    expect(state.hasSeenNotificationPrompt).toBe(true);
    expect(state.analyticsConsent).toBe(true);
  });
});
