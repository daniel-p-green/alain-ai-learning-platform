import { test, expect } from '@playwright/test';

const isPlaywright = !!process.env.PLAYWRIGHT_TEST;

if (isPlaywright) {
  test('generate page loads and shows inputs', async ({ page }) => {
    await page.goto('/generate');
    await expect(page.getByRole('heading', { name: /Generate Manual/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('https://huggingface.co/owner/repo')).toBeVisible();
    await expect(page.getByRole('button', { name: /Use Example \(Hosted\)/i })).toBeVisible();
  });
}
