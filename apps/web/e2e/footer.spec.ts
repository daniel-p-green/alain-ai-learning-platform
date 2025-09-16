import { test, expect } from '@playwright/test';

const isPlaywright = !!process.env.PLAYWRIGHT_TEST;

if (isPlaywright) {
  test('footer shows attribution and no legacy links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    // Attribution link
    const by = footer.getByRole('link', { name: /Daniel Green/i });
    await expect(by).toBeVisible();
    await expect(by).toHaveAttribute('href', /linkedin\.com\/in\/danielpgreen/);

    // X link
    const x = footer.getByRole('link', { name: /X \(@dgrreen\)/i });
    await expect(x).toBeVisible();
    await expect(x).toHaveAttribute('href', 'https://x.com/dgrreen');

    // Product links
    await expect(footer.getByRole('link', { name: /Notebooks/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Generate/i })).toBeVisible();

    // Legacy links should not exist
    await expect(footer.getByRole('link', { name: /Blueprint/i })).toHaveCount(0);
    await expect(footer.getByRole('link', { name: /Phases/i })).toHaveCount(0);
    await expect(footer.getByRole('link', { name: /^Settings$/i })).toHaveCount(0);
  });
}
