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
