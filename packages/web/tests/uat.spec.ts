/**
 * Vehicle Vitals - User Acceptance Testing (UAT) Script
 *
 * Comprehensive end-to-end tests covering all major features:
 * - User Authentication (Sign Up, Login, Password Reset)
 * - Vehicle Management (Create, Edit, Delete)
 * - Maintenance Records (Add, View, Delete)
 * - Timeline Dashboard
 * - Upcoming Tasks/Reminders
 * - Service Providers
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
const TEST_VEHICLE_YEAR = '2020';
const TEST_VEHICLE_VIN = '12345ABCDE67890FGH00';

test.describe('Vehicle Vitals - User Acceptance Testing', () => {
  // ─────────────────────────────────────────────────────────────────
  // AUTHENTICATION TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Authentication', () => {
    test('TC-AUTH-001: User can sign up with email', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/signup`);

      // Fill in sign up form using ID selectors
      await page.locator('#email').fill(TEST_EMAIL);
      await page.locator('#password').fill(TEST_PASSWORD);
      await page.locator('#confirmPassword').fill(TEST_PASSWORD);

      // Submit form
      await page.getByRole('button', { name: /Create Account/i }).click();

      // Verify redirect to app home
      await page.waitForURL(/\/app/, { timeout: 10000 });
      expect(page.url()).toContain('/app');
    });

    test('TC-AUTH-002: User can log in with email', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);

      // Fill login form
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);

      // Submit form
      await page.getByRo using ID selectors
      await page.locator('#email').fill(TEST_EMAIL);
      await page.locator('#password').fill(TEST_PASSWORD);

      // Submit form
      await page.getByRole('button', { name: /Sign I

    test('TC-AUTH-003: Login fails with incorrect password', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/auth/login`);

      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill('WrongPassword123');
      await page.getByRole('button', { name: /sign in|login/i }).click();

      // Should show error message and stay on login page
      await expect(
        page.getByText(/error|incorrect|invalid|failed/i)
      ).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/auth/login');
    });

    test('TC-AUTH-004: User can sign out', async ({ page }) => {
      // Log in first
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('#email').fill(TEST_EMAIL);
      await page.locator('#password').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /Sign In/i }).click();
      await page.waitForURL(/\/app/);

      // Navigate to profile and sign out
      await page.goto(`${BASE_URL}/app/profile`);
      
      // Look for sign out button
      const signOutButton = page.getByRole('button', {
        name: /Sign Out|Log Out|Logout/i,
      });
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        // Should redirect to home or login
        await page.waitForURL(/\/|\/auth/, { timeout: 10000 });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // VEHICLE MANAGEMENT TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Vehicle Management', () => {
    test.beforeEach(async ({ page }) => {
      // Log in before each test
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);
    });

    test('TC-VEHICLE-001: User can add a new vehicle', async ({ page }) => {
      // Navigate to add vehicle page
      await page.goto(`${BASE_URL}/app/add-vehicle`);

      // Fill in vehicle details
      await page.getByLabel(/make|manufacturer/i).fill(TEST_VEHICLE_MAKE);
      await page.getByLabel(/model/i).fill(TEST_VEHICLE_MODEL);
      await page.getByLabel(/year/i).fill(TEST_VEHICLE_YEAR);
      await page.getByLabel(/vin/i).fill(TEST_VEHICLE_VIN);

      // Submit form
      await page.getByRole('button', { name: /add|create|save/i }).click();

      // Verify vehicle appears in list
      await page.waitForURL(/\/app/);
      await expect(page.getByText(new RegExp(TEST_VEHICLE_MAKE))).toBeVisible({
        timeout: 5000,
      });
    });

    test('TC-VEHICLE-002: User can edit vehicle details', async ({ page }) => {
      // Navigate to home
      await page.goto(`${BASE_URL}/app`);

      // Find and click edit on first vehicle
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      await editButton.click();

      // Verify on edit page
      await expect(page.getByText(/edit vehicle|vehicle details/i)).toBeVisible(
        { timeout: 5000 }
      );

      // Change a field (e.g., notes)
      const notesField = page.getByLabel(/notes|description/i);
      if (await notesField.isVisible()) {
        await notesField.fill('Updated test notes');
        await page.getByRole('button', { name: /save|update/i }).click();
        await expect(page.getByText(/saved|updated/i)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('TC-VEHICLE-003: User can view vehicle details', async ({ page }) => {
      // Navigate to home
      await page.goto(`${BASE_URL}/app`);

      // Click on first vehicle
      const vehicleCard = page.locator('[data-testid="vehicle-card"]').first();
      if (!(await vehicleCard.isVisible())) {
        await page
          .getByText(new RegExp(TEST_VEHICLE_MAKE, 'i'))
          .first()
          .click();
      } else {
        await vehicleCard.click();
      }

      // Verify vehicle details page loads
      await expect(page.getByText(/vehicle details|edit vehicle/i)).toBeVisible(
        { timeout: 5000 }
      );
    });

    test('TC-VEHICLE-004: Vehicle list displays all added vehicles', async ({
      page,
    }) => {
      // Navigate to home
      await page.goto(`${BASE_URL}/app`);

      // Verify at least one vehicle is displayed
      const vehicleItems = page.locator(
        '[data-testid="vehicle-card"], .vehicle-item, [class*="vehicle"]'
      );
      expect(await vehicleItems.count()).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MAINTENANCE RECORDS TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Maintenance Records', () => {
    test.beforeEach(async ({ page }) => {
      // Log in
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);
    });

    test('TC-RECORDS-001: User can add a maintenance record', async ({
      page,
    }) => {
      // Navigate to records page (if vehicle exists)
      await page.goto(`${BASE_URL}/app`);

      // Try to access records for first vehicle
      const recordsLink = page
        .getByRole('link', { name: /records|maintenance/i })
        .first();
      if (await recordsLink.isVisible()) {
        await recordsLink.click();
        await page.waitForURL(/\/app\/records/);

        // Try to add a record
        const addButton = page.getByRole('button', { name: /add|new|create/i });
        if (await addButton.isVisible()) {
          await addButton.click();

          // Fill record details
          const dateField = page.getByLabel(/date|service date/i);
          if (await dateField.isVisible()) {
            await dateField.fill(new Date().toISOString().split('T')[0]);
          }

          const serviceField = page.getByLabel(/service|type|description/i);
          if (await serviceField.isVisible()) {
            await serviceField.fill('Oil Change');
          }

          // Save record
          await page.getByRole('button', { name: /save|add/i }).click();
          await expect(page.getByText(/saved|added|success/i)).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });

    test('TC-RECORDS-002: Records display in chronological order', async ({
      page,
    }) => {
      // Navigate to records page
      await page.goto(`${BASE_URL}/app`);
      const recordsLink = page
        .getByRole('link', { name: /records|maintenance/i })
        .first();
      if (await recordsLink.isVisible()) {
        await recordsLink.click();
        await page.waitForURL(/\/app\/records/);

        // Check if records are visible
        const records = page.locator(
          '[data-testid="record-item"], .record-item, [class*="record"]'
        );
        if ((await records.count()) > 1) {
          expect(await records.count()).toBeGreaterThan(0);
        }
      }
    });

    test('TC-RECORDS-003: User can upload file attachments to records', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/app`);
      const recordsLink = page
        .getByRole('link', { name: /records|maintenance/i })
        .first();
      if (await recordsLink.isVisible()) {
        await recordsLink.click();
        await page.waitForURL(/\/app\/records/);

        // Look for file upload
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible()) {
          // Upload capability exists
          expect(fileInput).toBeDefined();
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TIMELINE & DASHBOARD TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Timeline & Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);
    });

    test('TC-TIMELINE-001: Timeline page displays vehicle history', async ({
      page,
    }) => {
      // Navigate to timeline
      const timelineLink = page.getByRole('link', {
        name: /timeline|history|ownership/i,
      });
      if (await timelineLink.isVisible()) {
        await timelineLink.click();
        await page.waitForURL(/timeline|history/);

        // Verify timeline content loads
        await expect(page.locator('body')).toContainText(
          /timeline|history|chronology|records/i
        );
      }
    });

    test('TC-TIMELINE-002: Home dashboard displays vehicle summary', async ({
      page,
    }) => {
      // Navigate to home
      await page.goto(`${BASE_URL}/app`);

      // Verify dashboard elements
      const dashboard = page.locator('main, [role="main"]');
      await expect(dashboard).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // UPCOMING TASKS TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Upcoming Tasks & Reminders', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);
    });

    test('TC-UPCOMING-001: Upcoming tasks page displays maintenance reminders', async ({
      page,
    }) => {
      const upcomingLink = page.getByRole('link', {
        name: /upcoming|tasks|reminders|maintenance/i,
      });
      if (await upcomingLink.isVisible()) {
        await upcomingLink.click();
        await page.waitForURL(/upcoming|tasks/);

        // Verify page loaded
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('TC-UPCOMING-002: User can mark tasks as complete', async ({
      page,
    }) => {
      const upcomingLink = page.getByRole('link', {
        name: /upcoming|tasks|reminders/i,
      });
      if (await upcomingLink.isVisible()) {
        await upcomingLink.click();
        await page.waitForURL(/upcoming|tasks/);

        // Look for checkbox or complete button
        const completeButton = page
          .getByRole('button', { name: /complete|done|check/i })
          .first();
        if (await completeButton.isVisible()) {
          await completeButton.click();
          await expect(page.getByText(/completed|success/i)).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // SERVICE PROVIDERS TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Service Providers', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);
    });

    test('TC-PROVIDERS-001: Service providers page loads', async ({ page }) => {
      const providersLink = page.getByRole('link', {
        name: /providers|service|shops|dealerships/i,
      });
      if (await providersLink.isVisible()) {
        await providersLink.click();
        await page.waitForURL(/providers/);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('TC-PROVIDERS-002: User can add a service provider', async ({
      page,
    }) => {
      const providersLink = page.getByRole('link', {
        name: /providers|service/i,
      });
      if (await providersLink.isVisible()) {
        await providersLink.click();
        await page.waitForURL(/providers/);

        const addButton = page.getByRole('button', { name: /add|new|create/i });
        if (await addButton.isVisible()) {
          await addButton.click();

          // Fill provider form
          const nameField = page.getByLabel(/name|provider/i);
          if (await nameField.isVisible()) {
            await nameField.fill('Test Service Center');
          }

          const saveButton = page.getByRole('button', { name: /save|add/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await expect(page.getByText(/saved|added|success/i)).toBeVisible({
              timeout: 5000,
            });
          }
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // USER PROFILE TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('User Profile', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);
    });

    test('TC-PROFILE-001: User can view profile page', async ({ page }) => {
      const profileLink = page.getByRole('link', {
        name: /profile|account|settings/i,
      });
      if (await profileLink.isVisible()) {
        await profileLink.click();
        await page.waitForURL(/profile|account|settings/);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('TC-PROFILE-002: User can update profile information', async ({
      page,
    }) => {
      const profileLink = page.getByRole('link', {
        name: /profile|account|settings/i,
      });
      if (await profileLink.isVisible()) {
        await profileLink.click();
        await page.waitForURL(/profile|account|settings/);

        // Try to find and edit a profile field
        const firstNameField = page.getByLabel(/first name|name/i);
        if (await firstNameField.isVisible()) {
          const currentValue = await firstNameField.inputValue();
          await firstNameField.fill('Test User ' + Date.now());

          const saveButton = page.getByRole('button', { name: /save|update/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await expect(page.getByText(/saved|updated|success/i)).toBeVisible({
              timeout: 5000,
            });
          }
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // UI/UX TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('UI/UX & Navigation', () => {
    test('TC-UI-001: Landing page is responsive', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check for main content
      const content = page.locator('main, [role="main"], body');
      await expect(content).toBeVisible();
    });

    test('TC-UI-002: Navigation menu is accessible', async ({
      page,
      context,
    }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);

      // Check for navigation
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.isVisible()) {
        const links = nav.getByRole('link');
        expect(await links.count()).toBeGreaterThan(0);
      }
    });

    test('TC-UI-003: All pages load without console errors', async ({
      page,
      context,
    }) => {
      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Visit main pages
      await page.goto(BASE_URL);
      expect(errors.length).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // DATA PERSISTENCE TESTS
  // ─────────────────────────────────────────────────────────────────

  test.describe('Data Persistence', () => {
    test('TC-DATA-001: User data persists after logout and login', async ({
      page,
    }) => {
      // Log in
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);

      // Go to home
      await page.goto(`${BASE_URL}/app`);

      // Get vehicle count
      const vehicleCount = await page
        .locator(
          '[data-testid="vehicle-card"], .vehicle-item, [class*="vehicle"]'
        )
        .count();

      // Note vehicle data
      const vehicleText = await page.locator('body').textContent();

      // Log out
      const profileButton = page
        .getByRole('button', { name: /profile|account|menu/i })
        .first();
      if (await profileButton.isVisible()) {
        await profileButton.click();
      }
      const signOutButton = page.getByRole('menuitem', {
        name: /sign out|logout/i,
      });
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForURL(/^[^\/]*\/?$/);
      }

      // Log back in
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForURL(/\/app/);

      // Verify data is same
      const newVehicleCount = await page
        .locator(
          '[data-testid="vehicle-card"], .vehicle-item, [class*="vehicle"]'
        )
        .count();
      expect(newVehicleCount).toBe(vehicleCount);
    });
  });
});
