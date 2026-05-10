/**
 * Screenshot capture script for Vehicle Vitals User Guide
 * Usage: node scripts/capture-screenshots.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '../docs/screenshots');
const DEMO_EMAIL = 'demo@vehiclevitals.com';
const DEMO_PASSWORD = 'Demo2025!';

// Inject sessionStorage key that bypasses the EnvironmentGate component
const BYPASS_SCRIPT = () => {
  sessionStorage.setItem('vv_env_gate_auth', 'development');
};

async function saveScreenshot(page, filename, fullPage = false) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage });
  console.log(`  ✓ Saved: ${filename}`);
}

async function goto(page, url, waitMs = 1500) {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(BYPASS_SCRIPT); // re-inject after every navigation
  await page.waitForTimeout(waitMs);
}

async function run() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Inject gate bypass on every new document load
  await context.addInitScript(BYPASS_SCRIPT);

  // ─── 1. Landing page ──────────────────────────────────────────────────────
  console.log('\n[1] Landing page');
  await goto(page, BASE_URL, 1500);
  await saveScreenshot(page, 'landing.png', true);

  // ─── 2. Sign In page ──────────────────────────────────────────────────────
  console.log('\n[2] Sign In page');
  await goto(page, `${BASE_URL}/auth/login`, 1000);
  await saveScreenshot(page, 'login.png');

  // ─── 3. Sign Up page ──────────────────────────────────────────────────────
  console.log('\n[3] Sign Up page');
  await goto(page, `${BASE_URL}/auth/signup`, 1000);
  await saveScreenshot(page, 'signup.png');

  // ─── 4. Forgot Password page ──────────────────────────────────────────────
  console.log('\n[4] Forgot Password page');
  await goto(page, `${BASE_URL}/auth/forgot-password`, 1000);
  await saveScreenshot(page, 'forgot-password.png');

  // ─── 5. Instructions page ─────────────────────────────────────────────────
  console.log('\n[5] Instructions page');
  await goto(page, `${BASE_URL}/instructions`, 1000);
  await saveScreenshot(page, 'instructions.png', true);

  // ─── Sign in as demo user ─────────────────────────────────────────────────
  console.log('\n[auth] Signing in as demo user');
  await goto(page, `${BASE_URL}/auth/login`, 1000);
  await page.locator('input[type="email"]').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE_URL}/app**`, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  console.log('  Auth done, current URL:', page.url());

  // ─── 6. Garage – vehicle list ─────────────────────────────────────────────
  console.log('\n[6] Garage – vehicle list');
  await goto(page, `${BASE_URL}/app`, 3500);
  await saveScreenshot(page, 'garage-vehicles.png');

  // ─── 7. Garage – vehicle detail panel ─────────────────────────────────────
  console.log('\n[7] Garage – vehicle detail panel (F-150)');
  const vehicleCards = page.locator('main button').filter({ hasText: 'Ford F-150' });
  if (await vehicleCards.count() > 0) {
    await vehicleCards.first().click();
    await page.waitForTimeout(1500);
  }
  await saveScreenshot(page, 'garage-detail.png');

  // ─── 8. Add Vehicle page ──────────────────────────────────────────────────
  console.log('\n[8] Add Vehicle page');
  await goto(page, `${BASE_URL}/add-vehicle`, 1500);
  await saveScreenshot(page, 'add-vehicle.png');

  // ─── 9. Edit Vehicle page ─────────────────────────────────────────────────
  console.log('\n[9] Edit Vehicle page (F-150)');
  await goto(page, `${BASE_URL}/edit-vehicle/1FTEW1EP8NFA23457`, 2000);
  await saveScreenshot(page, 'edit-vehicle.png');

  // ─── 10. Records page ─────────────────────────────────────────────────────
  console.log('\n[10] Records page (F-150)');
  await goto(page, `${BASE_URL}/app/records/1FTEW1EP8NFA23457`, 3000);
  await saveScreenshot(page, 'records.png', true);

  // ─── 11. Timeline page ────────────────────────────────────────────────────
  console.log('\n[11] Timeline page');
  await goto(page, `${BASE_URL}/app/timeline`, 3000);
  await saveScreenshot(page, 'timeline.png', true);

  // ─── 12. Upcoming Tasks page ──────────────────────────────────────────────
  console.log('\n[12] Upcoming Tasks page');
  await goto(page, `${BASE_URL}/app/upcoming`, 2500);
  await saveScreenshot(page, 'upcoming.png', true);

  // ─── 13. Service Providers page ───────────────────────────────────────────
  console.log('\n[13] Service Providers page');
  await goto(page, `${BASE_URL}/app/providers`, 1500);
  await saveScreenshot(page, 'providers.png', true);

  // ─── 14. Profile page ─────────────────────────────────────────────────────
  console.log('\n[14] Profile page');
  await goto(page, `${BASE_URL}/app/profile`, 1500);
  await saveScreenshot(page, 'profile.png', true);

  await browser.close();
  console.log('\n✅ All screenshots saved to docs/screenshots/');
  fs.readdirSync(SCREENSHOTS_DIR).forEach(f => console.log(`  ${f}`));
}

run().catch(err => { console.error('Failed:', err); process.exit(1); });
