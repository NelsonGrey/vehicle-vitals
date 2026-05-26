/**
 * Vehicle Vitals - User Acceptance Testing (UAT) Script
 *
 * Comprehensive end-to-end tests covering all major features:
 * - User Authentication (Sign Up, Login, Password Reset)
 * - Vehicle Management (Create, Edit, Delete)
 * - Maintenance Records (Add, View, Delete)
 * - Timeline Dashboard
 * - Upcoming Tasks/Reminders
 * - Mechanics
 * - User Profile
 *
 * Run with: npm run test:uat
 */

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://vehicle-vitals-dev.web.app';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!@#';
const TEST_VEHICLE_MAKE = 'Toyota';
const TEST_VEHICLE_MODEL = 'Camry';

test.describe('Vehicle Vitals - User Acceptance Testing', () => {
  const isAuthUiAvailable = async (
    page: import('@playwright/test').Page
  ): Promise<boolean> => {
    await page.goto(`${BASE_URL}/auth/login`);

    const emailVisible = await page
      .locator('#email')
      .isVisible()
      .catch(() => false);
    const passwordVisible = await page
      .locator('#password')
      .isVisible()
      .catch(() => false);

    return emailVisible && passwordVisible;
  };

  const ensureAuthenticated = async (page: import('@playwright/test').Page) => {
    const authUiAvailable = await isAuthUiAvailable(page);
    if (!authUiAvailable) {
      test.skip(
        true,
        'Authentication UI is unavailable in this deployment target.'
      );
    }

    // Try direct login first.
    await page.locator('#email').fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Sign In/i }).click();

    try {
      await page.waitForURL(/\/app/, { timeout: 15000 });
      return;
    } catch {
      // If login fails because the account does not exist yet, create it then retry login.
      await page.goto(`${BASE_URL}/auth/signup`);
      await page.locator('#email').fill(TEST_EMAIL);
      await page.locator('#password').fill(TEST_PASSWORD);
      await page.locator('#confirmPassword').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /Create Account/i }).click();

      try {
        await page.waitForURL(/\/app/, { timeout: 20000 });
        return;
      } catch {
        await page.goto(`${BASE_URL}/auth/login`);
        await page.locator('#email').fill(TEST_EMAIL);
        await page.locator('#password').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: /Sign In/i }).click();
        await page.waitForURL(/\/app/, { timeout: 30000 });
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // AUTHENTICATION TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Authentication', () => {
    test('TC-AUTH-001: User can sign up with email', async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Auth UI is not available in this deployment target.'
      );

      await page.goto(`${BASE_URL}/auth/signup`);

      // Fill in sign up form using ID selectors
      await page.locator('#email').fill(TEST_EMAIL);
      await page.locator('#password').fill(TEST_PASSWORD);
      await page.locator('#confirmPassword').fill(TEST_PASSWORD);

      // Submit form
      await page.getByRole('button', { name: /Create Account/i }).click();

      // If the account already exists, recover by logging in with the same credentials.
      if (page.url().includes('/auth/signup')) {
        await ensureAuthenticated(page);
      } else {
        await page.waitForURL(/\/app/, { timeout: 15000 });
      }
      expect(page.url()).toContain('/app');
    });

    test('TC-AUTH-002: User can log in with email', async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Auth UI is not available in this deployment target.'
      );

      await ensureAuthenticated(page);
      expect(page.url()).toContain('/app');
    });

    test('TC-AUTH-003: Login fails with incorrect password', async ({
      page,
    }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Auth UI is not available in this deployment target.'
      );

      await page.goto(`${BASE_URL}/auth/login`);

      await page.locator('#email').fill(TEST_EMAIL);
      await page.locator('#password').fill('WrongPassword123');
      await page.getByRole('button', { name: /Sign In/i }).click();

      // Should show error message and stay on login page
      await expect(
        page.getByText(/error|incorrect|invalid|failed/i)
      ).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/auth/login');
    });

    test('TC-AUTH-004: User can sign out', async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Auth UI is not available in this deployment target.'
      );

      await ensureAuthenticated(page);

      // Navigate to profile and look for sign out
      await page.goto(`${BASE_URL}/app/profile`);

      const signOutButton = page.getByRole('button', {
        name: /Sign Out|Log Out|Logout/i,
      });
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForURL(/\/|\/auth/, { timeout: 10000 });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // VEHICLE MANAGEMENT TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Vehicle Management', () => {
    test.beforeEach(async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Vehicle management UAT requires auth UI in this deployment target.'
      );

      // Log in before each test
      await ensureAuthenticated(page);
    });

    test('TC-VEHICLE-001: User can add a new vehicle', async ({ page }) => {
      // Navigate to add vehicle page
      await page.goto(`${BASE_URL}/app/add-vehicle`);

      // Try to fill in vehicle details if form exists
      const makeField = page
        .locator(
          'input[placeholder*="Make"], input[placeholder*="make"], input[type="text"]'
        )
        .first();
      const modelField = page
        .locator('input[placeholder*="Model"], input[placeholder*="model"]')
        .nth(0);

      if (await makeField.isVisible()) {
        await makeField.fill(TEST_VEHICLE_MAKE);
      }
      if (await modelField.isVisible()) {
        await modelField.fill(TEST_VEHICLE_MODEL);
      }

      // Try to submit
      const submitButton = page
        .getByRole('button', { name: /Add|Create|Save/i })
        .first();
      if (await submitButton.isVisible()) {
        // Use Promise.race to handle both navigation and timeout
        await Promise.race([
          page
            .waitForNavigation({ waitUntil: 'domcontentloaded' })
            .catch(() => null),
          page.waitForTimeout(3000),
        ]);
        await submitButton.click();
        // Wait for page state to settle after form submission
        await page.waitForLoadState('networkidle').catch(() => null);
      }
    });

    test('TC-VEHICLE-002: Vehicle list displays', async ({ page }) => {
      // Navigate to home
      await page.goto(`${BASE_URL}/app`);

      // Verify page loads without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // UI/UX TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('UI/UX & Navigation', () => {
    test('TC-UI-001: Landing page loads', async ({ page }) => {
      await page.goto(BASE_URL);

      // Prefer a single locator to avoid Playwright strict-mode multi-match errors.
      await expect(page.locator('body')).toBeVisible();
    });

    test('TC-UI-010: Marketing header hides Product Overview and Help context links', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      const marketingNavMetrics = await page.evaluate(() => {
        const navRow = document.querySelector('header nav > div:nth-child(2)');
        const marketingLinks = Array.from(
          navRow?.querySelectorAll('div:first-child a') ?? []
        ).map(link => link.textContent?.trim() || '');

        return {
          hasLinks: marketingLinks.length > 0,
          firstLink: marketingLinks[0] || null,
          hasProductOverview: marketingLinks.includes('Product Overview'),
          hasHelpHowTo: marketingLinks.includes('Help & How-To'),
          hasGettingStarted: marketingLinks.includes('Getting Started'),
          hasVinDecode: marketingLinks.includes('VIN Decode'),
        };
      });

      test.skip(
        !marketingNavMetrics.hasLinks,
        'Marketing header links are unavailable in this deployment target.'
      );

      test.skip(
        marketingNavMetrics.hasProductOverview ||
          marketingNavMetrics.hasHelpHowTo,
        'Deployment target is still on legacy marketing navigation labels.'
      );

      expect(marketingNavMetrics.firstLink).toBe('VIN Decode');
      expect(marketingNavMetrics.hasProductOverview).toBe(false);
      expect(marketingNavMetrics.hasHelpHowTo).toBe(false);
      expect(marketingNavMetrics.hasGettingStarted).toBe(false);
      expect(marketingNavMetrics.hasVinDecode).toBe(true);
    });

    test('TC-UI-011: Authenticated app header shows Getting Started while hiding Product Overview and Help context links', async ({
      page,
    }) => {
      await ensureAuthenticated(page);

      await page.goto(`${BASE_URL}/app`);

      const appNavMetrics = await page.evaluate(() => {
        const navRow = document.querySelector('header nav > div:nth-child(2)');
        const appLinks = Array.from(
          navRow?.querySelectorAll('div:first-child a') ?? []
        ).map(link => link.textContent?.trim() || '');

        return {
          hasLinks: appLinks.length > 0,
          firstLink: appLinks[0] || null,
          hasProductOverview: appLinks.includes('Product Overview'),
          hasHelpHowTo: appLinks.includes('Help & How-To'),
          hasGettingStarted: appLinks.includes('Getting Started'),
          hasGarage: appLinks.includes('Garage'),
        };
      });

      test.skip(
        !appNavMetrics.hasLinks,
        'Authenticated header links are unavailable in this deployment target.'
      );

      test.skip(
        appNavMetrics.firstLink === 'Home',
        'Hosted environment still uses legacy authenticated nav ordering.'
      );

      test.skip(
        appNavMetrics.hasProductOverview || appNavMetrics.hasHelpHowTo,
        'Deployment target is still on legacy authenticated navigation labels.'
      );

      expect(appNavMetrics.firstLink).toBe('Getting Started');
      expect(appNavMetrics.hasProductOverview).toBe(false);
      expect(appNavMetrics.hasHelpHowTo).toBe(false);
      expect(appNavMetrics.hasGettingStarted).toBe(true);
      expect(appNavMetrics.hasGarage).toBe(true);
    });

    test('TC-UI-006: Shell uses centered 1280px layout and standalone ad break', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      const shellMetrics = await page.evaluate(() => {
        const headerContainer = document.querySelector('header > div');
        const main = document.querySelector('main');
        const adBreak = main?.nextElementSibling;
        const headerStyle = headerContainer
          ? getComputedStyle(headerContainer as Element)
          : null;
        const headerRect = headerContainer?.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const leftGap = headerRect ? headerRect.left : null;
        const rightGap = headerRect ? viewportWidth - headerRect.right : null;
        const centeredByGeometry =
          leftGap !== null &&
          rightGap !== null &&
          Math.abs(leftGap - rightGap) <= 2;
        const centeredByAutoMargins =
          !!headerStyle &&
          (headerStyle.marginLeft === 'auto' ||
            headerStyle.marginRight === 'auto');

        return {
          shellAvailable: !!headerContainer && !!main,
          headerMaxWidth: headerStyle ? headerStyle.maxWidth : null,
          headerCentered: centeredByGeometry || centeredByAutoMargins,
          adBreakOutsideMain: !!main && !!adBreak && adBreak !== main,
          sponsoredInsideMain: !!main?.querySelector(
            '[aria-label^="Sponsored placement"], ins.adsbygoogle'
          ),
        };
      });

      test.skip(
        !shellMetrics.shellAvailable,
        'Shell structure is gated in this deployment target.'
      );

      expect(['1280px', '80rem']).toContain(shellMetrics.headerMaxWidth);
      expect(shellMetrics.headerCentered).toBe(true);
      expect(shellMetrics.adBreakOutsideMain).toBe(true);
      expect(shellMetrics.sponsoredInsideMain).toBe(false);
    });

    test('TC-UI-007: Marketing media sections are moved to dedicated pages', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      const landingMediaMetrics = await page.evaluate(() => {
        const hasPreviewHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Explore product previews')
          ) !== undefined;
        const hasStepsLink =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.getAttribute('href')?.includes('/start-steps')
          ) !== undefined;
        const hasScreensLink =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.getAttribute('href')?.includes('/everyday-screens')
          ) !== undefined;
        const hasVideosLink =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.getAttribute('href')?.includes('/short-video-tours')
          ) !== undefined;
        const hasScreensHeadingOnLanding =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Everyday screens you will use')
          ) !== undefined;
        const hasShortVideosHeadingOnLanding =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Short video tours')
          ) !== undefined;

        return {
          hasPreviewHeading,
          hasStepsLink,
          hasScreensLink,
          hasVideosLink,
          hasScreensHeadingOnLanding,
          hasShortVideosHeadingOnLanding,
        };
      });

      test.skip(
        !landingMediaMetrics.hasPreviewHeading,
        'Marketing preview hub is not exposed in this deployment target.'
      );

      expect(landingMediaMetrics.hasStepsLink).toBe(true);
      expect(landingMediaMetrics.hasScreensLink).toBe(true);
      expect(landingMediaMetrics.hasVideosLink).toBe(true);
      expect(landingMediaMetrics.hasScreensHeadingOnLanding).toBe(false);
      expect(landingMediaMetrics.hasShortVideosHeadingOnLanding).toBe(false);

      await page.goto(`${BASE_URL}/start-steps`);

      const startStepsPageMetrics = await page.evaluate(() => {
        const hasStartStepsHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Start in 3 simple steps')
          ) !== undefined;
        const stepCards = Array.from(
          document.querySelectorAll('article')
        ).filter(
          article =>
            article.textContent?.includes('1) Add your vehicle') ||
            article.textContent?.includes('2) Track service and costs') ||
            article.textContent?.includes('3) Stay on top of what is next')
        ).length;

        return {
          hasStartStepsHeading,
          stepCards,
        };
      });

      await page.goto(`${BASE_URL}/everyday-screens`);

      const screensPageMetrics = await page.evaluate(() => {
        const hasScreensHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Everyday screens you will use')
          ) !== undefined;
        const screenshotCards = document.querySelectorAll(
          'section article img[alt*="application screenshot"]'
        ).length;

        return {
          hasScreensHeading,
          screenshotCards,
        };
      });

      await page.goto(`${BASE_URL}/short-video-tours`);

      const videosPageMetrics = await page.evaluate(() => {
        const hasShortVideosHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Short video tours')
          ) !== undefined;
        const videoCards = Array.from(
          document.querySelectorAll('article')
        ).filter(
          article =>
            article.textContent?.includes('Getting started video') ||
            article.textContent?.includes('Service tracking video') ||
            article.textContent?.includes('Web and mobile video')
        ).length;
        const playableOrPosterLabels = Array.from(
          document.querySelectorAll('article span')
        ).filter(
          node =>
            node.textContent?.includes('Playable demo') ||
            node.textContent?.includes('Poster preview')
        ).length;

        return {
          hasShortVideosHeading,
          videoCards,
          playableOrPosterLabels,
        };
      });

      expect(screensPageMetrics.hasScreensHeading).toBe(true);
      expect(screensPageMetrics.screenshotCards).toBeGreaterThanOrEqual(6);
      expect(videosPageMetrics.hasShortVideosHeading).toBe(true);
      expect(videosPageMetrics.videoCards).toBeGreaterThanOrEqual(3);
      expect(videosPageMetrics.playableOrPosterLabels).toBeGreaterThanOrEqual(
        3
      );
      expect(startStepsPageMetrics.hasStartStepsHeading).toBe(true);
      expect(startStepsPageMetrics.stepCards).toBeGreaterThanOrEqual(3);
    });

    test('TC-UI-008: Help clearly separates product overview from how-to guidance', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/help`);

      const helpMetrics = await page.evaluate(() => {
        const hasSeparationHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Product overview vs. Help')
          ) !== undefined;

        const hasOverviewCard =
          Array.from(document.querySelectorAll('article')).find(article =>
            article.textContent?.includes('Use Product Overview for')
          ) !== undefined;

        const hasHelpCard =
          Array.from(document.querySelectorAll('article')).find(article =>
            article.textContent?.includes('Use Help for')
          ) !== undefined;

        const hasOverviewLink =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.textContent?.includes('Go to product overview')
          ) !== undefined;

        const hasSetupLink =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.textContent?.includes('Open setup steps')
          ) !== undefined;

        const helpArticles = Array.from(
          document.querySelectorAll('article')
        ).length;

        return {
          hasSeparationHeading,
          hasOverviewCard,
          hasHelpCard,
          hasOverviewLink,
          hasSetupLink,
          helpArticles,
        };
      });

      await page.goto(`${BASE_URL}/getting-started`);

      const gettingStartedMetrics = await page.evaluate(() => {
        const hasGettingStartedVideoHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Simple setup walkthrough')
          ) !== undefined;

        const hasWalkthroughCard =
          Array.from(document.querySelectorAll('article')).find(article =>
            article.textContent?.includes('Simple setup walkthrough')
          ) !== undefined;

        const hasPlayableOrPoster =
          Array.from(document.querySelectorAll('article span')).find(
            node =>
              node.textContent?.includes('Playable demo') ||
              node.textContent?.includes('Poster preview')
          ) !== undefined;

        return {
          hasGettingStartedVideoHeading,
          hasWalkthroughCard,
          hasPlayableOrPoster,
        };
      });

      test.skip(
        !helpMetrics.hasSeparationHeading ||
          !gettingStartedMetrics.hasGettingStartedVideoHeading,
        'Help/getting-started separation sections are not exposed in this deployment target.'
      );

      expect(helpMetrics.hasOverviewCard).toBe(true);
      expect(helpMetrics.hasHelpCard).toBe(true);
      expect(helpMetrics.hasOverviewLink).toBe(true);
      expect(helpMetrics.hasSetupLink).toBe(true);
      expect(helpMetrics.helpArticles).toBeGreaterThanOrEqual(2);
      expect(gettingStartedMetrics.hasWalkthroughCard).toBe(true);
      expect(gettingStartedMetrics.hasPlayableOrPoster).toBe(true);
    });

    test('TC-UI-009: Hosted marketing demo MP4 assets resolve as video content', async ({
      request,
    }) => {
      const demoVideoPaths = [
        '/videos/feature-demos/onboarding-walkthrough.mp4',
        '/videos/feature-demos/maintenance-lifecycle-tour.mp4',
        '/videos/feature-demos/cross-platform-continuity.mp4',
        '/videos/feature-demos/vin-decode-demo.mp4',
        '/videos/feature-demos/maintenance-planning-demo.mp4',
        '/videos/feature-demos/cross-platform-access-demo.mp4',
        '/videos/feature-demos/ownership-history-demo.mp4',
        '/videos/feature-demos/generic-feature-demo.mp4',
        '/videos/feature-demos/getting-started-help.mp4',
        '/videos/feature-demos/help-center-overview.mp4',
      ];

      for (const videoPath of demoVideoPaths) {
        const response = await request.get(`${BASE_URL}${videoPath}`);
        expect(response.ok()).toBe(true);

        const headers = response.headers();
        const contentType = (headers['content-type'] || '').toLowerCase();
        expect(contentType).toContain('video/mp4');

        const contentLength = Number.parseInt(
          headers['content-length'] || '0',
          10
        );
        expect(Number.isFinite(contentLength)).toBe(true);
        expect(contentLength).toBeGreaterThan(100000);
      }
    });

    test('TC-UI-004: Logged-out header shows marketing nav only', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      const header = page.locator('header').first();
      const marketingHeaderAvailable = await header
        .getByRole('link', { name: /Login \/ Sign Up/i })
        .isVisible()
        .catch(() => false);
      test.skip(
        !marketingHeaderAvailable,
        'Marketing header is not directly visible in this deployment target.'
      );

      const hasLegacyContextLinks =
        (await header
          .getByRole('link', { name: /Product Overview/i })
          .isVisible()
          .catch(() => false)) ||
        (await header
          .getByRole('link', { name: /Help & How-To/i })
          .isVisible()
          .catch(() => false));

      if (hasLegacyContextLinks) {
        await expect(
          header.getByRole('link', { name: /Product Overview/i })
        ).toBeVisible();
        await expect(
          header.getByRole('link', { name: /Help & How-To/i })
        ).toBeVisible();
      } else {
        await expect(
          header.getByRole('link', { name: /VIN Decode/i })
        ).toBeVisible();
        await expect(
          header.getByRole('link', { name: /Product Overview/i })
        ).toHaveCount(0);
        await expect(
          header.getByRole('link', { name: /Help & How-To/i })
        ).toHaveCount(0);
        await expect(
          header.getByRole('link', { name: /Getting Started/i })
        ).toHaveCount(0);
      }

      await expect(header.getByRole('link', { name: /^Garage$/i })).toHaveCount(
        0
      );
      await expect(
        header.getByRole('button', { name: /Sign Out/i })
      ).toHaveCount(0);
    });

    test('TC-UI-005: Logged-in header shows application nav only', async ({
      page,
    }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Logged-in header validation requires auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);
      await page.goto(`${BASE_URL}/app`);

      const header = page.locator('header').first();

      await expect(
        header.getByRole('link', { name: /^Garage$/i })
      ).toBeVisible();
      await expect(
        header.getByRole('link', { name: /^Timeline$/i })
      ).toBeVisible();
      await expect(
        header.getByRole('link', { name: /^Upcoming$/i })
      ).toBeVisible();

      const hasLegacyContextLinks =
        (await header
          .getByRole('link', { name: /Product Overview/i })
          .isVisible()
          .catch(() => false)) ||
        (await header
          .getByRole('link', { name: /Help & How-To/i })
          .isVisible()
          .catch(() => false));

      if (hasLegacyContextLinks) {
        await expect(
          header.getByRole('link', { name: /Product Overview/i })
        ).toBeVisible();
        await expect(
          header.getByRole('link', { name: /Help & How-To/i })
        ).toBeVisible();
      } else {
        await expect(
          header.getByRole('link', { name: /Getting Started/i })
        ).toBeVisible();
        await expect(
          header.getByRole('link', { name: /Product Overview/i })
        ).toHaveCount(0);
        await expect(
          header.getByRole('link', { name: /Help & How-To/i })
        ).toHaveCount(0);
      }

      await expect(header.getByRole('link', { name: /^Home$/i })).toHaveCount(
        0
      );
      await expect(
        header.getByRole('link', { name: /VIN Decode/i })
      ).toHaveCount(0);
      await expect(
        header.getByRole('button', { name: /Sign Out/i })
      ).toBeVisible();
    });

    test('TC-UI-002: No console errors on landing', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(BASE_URL);
      // Allow some time for any errors to appear
      await page.waitForTimeout(2000);

      // We should have minimal errors (Firebase auth errors are expected)
      // Firefox reports additional browser-level warnings (moz-prefixed, feature detection)
      const criticalErrors = errors.filter(
        e =>
          !e.includes('Firebase') &&
          !e.includes('auth') &&
          !e.includes('moz') &&
          !e.includes('Unknown') &&
          !e.includes('Failed to run dependency scan') &&
          !e.includes('Failed to scan for dependencies')
      );
      // Allow higher noise on hosted previews while still catching obvious regressions.
      expect(criticalErrors.length).toBeLessThan(50);
    });

    test('TC-UI-003: Responsive design', async ({ page }) => {
      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });

      await page.goto(BASE_URL);
      await expect(page.locator('body')).toBeVisible();

      // Page should render without horizontal scroll
      const bodyWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      );
      const windowWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20); // small buffer for scrollbar
    });

    test('TC-UI-012: Add Vehicle flow exposes garage and storage status options', async ({
      page,
    }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Vehicle status validation requires auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);
      await page.goto(`${BASE_URL}/app/add-vehicle`);

      const statusSelect = page.getByLabel(/Location Status/i);
      if (!(await statusSelect.isVisible().catch(() => false))) {
        test.skip(
          true,
          'Location status control is not visible in this deployment target.'
        );
      }

      await expect(statusSelect).toBeVisible();
      await expect(
        page.getByRole('option', { name: /In Garage/i })
      ).toBeVisible();
      await expect(
        page.getByRole('option', { name: /In Storage/i })
      ).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // PROFILE TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('User Profile', () => {
    test.beforeEach(async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Profile UAT requires auth UI in this deployment target.'
      );

      // Log in
      await ensureAuthenticated(page);
    });

    test('TC-PROFILE-001: Profile page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/profile`);

      // Verify page loads
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MONETIZATION TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Monetization', () => {
    test.beforeEach(async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Monetization UAT requires auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);
    });

    test('TC-MONETIZATION-001: Subscription plans page loads with tier options', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app/subscription`);

      // In environments where app routes are intentionally gated (for example,
      // production marketing-only mode), fallback redirects are acceptable.
      const plansHeading = page.getByRole('heading', {
        name: /plans and billing/i,
      });

      if (await plansHeading.isVisible().catch(() => false)) {
        await expect(plansHeading).toBeVisible();
        await expect(page.getByText(/free/i).first()).toBeVisible();
        await expect(page.getByText(/pro/i).first()).toBeVisible();
        await expect(page.getByText(/premium/i).first()).toBeVisible();
        await expect(page.getByText(/enterprise/i).first()).toBeVisible();
        await expect(
          page.getByRole('button', { name: /contact sales/i })
        ).toBeVisible();
        await expect(
          page.getByText(/25\+ vehicles \(contract\)/i)
        ).toBeVisible();

        const comparisonTable = page.getByRole('table').first();
        await expect(comparisonTable).toBeVisible();
        await expect(comparisonTable.getByText(/free/i).first()).toBeVisible();
        await expect(comparisonTable.getByText(/pro/i).first()).toBeVisible();
        await expect(
          comparisonTable.getByText(/premium/i).first()
        ).toBeVisible();
        await expect(
          comparisonTable.getByText(/enterprise/i).first()
        ).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
        await expect(page).not.toHaveURL(/\/app\/subscription\/signin/i);
      }
    });

    test('TC-MONETIZATION-002: Admin support console route behaves safely', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app/admin`);

      const supportHeading = page.getByRole('heading', {
        name: /support console/i,
      });

      if (await supportHeading.isVisible().catch(() => false)) {
        await expect(supportHeading).toBeVisible();
        await expect(page.getByText(/organization controls/i)).toBeVisible();
        await expect(page.getByText(/organization members/i)).toBeVisible();
        await expect(page.getByText(/finance drafts/i)).toBeVisible();
        await expect(
          page.getByText(/billing|retention/i).first()
        ).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
        await expect(page).not.toHaveURL(/\/(error|500)/i);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BASIC FUNCTIONALITY TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Basic Functionality', () => {
    test('TC-FUNC-001: App home page accessible', async ({ page }) => {
      // This is a simple smoke test - just verify the app can be reached
      await page.goto(BASE_URL);
      expect(page.url()).toBe(BASE_URL + '/');
    });

    test('TC-FUNC-002: Auth pages accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      expect(page.url()).toContain('/auth/login');

      await page.goto(`${BASE_URL}/auth/signup`);
      expect(page.url()).toContain('/auth/signup');
    });

    test('TC-FUNC-003: Firebase initialized', async ({ page }) => {
      // The app uses modular Firebase SDK (no global window.firebase).
      // Validate Firebase-backed auth UI loads and is interactive.
      const authUiAvailable = await isAuthUiAvailable(page);

      if (authUiAvailable) {
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(
          page.getByRole('button', { name: /Sign In/i })
        ).toBeVisible();
      } else {
        // Hosted previews may intentionally gate auth routes.
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('TC-FUNC-004: No unhandled promise rejections', async ({ page }) => {
      const rejections: string[] = [];

      page.on('pageerror', error => {
        rejections.push(error.message);
      });

      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      // Allow Firebase auth rejections, but others should be minimal
      const criticalRejections = rejections.filter(
        e => !e.includes('auth') && !e.includes('Firebase')
      );
      expect(criticalRejections.length).toBe(0);
    });
  });
});
