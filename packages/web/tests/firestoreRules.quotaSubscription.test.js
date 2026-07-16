import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Loads the REAL firebase/firestore.rules file (not a synthetic allow-all
// ruleset) so this test exercises what actually deploys — specifically the
// carve-out that blocks client writes to users/{uid}/quotas/** and
// users/{uid}/subscription/** while leaving the rest of users/{uid}/**
// (vehicles, preferences, etc.) writable, per the quota-bypass /
// subscription-tier-spoofing fix.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.join(__dirname, '..', '..', '..', 'firebase', 'firestore.rules');

let testEnv;
let emulatorAvailable = true;
const PROJECT_ID = 'vehicle-vitals-rules-test';
const UID = 'rules-test-user-1';

beforeAll(async () => {
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: readFileSync(RULES_PATH, 'utf8'),
      },
    });
  } catch (err) {
    console.warn(
      '[RULES] Firestore emulator not available; skipping rules tests.',
      err?.message || err
    );
    emulatorAvailable = false;
  }
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

describe('firestore.rules — users/{uid}/quotas and subscription', () => {
  it('blocks a client write to their own quotas doc', async () => {
    if (!emulatorAvailable) return;
    const db = testEnv.authenticatedContext(UID).firestore();
    await assertFails(
      db
        .doc(`users/${UID}/quotas/2026-07`)
        .set({ aiAnalysesUsed: 0, aiAnalysesLimit: 999999 })
    );
  });

  it('blocks a client write to their own subscription doc', async () => {
    if (!emulatorAvailable) return;
    const db = testEnv.authenticatedContext(UID).firestore();
    await assertFails(db.doc(`users/${UID}/subscription/current`).set({ tier: 'premium' }));
  });

  it('still allows the client to read their own quotas doc', async () => {
    if (!emulatorAvailable) return;
    const adminDb = testEnv.unauthenticatedContext().firestore();
    // Seed via the emulator's security-rules-bypassing admin context.
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${UID}/quotas/2026-07`).set({ aiAnalysesUsed: 3 });
    });
    const db = testEnv.authenticatedContext(UID).firestore();
    await assertSucceeds(db.doc(`users/${UID}/quotas/2026-07`).get());
    void adminDb;
  });

  it('still allows the client to write unrelated users/{uid} data (e.g. vehicles)', async () => {
    if (!emulatorAvailable) return;
    const db = testEnv.authenticatedContext(UID).firestore();
    await assertSucceeds(
      db.doc(`users/${UID}/vehicles/1HGCM82633A123456`).set({ make: 'Honda', model: 'Civic' })
    );
  });

  it('blocks a different signed-in user from writing to someone else\'s quotas doc', async () => {
    if (!emulatorAvailable) return;
    const otherDb = testEnv.authenticatedContext('someone-else').firestore();
    await assertFails(
      otherDb.doc(`users/${UID}/quotas/2026-07`).set({ aiAnalysesUsed: 0 })
    );
  });
});
