#!/usr/bin/env node
// Copies the pure (no Firebase client SDK) modules from packages/shared's
// build output into packages/functions/vendor/vehicle-vitals-shared/dist.
//
// Why this exists: Firebase Functions deploy only uploads packages/functions
// itself (firebase.json's source), then runs npm install in an isolated
// remote build environment containing just that directory — a `file:`
// dependency pointing outside packages/functions (e.g. file:../shared)
// would resolve locally but break at deploy time, since the referenced
// directory was never uploaded. Vendoring a real, self-contained copy of
// the specific pure modules functions is allowed to use avoids that, and
// deliberately excludes packages/shared's index.js barrel (which re-exports
// `serverTimestamp` from the browser 'firebase/firestore' client SDK) so
// functions can never accidentally pull that in.
//
// Run this whenever packages/shared's pure modules change; `npm run build`
// in this package runs it automatically via the `prebuild` script.

const fs = require('fs');
const path = require('path');

const SHARED_DIST = path.join(__dirname, '..', '..', 'shared', 'dist');
const VENDOR_DIST = path.join(
  __dirname,
  '..',
  'vendor',
  'vehicle-vitals-shared',
  'dist'
);

// Keep in sync with the subpaths declared in
// packages/functions/vendor/vehicle-vitals-shared/package.json and
// packages/shared/package.json's own exports map.
const MODULES = ['vehicleHealth', 'maintenanceSchedules', 'vehiclePortfolio'];
const EXTENSIONS = ['.js', '.d.ts', '.js.map', '.d.ts.map'];

function main() {
  if (!fs.existsSync(SHARED_DIST)) {
    console.error(
      '[vendor-shared] packages/shared/dist not found. Build it first:\n' +
        '  npm run build --workspace=@vehicle-vitals/shared'
    );
    process.exit(1);
  }

  fs.mkdirSync(VENDOR_DIST, { recursive: true });

  let copied = 0;
  for (const moduleName of MODULES) {
    for (const ext of EXTENSIONS) {
      const src = path.join(SHARED_DIST, `${moduleName}${ext}`);
      if (!fs.existsSync(src)) {
        if (ext === '.js') {
          console.error(
            `[vendor-shared] Expected ${src} to exist but it doesn't — ` +
              'did packages/shared/src/' +
              `${moduleName}.js get renamed or removed?`
          );
          process.exit(1);
        }
        continue; // .map files are optional
      }
      fs.copyFileSync(src, path.join(VENDOR_DIST, `${moduleName}${ext}`));
      copied += 1;
    }
  }

  console.log(
    `[vendor-shared] Vendored ${copied} file(s) for ${MODULES.length} module(s) into ` +
      path.relative(process.cwd(), VENDOR_DIST)
  );
}

main();
