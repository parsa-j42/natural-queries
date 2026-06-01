import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run the real app in Chromium against the Vite dev server. The
// backend is mocked per-test via request interception, so no API keys are needed
// and the tests are deterministic; the dev server serves the real Parquet so
// DuckDB-WASM executes queries for real.
//
// VITE_API_URL is set empty so the app calls the API on relative paths
// (same-origin), which keeps route mocking simple (no CORS or preflight).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    env: { VITE_API_URL: '' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
