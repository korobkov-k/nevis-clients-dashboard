import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Runs against the production build served by Fastify (`node --run build` first).
 * `smoke` uses the real API; `visual` compares reviewed baselines in a fixed environment.
 */
export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/baselines/{arg}-{projectName}-{platform}{ext}',
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'en-US',
    timezoneId: 'UTC',
    // Also disables chart animation in the app.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.002 },
  },
  projects: [
    {
      name: 'smoke',
      testMatch: 'smoke.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'visual',
      testMatch: 'visual.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'node dist/server/main.js',
    url: `http://127.0.0.1:${PORT}/api/clients`,
    // No simulated latency: suites wait on observable state, not timers.
    env: { PORT: String(PORT), API_DELAY_MS: '0' },
    reuseExistingServer: false,
  },
});
