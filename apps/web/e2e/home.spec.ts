import { test, expect } from '@playwright/test';

test('home loads and shows CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /AI Manuals for AI Models/i })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#main').getByRole('link', { name: /Generate Manual/i })).toBeVisible();
  await expect(page.locator('#main').getByRole('link', { name: /Library/i })).toBeVisible();
});
