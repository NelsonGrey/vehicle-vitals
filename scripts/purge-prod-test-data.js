#!/usr/bin/env node

/*
  One-time pre-launch purge of ALL test / demo / seed data from
  vehicle-vitals-prod, so the production environment starts the App Store
  launch with a genuinely empty slate.

  As of 2026-09-01 the prod project contained zero real customer data --
  every Firestore document, every Auth user, and every Storage object was
  test, review-demo, sandbox-IAP, or foreign (a wishlist-wizard seed script
  had been run against this project by mistake on 2025-10-08). See
  memory/project-prod-test-data-cleanup.md for the full inventory.

  This does a FULL wipe (Mark's explicit choice):
    - every document in every top-level Firestore collection (recursive)
    - every object in the default Storage bucket
    - every Firebase Auth user (including the maintainer's own account)

  After running this, re-seed the two store-review demo accounts:
    node scripts/seed-app-review-demo-account.js --store=apple  --apply
    node scripts/seed-app-review-demo-account.js --store=google --apply
  ...then paste the freshly rotated passwords into App Store Connect
  (App Review Information) and Google Play Console (App content).

  Usage:
    node scripts/purge-prod-test-data.js            # dry run: list what would be deleted
    node scripts/purge-prod-test-data.js --apply    # actually delete

  Requirements:
    Application Default Credentials with Owner (or Firestore + Auth + Storage
    admin) on vehicle-vitals-prod:
      gcloud auth application-default login
    or GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account key.

  Hardcoded to vehicle-vitals-prod and asserts the resolved project id
  matches before writing anything -- it must never touch dev/staging or any
  other project by inheriting an ambient config.
*/

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const PROJECT_ID = 'vehicle-vitals-prod';
const STORAGE_BUCKET = 'vehicle-vitals-prod.firebasestorage.app';
const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(
    `[purge-prod-test-data] mode=${APPLY ? 'APPLY (destructive)' : 'dry-run'} project=${PROJECT_ID}`
  );

  const app = admin.initializeApp({
    credential: admin.applicationDefault(),
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET,
  });

  const resolved = app.options.projectId;
  if (resolved !== PROJECT_ID) {
    console.error(
      `[purge-prod-test-data] refusing to run: resolved project "${resolved}" != "${PROJECT_ID}"`
    );
    process.exit(1);
  }

  const auth = getAuth(app);
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();

  // ---- Firestore -----------------------------------------------------------
  const collections = await db.listCollections();
  console.log(
    `\n[Firestore] ${collections.length} top-level collections: ` +
      collections.map((c) => c.id).join(', ')
  );
  for (const col of collections) {
    const snap = await col.select().get(); // ids only, no field reads
    console.log(
      `  - ${col.id}: ${snap.size} doc(s)${APPLY ? ' -> recursiveDelete' : ''}`
    );
    if (APPLY) {
      await db.recursiveDelete(col);
    }
  }

  // ---- Storage -----------------------------------------------------------
  const [files] = await bucket.getFiles();
  console.log(`\n[Storage] gs://${STORAGE_BUCKET}: ${files.length} object(s)`);
  for (const f of files) {
    console.log(`  - ${f.name}`);
  }
  if (APPLY && files.length) {
    await bucket.deleteFiles({ force: true });
    console.log('  deleted all objects');
  }

  // ---- Auth -----------------------------------------------------------
  const uids = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    page.users.forEach((u) =>
      uids.push({ uid: u.uid, email: u.email || '(no email)' })
    );
    pageToken = page.pageToken;
  } while (pageToken);

  console.log(`\n[Auth] ${uids.length} user(s)`);
  uids.forEach((u) => console.log(`  - ${u.uid}  ${u.email}`));
  if (APPLY && uids.length) {
    for (let i = 0; i < uids.length; i += 1000) {
      const batch = uids.slice(i, i + 1000).map((u) => u.uid);
      const res = await auth.deleteUsers(batch);
      console.log(
        `  deleted ${res.successCount}, failed ${res.failureCount}` +
          (res.failureCount
            ? `: ${res.errors.map((e) => e.error.message).join('; ')}`
            : '')
      );
    }
  }

  console.log(
    `\n[purge-prod-test-data] ${APPLY ? 'done.' : 'dry run complete; pass --apply to delete.'}`
  );
  if (APPLY) {
    console.log(
      '[purge-prod-test-data] next: re-seed demo accounts (see header comment).'
    );
  }
}

main().catch((error) => {
  console.error('[purge-prod-test-data] failed', error);
  process.exitCode = 1;
});
