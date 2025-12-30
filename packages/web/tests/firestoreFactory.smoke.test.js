import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
        host: '127.0.0.1',
        port: 8080,
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
    const ctx = testEnv.authenticatedContext(UID);
    db = ctx.firestore();
    const fakeAuth = { currentUser: { uid: UID } };
    // Use the test environment's firestore API
    const helpers = {
      collection: (db, path) => db.collection(path),
      doc: (db, path) => db.doc(path),
      setDoc: (ref, data) => ref.set(data),
      getDocs: ref => ref.get(),
      getDoc: ref => ref.get(),
      addDoc: (ref, data) => ref.add(data),
      updateDoc: (ref, data) => ref.update(data),
      deleteDoc: ref => ref.delete(),
      serverTimestamp: () => new Date(),
    };
    service = createFirestoreService({ db, auth: fakeAuth, helpers });
  } catch (err) {
    // If emulator isn't running or init fails, skip tests gracefully
    console.warn(
      '[SMOKE] Firestore emulator not available; skipping smoke tests.',
      err?.message || err
    );
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
    const vehicle = {
      ..._defaultVehicle,
      vin,
      make: 'Test',
      model: 'Car',
      year: '2025',
    };

    await service.addOrUpdateVehicle(vehicle);

    const ref = db.doc(`users/${UID}/vehicles/${vin}`);
    const snap = await ref.get();
    expect(snap.exists).toBe(true);
    const data = snap.data();
    expect(data).toMatchObject({
      vin,
      make: 'Test',
      model: 'Car',
      year: '2025',
    });
    expect(data.updatedAt).toBeDefined();
  });

  it('adds maintenance with createdAt (and updatedAt) and can be fetched by id', async () => {
    if (!emulatorAvailable) return;
    const vin = 'VINSMOKETEST12345';
    const created = await service.addMaintenanceEntry(vin, {
      title: 'Oil',
      notes: 'Change oil',
    });
    expect(created).toHaveProperty('id');

    const entryRef = db.doc(
      `users/${UID}/vehicles/${vin}/maintenance/${created.id}`
    );
    const entrySnap = await entryRef.get();
    expect(entrySnap.exists).toBe(true);
    const edata = entrySnap.data();
    expect(edata.title).toBe('Oil');
    expect(edata.createdAt).toBeDefined();
    // factory also stamps updatedAt on create
    expect(edata.updatedAt).toBeDefined();
  });
});
