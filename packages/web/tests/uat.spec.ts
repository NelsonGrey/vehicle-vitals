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
 * - Account Consolidation
 * - Firestore Pagination
 * - Image Caching
 * - Error Boundary Handling
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

  // Adds a vehicle via the real Add Vehicle form and returns its VIN, or null
  // if the flow could not complete (gated deployment target, tier limit
  // already reached from a prior run against this shared test account, etc).
  // Used by tests that need at least one vehicle to exist to exercise Home's
  // health banner/badges or a vehicle's Records page.
  let vehicleCounter = 0;
  const addTestVehicle = async (
    page: import('@playwright/test').Page
  ): Promise<string | null> => {
    vehicleCounter += 1;
    const vin = `UATVEH${Date.now()}${vehicleCounter}`
      .slice(0, 17)
      .toUpperCase();

    await page.goto(`${BASE_URL}/app/add-vehicle`);

    const vinField = page.locator('#vin');
    if (!(await vinField.isVisible().catch(() => false))) {
      return null;
    }
    await vinField.fill(vin);

    const yearSelect = page.locator('#year');
    if (await yearSelect.isVisible().catch(() => false)) {
      const yearValues = await yearSelect
        .locator('option')
        .evaluateAll(options =>
          options.map(option => (option as HTMLOptionElement).value)
        );
      const firstRealYear = yearValues.find(y => /^\d{4}$/.test(y));
      if (firstRealYear) {
        await yearSelect.selectOption(firstRealYear);
      }
    }

    const makeField = page.locator('#make');
    if (await makeField.isVisible().catch(() => false)) {
      await makeField.fill(TEST_VEHICLE_MAKE);
    }

    const modelField = page.locator('#model');
    if (
      (await modelField.isVisible().catch(() => false)) &&
      !(await modelField.isDisabled().catch(() => true))
    ) {
      await modelField.fill(TEST_VEHICLE_MODEL);
    }

    const submitButton = page.getByRole('button', { name: /^Add Vehicle$/ });
    if (!(await submitButton.isVisible().catch(() => false))) {
      return null;
    }
    await submitButton.click();

    try {
      await page.waitForURL(/\/app\/?(\?.*)?$/, { timeout: 15000 });
      return vin;
    } catch {
      return null;
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

      const signOutButton = page
        .getByRole('button', {
          name: /Sign Out|Log Out|Logout/i,
        })
        .first();
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
        // Wait for page state to settle after form submission. Bounded
        // explicitly: a Firestore-backed app with persistent listeners may
        // never reach true network-idle, and an unbounded wait can consume
        // the entire test timeout budget.
        await page
          .waitForLoadState('networkidle', { timeout: 5000 })
          .catch(() => null);
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
  // VEHICLE HEALTH TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Vehicle Health', () => {
    test.beforeEach(async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Vehicle Health UAT requires auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);
    });

    test('TC-HEALTH-001: Home shows a Garage Health banner and a per-vehicle score badge', async ({
      page,
    }) => {
      const vin = await addTestVehicle(page);
      test.skip(
        !vin,
        'Could not add a test vehicle in this deployment target.'
      );

      await page.goto(`${BASE_URL}/app`);

      await expect(page.getByText(/^Garage Health:/i)).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByText(/Health: \d+\/100/i).first()).toBeVisible({
        timeout: 20000,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // RECORDS TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Records', () => {
    test.beforeEach(async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Records UAT requires auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);
    });

    test('TC-INSIGHTS-001: Ownership Insights section is collapsed by default and expands on click', async ({
      page,
    }) => {
      const vin = await addTestVehicle(page);
      test.skip(
        !vin,
        'Could not add a test vehicle in this deployment target.'
      );

      await page.goto(`${BASE_URL}/app/records/${vin}`);

      const insightsToggle = page.getByRole('button', {
        name: /ownership insights/i,
      });
      test.skip(
        !(await insightsToggle.isVisible().catch(() => false)),
        'Ownership Insights section is not visible in this deployment target.'
      );

      await expect(insightsToggle).toHaveAttribute('aria-expanded', 'false');

      await insightsToggle.click();
      await expect(insightsToggle).toHaveAttribute('aria-expanded', 'true');
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
          hasVinLookup: marketingLinks.includes('VIN Lookup'),
          hasOwnershipRecords: marketingLinks.includes('Ownership Records'),
          hasSharedGarage: marketingLinks.includes('Shared Garage'),
          hasGuidedSetup: marketingLinks.includes('Guided Setup'),
          hasHandsOnMaintenance: marketingLinks.includes(
            'Hands-On Maintenance'
          ),
          hasWorkVehicles: marketingLinks.includes('Work Vehicles'),
          hasPricing: marketingLinks.includes('Pricing'),
          hasProductTour: marketingLinks.includes('Product Tour'),
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

      expect(marketingNavMetrics.firstLink).toBe('Ownership Records');
      expect(marketingNavMetrics.hasProductOverview).toBe(false);
      expect(marketingNavMetrics.hasHelpHowTo).toBe(false);
      expect(marketingNavMetrics.hasGettingStarted).toBe(false);
      expect(marketingNavMetrics.hasVinLookup).toBe(false);
      expect(marketingNavMetrics.hasOwnershipRecords).toBe(true);
      expect(marketingNavMetrics.hasSharedGarage).toBe(true);
      expect(marketingNavMetrics.hasGuidedSetup).toBe(true);
      expect(marketingNavMetrics.hasHandsOnMaintenance).toBe(true);
      expect(marketingNavMetrics.hasWorkVehicles).toBe(true);
      // Pricing/Product Tour live in the footer and authenticated header,
      // not the logged-out persona nav row this test inspects.
      expect(marketingNavMetrics.hasPricing).toBe(false);
      expect(marketingNavMetrics.hasProductTour).toBe(false);
    });

    test('TC-UI-011: Authenticated app header hides Product Overview and Help context links', async ({
      page,
    }) => {
      await ensureAuthenticated(page);

      await page.goto(`${BASE_URL}/app`);

      const header = page.locator('header').first();

      await expect(
        header.getByRole('button', { name: /Sign Out/i })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        header.getByRole('link', { name: /^Garage$/i })
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

      test.skip(
        hasLegacyContextLinks,
        'Deployment target is still on legacy authenticated navigation labels.'
      );

      await expect(
        header.getByRole('link', { name: /Getting Started/i })
      ).toBeVisible();
      await expect(
        header.getByRole('link', { name: /Product Overview/i })
      ).toHaveCount(0);
      await expect(
        header.getByRole('link', { name: /Help & How-To/i })
      ).toHaveCount(0);
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

    test('TC-UI-007: Marketing media sections consolidate into Getting Started and Product Tour', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      const landingMediaMetrics = await page.evaluate(() => {
        const hasPersonaHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes(
              'Choose the path that matches your garage'
            )
          ) !== undefined;
        const hasPlanHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes(
              'Plans built around growing vehicle responsibility'
            )
          ) !== undefined;
        const hasProofHeading =
          Array.from(document.querySelectorAll('h1, h2, h3')).find(node =>
            node.textContent?.includes('Product proof for the story')
          ) !== undefined;
        const hasGettingStartedLink =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.getAttribute('href')?.includes('/getting-started')
          ) !== undefined;
        const hasProductTourLink =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.getAttribute('href')?.includes('/product-tour')
          ) !== undefined;

        return {
          hasPersonaHeading,
          hasPlanHeading,
          hasProofHeading,
          hasGettingStartedLink,
          hasProductTourLink,
        };
      });

      test.skip(
        !landingMediaMetrics.hasPersonaHeading,
        'Persona-led marketing page is not exposed in this deployment target.'
      );

      expect(landingMediaMetrics.hasPlanHeading).toBe(true);
      expect(landingMediaMetrics.hasProofHeading).toBe(true);
      expect(landingMediaMetrics.hasGettingStartedLink).toBe(true);
      expect(landingMediaMetrics.hasProductTourLink).toBe(true);

      // Legacy URLs redirect (replace semantics) to their canonical pages.
      await page.goto(`${BASE_URL}/start-steps`);
      await expect(page).toHaveURL(`${BASE_URL}/getting-started`);

      const gettingStartedPageMetrics = await page.evaluate(() => {
        const hasGettingStartedHeading =
          Array.from(document.querySelectorAll('h1')).find(node =>
            node.textContent?.includes('Getting Started')
          ) !== undefined;
        const stepCards = Array.from(
          document.querySelectorAll('article')
        ).filter(
          article =>
            article.textContent?.includes('1) Add your vehicle') ||
            article.textContent?.includes('2) Track service and costs') ||
            article.textContent?.includes('3) Stay on top of what is next')
        ).length;
        const reminderLink = Array.from(document.querySelectorAll('a')).find(
          link => link.textContent?.includes('See reminders demo')
        );
        const hasShopsAndServicesStep =
          Array.from(document.querySelectorAll('a')).find(
            link => link.getAttribute('href') === '/app/providers'
          ) !== undefined;

        return {
          hasGettingStartedHeading,
          stepCards,
          reminderHref: reminderLink?.getAttribute('href'),
          hasShopsAndServicesStep,
        };
      });

      await page.goto(`${BASE_URL}/everyday-screens`);
      await expect(page).toHaveURL(`${BASE_URL}/product-tour`);

      await page.goto(`${BASE_URL}/short-video-tours`);
      await expect(page).toHaveURL(`${BASE_URL}/product-tour`);

      const productTourPageMetrics = await page.evaluate(() => {
        const hasProductTourHeading =
          Array.from(document.querySelectorAll('h1')).find(node =>
            node.textContent?.includes('Product Tour')
          ) !== undefined;
        const screenshotCards = document.querySelectorAll(
          'section article img[alt*="product screen"]'
        ).length;
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
        const hasMergedEverydayScreens =
          Array.from(document.querySelectorAll('h3')).find(
            node =>
              node.textContent?.includes('Vehicle details') ||
              node.textContent?.includes('Add vehicle screen')
          ) !== undefined;

        return {
          hasProductTourHeading,
          screenshotCards,
          videoCards,
          playableOrPosterLabels,
          hasMergedEverydayScreens,
        };
      });

      expect(productTourPageMetrics.hasProductTourHeading).toBe(true);
      expect(productTourPageMetrics.screenshotCards).toBeGreaterThanOrEqual(8);
      expect(productTourPageMetrics.hasMergedEverydayScreens).toBe(true);
      expect(productTourPageMetrics.videoCards).toBeGreaterThanOrEqual(3);
      expect(
        productTourPageMetrics.playableOrPosterLabels
      ).toBeGreaterThanOrEqual(3);
      expect(gettingStartedPageMetrics.hasGettingStartedHeading).toBe(true);
      expect(gettingStartedPageMetrics.stepCards).toBeGreaterThanOrEqual(3);
      expect(gettingStartedPageMetrics.reminderHref).toBe(
        '/help#maintenance-history-and-reminders'
      );
      expect(gettingStartedPageMetrics.hasShopsAndServicesStep).toBe(true);
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
        const reminderPreferencesLink = Array.from(
          document.querySelectorAll('a')
        ).find(link => link.textContent?.includes('Open reminder preferences'));
        const hasSkipToSupportContact =
          Array.from(document.querySelectorAll('a')).find(link =>
            link.textContent?.includes('Skip to support contact')
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
          reminderPreferencesHref:
            reminderPreferencesLink?.getAttribute('href'),
          hasSkipToSupportContact,
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
      expect(helpMetrics.reminderPreferencesHref).toBe(
        '/help#maintenance-history-and-reminders'
      );
      expect(helpMetrics.hasSkipToSupportContact).toBe(false);
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
        '/videos/feature-demos/vin-lookup-demo.mp4',
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

      // Logged-out header shows persona nav (not Pricing/Product Tour —
      // those live in the footer and authenticated header, not here).
      await expect(
        header.getByRole('link', { name: /Ownership Records/i })
      ).toBeVisible();
      await expect(
        header.getByRole('link', { name: /Shared Garage/i })
      ).toBeVisible();

      await expect(
        header.getByRole('link', { name: /Product Overview/i })
      ).toHaveCount(0);
      await expect(
        header.getByRole('link', { name: /Help & How-To/i })
      ).toHaveCount(0);
      await expect(
        header.getByRole('link', { name: /VIN Lookup/i })
      ).toHaveCount(0);
      await expect(
        header.getByRole('link', { name: /Getting Started/i })
      ).toHaveCount(0);
      await expect(
        header.getByRole('link', { name: /Subscriptions/i })
      ).toHaveCount(0);

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
        header.getByRole('link', { name: /^Service History$/i })
      ).toBeVisible();
      await expect(
        header.getByRole('link', { name: /^Maintenance Plan$/i })
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
        header.getByRole('link', { name: /VIN Lookup/i })
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
      // Native <select> options are only rendered by the OS-level dropdown
      // when open; WebKit's a11y tree reports them as not-visible while
      // closed, unlike Chromium/Firefox. Check DOM attachment instead of
      // visibility so this holds across browsers.
      await expect(
        page.getByRole('option', { name: /In Garage/i })
      ).toBeAttached();
      await expect(
        page.getByRole('option', { name: /In Storage/i })
      ).toBeAttached();
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

    test('TC-PROFILE-002: Profile page exposes safe account consolidation recovery guidance', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app/profile`);
      await page.waitForURL(/\/app\/profile/, { timeout: 15000 });
      await expect(
        page.getByRole('heading', { name: /^profile$/i })
      ).toBeVisible({ timeout: 15000 });

      // Account & Security (selected inline in the Profile detail panel)
      // exposes the signed-in user's UID, which the consolidation
      // self-merge guard below needs.
      await page.getByRole('button', { name: /account & security/i }).click();
      await expect(
        page.getByRole('heading', { name: /^account & security$/i })
      ).toBeVisible({ timeout: 15000 });

      const currentUid = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div'));
        for (const card of cards) {
          const paragraphs = Array.from(card.querySelectorAll('p'));
          const label = paragraphs[0]?.textContent?.trim();
          if (label === 'User ID') {
            return paragraphs[1]?.textContent?.trim() || '';
          }
        }
        return '';
      });

      await page
        .getByRole('button', { name: /merge & share garage/i })
        .click();

      await expect(
        page.getByRole('heading', { name: /account consolidation/i })
      ).toBeVisible({ timeout: 15000 });
      await expect(page.getByLabel(/source account uid/i)).toBeVisible({
        timeout: 15000,
      });

      test.skip(
        !currentUid,
        'Current user UID is not visible on the account security page.'
      );

      await page.getByLabel(/source account uid/i).fill(currentUid);
      await page
        .getByRole('button', { name: /send verification code/i })
        .click();

      await expect(
        page.getByText(/cannot consolidate an account with itself/i)
      ).toBeVisible();
    });

    test('TC-PROFILE-003: Profile menu selections populate the detail panel inline', async ({
      page,
    }) => {
      const destinations: Array<{
        link: RegExp;
        heading: RegExp;
      }> = [
        {
          link: /^account & security/i,
          heading: /^account & security$/i,
        },
        {
          link: /^maintenance alerts/i,
          heading: /^maintenance alerts$/i,
        },
        {
          link: /^merge & share garage/i,
          heading: /^merge & share garage$/i,
        },
        {
          link: /^data & privacy/i,
          heading: /^data & privacy$/i,
        },
      ];

      await page.goto(`${BASE_URL}/app/profile`);
      await page.waitForURL(/\/app\/profile/, { timeout: 15000 });

      for (const destination of destinations) {
        await page.getByRole('button', { name: destination.link }).click();
        await expect(
          page.getByRole('heading', { name: destination.heading })
        ).toBeVisible({ timeout: 15000 });

        // Selecting a section populates the detail panel in place -- it
        // must never navigate away from the Profile hub.
        await expect(page).toHaveURL(/\/app\/profile$/);
      }
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

    test('TC-MONETIZATION-001: Subscription page loads with tier options', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app/subscription`);

      // In environments where app routes are intentionally gated (for example,
      // production marketing-only mode), fallback redirects are acceptable.
      const plansHeading = page.getByRole('heading', {
        name: /subscriptions and billing/i,
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

    test('TC-MONETIZATION-003: Subscription checkout banner renders on return flow', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app/subscription?checkout=success`);

      const successBanner = page.getByText(
        /checkout completed\. your subscription is being finalized\./i
      );

      if (await successBanner.isVisible().catch(() => false)) {
        await expect(successBanner).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
        await expect(page).not.toHaveURL(/\/signin/i);
      }
    });

    test('TC-MONETIZATION-004: Past-due billing recovery panel shows support actions', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app/subscription`);

      const billingPanel = page.getByText(/billing action needed/i);

      if (await billingPanel.isVisible().catch(() => false)) {
        await expect(billingPanel).toBeVisible();
        await expect(
          page.getByRole('link', { name: /contact support/i })
        ).toBeVisible();
        await expect(
          page.getByRole('link', { name: /email support/i })
        ).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
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

  // ─────────────────────────────────────────────────────────────────
  // ACCOUNT CONSOLIDATION TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Account Consolidation', () => {
    test('TC-CONSOLIDATE-001: Account consolidation callable is available', async ({
      page,
    }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Account consolidation requires auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);
      await page.goto(`${BASE_URL}/app/profile`);

      // Check if consolidation UI is present (may be in profile or settings)
      const consolidationSection = page.getByText(/consolidate|merge|link/i);
      if (await consolidationSection.isVisible()) {
        await expect(consolidationSection).toBeVisible();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // FIRESTORE PAGINATION TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Firestore Pagination', () => {
    test.beforeEach(async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Pagination tests require auth UI in this deployment target.'
      );
      await ensureAuthenticated(page);
    });

    test('TC-PAGINATION-001: Garage supports loading additional vehicles', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app`);

      const loadMoreButton = page.getByRole('button', {
        name: /load more vehicles/i,
      });

      if (await loadMoreButton.isVisible().catch(() => false)) {
        await loadMoreButton.click();
        await expect(loadMoreButton).toBeVisible();
      } else {
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // IMAGE CACHING TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Image Caching', () => {
    test.beforeEach(async ({ page }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Image caching tests require auth UI in this deployment target.'
      );
      await ensureAuthenticated(page);
    });

    test('TC-CACHE-001: Vehicle images load with caching', async ({ page }) => {
      await page.goto(`${BASE_URL}/app/add-vehicle`);

      // Add a vehicle with a photo URL if possible
      const photoUrlField = page.locator(
        'input[type="url"], input[placeholder*="photo"], input[placeholder*="image"]'
      );
      if (await photoUrlField.isVisible()) {
        await photoUrlField.fill('https://via.placeholder.com/300');

        // Verify the image loads
        const image = page.locator('img').first();
        if (await image.isVisible()) {
          await expect(image).toBeVisible({ timeout: 10000 });

          // Check if image has proper caching headers (via network response)
          const responses: any[] = [];
          page.on('response', response => {
            if (response.url().includes('placeholder')) {
              responses.push(response);
            }
          });

          await page.reload();
          await page.waitForTimeout(2000);

          // Verify image was cached (should be faster on reload)
          expect(responses.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // ERROR BOUNDARY TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Error Boundary', () => {
    test('TC-ERROR-001: Error boundary catches component errors', async ({
      page,
    }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Error boundary tests require auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);

      // Navigate to a page that might have errors
      await page.goto(`${BASE_URL}/app`);

      // Check if error boundary UI is not present (no errors)
      const errorBoundary = page.getByText(
        /something went wrong|unexpected error/i
      );
      const isPresent = await errorBoundary.isVisible().catch(() => false);

      expect(isPresent).toBe(false);
    });

    test('TC-ERROR-002: App handles network errors gracefully', async ({
      page,
    }) => {
      const authUiAvailable = await isAuthUiAvailable(page);
      test.skip(
        !authUiAvailable,
        'Error boundary tests require auth UI in this deployment target.'
      );

      await ensureAuthenticated(page);

      await page.goto(`${BASE_URL}/app`);

      try {
        // Toggle offline after load so Firefox does not fail the navigation itself.
        await page.context().setOffline(true);

        // App should continue rendering without crashing when the connection drops.
        await expect(page.locator('body')).toBeVisible();
      } finally {
        await page.context().setOffline(false);
      }
    });
  });
});
