/*
  Export Vehicle Vitals logo (SVG) into JPG and PNG variants using sharp.
  Output goes to /web/public/assets/exports
*/

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'packages', 'web', 'public', 'assets', 'vehicle-vitals-logo.svg');
const outDir = path.join(root, 'packages', 'web', 'public', 'assets', 'exports');

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error('SVG not found at', svgPath);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const svg = fs.readFileSync(svgPath);

  // Export sizes (width x height in px), maintain aspect ratio
  const sizes = [256, 512, 1024];

  for (const size of sizes) {
    const base = path.join(outDir, `vehicle-vitals-logo-${size}`);
    // PNG with transparent background
    await sharp(svg)
      .resize({ width: size })
      .png({ compressionLevel: 9 })
      .toFile(`${base}.png`);

    // JPG with cream background matching --bg token (#fffaf3)
    await sharp(svg)
      .resize({ width: size })
      .flatten({ background: '#fffaf3' })
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(`${base}.jpg`);
  }

  console.log('Exported logo to', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
