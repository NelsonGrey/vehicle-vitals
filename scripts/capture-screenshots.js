/**
 * Screenshot capture script for Vehicle Vitals User Guide
 * Usage: node scripts/capture-screenshots.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '../docs/screenshots');
const WEB_FEATURE_IMAGES_DIR = path.join(
  __dirname,
  '../packages/web/public/images/features'
);
const SCREENSHOT_VIEWPORT = { width: 1280, height: 1800 };
const DEMO_EMAIL = 'demo@vehiclevitals.com';
const DEMO_PASSWORD = 'Demo2025!';

// Inject sessionStorage key that bypasses the EnvironmentGate component
const BYPASS_SCRIPT = () => {
  sessionStorage.setItem('vv_env_gate_auth', 'development');
};

async function saveScreenshot(page, filename, fullPage = false) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: filepath, fullPage });
  console.log(`  ✓ Saved: ${filename}`);
}

function syncWebFeatureImages() {
  const webImageFiles = [
    'landing.png',
    'garage-vehicles.png',
    'garage-detail.png',
    'add-vehicle.png',
    'edit-vehicle.png',
    'records.png',
    'timeline.png',
    'upcoming.png',
    'providers.png',
    'profile.png',
  ];

  fs.mkdirSync(WEB_FEATURE_IMAGES_DIR, { recursive: true });

  for (const file of webImageFiles) {
    const source = path.join(SCREENSHOTS_DIR, file);
    const destination = path.join(WEB_FEATURE_IMAGES_DIR, file);

    if (fs.existsSync(source)) {
      fs.copyFileSync(source, destination);
      console.log(`  ↳ Synced feature image: ${file}`);
    }
  }

  const landing = path.join(SCREENSHOTS_DIR, 'landing.png');
  const landingCurrent = path.join(
    WEB_FEATURE_IMAGES_DIR,
    'landing-current.png'
  );
  if (fs.existsSync(landing)) {
    fs.copyFileSync(landing, landingCurrent);
    console.log('  ↳ Synced feature image: landing-current.png');
  }
}

async function goto(page, url, waitMs = 1500) {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(BYPASS_SCRIPT); // re-inject after every navigation
  await page.waitForTimeout(waitMs);
}

async function run() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: SCREENSHOT_VIEWPORT,
  });
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
  await saveScreenshot(page, 'login.png', true);

  // ─── 3. Sign Up page ──────────────────────────────────────────────────────
  console.log('\n[3] Sign Up page');
  await goto(page, `${BASE_URL}/auth/signup`, 1000);
  await saveScreenshot(page, 'signup.png', true);

  // ─── 4. Forgot Password page ──────────────────────────────────────────────
  console.log('\n[4] Forgot Password page');
  await goto(page, `${BASE_URL}/auth/forgot-password`, 1000);
  await saveScreenshot(page, 'forgot-password.png', true);

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
  await page
    .waitForURL(`${BASE_URL}/app**`, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(2500);
  console.log('  Auth done, current URL:', page.url());

  // ─── 6. Garage – vehicle list ─────────────────────────────────────────────
  console.log('\n[6] Garage – vehicle list');
  await goto(page, `${BASE_URL}/app`, 3500);
  await saveScreenshot(page, 'garage-vehicles.png', true);

  // ─── 7. Garage – vehicle detail panel ─────────────────────────────────────
  console.log('\n[7] Garage – vehicle detail panel (F-150)');
  const vehicleCards = page
    .locator('main button')
    .filter({ hasText: 'Ford F-150' });
  if ((await vehicleCards.count()) > 0) {
    await vehicleCards.first().click();
    await page.waitForTimeout(1500);
  }
  await saveScreenshot(page, 'garage-detail.png', true);

  // ─── 8. Add Vehicle page ──────────────────────────────────────────────────
  console.log('\n[8] Add Vehicle page');
  await goto(page, `${BASE_URL}/add-vehicle`, 1500);
  await saveScreenshot(page, 'add-vehicle.png', true);

  // ─── 9. Edit Vehicle page ─────────────────────────────────────────────────
  console.log('\n[9] Edit Vehicle page (F-150)');
  await goto(page, `${BASE_URL}/edit-vehicle/1FTEW1EP8NFA23457`, 2000);
  await saveScreenshot(page, 'edit-vehicle.png', true);

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
  syncWebFeatureImages();
  console.log('\n✅ All screenshots saved to docs/screenshots/');
  fs.readdirSync(SCREENSHOTS_DIR).forEach(f => console.log(`  ${f}`));
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
