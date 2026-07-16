#!/usr/bin/env node
/*
  Seed robust demo data into Firestore for a specific user UID.
  Usage:
    node packages/functions/scripts/seed-demo-data.js --uid=<firebase-uid> [--file=scripts/test-data/demo-data.json]

  Required auth context:
    - GOOGLE_APPLICATION_CREDENTIALS or other Admin SDK default credentials.
*/

const fs = require('fs');
const path = require('path');
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

function resolveDataFile(cliFile) {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const defaultFile = path.resolve(
    repoRoot,
    'scripts',
    'test-data',
    'demo-data.json'
  );

  if (!cliFile) return defaultFile;

  const fromCwd = path.resolve(process.cwd(), cliFile);
  if (fs.existsSync(fromCwd)) return fromCwd;

  const normalized = cliFile.replace(/^\.\//, '');
  const fromRepoRoot = path.resolve(repoRoot, normalized);
  if (fs.existsSync(fromRepoRoot)) return fromRepoRoot;

  return fromCwd;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const uid = args.uid || process.env.DEMO_UID;
  if (!uid) {
    throw new Error(
      'Missing required --uid=<firebase-uid> (or DEMO_UID env var).'
    );
  }

  const dataFile = resolveDataFile(args.file || process.env.DEMO_DATA_FILE);
  if (!fs.existsSync(dataFile)) {
    throw new Error(`Demo data file not found: ${dataFile}`);
  }

  const raw = fs.readFileSync(dataFile, 'utf8');
  const parsed = JSON.parse(raw);
  const vehicles = Array.isArray(parsed.vehicles) ? parsed.vehicles : [];

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  const db = admin.firestore();
  const baseRef = db.collection('users').doc(uid).collection('vehicles');

  let vehiclesCount = 0;
  let maintenanceCount = 0;
  let remindersCount = 0;

  for (const vehicleSeed of vehicles) {
    if (!vehicleSeed || !vehicleSeed.vin) continue;

    const { maintenance = [], reminders = [], ...vehicleDoc } = vehicleSeed;
    const vehicleRef = baseRef.doc(String(vehicleSeed.vin));

    await vehicleRef.set(
      {
        ...vehicleDoc,
        vin: String(vehicleSeed.vin),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    vehiclesCount += 1;

    for (const entry of maintenance) {
      const entryId = entry.id ? String(entry.id) : null;
      const { id, ...entryDoc } = entry;
      const targetRef = entryId
        ? vehicleRef.collection('maintenance').doc(entryId)
        : vehicleRef.collection('maintenance').doc();

      await targetRef.set({
        ...entryDoc,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      maintenanceCount += 1;
    }

    for (const reminder of reminders) {
      const reminderId = reminder.id ? String(reminder.id) : null;
      const { id, ...reminderDoc } = reminder;
      const targetRef = reminderId
        ? vehicleRef.collection('reminders').doc(reminderId)
        : vehicleRef.collection('reminders').doc();

      await targetRef.set({
        ...reminderDoc,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      remindersCount += 1;
    }
  }

  await db
    .collection('users')
    .doc(uid)
    .collection('_meta')
    .doc('demoSeed')
    .set(
      {
        dataset: parsed.dataset || 'default-demo-data',
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
        vehiclesCount,
        maintenanceCount,
        remindersCount,
      },
      { merge: true }
    );

  console.log(
    JSON.stringify(
      {
        ok: true,
        uid,
        dataFile,
        vehiclesCount,
        maintenanceCount,
        remindersCount,
      },
      null,
      2
    )
  );
}

main().catch(err => {
  console.error('seed-demo-data failed:', err.message || err);
  process.exitCode = 1;
});
