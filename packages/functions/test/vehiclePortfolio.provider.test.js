const test = require('node:test');
const assert = require('node:assert/strict');

require('../lib/index.js'); // admin.initializeApp() side effect
const { selfHealPortfolio } = require('../lib/vehiclePortfolio.provider.js');

const runFirestoreIntegration =
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.ALLOW_LIVE_FIRESTORE_TESTS === 'true';

(runFirestoreIntegration ? test : test.skip)(
  'selfHealPortfolio fills in the canonical template when documentPortfolio is entirely missing',
  async () => {
    const admin = require('firebase-admin');
    const uid = `portfolio-missing-${Date.now()}`;
    const vin = '1HGCM82633A123456';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    await vehicleRef.set({ vin, mileage: 1000 });
    await selfHealPortfolio(vehicleRef);

    const snap = await vehicleRef.get();
    const portfolio = snap.data().documentPortfolio;

    assert.ok(portfolio);
    assert.ok(Array.isArray(portfolio.categories));
    assert.equal(portfolio.categories.length, 4); // ownership, finance, maintenance, reference
    const maintenanceCategory = portfolio.categories.find(
      c => c.key === 'maintenance'
    );
    assert.ok(maintenanceCategory);
    assert.ok(maintenanceCategory.items.length > 0);
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'selfHealPortfolio adds only the missing category, leaving existing categories and their uploaded files untouched',
  async () => {
    const admin = require('firebase-admin');
    const uid = `portfolio-partial-${Date.now()}`;
    const vin = '1HGCM82633A123457';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    // A deliberately incomplete portfolio: only the 'ownership' category,
    // with one item already marked ready and a real uploaded file — this
    // must survive the reconciliation untouched.
    await vehicleRef.set({
      vin,
      mileage: 1000,
      documentPortfolio: {
        schemaVersion: 1,
        categories: [
          {
            key: 'ownership',
            title: 'Ownership and Legal',
            items: [
              {
                id: 'title',
                title: 'Vehicle Title',
                required: true,
                status: 'ready',
                files: [{ path: 'users/x/vehicles/y/records/title/file.pdf' }],
                notes: 'uploaded by user',
              },
            ],
          },
        ],
      },
    });

    await selfHealPortfolio(vehicleRef);

    const snap = await vehicleRef.get();
    const portfolio = snap.data().documentPortfolio;

    assert.equal(portfolio.categories.length, 4);
    const ownership = portfolio.categories.find(c => c.key === 'ownership');
    const titleItem = ownership.items.find(item => item.id === 'title');
    assert.equal(titleItem.status, 'ready');
    assert.equal(titleItem.notes, 'uploaded by user');
    assert.equal(titleItem.files.length, 1);
    // The other ownership items (registration, insurance, bill_of_sale)
    // should have been filled in from the canonical template.
    assert.ok(ownership.items.length > 1);

    const maintenanceCategory = portfolio.categories.find(
      c => c.key === 'maintenance'
    );
    assert.ok(maintenanceCategory);
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'selfHealPortfolio does nothing (no write) when the portfolio already matches the canonical template',
  async () => {
    const admin = require('firebase-admin');
    const uid = `portfolio-complete-${Date.now()}`;
    const vin = '1HGCM82633A123458';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    await vehicleRef.set({ vin, mileage: 1000 });
    await selfHealPortfolio(vehicleRef); // first call fills in the template
    const first = (await vehicleRef.get()).data().documentPortfolio;

    await selfHealPortfolio(vehicleRef); // second call should no-op
    const second = (await vehicleRef.get()).data().documentPortfolio;

    assert.deepEqual(first, second);
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'selfHealPortfolio does nothing for a vehicle doc that does not exist',
  async () => {
    const admin = require('firebase-admin');
    const uid = `portfolio-missing-vehicle-${Date.now()}`;
    const vin = '1HGCM82633A123459';
    const vehicleRef = admin.firestore().doc(`users/${uid}/vehicles/${vin}`);

    await selfHealPortfolio(vehicleRef); // should not throw
    const snap = await vehicleRef.get();
    assert.equal(snap.exists, false);
  }
);
