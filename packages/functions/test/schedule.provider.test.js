const test = require('node:test');
const assert = require('node:assert/strict');

const { buildMaintenancePlan } = require('../lib/schedule.provider.js');

test('buildMaintenancePlan reports the next unvisited interval multiple, not one interval further', () => {
  // Regression for a bug where an extra interval was added on top of the
  // rounded-up multiple, telling users they had a full interval more
  // headroom than they actually did (e.g. reporting 10,000 mi remaining on
  // a 5,000 mi interval when only 5,000 mi remained, or none at all).
  const plan = buildMaintenancePlan(25000);
  const brake = plan.items.find(item => item.serviceType === 'brake_inspection');
  assert.equal(brake.nextDueMileage, 30000);

  const oil = plan.items.find(item => item.serviceType === 'oil_change');
  assert.equal(oil.nextDueMileage, 30000);
});

test('buildMaintenancePlan advances a full interval when currentMileage lands exactly on a multiple', () => {
  const plan = buildMaintenancePlan(10000);
  const oil = plan.items.find(item => item.serviceType === 'oil_change');
  assert.equal(oil.nextDueMileage, 15000);
});

test('buildMaintenancePlan uses manufacturer-specific intervals when make/model is covered', () => {
  const plan = buildMaintenancePlan(25000, 'Honda', 'Civic');
  assert.equal(plan.modelSpecific, true);
  assert.equal(plan.strategy, 'manufacturer_schedule_v1');

  // Honda Civic's real interval is 7,500 mi for oil/tire, not the generic
  // template's 5,000 mi — confirms the manufacturer table is actually
  // being used, not silently falling back to generic.
  const oil = plan.items.find(item => item.serviceType === 'oil_change');
  assert.equal(oil.intervalMiles, 7500);
  assert.equal(oil.nextDueMileage, 30000);

  const brake = plan.items.find(item => item.serviceType === 'brake_inspection');
  assert.equal(brake.intervalMiles, 15000); // Civic-specific, not the generic 10,000
});

test('buildMaintenancePlan is case/whitespace-insensitive when matching make/model', () => {
  const plan = buildMaintenancePlan(25000, ' TOYOTA ', ' camry ');
  assert.equal(plan.modelSpecific, true);
});

test('buildMaintenancePlan falls back to the generic template for an uncovered make/model', () => {
  const plan = buildMaintenancePlan(25000, 'Tesla', 'Model 3');
  assert.equal(plan.modelSpecific, false);
  assert.equal(plan.strategy, 'static_schedule_v1');
  const oil = plan.items.find(item => item.serviceType === 'oil_change');
  assert.equal(oil.intervalMiles, 5000);
});

test('buildMaintenancePlan falls back to the generic template when make/model is omitted', () => {
  const plan = buildMaintenancePlan(25000);
  assert.equal(plan.modelSpecific, false);
});
