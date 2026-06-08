#!/usr/bin/env node
/*
  Purge seeded demo data for a specific user UID.
  Usage:
    node packages/functions/scripts/purge-demo-data.js --uid=<firebase-uid> --force
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
  const uid = args.uid || process.env.DEMO_UID;
  const force = Boolean(args.force);

  if (!uid) {
    throw new Error(
      'Missing required --uid=<firebase-uid> (or DEMO_UID env var).'
    );
  }

  if (!force) {
    throw new Error('Refusing to purge without --force flag.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  const db = admin.firestore();
  const vehiclesRef = db.collection('users').doc(uid).collection('vehicles');
  const metaRef = db
    .collection('users')
    .doc(uid)
    .collection('_meta')
    .doc('demoSeed');

  await db.recursiveDelete(vehiclesRef);
  await metaRef.delete().catch(() => undefined);

  console.log('Demo data purge completed successfully.');
}

main().catch(err => {
  console.error('purge-demo-data failed:', err.message || err);
  process.exitCode = 1;
});
