import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'bash -lc "PORT=3057 npm run dev"',
    port: 3057,
    reuseExistingServer: false,
    timeout: 180000,
  },
  use: {
    baseURL: 'http://localhost:3057',
    headless: true,
  },
});
