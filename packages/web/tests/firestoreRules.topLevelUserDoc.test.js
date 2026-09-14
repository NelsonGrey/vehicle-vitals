import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Regression test for a real bug found 2026-09-14 while wiring the palette
// preference (paletteWeb/paletteMobile/paletteLinked): a `{document=**}`
// wildcard capture is empty for the exact users/{userId} document itself,
// and calling `.size()` on that empty capture threw a runtime
// "Function not found" error that silently denied EVERY direct write to
// that document -- including the already-shipped
// EmailReminderService.updateEmailPreferences toggle, not just the new
// palette fields. The fix splits users/{userId} into its own unconditional
// rule, separate from the recursive users/{userId}/{document=**} rule that
// still gates quotas/subscription subcollection writes (see
// firestoreRules.quotaSubscription.test.js for that half).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.join(__dirname, '..', '..', '..', 'firebase', 'firestore.rules');

let testEnv;
let emulatorAvailable = true;
const PROJECT_ID = 'vehicle-vitals-rules-test';
const UID = 'rules-test-top-level-user';
const OTHER_UID = 'rules-test-someone-else';

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

describe('firestore.rules — the top-level users/{uid} document itself', () => {
  it('allows a signed-in user to write their own top-level doc (merge)', async () => {
    if (!emulatorAvailable) return;
    const db = testEnv.authenticatedContext(UID).firestore();
    await assertSucceeds(
      db.doc(`users/${UID}`).set({ paletteWeb: 'cyanTeal' }, { merge: true })
    );
  });

  it('allows the exact write shape EmailReminderService uses', async () => {
    if (!emulatorAvailable) return;
    const db = testEnv.authenticatedContext(UID).firestore();
    await assertSucceeds(
      db.doc(`users/${UID}`).set({ emailRemindersEnabled: true }, { merge: true })
    );
  });

  it('allows reading their own top-level doc', async () => {
    if (!emulatorAvailable) return;
    const db = testEnv.authenticatedContext(UID).firestore();
    await assertSucceeds(db.doc(`users/${UID}`).get());
  });

  it("blocks a different signed-in user from writing someone else's top-level doc", async () => {
    if (!emulatorAvailable) return;
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(
      otherDb.doc(`users/${UID}`).set({ paletteWeb: 'indigo' }, { merge: true })
    );
  });

  it('blocks an unauthenticated write to a top-level doc', async () => {
    if (!emulatorAvailable) return;
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      anonDb.doc(`users/${UID}`).set({ paletteWeb: 'indigo' }, { merge: true })
    );
  });
});
