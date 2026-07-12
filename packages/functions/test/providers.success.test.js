const test = require('node:test');
const assert = require('node:assert/strict');

const { lookupOwnerManuals } = require('../lib/manuals.provider.js');
const { lookupWarrantySummary } = require('../lib/warranty.provider.js');

const originalFetch = global.fetch;

function mockVpicResponse({ make, model, year }) {
  return {
    ok: true,
    async json() {
      return {
        Results: [
          { Variable: 'Make', Value: make },
          { Variable: 'Model', Value: model },
          { Variable: 'Model Year', Value: String(year) },
        ],
      };
    },
  };
}

test('lookupOwnerManuals returns normalized OEM portal manual entry', async () => {
  global.fetch = async () =>
    mockVpicResponse({
      make: 'Honda',
      model: 'Civic',
      year: 2022,
    });

  const manuals = await lookupOwnerManuals('1HGCM82633A123456');

  assert.equal(Array.isArray(manuals), true);
  assert.equal(manuals.length, 1);
  assert.equal(manuals[0].source, 'oem_portal');
  assert.equal(manuals[0].language, 'en');
  assert.equal(manuals[0].publishedYear, 2022);
  assert.equal(
    manuals[0].url,
    'https://owners.honda.com/vehicle-information/information/owner-manuals'
  );
});

test('lookupWarrantySummary returns normalized heuristic coverage summary', async () => {
  global.fetch = async () =>
    mockVpicResponse({
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
    });

  const summary = await lookupWarrantySummary('4T1BF1FK9HU123456', 12000);

  assert.equal(summary.source, 'warranty_heuristic_v1');
  assert.equal(summary.coverages.length, 3);
  assert.equal(summary.coverages[0].type, 'basic');
  assert.equal(summary.coverages[1].type, 'powertrain');
  assert.equal(summary.coverages[2].type, 'corrosion');
  assert.equal(
    summary.status === 'active' || summary.status === 'expired',
    true
  );
  assert.equal(typeof summary.asOf, 'string');
});

test.after(() => {
  global.fetch = originalFetch;
});
