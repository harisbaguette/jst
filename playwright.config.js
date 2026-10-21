import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5178',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--mute-audio'] },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: true,
  },
});
