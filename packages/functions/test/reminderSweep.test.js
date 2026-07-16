const test = require('node:test');
const assert = require('node:assert/strict');

const {
  deriveMileageBasedMaintenanceItems,
  runMaintenanceReminderSweep,
} = require('../lib/index.js');

test('deriveMileageBasedMaintenanceItems surfaces oil/tire/brake items due within the window', () => {
  // Regression: the reminder cron previously only ever considered oil
  // change (via a fixed 6-month calendar check) and never looked at
  // mileage or covered tire/brake service at all.
  const items = deriveMileageBasedMaintenanceItems(29500, 45);
  const titles = items.map(item => item.title).sort();

  assert.deepEqual(titles, ['Brake Inspection', 'Oil Change', 'Tire Rotation']);
  items.forEach(item => {
    assert.equal(item.type, 'preventive');
    assert.match(item.dueDate, /^\d{4}-\d{2}-\d{2}$/);
  });
});

test('deriveMileageBasedMaintenanceItems omits items due well outside the window', () => {
  const items = deriveMileageBasedMaintenanceItems(25000, 30);
  assert.deepEqual(items, []);
});

test('deriveMileageBasedMaintenanceItems returns nothing for invalid mileage', () => {
  assert.deepEqual(deriveMileageBasedMaintenanceItems(0, 30), []);
  assert.deepEqual(deriveMileageBasedMaintenanceItems(NaN, 30), []);
});

test('runMaintenanceReminderSweep skips a vehicle still within its reminder cooldown', async () => {
  const sentEmails = [];
  const markedSent = [];
  const recentlySent = new Date();
  recentlySent.setDate(recentlySent.getDate() - 2); // 2 days ago, cooldown is 7

  const summary = await runMaintenanceReminderSweep({
    async queryDocuments(collection) {
      if (collection === 'users') {
        return [
          {
            id: 'user-1',
            email: 'user1@example.com',
            emailRemindersEnabled: true,
          },
        ];
      }
      if (collection === 'users/user-1/vehicles') {
        return [
          {
            vin: 'VIN-COOLDOWN',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            lastMaintenanceReminderSentAt: recentlySent.toISOString(),
          },
        ];
      }
      return [];
    },
    async getUpcomingMaintenance() {
      return [{ title: 'Oil Change', dueDate: 'Within 30 days', type: 'preventive' }];
    },
    async sendReminderEmail(email, vehicle, items) {
      sentEmails.push({ email, vin: vehicle.vin, items });
    },
    async markReminderSent(userId, vin) {
      markedSent.push({ userId, vin });
    },
  });

  assert.equal(summary.remindersSent, 0);
  assert.deepEqual(sentEmails, []);
  assert.deepEqual(markedSent, []);
});

test('runMaintenanceReminderSweep sends and records cooldown state once the previous cooldown has elapsed', async () => {
  const sentEmails = [];
  const markedSent = [];
  const longAgo = new Date();
  longAgo.setDate(longAgo.getDate() - 10); // 10 days ago, past the 7-day cooldown

  const summary = await runMaintenanceReminderSweep({
    async queryDocuments(collection) {
      if (collection === 'users') {
        return [
          {
            id: 'user-2',
            email: 'user2@example.com',
            emailRemindersEnabled: true,
          },
        ];
      }
      if (collection === 'users/user-2/vehicles') {
        return [
          {
            vin: 'VIN-ELAPSED',
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            lastMaintenanceReminderSentAt: longAgo.toISOString(),
          },
        ];
      }
      return [];
    },
    async getUpcomingMaintenance() {
      return [{ title: 'Oil Change', dueDate: 'Within 30 days', type: 'preventive' }];
    },
    async sendReminderEmail(email, vehicle, items) {
      sentEmails.push({ email, vin: vehicle.vin, items });
    },
    async markReminderSent(userId, vin) {
      markedSent.push({ userId, vin });
    },
  });

  assert.equal(summary.remindersSent, 1);
  assert.deepEqual(sentEmails, [
    {
      email: 'user2@example.com',
      vin: 'VIN-ELAPSED',
      items: [{ title: 'Oil Change', dueDate: 'Within 30 days', type: 'preventive' }],
    },
  ]);
  assert.deepEqual(markedSent, [{ userId: 'user-2', vin: 'VIN-ELAPSED' }]);
});

test('runMaintenanceReminderSweep sends and records cooldown state for a vehicle with no prior reminder', async () => {
  const markedSent = [];

  const summary = await runMaintenanceReminderSweep({
    async queryDocuments(collection) {
      if (collection === 'users') {
        return [
          {
            id: 'user-3',
            email: 'user3@example.com',
            emailRemindersEnabled: true,
          },
        ];
      }
      if (collection === 'users/user-3/vehicles') {
        return [{ vin: 'VIN-NEW', make: 'Ford', model: 'F-150', year: 2023 }];
      }
      return [];
    },
    async getUpcomingMaintenance() {
      return [{ title: 'Oil Change', dueDate: 'Within 30 days', type: 'preventive' }];
    },
    async sendReminderEmail() {},
    async markReminderSent(userId, vin) {
      markedSent.push({ userId, vin });
    },
  });

  assert.equal(summary.remindersSent, 1);
  assert.deepEqual(markedSent, [{ userId: 'user-3', vin: 'VIN-NEW' }]);
});
