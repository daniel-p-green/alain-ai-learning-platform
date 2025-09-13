import { test, expect } from '@playwright/test';

test('home loads and shows CTAs', async ({ page }) => {
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: /Learn faster with runnable notebooks/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Get started/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Browse tutorials/i })).toBeVisible();
});

