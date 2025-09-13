import { test, expect } from '@playwright/test';

test('tutorial detail loads (local seeded)', async ({ request, page }) => {
  const id = 'local-seeded-e2e';
  await request.post('/api/tutorials/local/seed', { data: { id, title: 'E2E Tutorial' } });
  await page.goto(`/tutorial/${id}`);
  await expect(page.getByRole('heading', { name: /E2E Tutorial/i })).toBeVisible();
  await expect(page.getByText(/Copy as/i)).toBeVisible();
});

