import { test, expect } from '@playwright/test';

test.describe('Accessibility smoke', () => {
  test('@a11y login page has expected landmarks', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'VenueFlow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });
});
