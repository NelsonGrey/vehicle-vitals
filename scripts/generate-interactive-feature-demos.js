#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const {
  DEFAULT_MODEL,
  DEFAULT_VOICE,
  synthesizeSpeech,
} = require('./lib/openai-audio');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(
  ROOT,
  'packages',
  'web',
  'public',
  'videos',
  'feature-demos'
);
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vv-interactive-all-'));

const BASE_URL =
  process.env.VV_DEMO_BASE_URL || 'https://vehicle-vitals-dev.web.app';
const WIDTH = 1280;
const HEIGHT = 720;
const FRAME_RATE = 30;

const DEMO_EMAIL = process.env.VV_DEMO_EMAIL || 'demo.user@vehiclevitals.dev';
const DEMO_PASSWORD = process.env.VV_DEMO_PASSWORD || 'DemoPassword123!';
const GATE_PASSWORD = process.env.VV_MARKETING_GATE_PASSWORD || '';

const OPENAI_MODEL = process.env.VV_OPENAI_TTS_MODEL || DEFAULT_MODEL;
const OPENAI_VOICE = process.env.VV_OPENAI_TTS_VOICE || DEFAULT_VOICE;
const SAY_VOICE = process.env.VV_NARRATION_VOICE || 'Samantha';
const SAY_RATE = process.env.VV_NARRATION_RATE || '170';

const videoPlans = [
  {
    output: 'onboarding-walkthrough.mp4',
    route: '/',
    narration:
      'Start on the Vehicle-Vitals home page, open getting started guidance, then continue into sign up and sign in. This flow shows a clear path from first visit to active usage.',
    actions: [
      { type: 'wait', ms: 1000 },
      { type: 'clickLink', name: /Getting Started/i, wait: 900 },
      { type: 'clickLink', name: /Login\s*\/\s*Sign Up/i, wait: 900 },
      { type: 'clickLink', name: /Create Account/i, wait: 900 },
      { type: 'goto', route: '/vin-lookup-demo', wait: 1200 },
    ],
  },
  {
    output: 'maintenance-lifecycle-tour.mp4',
    route: '/maintenance-planning-demo',
    narration:
      'Maintenance planning starts with upcoming tasks, continues through records and history, and stays connected through support routes for providers and reminders.',
    actions: [
      { type: 'wait', ms: 900 },
      { type: 'clickLink', name: /^Maintenance$/i, wait: 900 },
      {
        type: 'scrollHeading',
        name: /What You See On The Marketing Side/i,
        wait: 900,
      },
      { type: 'scrollHeading', name: /Video Walkthrough Lane/i, wait: 900 },
      { type: 'goto', route: '/help', wait: 1000 },
    ],
  },
  {
    output: 'cross-platform-continuity.mp4',
    route: '/cross-platform-access-demo',
    narration:
      'Cross platform continuity keeps users moving between desktop and mobile without losing context. Navigation, authentication, and feature access remain consistent across screens.',
    actions: [
      { type: 'wait', ms: 900 },
      { type: 'clickLink', name: /^Cross Platform$/i, wait: 800 },
      { type: 'clickLink', name: /^Home$/i, wait: 900 },
      { type: 'clickLink', name: /^Cross Platform$/i, wait: 900 },
      {
        type: 'scrollHeading',
        name: /How It Is Implemented In The User App/i,
        wait: 1000,
      },
    ],
  },
  {
    output: 'vin-lookup-demo.mp4',
    route: '/vin-lookup-demo',
    narration:
      'In this VIN lookup walkthrough, navigate between feature pages, open the sign in route, type credentials, and return to the demo lane to highlight the marketing and product bridge.',
    actions: [
      { type: 'wait', ms: 900 },
      { type: 'clickLink', name: /^Maintenance$/i, wait: 700 },
      { type: 'clickLink', name: /^VIN Lookup$/i, wait: 900 },
      { type: 'clickLink', name: /Login\s*\/\s*Sign Up/i, wait: 700 },
      { type: 'typeIfVisible', selector: '#email', value: DEMO_EMAIL },
      { type: 'typeIfVisible', selector: '#password', value: DEMO_PASSWORD },
      { type: 'clickButton', name: /Sign In/i, wait: 1200 },
      { type: 'goto', route: '/vin-lookup-demo', wait: 1000 },
      { type: 'scrollHeading', name: /Video Walkthrough Lane/i, wait: 1300 },
    ],
  },
  {
    output: 'maintenance-planning-demo.mp4',
    route: '/maintenance-planning-demo',
    narration:
      'This demo highlights planning workflows, from reminders and schedule visibility to user actions that move from content exploration toward in-app execution.',
    actions: [
      { type: 'wait', ms: 900 },
      { type: 'scrollHeading', name: /Visual Product Gallery/i, wait: 900 },
      { type: 'scrollHeading', name: /Video Walkthrough Lane/i, wait: 900 },
      { type: 'clickLink', name: /Open Maintenance Planner/i, wait: 900 },
      { type: 'goto', route: '/maintenance-planning-demo', wait: 1100 },
    ],
  },
  {
    output: 'cross-platform-access-demo.mp4',
    route: '/cross-platform-access-demo',
    narration:
      'Users can begin on marketing, move into authentication, and transition to app routes. This interaction sequence demonstrates a practical path from discovery to secure usage.',
    actions: [
      { type: 'wait', ms: 800 },
      { type: 'clickLink', name: /Login\s*\/\s*Sign Up/i, wait: 700 },
      { type: 'typeIfVisible', selector: '#email', value: DEMO_EMAIL },
      { type: 'typeIfVisible', selector: '#password', value: DEMO_PASSWORD },
      { type: 'clickButton', name: /Sign In/i, wait: 1200 },
      { type: 'goto', route: '/cross-platform-access-demo', wait: 1000 },
      {
        type: 'scrollHeading',
        name: /How It Is Implemented In The User App/i,
        wait: 1200,
      },
    ],
  },
  {
    output: 'ownership-history-demo.mp4',
    route: '/ownership-history-demo',
    narration:
      'Ownership history is presented through records, timelines, and detail views, then connected to practical app entry points for authenticated users.',
    actions: [
      { type: 'wait', ms: 900 },
      { type: 'clickLink', name: /^Ownership History$/i, wait: 900 },
      {
        type: 'scrollHeading',
        name: /What You See On The Marketing Side/i,
        wait: 900,
      },
      {
        type: 'scrollHeading',
        name: /How It Is Implemented In The User App/i,
        wait: 1200,
      },
      { type: 'goto', route: '/help', wait: 900 },
    ],
  },
  {
    output: 'generic-feature-demo.mp4',
    route: '/',
    narration:
      'This generic feature overview shows primary navigation, page transitions, and route-level interaction pacing for a broad marketing story across the product surface.',
    actions: [
      { type: 'wait', ms: 900 },
      { type: 'clickLink', name: /^VIN Lookup$/i, wait: 700 },
      { type: 'clickLink', name: /^Maintenance$/i, wait: 700 },
      { type: 'clickLink', name: /^Cross Platform$/i, wait: 700 },
      { type: 'clickLink', name: /^Ownership History$/i, wait: 700 },
      { type: 'clickLink', name: /^Home$/i, wait: 1100 },
    ],
  },
  {
    output: 'getting-started-help.mp4',
    route: '/getting-started',
    narration:
      'Getting started now shows practical guidance interactions, including navigation to help and authentication routes that support first-time onboarding and setup.',
    actions: [
      { type: 'wait', ms: 900 },
      {
        type: 'scrollHeading',
        name: /Step|Getting Started|Workflow/i,
        wait: 1000,
      },
      { type: 'clickLink', name: /Help/i, wait: 900 },
      { type: 'clickLink', name: /Login\s*\/\s*Sign Up/i, wait: 900 },
      { type: 'goto', route: '/getting-started', wait: 1100 },
    ],
  },
  {
    output: 'help-center-overview.mp4',
    route: '/help',
    narration:
      'The help center sequence walks through popular topics, support pathways, and related navigation actions so users can quickly move from questions into concrete next steps.',
    actions: [
      { type: 'wait', ms: 900 },
      { type: 'scrollHeading', name: /Popular Topics/i, wait: 900 },
      { type: 'scrollHeading', name: /Help Video Walkthroughs/i, wait: 900 },
      { type: 'clickLink', name: /Contact Support/i, wait: 800 },
      { type: 'goto', route: '/help', wait: 1100 },
    ],
  },
];

function run(bin, args, options = {}) {
  execFileSync(bin, args, {
    stdio: 'inherit',
    ...options,
  });
}

function runCapture(bin, args, options = {}) {
  return execFileSync(bin, args, {
    encoding: 'utf8',
    ...options,
  }).trim();
}

function assertTool(bin) {
  try {
    runCapture('command', ['-v', bin]);
  } catch {
    throw new Error(`Required tool not found: ${bin}`);
  }
}

function getDurationSeconds(filePath) {
  const output = runCapture('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);

  const value = Number.parseFloat(output);
  return Number.isFinite(value) ? value : 0;
}

function sanitizeBase(baseName) {
  return baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
}

async function maybeUnlockEnvironmentGate(page) {
  const passwordField = page.locator('input[type="password"]').first();
  const gateVisible = await passwordField.isVisible().catch(() => false);
  if (!gateVisible) {
    return;
  }

  if (!GATE_PASSWORD) {
    throw new Error(
      'Environment access gate detected. Set VV_MARKETING_GATE_PASSWORD to continue recording.'
    );
  }

  await passwordField.fill(GATE_PASSWORD);

  const enterButton = page
    .getByRole('button', { name: /enter|unlock|continue|submit/i })
    .first();

  if (await enterButton.isVisible().catch(() => false)) {
    await enterButton.click();
  } else {
    await passwordField.press('Enter');
  }

  await page.waitForTimeout(900);
}

async function typeHuman(locator, text) {
  await locator.click();
  await locator.type(text, { delay: 32 });
}

async function maybeClickLink(page, name) {
  const locator = page.getByRole('link', { name }).first();
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
    await page.waitForLoadState('domcontentloaded');
    return true;
  }
  return false;
}

async function maybeClickButton(page, name) {
  const locator = page.getByRole('button', { name }).first();
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
    return true;
  }
  return false;
}

async function maybeType(page, selector, value) {
  const locator = page.locator(selector).first();
  if (await locator.isVisible().catch(() => false)) {
    await typeHuman(locator, value);
    return true;
  }
  return false;
}

async function maybeScrollHeading(page, name) {
  const heading = page.getByRole('heading', { name }).first();
  if (await heading.isVisible().catch(() => false)) {
    await heading.scrollIntoViewIfNeeded();
    return true;
  }
  return false;
}

async function runAction(page, action) {
  if (action.type === 'wait') {
    await page.waitForTimeout(action.ms || 600);
    return;
  }

  if (action.type === 'goto') {
    await page.goto(`${BASE_URL}${action.route}`, {
      waitUntil: 'domcontentloaded',
    });
    await maybeUnlockEnvironmentGate(page);
    await page.waitForTimeout(action.wait || 800);
    return;
  }

  if (action.type === 'clickLink') {
    await maybeClickLink(page, action.name);
    await page.waitForTimeout(action.wait || 700);
    return;
  }

  if (action.type === 'clickButton') {
    await maybeClickButton(page, action.name);
    await page.waitForTimeout(action.wait || 700);
    return;
  }

  if (action.type === 'typeIfVisible') {
    await maybeType(page, action.selector, action.value || '');
    await page.waitForTimeout(action.wait || 220);
    return;
  }

  if (action.type === 'scrollHeading') {
    await maybeScrollHeading(page, action.name);
    await page.waitForTimeout(action.wait || 800);
  }
}

async function recordPlanVideo(plan) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: {
      dir: TMP_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  const page = await context.newPage();
  const videoHandle = page.video();

  await page.goto(`${BASE_URL}${plan.route}`, {
    waitUntil: 'domcontentloaded',
  });
  await maybeUnlockEnvironmentGate(page);
  await page.waitForTimeout(900);

  for (const action of plan.actions) {
    await runAction(page, action);
  }

  await page.waitForTimeout(650);

  await context.close();
  const recordedPath = await videoHandle.path();
  await browser.close();

  if (!recordedPath || !fs.existsSync(recordedPath)) {
    throw new Error(`No Playwright recording generated for ${plan.output}`);
  }

  return recordedPath;
}

function normalizeVideo(sourcePath, baseName) {
  const outPath = path.join(TMP_DIR, `${sanitizeBase(baseName)}.video.mp4`);

  run('ffmpeg', [
    '-y',
    '-i',
    sourcePath,
    '-vf',
    `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},fps=${FRAME_RATE},format=yuv420p`,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    outPath,
  ]);

  return outPath;
}

async function generateNarration(plan) {
  const provider = (process.env.VV_TTS_PROVIDER || '').toLowerCase();
  const shouldUseOpenAI =
    provider === 'openai' || (!provider && process.env.OPENAI_API_KEY);

  if (shouldUseOpenAI) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('VV_TTS_PROVIDER=openai requires OPENAI_API_KEY.');
    }

    const outPath = path.join(
      TMP_DIR,
      `${sanitizeBase(plan.output)}.narration.mp3`
    );
    await synthesizeSpeech({
      apiKey: process.env.OPENAI_API_KEY,
      model: OPENAI_MODEL,
      voice: OPENAI_VOICE,
      input: plan.narration,
      outputPath: outPath,
    });
    return outPath;
  }

  const textPath = path.join(TMP_DIR, `${sanitizeBase(plan.output)}.txt`);
  const outPath = path.join(TMP_DIR, `${sanitizeBase(plan.output)}.aiff`);
  fs.writeFileSync(textPath, `${plan.narration}\n`, 'utf8');
  run('say', ['-v', SAY_VOICE, '-r', SAY_RATE, '-f', textPath, '-o', outPath]);
  return outPath;
}

function padVideoIfNeeded(videoPath, audioPath, baseName) {
  const videoDuration = getDurationSeconds(videoPath);
  const audioDuration = getDurationSeconds(audioPath);

  if (audioDuration <= videoDuration + 0.1) {
    return videoPath;
  }

  const delta = Math.ceil((audioDuration - videoDuration) * 1000) / 1000;
  const paddedPath = path.join(TMP_DIR, `${sanitizeBase(baseName)}.padded.mp4`);

  run('ffmpeg', [
    '-y',
    '-i',
    videoPath,
    '-vf',
    `tpad=stop_mode=clone:stop_duration=${delta}`,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    paddedPath,
  ]);

  return paddedPath;
}

function muxVideoAndAudio(videoPath, audioPath, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  run('ffmpeg', [
    '-y',
    '-i',
    videoPath,
    '-i',
    audioPath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-shortest',
    '-movflags',
    '+faststart',
    outputPath,
  ]);
}

function selectedPlans() {
  const rawOnly = process.env.VV_INTERACTIVE_ONLY || '';
  if (!rawOnly.trim()) {
    return videoPlans;
  }

  const requested = new Set(
    rawOnly
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  );

  return videoPlans.filter(
    plan =>
      requested.has(plan.output.replace(/\.mp4$/i, '')) ||
      requested.has(plan.output)
  );
}

async function generatePlan(plan) {
  const outputPath = path.join(OUTPUT_DIR, plan.output);
  console.log(`[video] Recording interactive demo: ${plan.output}`);
  const rawRecorded = await recordPlanVideo(plan);

  console.log(`[video] Normalizing footage: ${plan.output}`);
  const normalized = normalizeVideo(rawRecorded, plan.output);

  console.log(`[video] Narrating: ${plan.output}`);
  const narration = await generateNarration(plan);

  console.log(`[video] Muxing output: ${plan.output}`);
  const padded = padVideoIfNeeded(normalized, narration, plan.output);
  muxVideoAndAudio(padded, narration, outputPath);

  const duration = getDurationSeconds(outputPath).toFixed(2);
  console.log(`[video] Wrote ${outputPath} (${duration}s)`);
}

async function main() {
  assertTool('ffmpeg');
  assertTool('ffprobe');

  const provider = (process.env.VV_TTS_PROVIDER || '').toLowerCase();
  const shouldUseOpenAI =
    provider === 'openai' || (!provider && process.env.OPENAI_API_KEY);
  if (!shouldUseOpenAI) {
    assertTool('say');
  }

  const plans = selectedPlans();
  if (!plans.length) {
    throw new Error(
      'No video plans selected. Check VV_INTERACTIVE_ONLY value.'
    );
  }

  for (const plan of plans) {
    await generatePlan(plan);
  }

  console.log(`[video] Completed ${plans.length} interactive demo video(s).`);
}

main()
  .catch(error => {
    console.error('[video] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });
