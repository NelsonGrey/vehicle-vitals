import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let testEnv;
let service;
const PROJECT_ID = 'vehicle-vitals-test';
const UID = 'test-user-1';
let emulatorAvailable = true;

beforeAll(async () => {
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: `
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} {
                allow read, write: if true;
              }
            }
          }
        `,
      },
    });

    const authContext = testEnv.authenticatedContext(UID);
    const testDb = authContext.firestore();
    const fakeAuth = { currentUser: { uid: UID } };

    // Mock the FirebaseClient to return test environment BEFORE importing the service
    vi.mock('../src/shared/firebaseConfig.js', () => ({
      auth: fakeAuth,
      db: testDb,
    }));

    // import the service after mocking
    const {
      addMaintenanceEntry,
      getMaintenanceEntries,
      getMaintenanceEntry,
      updateMaintenanceEntry,
      deleteMaintenanceEntry,
    } = await import('../src/shared/firestoreService.js');
    service = {
      addMaintenanceEntry,
      getMaintenanceEntries,
      getMaintenanceEntry,
      updateMaintenanceEntry,
      deleteMaintenanceEntry,
    };
  } catch (err) {
    // If emulator isn't running or initialize fails, skip emulator-dependent tests
    console.warn(
      'Firestore emulator not available; emulator-dependent tests will be skipped.',
      err?.message || err
    );
    emulatorAvailable = false;
  }
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

describe('firestoreService (emulator) maintenance helpers', () => {
  it('can add, get, update and delete a maintenance entry and stamps timestamps', async () => {
    if (!emulatorAvailable) {
      console.warn('Skipping emulator-dependent test');
      return;
    }

    const vin = 'TESTVIN123';

    // add
    const created = await service.addMaintenanceEntry(vin, {
      title: 'Oil',
      notes: 'Change oil',
      cost: 29.99,
    });
    expect(created).toHaveProperty('id');
    expect(created.title).toBe('Oil');

    // list
    const list = await service.getMaintenanceEntries(vin);
    expect(list.length).toBeGreaterThanOrEqual(1);

    const fetched = await service.getMaintenanceEntry(vin, created.id);
    expect(fetched).not.toBeNull();
    expect(fetched.title).toBe('Oil');
    // createdAt should exist after creation (serverTimestamp placeholder in emulator becomes a Timestamp)
    expect(fetched).toHaveProperty('createdAt');

    // update
    await service.updateMaintenanceEntry(vin, created.id, {
      title: 'Oil Change',
      cost: 35,
    });
    const updated = await service.getMaintenanceEntry(vin, created.id);
    expect(updated.title).toBe('Oil Change');
    expect(updated.cost).toBe(35);
    // updatedAt should exist after update
    expect(updated).toHaveProperty('updatedAt');

    // delete
    await service.deleteMaintenanceEntry(vin, created.id);
    const after = await service.getMaintenanceEntries(vin);
    expect(after.find(e => e.id === created.id)).toBeUndefined();
  });
});
