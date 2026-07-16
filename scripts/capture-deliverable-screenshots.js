#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.VV_SCREENSHOT_BASE_URL || 'http://localhost:5173';
const DATE =
  process.env.VV_SCREENSHOT_DATE || new Date().toISOString().slice(0, 10);
const OUTPUT_ROOT = path.resolve(
  process.env.VV_SCREENSHOT_OUTPUT ||
    path.join(ROOT, 'output', 'playwright', `vehicle-vitals-${DATE}`, 'web')
);
const USE_EMULATORS = process.env.VV_SCREENSHOT_USE_EMULATORS === '1';
const AUTH_EMAIL =
  process.env.VV_SCREENSHOT_EMAIL || 'screenshots@vehicle-vitals.local';
const AUTH_PASSWORD =
  process.env.VV_SCREENSHOT_PASSWORD || 'ScreenshotDemo2026!';
const DEMO_VIN = process.env.VV_SCREENSHOT_VIN || '1HGCM82633A100001';

const allViewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'tablet', width: 1024, height: 1366 },
  { id: 'mobile', width: 390, height: 844 },
];
const requestedViewportIds = new Set(
  String(process.env.VV_SCREENSHOT_VIEWPORTS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);
const viewports = requestedViewportIds.size
  ? allViewports.filter(viewport => requestedViewportIds.has(viewport.id))
  : allViewports;
const requestedRouteIds = new Set(
  String(process.env.VV_SCREENSHOT_ROUTE_IDS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);
const shouldCaptureRoute = id =>
  requestedRouteIds.size === 0 || requestedRouteIds.has(id);

const publicRoutes = [
  { id: 'landing', route: '/' },
  { id: 'persona-owners', route: '/personas/owners' },
  { id: 'persona-households', route: '/personas/households' },
  { id: 'persona-new-drivers', route: '/personas/new-drivers' },
  { id: 'persona-diy-maintainers', route: '/personas/diy-maintainers' },
  { id: 'persona-light-fleets', route: '/personas/light-fleets' },
  { id: 'demo-vin-lookup', route: '/vin-lookup-demo' },
  { id: 'demo-maintenance-planning', route: '/maintenance-planning-demo' },
  { id: 'demo-cross-platform', route: '/cross-platform-access-demo' },
  { id: 'demo-ownership-history', route: '/ownership-history-demo' },
  { id: 'getting-started', route: '/getting-started' },
  { id: 'product-tour', route: '/product-tour' },
  { id: 'help', route: '/help' },
  { id: 'support', route: '/support' },
  { id: 'pricing', route: '/subscription' },
  { id: 'privacy', route: '/privacy' },
  { id: 'terms', route: '/terms' },
  { id: 'login', route: '/auth/login' },
  { id: 'signup', route: '/auth/signup' },
  { id: 'forgot-password', route: '/auth/forgot-password' },
];

const authenticatedRoutes = [
  { id: 'app-garage', route: '/app' },
  { id: 'app-add-vehicle', route: '/app/add-vehicle' },
  { id: 'app-edit-vehicle', route: `/app/edit-vehicle/${DEMO_VIN}` },
  { id: 'app-records', route: `/app/records/${DEMO_VIN}` },
  { id: 'app-profile', route: '/app/profile' },
  { id: 'app-account-security', route: '/app/account' },
  { id: 'app-maintenance-alerts', route: '/app/maintenance-alerts' },
  { id: 'app-account-consolidation', route: '/app/account-consolidation' },
  { id: 'app-api-automation', route: '/app/api-automation' },
  { id: 'app-data-privacy', route: '/app/data-privacy' },
  { id: 'app-shops-services', route: '/app/providers' },
  { id: 'app-service-history', route: '/app/timeline' },
  { id: 'app-maintenance-plan', route: '/app/upcoming' },
  { id: 'app-demo-data', route: '/app/dev-seed' },
];
const needsAuthenticatedCapture =
  requestedRouteIds.size === 0 ||
  authenticatedRoutes.some(item => requestedRouteIds.has(item.id)) ||
  requestedRouteIds.has('app-garage-detail');

const manifest = [];

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

async function prepareEmulatorAccount() {
  if (!USE_EMULATORS) return null;

  const endpoint =
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts';
  const body = {
    email: AUTH_EMAIL,
    password: AUTH_PASSWORD,
    returnSecureToken: true,
  };

  let response = await fetch(`${endpoint}:signUp?key=local-screenshot-key`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  let payload = await response.json();

  if (!response.ok && payload?.error?.message === 'EMAIL_EXISTS') {
    response = await fetch(
      `${endpoint}:signInWithPassword?key=local-screenshot-key`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    payload = await response.json();
  }

  if (!response.ok || !payload.localId) {
    throw new Error(
      `Could not prepare the local screenshot account: ${payload?.error?.message || response.status}`
    );
  }

  execFileSync(
    process.execPath,
    [
      path.join(ROOT, 'packages', 'functions', 'scripts', 'seed-demo-data.js'),
      `--uid=${payload.localId}`,
    ],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        FIREBASE_PROJECT_ID: 'vehicle-vitals-dev',
        GCLOUD_PROJECT: 'vehicle-vitals-dev',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      },
    }
  );

  return payload.localId;
}

async function settlePage(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
  await page
    .waitForFunction(() => document.fonts?.status === 'loaded', null, {
      timeout: 5000,
    })
    .catch(() => {});
  await page
    .evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.race([
        Promise.all(
          images.map(image =>
            image.complete
              ? Promise.resolve()
              : new Promise(resolve => {
                  image.addEventListener('load', resolve, { once: true });
                  image.addEventListener('error', resolve, { once: true });
                })
          )
        ),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]);
      window.scrollTo(0, 0);
    })
    .catch(() => {});
  await page.waitForTimeout(500);
}

async function capture(page, viewport, item, scope, errors) {
  const startedAt = Date.now();
  if (!item.skipNavigation) {
    await page.goto(`${BASE_URL}${item.route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await settlePage(page);
  }
  await page.addStyleTag({
    content:
      '[aria-label^="Sponsored placement"] { display: none !important; }',
  });
  await page.evaluate(() => {
    const scrollArea = document.querySelector('.site-scroll-area');
    const layout = scrollArea?.parentElement;
    for (const element of [
      document.documentElement,
      document.body,
      document.getElementById('root'),
      layout,
      scrollArea,
    ]) {
      if (!(element instanceof HTMLElement)) continue;
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
    }
    if (scrollArea instanceof HTMLElement) {
      scrollArea.style.flex = 'none';
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(100);

  const directory = path.join(OUTPUT_ROOT, viewport.id);
  ensureDirectory(directory);
  const filePath = path.join(directory, `${item.id}.png`);
  await page.screenshot({
    path: filePath,
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });

  const pageInfo = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
  }));

  const relativeFile = path.relative(ROOT, filePath);
  const existingIndex = manifest.findIndex(
    entry => entry.viewport === viewport.id && entry.id === item.id
  );
  if (existingIndex >= 0) manifest.splice(existingIndex, 1);
  manifest.push({
    platform: 'web',
    scope,
    viewport: viewport.id,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    id: item.id,
    route: item.route,
    finalUrl: page.url(),
    title: pageInfo.title,
    h1: pageInfo.h1,
    documentWidth: pageInfo.documentWidth,
    documentHeight: pageInfo.documentHeight,
    bytes: fs.statSync(filePath).size,
    consoleErrors: errors.splice(0).join(' | '),
    durationMs: Date.now() - startedAt,
    file: relativeFile,
  });
  writeManifest();
  console.log(`  captured ${viewport.id}/${item.id}.png`);
}

async function captureGarageDetail(page, viewport, errors) {
  await page.goto(`${BASE_URL}/app`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await settlePage(page);

  const candidate = page
    .locator('main button')
    .filter({ hasText: /Honda Accord|Ford F-150/ })
    .first();
  if ((await candidate.count()) === 0) return;

  await candidate.click();
  await page.waitForTimeout(500);
  await capture(
    page,
    viewport,
    { id: 'app-garage-detail', route: '/app', skipNavigation: true },
    'authenticated-state',
    errors
  );
}

async function signIn(page) {
  await page.goto(`${BASE_URL}/auth/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.locator('#email').fill(AUTH_EMAIL);
  await page.locator('#password').fill(AUTH_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => url.pathname.startsWith('/app'), {
    timeout: 20000,
  });
  await settlePage(page);
}

function writeManifest() {
  const jsonPath = path.join(OUTPUT_ROOT, 'manifest.json');
  const csvPath = path.join(OUTPUT_ROOT, 'manifest.csv');
  fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const headers = Object.keys(manifest[0] || {});
  const rows = [headers.map(csvCell).join(',')];
  for (const item of manifest) {
    rows.push(headers.map(header => csvCell(item[header])).join(','));
  }
  fs.writeFileSync(csvPath, `${rows.join('\n')}\n`);
}

async function hydrateExistingManifest() {
  const manifestPath = path.join(OUTPUT_ROOT, 'manifest.json');
  let existingByKey = new Map();

  if (fs.existsSync(manifestPath)) {
    try {
      const existingManifest = JSON.parse(
        fs.readFileSync(manifestPath, 'utf8')
      );
      existingByKey = new Map(
        existingManifest.map(entry => [`${entry.viewport}:${entry.id}`, entry])
      );
    } catch (error) {
      console.warn(`Could not reuse the existing manifest: ${error.message}`);
    }
  }

  for (const viewport of allViewports) {
    const expected = [
      ...publicRoutes.map(item => ({ ...item, scope: 'public' })),
      ...authenticatedRoutes.map(item => ({ ...item, scope: 'authenticated' })),
      {
        id: 'app-garage-detail',
        route: '/app',
        scope: 'authenticated-state',
      },
    ];

    for (const item of expected) {
      const filePath = path.join(OUTPUT_ROOT, viewport.id, `${item.id}.png`);
      if (!fs.existsSync(filePath)) continue;
      const existing = existingByKey.get(`${viewport.id}:${item.id}`);
      if (existing) {
        manifest.push(existing);
        continue;
      }
      const metadata = await sharp(filePath).metadata();
      manifest.push({
        platform: 'web',
        scope: item.scope,
        viewport: viewport.id,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        id: item.id,
        route: item.route,
        finalUrl: '',
        title: '',
        h1: '',
        documentWidth: metadata.width || '',
        documentHeight: metadata.height || '',
        bytes: fs.statSync(filePath).size,
        consoleErrors: '',
        durationMs: '',
        file: path.relative(ROOT, filePath),
      });
    }
  }
}

async function run() {
  ensureDirectory(OUTPUT_ROOT);
  await hydrateExistingManifest();
  writeManifest();
  await prepareEmulatorAccount();

  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of viewports) {
      console.log(`\n[${viewport.id}] public website`);
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: 'light',
        reducedMotion: 'reduce',
        deviceScaleFactor: 1,
      });
      await context.addInitScript(() => {
        try {
          localStorage.setItem(
            'vv_cookie_consent',
            JSON.stringify({
              decided: true,
              analytics: 'denied',
              ads: 'denied',
            })
          );
          sessionStorage.setItem('vv_env_gate_auth', 'development');
        } catch {
          // Storage is unavailable on the initial blank document.
        }
      });

      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      for (const item of publicRoutes) {
        if (!shouldCaptureRoute(item.id)) continue;
        await capture(page, viewport, item, 'public', consoleErrors);
      }

      if (
        needsAuthenticatedCapture &&
        (USE_EMULATORS || process.env.VV_SCREENSHOT_EMAIL)
      ) {
        console.log(`[${viewport.id}] authenticated web app`);
        await signIn(page);
        for (const item of authenticatedRoutes) {
          if (!shouldCaptureRoute(item.id)) continue;
          await capture(page, viewport, item, 'authenticated', consoleErrors);
        }
        if (shouldCaptureRoute('app-garage-detail')) {
          await captureGarageDetail(page, viewport, consoleErrors);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  writeManifest();
  console.log(`\nCaptured ${manifest.length} website screenshots.`);
  console.log(`Manifest: ${path.join(OUTPUT_ROOT, 'manifest.csv')}`);
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
