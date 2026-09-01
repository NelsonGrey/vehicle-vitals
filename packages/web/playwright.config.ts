import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'https://vehicle-vitals-dev.web.app';
const shouldStartWebServer =
  !process.env.BASE_URL || /localhost|127\.0\.0\.1/i.test(process.env.BASE_URL);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html', { outputFolder: 'test-results-html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldStartWebServer
    ? {
        // Serve a real built artifact (build:development + vite preview), not
        // the dev server: the dev server's dependency scan can't resolve
        // expo-constants (a mobile-only import in packages/shared) and the
        // resulting runtime breakage makes marketing-nav tests like TC-UI-010
        // fail against `npm run dev` while passing against a built deploy.
        // EnvironmentGate is bypassed on localhost, so this gives real
        // coverage without the deployed dev/staging Google-sign-in wall.
        command: 'npm run uat:serve',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 180000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  timeout: 60000,
});
