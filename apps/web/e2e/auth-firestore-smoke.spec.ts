import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env['E2E_API_URL'] || process.env['NEXT_PUBLIC_API_URL'] || 'http://127.0.0.1:3001';

test.describe('Auth + Firestore smoke', () => {
  test('login page renders Google sign-in controls', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'VenueFlow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });

  test('auth smoke endpoint rejects missing token', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/auth/smoke`);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('health endpoint is reachable', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });
});
