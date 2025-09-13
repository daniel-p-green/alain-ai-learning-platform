import { test, expect } from '@playwright/test';

test('generate page loads and shows inputs', async ({ page }) => {
  await page.goto('/generate');
  await expect(page.getByRole('heading', { name: /Generate Lesson/i })).toBeVisible();
  await expect(page.getByPlaceholder('https://huggingface.co/owner/repo')).toBeVisible();
  await expect(page.getByRole('button', { name: /Use Example \(Hosted\)/i })).toBeVisible();
});

