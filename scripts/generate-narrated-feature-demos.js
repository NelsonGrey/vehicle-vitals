#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT, 'docs', 'screenshots');
const OUTPUT_DIR = path.join(
  ROOT,
  'packages',
  'web',
  'public',
  'videos',
  'feature-demos'
);
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vv-narrated-demos-'));

const FRAME_RATE = 30;
const WIDTH = 1280;
const HEIGHT = 720;
const VOICE = process.env.VV_NARRATION_VOICE || 'Samantha';
const RATE = process.env.VV_NARRATION_RATE || '170';

function run(bin, args, options = {}) {
  execFileSync(bin, args, {
    stdio: 'inherit',
    ...options,
  });
}

function runCapture(bin, args) {
  return execFileSync(bin, args, { encoding: 'utf8' }).trim();
}

function assertTool(bin) {
  try {
    runCapture('command', ['-v', bin]);
  } catch {
    throw new Error(`Required tool not found: ${bin}`);
  }
}

function ffprobeDurationSeconds(filePath) {
  const out = runCapture('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);
  const value = Number.parseFloat(out);
  return Number.isFinite(value) ? value : 0;
}

const videoBlueprints = [
  {
    output: 'onboarding-walkthrough.mp4',
    narration:
      'Welcome to Vehicle Vitals. Start on the marketing home page, then create your account and use the getting started workflow. From there, your garage becomes a live dashboard for every vehicle and task.',
    scenes: [
      { image: 'landing.png', title: 'Marketing home', seconds: 4.5 },
      { image: 'signup.png', title: 'Create an account', seconds: 4.5 },
      { image: 'instructions.png', title: 'Guided setup', seconds: 4.5 },
      { image: 'garage-vehicles.png', title: 'Garage dashboard', seconds: 5.0 },
    ],
  },
  {
    output: 'maintenance-lifecycle-tour.mp4',
    narration:
      'Maintenance planning is visible end to end. Upcoming tasks highlight what is due, timeline shows history, and records keep service details organized for every vehicle in one place.',
    scenes: [
      { image: 'upcoming.png', title: 'Upcoming tasks', seconds: 4.5 },
      { image: 'timeline.png', title: 'Service timeline', seconds: 4.5 },
      { image: 'records.png', title: 'Maintenance records', seconds: 4.5 },
      { image: 'providers.png', title: 'Service providers', seconds: 4.5 },
    ],
  },
  {
    output: 'cross-platform-continuity.mp4',
    narration:
      'Vehicle Vitals keeps your data consistent across web and mobile. The same garage, tasks, and profile context follow you between screens so progress never gets lost.',
    scenes: [
      { image: 'ios-home.png', title: 'Mobile home', seconds: 4.5 },
      { image: 'garage-vehicles.png', title: 'Web garage', seconds: 4.5 },
      {
        image: 'ios-upcoming.png',
        title: 'Mobile upcoming tasks',
        seconds: 4.5,
      },
      { image: 'profile.png', title: 'Shared profile context', seconds: 4.5 },
    ],
  },
  {
    output: 'vin-decode-demo.mp4',
    narration:
      'The VIN flow accelerates setup. Add a vehicle with decoded details, refine key fields in the editor, and immediately connect that data to maintenance planning and records.',
    scenes: [
      { image: 'add-vehicle.png', title: 'VIN add flow', seconds: 4.5 },
      { image: 'edit-vehicle.png', title: 'Vehicle editing', seconds: 4.5 },
      {
        image: 'garage-detail.png',
        title: 'Vehicle detail panel',
        seconds: 4.5,
      },
      { image: 'records.png', title: 'Records linked to VIN', seconds: 4.5 },
    ],
  },
  {
    output: 'maintenance-planning-demo.mp4',
    narration:
      'Plan service before problems happen. Upcoming tasks prioritize actions, records preserve detail, and timeline keeps a clear history of what was completed and when.',
    scenes: [
      { image: 'upcoming.png', title: 'Prioritized task list', seconds: 4.5 },
      { image: 'records.png', title: 'Detailed service records', seconds: 4.5 },
      { image: 'timeline.png', title: 'Chronological history', seconds: 4.5 },
      {
        image: 'profile.png',
        title: 'Preferences and reminders',
        seconds: 4.5,
      },
    ],
  },
  {
    output: 'cross-platform-access-demo.mp4',
    narration:
      'Access starts on marketing and continues through secure sign-in. Users can move from desktop to mobile while staying connected to the same account and vehicle portfolio.',
    scenes: [
      {
        image: 'ios-marketing.png',
        title: 'Mobile marketing entry',
        seconds: 4.5,
      },
      { image: 'login.png', title: 'Web sign in', seconds: 4.5 },
      { image: 'ios-login.png', title: 'Mobile sign in', seconds: 4.5 },
      {
        image: 'ios-home.png',
        title: 'Mobile authenticated home',
        seconds: 4.5,
      },
    ],
  },
  {
    output: 'ownership-history-demo.mp4',
    narration:
      'Ownership confidence comes from complete history. Service records, timeline views, and detailed vehicle pages create a clear story for maintenance, resale, and long-term planning.',
    scenes: [
      { image: 'records.png', title: 'Ownership records', seconds: 4.5 },
      { image: 'timeline.png', title: 'Lifecycle timeline', seconds: 4.5 },
      {
        image: 'garage-detail.png',
        title: 'Vehicle-level context',
        seconds: 4.5,
      },
      { image: 'profile.png', title: 'Owner preferences', seconds: 4.5 },
    ],
  },
  {
    output: 'generic-feature-demo.mp4',
    narration:
      'Vehicle Vitals combines onboarding, maintenance planning, ownership history, and profile controls into one experience. Each section is designed to reduce friction and improve long-term reliability.',
    scenes: [
      { image: 'landing.png', title: 'Marketing overview', seconds: 4.5 },
      { image: 'garage-vehicles.png', title: 'Garage overview', seconds: 4.5 },
      { image: 'upcoming.png', title: 'Actionable reminders', seconds: 4.5 },
      { image: 'profile.png', title: 'User controls', seconds: 4.5 },
    ],
  },
  {
    output: 'getting-started-help.mp4',
    narration:
      'Getting started is straightforward. Begin from the landing page, follow guided setup instructions, create your account, and return to login whenever you need to resume.',
    scenes: [
      { image: 'landing.png', title: 'Start here', seconds: 4.5 },
      { image: 'instructions.png', title: 'Guided instructions', seconds: 4.5 },
      { image: 'signup.png', title: 'Account creation', seconds: 4.5 },
      { image: 'login.png', title: 'Return sign in', seconds: 4.5 },
    ],
  },
  {
    output: 'help-center-overview.mp4',
    narration:
      'The help experience connects users to setup, profile preferences, providers, and upcoming tasks. It is designed to move quickly from questions to practical in-product outcomes.',
    scenes: [
      { image: 'instructions.png', title: 'Help and setup', seconds: 4.5 },
      { image: 'profile.png', title: 'Profile and preferences', seconds: 4.5 },
      { image: 'providers.png', title: 'Provider support', seconds: 4.5 },
      { image: 'upcoming.png', title: 'Task follow through', seconds: 4.5 },
    ],
  },
];

function ensureInputsExist() {
  for (const video of videoBlueprints) {
    for (const scene of video.scenes) {
      const imagePath = path.join(SCREENSHOT_DIR, scene.image);
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Missing screenshot required for videos: ${imagePath}`);
      }
    }
  }
}

function buildNarrationAudio(video) {
  const txtPath = path.join(TMP_DIR, `${video.output}.txt`);
  const aiffPath = path.join(TMP_DIR, `${video.output}.aiff`);
  fs.writeFileSync(txtPath, `${video.narration}\n`, 'utf8');

  run('say', ['-v', VOICE, '-r', RATE, '-f', txtPath, '-o', aiffPath]);
  return aiffPath;
}

function buildSceneVideo(video) {
  const silentPath = path.join(TMP_DIR, `${video.output}.silent.mp4`);
  const ffmpegArgs = ['-y'];

  for (const scene of video.scenes) {
    const imagePath = path.join(SCREENSHOT_DIR, scene.image);
    ffmpegArgs.push('-loop', '1', '-t', String(scene.seconds), '-i', imagePath);
  }

  const filterParts = [];
  const concatRefs = [];

  for (let i = 0; i < video.scenes.length; i += 1) {
    const scene = video.scenes[i];
    filterParts.push(
      `[${i}:v]` +
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
        `crop=${WIDTH}:${HEIGHT},` +
        `fps=${FRAME_RATE},` +
        `drawbox=x=0:y=${HEIGHT - 108}:w=${WIDTH}:h=108:color=black@0.46:t=fill,` +
        `format=yuv420p[v${i}]`
    );

    concatRefs.push(`[v${i}]`);
  }

  filterParts.push(
    `${concatRefs.join('')}concat=n=${video.scenes.length}:v=1:a=0,format=yuv420p[vout]`
  );

  ffmpegArgs.push(
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    '[vout]',
    '-r',
    String(FRAME_RATE),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    silentPath
  );

  run('ffmpeg', ffmpegArgs);
  return silentPath;
}

function ensureVideoAtLeastDuration(videoPath, targetSeconds) {
  const currentSeconds = ffprobeDurationSeconds(videoPath);
  if (currentSeconds >= targetSeconds) {
    return videoPath;
  }

  const paddedPath = videoPath.replace('.silent.mp4', '.padded.mp4');
  const extra = Math.max(0.1, targetSeconds - currentSeconds + 0.1);

  run('ffmpeg', [
    '-y',
    '-i',
    videoPath,
    '-vf',
    `tpad=stop_mode=clone:stop_duration=${extra.toFixed(2)}`,
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
    '160k',
    '-shortest',
    '-movflags',
    '+faststart',
    outputPath,
  ]);
}

function generateAllVideos() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const video of videoBlueprints) {
    const outputPath = path.join(OUTPUT_DIR, video.output);
    console.log(`\nGenerating ${video.output}...`);

    const audioPath = buildNarrationAudio(video);
    const audioSeconds = ffprobeDurationSeconds(audioPath);
    const silentVideoPath = buildSceneVideo(video);
    const finalVideoSourcePath = ensureVideoAtLeastDuration(
      silentVideoPath,
      audioSeconds
    );

    muxVideoAndAudio(finalVideoSourcePath, audioPath, outputPath);

    const finalSeconds = ffprobeDurationSeconds(outputPath).toFixed(2);
    const finalSizeKb = Math.round(fs.statSync(outputPath).size / 1024);
    console.log(`  ✓ ${video.output} (${finalSeconds}s, ${finalSizeKb} KB)`);
  }
}

function cleanup() {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}

function main() {
  try {
    assertTool('ffmpeg');
    assertTool('ffprobe');
    assertTool('say');
    ensureInputsExist();
    generateAllVideos();
    console.log('\nDone. Narrated feature demo videos regenerated.');
  } finally {
    cleanup();
  }
}

main();
