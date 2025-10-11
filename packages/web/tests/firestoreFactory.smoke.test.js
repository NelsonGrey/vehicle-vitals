import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as firestoreHelpers from 'firebase/firestore';

import { createFirestoreService } from '../../shared/src/firestoreServiceFactory.js';
import { defaultVehicle as _defaultVehicle } from '../../shared/src/types.js';

let testEnv;
let db;
let service;
const PROJECT_ID = 'vehicle-vitals-test';
const UID = 'smoke-user-1';
let emulatorAvailable = true;

beforeAll(async () => {
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: 'service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }',
      },
    });
    const ctx = testEnv.authenticatedContext(UID);
    db = ctx.firestore();
    const fakeAuth = { currentUser: { uid: UID } };
    service = createFirestoreService({ db, auth: fakeAuth, helpers: firestoreHelpers });
  } catch (err) {
    // If emulator isn't running or init fails, skip tests gracefully
    console.warn('[SMOKE] Firestore emulator not available; skipping smoke tests.', err?.message || err);
    emulatorAvailable = false;
  }
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

describe('firestoreServiceFactory smoke', () => {
  it('writes vehicle at users/{uid}/vehicles/{vin} and stamps updatedAt', async () => {
    if (!emulatorAvailable) return;
    const vin = 'VINSMOKETEST12345'; // 17 chars
    const vehicle = { ..._defaultVehicle, vin, make: 'Test', model: 'Car', year: '2025' };

    await service.addOrUpdateVehicle(vehicle);

    const ref = firestoreHelpers.doc(db, `users/${UID}/vehicles/${vin}`);
    const snap = await firestoreHelpers.getDoc(ref);
    expect(snap.exists()).toBe(true);
    const data = snap.data();
    expect(data).toMatchObject({ vin, make: 'Test', model: 'Car', year: '2025' });
    expect(data.updatedAt).toBeDefined();
  });

  it('adds maintenance with createdAt (and updatedAt) and can be fetched by id', async () => {
    if (!emulatorAvailable) return;
    const vin = 'VINSMOKETEST12345';
    const created = await service.addMaintenanceEntry(vin, { title: 'Oil', notes: 'Change oil' });
    expect(created).toHaveProperty('id');

    const entryRef = firestoreHelpers.doc(db, `users/${UID}/vehicles/${vin}/maintenance/${created.id}`);
    const entrySnap = await firestoreHelpers.getDoc(entryRef);
    expect(entrySnap.exists()).toBe(true);
    const edata = entrySnap.data();
    expect(edata.title).toBe('Oil');
    expect(edata.createdAt).toBeDefined();
    // factory also stamps updatedAt on create
    expect(edata.updatedAt).toBeDefined();
  });
});
