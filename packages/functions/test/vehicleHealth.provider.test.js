const test = require('node:test');
const assert = require('node:assert/strict');

require('../lib/index.js'); // admin.initializeApp() side effect
const { recomputeAndWrite } = require('../lib/vehicleHealth.provider.js');

const runFirestoreIntegration =
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.ALLOW_LIVE_FIRESTORE_TESTS === 'true';

(runFirestoreIntegration ? test : test.skip)(
  'recomputeAndWrite populates vehicleHealthSnapshot from vehicle + maintenance data',
  async () => {
    const admin = require('firebase-admin');
    const uid = `health-${Date.now()}`;
    const vin = '1HGCM82633A123456';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    await vehicleRef.set({ vin, mileage: 55000, make: 'Honda', model: 'Civic' });
    await vehicleRef.collection('maintenance').add({
      title: 'Oil change',
      date: '2026-01-15',
      mileage: 50000,
    });

    await recomputeAndWrite(vehicleRef);

    const snap = await vehicleRef.get();
    const snapshot = snap.data().vehicleHealthSnapshot;

    assert.ok(snapshot, 'snapshot should be written');
    assert.equal(snapshot.vin, vin);
    assert.equal(typeof snapshot.overallHealthScore, 'number');
    assert.ok(snapshot.overallHealthScore >= 0 && snapshot.overallHealthScore <= 100);
    assert.ok(Array.isArray(snapshot.components));
    assert.equal(snapshot.components.length, 6);
    assert.ok(snapshot.computedFromVersion);
    assert.ok(snapshot.computedAt);
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'recomputeAndWrite is idempotent — a second call with unchanged inputs does not rewrite the snapshot',
  async () => {
    const admin = require('firebase-admin');
    const uid = `health-idempotent-${Date.now()}`;
    const vin = '1HGCM82633A123457';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    await vehicleRef.set({ vin, mileage: 30000 });

    await recomputeAndWrite(vehicleRef);
    const first = (await vehicleRef.get()).data().vehicleHealthSnapshot;

    await recomputeAndWrite(vehicleRef);
    const second = (await vehicleRef.get()).data().vehicleHealthSnapshot;

    // computedAt is a server timestamp — if the guard failed and a second
    // write happened, this would be a strictly later value.
    assert.equal(
      first.computedAt.toMillis(),
      second.computedAt.toMillis(),
      'a second call with no input changes must not produce a new write'
    );
    assert.equal(first.computedFromVersion, second.computedFromVersion);
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'recomputeAndWrite recomputes when mileage actually changes',
  async () => {
    const admin = require('firebase-admin');
    const uid = `health-recompute-${Date.now()}`;
    const vin = '1HGCM82633A123458';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    await vehicleRef.set({ vin, mileage: 10000 });
    await recomputeAndWrite(vehicleRef);
    const first = (await vehicleRef.get()).data().vehicleHealthSnapshot;

    await vehicleRef.set({ mileage: 60000 }, { merge: true });
    await recomputeAndWrite(vehicleRef);
    const second = (await vehicleRef.get()).data().vehicleHealthSnapshot;

    assert.notEqual(first.computedFromVersion, second.computedFromVersion);
    assert.notEqual(first.computedAt.toMillis(), second.computedAt.toMillis());
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'recomputeAndWrite does nothing for a vehicle doc that does not exist',
  async () => {
    const admin = require('firebase-admin');
    const uid = `health-missing-${Date.now()}`;
    const vin = '1HGCM82633A123459';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    await recomputeAndWrite(vehicleRef); // should not throw
    const snap = await vehicleRef.get();
    assert.equal(snap.exists, false);
  }
);
