#!/usr/bin/env node
/**
 * Writes WebP siblings for marketing images. The React components request
 * the .webp first and keep the original file as the fallback and as the
 * full-size gallery target.
 *
 * Run from packages/web: `node scripts/optimize-marketing-images.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');

const jobs = [
  { src: 'images/hero-garage.jpg', width: 512, quality: 68 },
  { src: 'android-chrome-512x512.png', width: 320, quality: 72 },
  { src: 'images/features/add-vehicle.png', width: 960, quality: 68 },
  { src: 'images/features/timeline.png', width: 960, quality: 68 },
  { src: 'images/features/ios-home.png', width: 960, quality: 68 },
];

for (const name of fs.readdirSync(path.join(pub, 'images/features/current'))) {
  if (name.endsWith('.png')) {
    jobs.push({
      src: `images/features/current/${name}`,
      width: 720,
      quality: 66,
    });
  }
}

let written = 0;
for (const job of jobs) {
  const input = path.join(pub, job.src);
  const output = input.replace(/\.(png|jpe?g)$/i, '.webp');
  const image = sharp(input);
  const meta = await image.metadata();
  const width = Math.min(job.width, meta.width || job.width);
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: job.quality })
    .toFile(output);
  const before = fs.statSync(input).size;
  const after = fs.statSync(output).size;
  written += 1;
  console.log(
    `${job.src} ${before} -> ${path.basename(output)} ${after} (${width}px)`
  );
}

console.log(`[optimize-marketing-images] wrote ${written} webp files`);
