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
const OUTPUT_PATH = path.join(
  ROOT,
  'packages',
  'web',
  'public',
  'videos',
  'feature-demos',
  'vin-decode-demo.mp4'
);
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vv-interactive-vin-'));

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

const narrationText =
  'In Vehicle Vitals, start from the VIN Decode demo page, navigate features from the header, and open authentication to continue. ' +
  'Fill your email and password, then return to VIN decode to review the walkthrough lane and supporting content.';

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

async function typeHuman(locator, text) {
  await locator.click();
  await locator.type(text, { delay: 35 });
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

  await page.waitForTimeout(1000);
}

async function recordInteractiveFlow() {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: {
      dir: TMP_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  const page = await context.newPage();
  const videoHandle = page.video();

  await page.goto(`${BASE_URL}/vin-decode-demo`, {
    waitUntil: 'domcontentloaded',
  });
  await maybeUnlockEnvironmentGate(page);
  await page.waitForTimeout(1200);

  const maintenanceNav = page
    .getByRole('link', { name: /^Maintenance$/i })
    .first();
  if (await maintenanceNav.isVisible().catch(() => false)) {
    await maintenanceNav.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(900);
  }

  const vinNav = page.getByRole('link', { name: /^VIN Decode$/i }).first();
  if (await vinNav.isVisible().catch(() => false)) {
    await vinNav.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(900);
  }

  const loginLink = page
    .getByRole('link', { name: /Login\s*\/\s*Sign Up/i })
    .first();
  if (await loginLink.isVisible().catch(() => false)) {
    await loginLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  }

  const emailField = page.locator('#email').first();
  if (await emailField.isVisible().catch(() => false)) {
    await typeHuman(emailField, DEMO_EMAIL);
    await page.waitForTimeout(250);
  }

  const passwordField = page.locator('#password').first();
  if (await passwordField.isVisible().catch(() => false)) {
    await typeHuman(passwordField, DEMO_PASSWORD);
    await page.waitForTimeout(250);
  }

  const signInButton = page.getByRole('button', { name: /Sign In/i }).first();
  if (await signInButton.isVisible().catch(() => false)) {
    await signInButton.click();
    await page.waitForTimeout(1500);
  }

  await page.goto(`${BASE_URL}/vin-decode-demo`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1000);

  const laneHeading = page
    .getByRole('heading', { name: /Video Walkthrough Lane/i })
    .first();
  if (await laneHeading.isVisible().catch(() => false)) {
    await laneHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);
  }

  await context.close();
  const recordedVideo = await videoHandle.path();
  await browser.close();

  if (!recordedVideo || !fs.existsSync(recordedVideo)) {
    throw new Error('Playwright did not produce a video recording.');
  }

  return recordedVideo;
}

function normalizeVideo(sourcePath) {
  const outputPath = path.join(TMP_DIR, 'interactive-video.mp4');

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
    outputPath,
  ]);

  return outputPath;
}

async function generateNarration() {
  const provider = (process.env.VV_TTS_PROVIDER || '').toLowerCase();
  const shouldUseOpenAI =
    provider === 'openai' || (!provider && process.env.OPENAI_API_KEY);

  if (shouldUseOpenAI) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('VV_TTS_PROVIDER=openai requires OPENAI_API_KEY.');
    }

    const outPath = path.join(TMP_DIR, 'narration.mp3');
    await synthesizeSpeech({
      apiKey: process.env.OPENAI_API_KEY,
      model: OPENAI_MODEL,
      voice: OPENAI_VOICE,
      input: narrationText,
      outputPath: outPath,
    });
    return outPath;
  }

  const outPath = path.join(TMP_DIR, 'narration.aiff');
  const textPath = path.join(TMP_DIR, 'narration.txt');
  fs.writeFileSync(textPath, `${narrationText}\n`, 'utf8');

  run('say', ['-v', SAY_VOICE, '-r', SAY_RATE, '-f', textPath, '-o', outPath]);
  return outPath;
}

function padVideoIfNeeded(videoPath, audioPath) {
  const videoDuration = getDurationSeconds(videoPath);
  const audioDuration = getDurationSeconds(audioPath);

  if (audioDuration <= videoDuration + 0.1) {
    return videoPath;
  }

  const delta = Math.ceil((audioDuration - videoDuration) * 1000) / 1000;
  const padded = path.join(TMP_DIR, 'interactive-video-padded.mp4');

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
    padded,
  ]);

  return padded;
}

function muxVideoAndNarration(videoPath, audioPath) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

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
    OUTPUT_PATH,
  ]);
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

  console.log('[video] Recording real interaction flow with Playwright...');
  const rawRecording = await recordInteractiveFlow();

  console.log('[video] Normalizing recorded video...');
  const normalizedVideo = normalizeVideo(rawRecording);

  console.log('[video] Generating narration track...');
  const narrationAudio = await generateNarration();

  console.log('[video] Matching durations and muxing final output...');
  const paddedVideo = padVideoIfNeeded(normalizedVideo, narrationAudio);
  muxVideoAndNarration(paddedVideo, narrationAudio);

  const duration = getDurationSeconds(OUTPUT_PATH).toFixed(2);
  console.log(`[video] Wrote ${OUTPUT_PATH} (${duration}s)`);
}

main()
  .catch(error => {
    console.error('[video] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });
