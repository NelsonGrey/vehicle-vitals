#!/usr/bin/env node
/*
  One-time backfill: populate vehicleHealthSnapshot and self-heal
  documentPortfolio on every existing vehicle doc (users/{uid}/vehicles/{vin}
  and orgs/{orgId}/vehicles/{vin}).

  Needed because the onDocumentWritten/onDocumentCreated triggers that
  compute these fields (vehicleHealth.provider.ts, vehiclePortfolio.provider.ts)
  only fire on a vehicle doc's NEXT write — vehicles created before those
  triggers were deployed won't get the fields populated until they're
  otherwise touched. Both underlying functions are idempotent (recomputeAndWrite
  skips vehicles whose version key already matches; selfHealPortfolio only
  writes when something is actually missing), so this is safe to re-run.

  Usage:
    node packages/functions/scripts/backfill-vehicle-derived-fields.js [--dry-run]

  Required auth context:
    - GOOGLE_APPLICATION_CREDENTIALS or other Admin SDK default credentials.
*/

const admin = require('firebase-admin');

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const [key, value] = raw.slice(2).split('=');
    args[key] = value === undefined ? true : value;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run']);

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  const { recomputeAndWrite } = require('../lib/vehicleHealth.provider');
  const { selfHealPortfolio } = require('../lib/vehiclePortfolio.provider');

  const db = admin.firestore();
  const snap = await db.collectionGroup('vehicles').get();

  let healthOk = 0;
  let healthFailed = 0;
  let portfolioOk = 0;
  let portfolioFailed = 0;

  for (const doc of snap.docs) {
    if (dryRun) {
      console.log(`[dry-run] would backfill ${doc.ref.path}`);
      continue;
    }

    try {
      await recomputeAndWrite(doc.ref);
      healthOk += 1;
    } catch (err) {
      healthFailed += 1;
      console.error(`vehicleHealthSnapshot backfill failed for ${doc.ref.path}:`, err.message || err);
    }

    try {
      await selfHealPortfolio(doc.ref);
      portfolioOk += 1;
    } catch (err) {
      portfolioFailed += 1;
      console.error(`documentPortfolio backfill failed for ${doc.ref.path}:`, err.message || err);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        vehiclesFound: snap.size,
        vehicleHealthSnapshot: { succeeded: healthOk, failed: healthFailed },
        documentPortfolio: { succeeded: portfolioOk, failed: portfolioFailed },
      },
      null,
      2
    )
  );
}

main().catch(err => {
  console.error('backfill-vehicle-derived-fields failed:', err.message || err);
  process.exitCode = 1;
});
