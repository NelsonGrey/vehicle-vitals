const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('crypto');
const {
  getOwnerManuals,
  getWarrantySummary,
  getMaintenancePlan,
  sendMaintenanceReminder,
  createCalendarEvent,
  createCalendarEventCallable,
  getPremiumEntitlement,
  verifyPremiumPurchase,
  bootstrapEnterpriseContextCallable,
  getEffectiveEntitlementsCallable,
  createApiAccessKeyCallable,
  createSubscriptionCheckoutSessionCallable,
  listApiAccessKeysCallable,
  revokeApiAccessKeyCallable,
  getZapierWebhookConfigCallable,
  zapierMaintenanceWebhook,
  stripeSubscriptionWebhook,
  transferVehicleCallable,
  getOrganizationMembersCallable,
  setOrganizationMemberRoleCallable,
  createInvoiceDraftCallable,
  createPayableDraftCallable,
  applyRetentionPolicyCallable,
  requestUserDataExportCallable,
  requestUserDataDeletionCallable,
  submitSupportRequestCallable,
  deriveUpcomingMaintenanceItems,
  runMaintenanceReminderSweep,
  runMaintenanceReminderSchedule,
} = require('../lib/index.js');

const originalFetch = global.fetch;

function makeResponse() {
  const state = {
    statusCode: 200,
    body: null,
    headers: {},
  };
  const handlers = {
    finish: [],
    close: [],
  };

  const emit = event => {
    handlers[event].forEach(fn => fn());
  };

  return {
    state,
    on(event, callback) {
      if (handlers[event]) {
        handlers[event].push(callback);
      }
      return this;
    },
    setHeader(name, value) {
      state.headers[String(name).toLowerCase()] = value;
      return this;
    },
    getHeader(name) {
      return state.headers[String(name).toLowerCase()];
    },
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(payload) {
      state.body = payload;
      emit('finish');
      emit('close');
      return this;
    },
  };
}

function baseHeaders() {
  return {
    authorization: 'Bearer fake-token',
    'x-forwarded-for': '198.51.100.15',
  };
}

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

async function enablePremiumApiFeatures(uid, email) {
  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  const admin = require('firebase-admin');
  await admin.firestore().doc(`users/${uid}/subscription/current`).set(
    {
      tier: 'premium',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

function buildWebhookSignature(payload, secret) {
  const payloadText = JSON.stringify(payload || {});
  return `sha256=${createHmac('sha256', secret).update(payloadText).digest('hex')}`;
}

function isGooglePlayApiUrl(url) {
  try {
    return new URL(String(url)).hostname === 'androidpublisher.googleapis.com';
  } catch {
    return false;
  }
}

function buildStripeSignature(
  payload,
  secret,
  timestamp = Math.floor(Date.now() / 1000)
) {
  const payloadText = JSON.stringify(payload || {});
  const signedPayload = `${timestamp}.${payloadText}`;
  const digest = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

test('getOwnerManuals returns 503 when manuals feature disabled', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.MANUALS_ENABLED = 'false';
  process.env.MANUALS_PROVIDER = 'manuals_primary';

  const req = {
    method: 'GET',
    headers: baseHeaders(),
    query: { vin: '1HGCM82633A123456' },
    ip: '198.51.100.15',
  };
  const res = makeResponse();

  await getOwnerManuals(req, res);

  assert.equal(res.state.statusCode, 503);
  assert.equal(res.state.body.success, false);
  assert.equal(res.state.body.error, 'Owner manual feature is disabled');
});

test('getOwnerManuals returns 501 when provider is not configured', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.MANUALS_ENABLED = 'true';
  process.env.MANUALS_PROVIDER = 'none';

  const req = {
    method: 'GET',
    headers: baseHeaders(),
    query: { vin: '1HGCM82633A123456' },
    ip: '198.51.100.16',
  };
  const res = makeResponse();

  await getOwnerManuals(req, res);

  assert.equal(res.state.statusCode, 501);
  assert.equal(res.state.body.success, false);
  assert.equal(
    res.state.body.error,
    'Owner manual provider integration not implemented'
  );
});

test('getWarrantySummary returns 503 when warranty feature disabled', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.WARRANTY_ENABLED = 'false';
  process.env.WARRANTY_PROVIDER = 'warranty_primary';

  const req = {
    method: 'GET',
    headers: baseHeaders(),
    query: { vin: '1HGCM82633A123456' },
    ip: '198.51.100.17',
  };
  const res = makeResponse();

  await getWarrantySummary(req, res);

  assert.equal(res.state.statusCode, 503);
  assert.equal(res.state.body.success, false);
  assert.equal(res.state.body.error, 'Warranty feature is disabled');
});

test('getWarrantySummary returns 501 when provider is not configured', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.WARRANTY_ENABLED = 'true';
  process.env.WARRANTY_PROVIDER = 'none';

  const req = {
    method: 'GET',
    headers: baseHeaders(),
    query: { vin: '1HGCM82633A123456' },
    ip: '198.51.100.18',
  };
  const res = makeResponse();

  await getWarrantySummary(req, res);

  assert.equal(res.state.statusCode, 501);
  assert.equal(res.state.body.success, false);
  assert.equal(
    res.state.body.error,
    'Warranty provider integration not implemented'
  );
});

test('getMaintenancePlan returns 401 when auth is required and token missing', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'true';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';

  const req = {
    method: 'GET',
    headers: {},
    query: { vin: '1HGCM82633A123456', currentMileage: '40000' },
    ip: '198.51.100.19',
  };
  const res = makeResponse();

  await getMaintenancePlan(req, res);

  assert.equal(res.state.statusCode, 401);
  assert.equal(res.state.body.success, false);
  assert.equal(res.state.body.error, 'Missing Bearer token');
});

test('createCalendarEvent returns 503 when calendar feature disabled', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.CALENDAR_ENABLED = 'false';

  const req = {
    method: 'POST',
    headers: baseHeaders(),
    body: {
      vehicleVin: '1HGCM82633A123456',
      title: 'Oil Change',
      startAt: '2026-07-01T15:00:00Z',
      target: 'ics',
    },
    ip: '198.51.100.20',
  };
  const res = makeResponse();

  await createCalendarEvent(req, res);

  assert.equal(res.state.statusCode, 503);
  assert.equal(res.state.body.success, false);
  assert.equal(res.state.body.error, 'Calendar feature is disabled');
});

test('sendMaintenanceReminder returns 405 for non-POST requests', async () => {
  const req = {
    method: 'GET',
    headers: baseHeaders(),
    body: {},
    ip: '198.51.100.20',
  };
  const res = makeResponse();

  await sendMaintenanceReminder(req, res);

  assert.equal(res.state.statusCode, 405);
  assert.equal(res.state.body.error, 'Method not allowed');
});

test('sendMaintenanceReminder returns 400 when payload is invalid', async () => {
  const req = {
    method: 'POST',
    headers: baseHeaders(),
    body: {
      email: 'driver@example.com',
      vehicle: {
        make: 'Honda',
        model: 'Accord',
        year: 2022,
        vin: '1HGCV1F39NA000001',
      },
      maintenanceItems: 'not-an-array',
    },
    ip: '198.51.100.20',
  };
  const res = makeResponse();

  await sendMaintenanceReminder(req, res);

  assert.equal(res.state.statusCode, 400);
  assert.equal(
    res.state.body.error,
    'Missing required fields: email, vehicle, maintenanceItems'
  );
});

test('sendMaintenanceReminder returns 200 for valid payload', async () => {
  process.env.EMAIL_PROVIDER = 'log';

  const req = {
    method: 'POST',
    headers: baseHeaders(),
    body: {
      email: 'driver@example.com',
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        vin: '4T1BF1FK9HU123456',
      },
      maintenanceItems: [
        {
          title: 'Oil Change',
          dueDate: 'Within 30 days',
        },
      ],
    },
    ip: '198.51.100.20',
  };
  const res = makeResponse();

  await sendMaintenanceReminder(req, res);

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.success, true);
  assert.equal(res.state.body.message, 'Reminder email sent');
});

test('sendMaintenanceReminder returns 500 when provider send fails', async () => {
  process.env.EMAIL_PROVIDER = 'sendgrid';
  delete process.env.SENDGRID_API_KEY;
  delete process.env.SENDGRID_FROM_EMAIL;

  const req = {
    method: 'POST',
    headers: baseHeaders(),
    body: {
      email: 'driver@example.com',
      vehicle: {
        make: 'Ford',
        model: 'Escape',
        year: 2021,
        vin: '1FMCU9G63MUA00001',
      },
      maintenanceItems: [
        {
          title: 'Brake Inspection',
          dueDate: 'Within 14 days',
        },
      ],
    },
    ip: '198.51.100.20',
  };
  const res = makeResponse();

  await sendMaintenanceReminder(req, res);

  assert.equal(res.state.statusCode, 500);
  assert.equal(res.state.body.success, false);
  assert.equal(res.state.body.error, 'Failed to send reminder email');

  process.env.EMAIL_PROVIDER = 'log';
});

test('getOwnerManuals returns 200 with normalized manuals payload', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.MANUALS_ENABLED = 'true';
  process.env.MANUALS_PROVIDER = 'manuals_primary';

  global.fetch = async () =>
    mockVpicResponse({
      make: 'Honda',
      model: 'Civic',
      year: 2022,
    });

  const req = {
    method: 'GET',
    headers: baseHeaders(),
    query: { vin: '1HGCM82633A123456' },
    ip: '198.51.100.21',
  };
  const res = makeResponse();

  await getOwnerManuals(req, res);

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.success, true);
  assert.equal(res.state.body.provider, 'manuals_primary');
  assert.equal(Array.isArray(res.state.body.manuals), true);
  assert.equal(res.state.body.manuals.length, 1);
});

test('getWarrantySummary returns 200 with normalized warranty payload', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.WARRANTY_ENABLED = 'true';
  process.env.WARRANTY_PROVIDER = 'warranty_primary';

  global.fetch = async () =>
    mockVpicResponse({
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
    });

  const req = {
    method: 'GET',
    headers: baseHeaders(),
    query: { vin: '4T1BF1FK9HU123456', currentMileage: '12000' },
    ip: '198.51.100.22',
  };
  const res = makeResponse();

  await getWarrantySummary(req, res);

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.success, true);
  assert.equal(res.state.body.provider, 'warranty_primary');
  assert.equal(res.state.body.warranty.source, 'warranty_heuristic_v1');
  assert.equal(Array.isArray(res.state.body.warranty.coverages), true);
  assert.equal(res.state.body.warranty.coverages.length, 3);
});

test('getMaintenancePlan returns 200 with normalized plan payload', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.MAINTENANCE_PLAN_ENABLED = 'true';
  process.env.SCHEDULE_PROVIDER = 'schedule_primary';

  const req = {
    method: 'GET',
    headers: baseHeaders(),
    query: { vin: '1HGCM82633A123456', currentMileage: '42100' },
    ip: '198.51.100.23',
  };
  const res = makeResponse();

  await getMaintenancePlan(req, res);

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.success, true);
  assert.equal(res.state.body.provider, 'schedule_primary');
  assert.equal(res.state.body.plan.strategy, 'static_schedule_v1');
  assert.equal(Array.isArray(res.state.body.plan.items), true);
  assert.equal(res.state.body.plan.items.length, 3);
});

test('createCalendarEvent returns 200 with ICS event payload', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.CALENDAR_ENABLED = 'true';
  process.env.CALENDAR_PROVIDER = 'calendar_primary';

  const req = {
    method: 'POST',
    headers: baseHeaders(),
    body: {
      vehicleVin: '1HGCM82633A123456',
      title: 'Oil Change',
      description: 'Scheduled maintenance',
      startAt: '2026-07-01T15:00:00Z',
      endAt: '2026-07-01T16:00:00Z',
      target: 'ics',
    },
    ip: '198.51.100.24',
  };
  const res = makeResponse();

  await createCalendarEvent(req, res);

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.success, true);
  assert.equal(res.state.body.provider, 'calendar_primary');
  assert.equal(res.state.body.event.target, 'ics');
  assert.equal(typeof res.state.body.event.downloadUrl, 'string');
  assert.equal(
    res.state.body.event.downloadUrl.startsWith('data:text/calendar'),
    true
  );
});

test('createCalendarEvent returns 200 with Google event payload', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.CALENDAR_ENABLED = 'true';
  process.env.CALENDAR_PROVIDER = 'calendar_primary';

  const req = {
    method: 'POST',
    headers: baseHeaders(),
    body: {
      vehicleVin: '1HGCM82633A123456',
      title: 'Brake Inspection',
      description: 'Scheduled maintenance',
      startAt: '2026-08-01T15:00:00Z',
      endAt: '2026-08-01T16:00:00Z',
      target: 'google',
    },
    ip: '198.51.100.25',
  };
  const res = makeResponse();

  await createCalendarEvent(req, res);

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.success, true);
  assert.equal(res.state.body.event.target, 'google');
  assert.equal(typeof res.state.body.event.actionUrl, 'string');
  assert.equal(
    res.state.body.event.actionUrl.startsWith(
      'https://calendar.google.com/calendar/render?action=TEMPLATE'
    ),
    true
  );
});

test('createCalendarEvent returns 200 with Apple event payload', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'false';
  process.env.CALENDAR_ENABLED = 'true';
  process.env.CALENDAR_PROVIDER = 'calendar_primary';

  const req = {
    method: 'POST',
    headers: baseHeaders(),
    body: {
      vehicleVin: '1HGCM82633A123456',
      title: 'Tire Rotation',
      description: 'Scheduled maintenance',
      startAt: '2026-09-01T15:00:00Z',
      endAt: '2026-09-01T16:00:00Z',
      target: 'apple',
    },
    ip: '198.51.100.26',
  };
  const res = makeResponse();

  await createCalendarEvent(req, res);

  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body.success, true);
  assert.equal(res.state.body.event.target, 'apple');
  assert.equal(res.state.body.event.delivery, 'ics_import');
  assert.equal(typeof res.state.body.event.downloadUrl, 'string');
  assert.equal(
    res.state.body.event.downloadUrl.startsWith('data:text/calendar'),
    true
  );
});

test('createCalendarEventCallable rejects when auth is required and context is missing', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'true';
  process.env.CALENDAR_ENABLED = 'true';
  process.env.CALENDAR_PROVIDER = 'calendar_primary';

  await assert.rejects(
    () =>
      createCalendarEventCallable.run({
        data: {
          vehicleVin: '1HGCM82633A123456',
          title: 'Oil Change',
          startAt: '2026-10-01T15:00:00Z',
          target: 'ics',
        },
      }),
    error => {
      assert.equal(error.code, 'unauthenticated');
      assert.equal(error.message, 'Missing auth context');
      return true;
    }
  );
});

test('createCalendarEventCallable returns normalized event payload with auth context', async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'true';
  process.env.CALENDAR_ENABLED = 'true';
  process.env.CALENDAR_PROVIDER = 'calendar_primary';

  const result = await createCalendarEventCallable.run({
    auth: { uid: 'smoke-user' },
    data: {
      vehicleVin: '1HGCM82633A123456',
      title: 'Battery Service',
      description: 'Scheduled maintenance',
      startAt: '2026-11-01T15:00:00Z',
      endAt: '2026-11-01T16:00:00Z',
      target: 'google',
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.provider, 'calendar_primary');
  assert.equal(result.event.target, 'google');
  assert.equal(typeof result.event.actionUrl, 'string');
});

test('deriveUpcomingMaintenanceItems suggests oil change with no history', () => {
  const items = deriveUpcomingMaintenanceItems([], 21);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Oil Change');
  assert.equal(items[0].dueDate, 'Within 21 days');
  assert.equal(items[0].type, 'preventive');
});

test('deriveUpcomingMaintenanceItems suppresses reminder for recent oil change', () => {
  const recent = new Date();
  recent.setDate(recent.getDate() - 45);

  const items = deriveUpcomingMaintenanceItems([
    {
      title: 'Full Synthetic Oil Change',
      date: recent.toISOString(),
    },
  ]);

  assert.deepEqual(items, []);
});

test('deriveUpcomingMaintenanceItems suggests reminder for stale oil history', () => {
  const stale = new Date();
  stale.setDate(stale.getDate() - 220);

  const items = deriveUpcomingMaintenanceItems([
    {
      title: 'Oil Change',
      date: stale.toISOString(),
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Oil Change');
});

test('runMaintenanceReminderSweep sends reminders only for eligible users/vehicles', async () => {
  const sentEmails = [];
  const queriedCollections = [];

  const summary = await runMaintenanceReminderSweep({
    async queryDocuments(collection) {
      queriedCollections.push(collection);

      if (collection === 'users') {
        return [
          {
            id: 'user-enabled',
            email: 'enabled@example.com',
            emailRemindersEnabled: true,
          },
          {
            id: 'user-disabled',
            email: 'disabled@example.com',
            emailRemindersEnabled: false,
          },
          {
            id: 'user-no-email',
            emailRemindersEnabled: true,
          },
        ];
      }

      if (collection === 'users/user-enabled/vehicles') {
        return [
          { vin: 'VIN-1', make: 'Honda', model: 'Civic', year: 2021 },
          { vin: 'VIN-2', make: 'Toyota', model: 'Camry', year: 2022 },
        ];
      }

      return [];
    },
    async getUpcomingMaintenance(vehicle) {
      if (vehicle.vin === 'VIN-1') {
        return [
          {
            title: 'Oil Change',
            dueDate: 'Within 30 days',
            type: 'preventive',
          },
        ];
      }
      return [];
    },
    async sendReminderEmail(email, vehicle, maintenanceItems) {
      sentEmails.push({
        email,
        vin: vehicle.vin,
        count: maintenanceItems.length,
      });
    },
  });

  assert.deepEqual(queriedCollections, [
    'users',
    'users/user-enabled/vehicles',
  ]);
  assert.equal(summary.usersScanned, 3);
  assert.equal(summary.vehiclesScanned, 2);
  assert.equal(summary.remindersSent, 1);
  assert.equal(summary.reminderFailures, 0);
  assert.deepEqual(sentEmails, [
    {
      email: 'enabled@example.com',
      vin: 'VIN-1',
      count: 1,
    },
  ]);
});

test('runMaintenanceReminderSweep skips users without valid ids', async () => {
  const summary = await runMaintenanceReminderSweep({
    async queryDocuments(collection) {
      if (collection === 'users') {
        return [
          { email: 'no-id@example.com', emailRemindersEnabled: true },
          {
            id: '',
            email: 'blank-id@example.com',
            emailRemindersEnabled: true,
          },
        ];
      }

      throw new Error(`Unexpected query path: ${collection}`);
    },
    async getUpcomingMaintenance() {
      throw new Error('getUpcomingMaintenance should not be called');
    },
    async sendReminderEmail() {
      throw new Error('sendReminderEmail should not be called');
    },
  });

  assert.equal(summary.usersScanned, 2);
  assert.equal(summary.vehiclesScanned, 0);
  assert.equal(summary.remindersSent, 0);
  assert.equal(summary.reminderFailures, 0);
});

test('runMaintenanceReminderSweep continues after reminder delivery failure', async () => {
  const attemptedVins = [];

  const summary = await runMaintenanceReminderSweep({
    async queryDocuments(collection) {
      if (collection === 'users') {
        return [
          {
            id: 'resilience-user',
            email: 'resilience@example.com',
            emailRemindersEnabled: true,
          },
        ];
      }

      if (collection === 'users/resilience-user/vehicles') {
        return [
          { vin: 'VIN-FAIL', make: 'Ford', model: 'Escape', year: 2020 },
          { vin: 'VIN-OK', make: 'Mazda', model: 'CX-5', year: 2023 },
        ];
      }

      return [];
    },
    async getUpcomingMaintenance() {
      return [
        { title: 'Oil Change', dueDate: 'Within 30 days', type: 'preventive' },
      ];
    },
    async sendReminderEmail(_email, vehicle) {
      attemptedVins.push(vehicle.vin);
      if (vehicle.vin === 'VIN-FAIL') {
        throw new Error('Simulated delivery outage');
      }
    },
  });

  assert.deepEqual(attemptedVins, ['VIN-FAIL', 'VIN-OK']);
  assert.equal(summary.usersScanned, 1);
  assert.equal(summary.vehiclesScanned, 2);
  assert.equal(summary.remindersSent, 1);
  assert.equal(summary.reminderFailures, 1);
});

test('runMaintenanceReminderSchedule logs summary and returns it on success', async () => {
  const infoLogs = [];
  const errorLogs = [];
  const expectedSummary = {
    usersScanned: 2,
    vehiclesScanned: 4,
    remindersSent: 3,
    reminderFailures: 1,
  };

  const summary = await runMaintenanceReminderSchedule({
    async runSweep() {
      return expectedSummary;
    },
    onInfo(message, payload) {
      infoLogs.push({ message, payload });
    },
    onError(message, error) {
      errorLogs.push({ message, error });
    },
  });

  assert.deepEqual(summary, expectedSummary);
  assert.equal(infoLogs.length, 2);
  assert.deepEqual(infoLogs[1], {
    message: 'Maintenance reminder check completed',
    payload: expectedSummary,
  });
  assert.equal(errorLogs.length, 0);
});

test('runMaintenanceReminderSchedule swallows errors and returns null', async () => {
  const infoLogs = [];
  const errorLogs = [];

  const summary = await runMaintenanceReminderSchedule({
    async runSweep() {
      throw new Error('sweep-failure');
    },
    onInfo(message, payload) {
      infoLogs.push({ message, payload });
    },
    onError(message, error) {
      errorLogs.push({ message, error: error.message });
    },
  });

  assert.equal(summary, null);
  assert.equal(infoLogs.length, 1);
  assert.equal(errorLogs.length, 1);
  assert.deepEqual(errorLogs[0], {
    message: 'Error checking maintenance reminders:',
    error: 'sweep-failure',
  });
});

test('verifyPremiumPurchase rejects without auth context', async () => {
  await assert.rejects(
    () =>
      verifyPremiumPurchase.run({
        data: {
          productId: 'premium_ad_free',
          verificationData: 'receipt-token',
        },
      }),
    error => {
      assert.equal(error.code, 'unauthenticated');
      assert.equal(error.message, 'Missing auth context');
      return true;
    }
  );
});

test('verifyPremiumPurchase rejects unsupported product id', async () => {
  await assert.rejects(
    () =>
      verifyPremiumPurchase.run({
        auth: { uid: 'premium-user' },
        data: {
          productId: 'premium_unknown',
          verificationData: 'receipt-token',
        },
      }),
    error => {
      assert.equal(error.code, 'invalid-argument');
      assert.equal(error.message, 'Unsupported premium productId');
      return true;
    }
  );
});

test('verifyPremiumPurchase rejects missing verification data', async () => {
  await assert.rejects(
    () =>
      verifyPremiumPurchase.run({
        auth: { uid: 'premium-user' },
        data: {
          productId: 'premium_ad_free',
          verificationData: ' ',
        },
      }),
    error => {
      assert.equal(error.code, 'invalid-argument');
      assert.equal(
        error.message,
        'verificationData is required for premium verification'
      );
      return true;
    }
  );
});

test('verifyPremiumPurchase returns provisional entitlement payload', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'false';
  const result = await verifyPremiumPurchase.run({
    auth: { uid: 'premium-user' },
    data: {
      productId: 'premium_ad_free',
      purchaseId: 'purchase-123',
      verificationData: 'server-receipt-token',
      source: 'app_store',
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.entitlement.premium, true);
  assert.equal(result.entitlement.verified, false);
  assert.equal(result.entitlement.verificationState, 'provisional');
});

test('verifyPremiumPurchase rejects in strict mode when verification is not possible', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'true';
  delete process.env.APPLE_SHARED_SECRET;

  await assert.rejects(
    () =>
      verifyPremiumPurchase.run({
        auth: { uid: 'premium-user-strict' },
        data: {
          productId: 'premium_ad_free',
          purchaseId: 'purchase-strict',
          verificationData: 'server-receipt-token',
          source: 'app_store',
        },
      }),
    error => {
      assert.equal(error.code, 'failed-precondition');
      assert.equal(error.message, 'APPLE_SHARED_SECRET not configured');
      return true;
    }
  );
});

test('verifyPremiumPurchase returns verified entitlement in strict mode with valid Apple receipt', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'true';
  process.env.APPLE_SHARED_SECRET = 'test-shared-secret';

  const originalFetchForApple = global.fetch;
  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        status: 0,
        receipt: {
          in_app: [{ product_id: 'premium_ad_free' }],
        },
      };
    },
  });

  try {
    const result = await verifyPremiumPurchase.run({
      auth: { uid: 'premium-user-verified' },
      data: {
        productId: 'premium_ad_free',
        purchaseId: 'purchase-verified',
        verificationData: 'valid-apple-receipt',
        source: 'app_store',
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.entitlement.premium, true);
    assert.equal(result.entitlement.verified, true);
    assert.equal(result.entitlement.verificationState, 'verified');
  } finally {
    global.fetch = originalFetchForApple;
  }
});

test('verifyPremiumPurchase returns verified entitlement in strict mode with valid Play receipt', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'true';
  process.env.GOOGLE_PLAY_PACKAGE_NAME = 'com.example.vehiclevitals';
  process.env.GOOGLE_PLAY_ACCESS_TOKEN = 'test-play-access-token';

  const originalFetchForPlay = global.fetch;
  global.fetch = async url => {
    if (isGooglePlayApiUrl(url)) {
      return {
        ok: true,
        async json() {
          return { purchaseState: 0, consumptionState: 0 };
        },
      };
    }

    return {
      ok: false,
      async text() {
        return 'unexpected URL';
      },
    };
  };

  try {
    const result = await verifyPremiumPurchase.run({
      auth: { uid: 'premium-user-play-verified' },
      data: {
        productId: 'premium_ad_free',
        purchaseId: 'purchase-play-verified',
        verificationData: 'play-token-verified',
        source: 'play_store',
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.entitlement.premium, true);
    assert.equal(result.entitlement.verified, true);
    assert.equal(result.entitlement.verificationState, 'verified');
  } finally {
    global.fetch = originalFetchForPlay;
  }
});

test('verifyPremiumPurchase treats google_play source alias as Play Store', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'true';
  process.env.GOOGLE_PLAY_PACKAGE_NAME = 'com.example.vehiclevitals';
  process.env.GOOGLE_PLAY_ACCESS_TOKEN = 'test-play-access-token';

  const originalFetchForPlay = global.fetch;
  global.fetch = async url => {
    if (isGooglePlayApiUrl(url)) {
      return {
        ok: true,
        async json() {
          return { purchaseState: 0, consumptionState: 0 };
        },
      };
    }

    return {
      ok: false,
      async text() {
        return 'unexpected URL';
      },
    };
  };

  try {
    const result = await verifyPremiumPurchase.run({
      auth: { uid: 'premium-user-google-play-alias' },
      data: {
        productId: 'premium_ad_free',
        purchaseId: 'purchase-google-play-alias',
        verificationData: 'play-token-google-play-alias',
        source: 'google_play',
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.entitlement.verified, true);
    assert.equal(result.entitlement.verificationState, 'verified');
  } finally {
    global.fetch = originalFetchForPlay;
  }
});

test('verifyPremiumPurchase rejects in strict mode when Play verification fails', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'true';
  process.env.GOOGLE_PLAY_PACKAGE_NAME = 'com.example.vehiclevitals';
  process.env.GOOGLE_PLAY_ACCESS_TOKEN = 'test-play-access-token';

  const originalFetchForPlay = global.fetch;
  global.fetch = async url => {
    if (isGooglePlayApiUrl(url)) {
      return {
        ok: true,
        async json() {
          return { purchaseState: 1, consumptionState: 0 };
        },
      };
    }

    return {
      ok: false,
      async text() {
        return 'unexpected URL';
      },
    };
  };

  try {
    await assert.rejects(
      () =>
        verifyPremiumPurchase.run({
          auth: { uid: 'premium-user-play-reject' },
          data: {
            productId: 'premium_ad_free',
            purchaseId: 'purchase-play-reject',
            verificationData: 'play-token-reject',
            source: 'play_store',
          },
        }),
      error => {
        assert.equal(error.code, 'failed-precondition');
        assert.equal(
          error.message,
          'Play purchase state invalid (purchaseState=1, consumptionState=0)'
        );
        return true;
      }
    );
  } finally {
    global.fetch = originalFetchForPlay;
  }
});

test('getPremiumEntitlement rejects without auth context', async () => {
  await assert.rejects(
    () => getPremiumEntitlement.run({}),
    error => {
      assert.equal(error.code, 'unauthenticated');
      assert.equal(error.message, 'Missing auth context');
      return true;
    }
  );
});

test('verifyPremiumPurchase blocks replay across different users', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'false';
  const receipt = `shared-receipt-${Date.now()}`;

  const first = await verifyPremiumPurchase.run({
    auth: { uid: 'premium-user-a' },
    data: {
      productId: 'premium_ad_free',
      purchaseId: 'purchase-a',
      verificationData: receipt,
      source: 'play_store',
    },
  });

  assert.equal(first.success, true);

  await assert.rejects(
    () =>
      verifyPremiumPurchase.run({
        auth: { uid: 'premium-user-b' },
        data: {
          productId: 'premium_ad_free',
          purchaseId: 'purchase-b',
          verificationData: receipt,
          source: 'play_store',
        },
      }),
    error => {
      assert.equal(error.code, 'permission-denied');
      assert.equal(
        error.message,
        'Receipt is already linked to another account'
      );
      return true;
    }
  );
});

test('getPremiumEntitlement returns active provisional entitlement after verification', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'false';
  process.env.PREMIUM_UNKNOWN_SOURCE_UNVERIFIED = 'false';
  const uid = `premium-user-${Date.now()}`;

  await verifyPremiumPurchase.run({
    auth: { uid },
    data: {
      productId: 'premium_ad_free',
      purchaseId: 'purchase-entitlement',
      verificationData: `entitlement-receipt-${Date.now()}`,
      source: 'unknown_store',
    },
  });

  const entitlement = await getPremiumEntitlement.run({ auth: { uid } });

  assert.equal(entitlement.success, true);
  assert.equal(entitlement.entitlement.premium, true);
  assert.equal(entitlement.entitlement.verified, false);
  assert.equal(entitlement.entitlement.verificationState, 'provisional');
  assert.equal(entitlement.entitlement.productId, 'premium_ad_free');
});

test('createSubscriptionCheckoutSessionCallable rejects without auth context', async () => {
  await assert.rejects(
    () =>
      createSubscriptionCheckoutSessionCallable.run({
        data: { targetTier: 'pro', billingPeriod: 'monthly' },
      }),
    error => {
      assert.equal(error.code, 'unauthenticated');
      return true;
    }
  );
});

test('createSubscriptionCheckoutSessionCallable returns redirect payload when template configured', async () => {
  const uid = `checkout-session-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousTemplate = process.env.STRIPE_CHECKOUT_URL_TEMPLATE;

  process.env.STRIPE_CHECKOUT_URL_TEMPLATE =
    'https://checkout.example/{CHECKOUT_SESSION_ID}?u={UID}&tier={TIER}&period={BILLING_PERIOD}';

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  try {
    const result = await createSubscriptionCheckoutSessionCallable.run({
      auth: { uid, token: { email } },
      data: { targetTier: 'pro', billingPeriod: 'annual' },
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, 'redirect');
    assert.equal(typeof result.checkoutUrl, 'string');
    assert.equal(result.checkoutUrl.includes('checkout.example/'), true);
    assert.equal(
      result.checkoutUrl.includes(`u=${encodeURIComponent(uid)}`),
      true
    );
    assert.equal(result.checkoutUrl.includes('tier=pro'), true);
    assert.equal(result.checkoutUrl.includes('period=annual'), true);
  } finally {
    if (typeof previousTemplate === 'undefined') {
      delete process.env.STRIPE_CHECKOUT_URL_TEMPLATE;
    } else {
      process.env.STRIPE_CHECKOUT_URL_TEMPLATE = previousTemplate;
    }
  }
});

test('createSubscriptionCheckoutSessionCallable uses Stripe API when secret key is configured', async () => {
  const uid = `checkout-stripe-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousTemplate = process.env.STRIPE_CHECKOUT_URL_TEMPLATE;
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  const previousPrice = process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY;
  const previousSuccessUrl = process.env.STRIPE_CHECKOUT_SUCCESS_URL;
  const previousCancelUrl = process.env.STRIPE_CHECKOUT_CANCEL_URL;
  const originalFetchForStripe = global.fetch;

  delete process.env.STRIPE_CHECKOUT_URL_TEMPLATE;
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY = 'price_premium_monthly_test';
  process.env.STRIPE_CHECKOUT_SUCCESS_URL =
    'https://app.vehicle-vitals.test/app/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}';
  process.env.STRIPE_CHECKOUT_CANCEL_URL =
    'https://app.vehicle-vitals.test/app/subscription?checkout=cancelled';

  global.fetch = async (url, options) => {
    if (String(url).includes('api.stripe.com/v1/checkout/sessions')) {
      assert.equal(options?.method, 'POST');
      assert.equal(
        String(options?.headers?.Authorization || '').startsWith(
          'Bearer sk_test_'
        ),
        true
      );

      return {
        ok: true,
        async json() {
          return {
            id: `cs_live_${Date.now()}`,
            url: 'https://checkout.stripe.test/session/live',
            customer: `cus_live_${Date.now()}`,
            subscription: `sub_live_${Date.now()}`,
          };
        },
      };
    }

    throw new Error(`Unexpected fetch URL in checkout test: ${url}`);
  };

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  try {
    const result = await createSubscriptionCheckoutSessionCallable.run({
      auth: { uid, token: { email } },
      data: { targetTier: 'premium', billingPeriod: 'monthly' },
    });

    assert.equal(result.success, true);
    assert.equal(result.mode, 'redirect');
    assert.equal(
      result.checkoutUrl,
      'https://checkout.stripe.test/session/live'
    );
    assert.equal(String(result.checkoutSessionId).startsWith('cs_live_'), true);
  } finally {
    global.fetch = originalFetchForStripe;
    if (typeof previousTemplate === 'undefined') {
      delete process.env.STRIPE_CHECKOUT_URL_TEMPLATE;
    } else {
      process.env.STRIPE_CHECKOUT_URL_TEMPLATE = previousTemplate;
    }
    if (typeof previousStripeKey === 'undefined') {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = previousStripeKey;
    }
    if (typeof previousPrice === 'undefined') {
      delete process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY;
    } else {
      process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY = previousPrice;
    }
    if (typeof previousSuccessUrl === 'undefined') {
      delete process.env.STRIPE_CHECKOUT_SUCCESS_URL;
    } else {
      process.env.STRIPE_CHECKOUT_SUCCESS_URL = previousSuccessUrl;
    }
    if (typeof previousCancelUrl === 'undefined') {
      delete process.env.STRIPE_CHECKOUT_CANCEL_URL;
    } else {
      process.env.STRIPE_CHECKOUT_CANCEL_URL = previousCancelUrl;
    }
  }
});

test('createApiAccessKeyCallable rejects without auth context', async () => {
  await assert.rejects(
    () => createApiAccessKeyCallable.run({ data: { label: 'Primary' } }),
    error => {
      assert.equal(error.code, 'unauthenticated');
      return true;
    }
  );
});

test('API key callables create, list, and revoke keys for entitled user', async () => {
  const uid = `api-keys-${Date.now()}`;
  const email = `${uid}@example.com`;

  await enablePremiumApiFeatures(uid, email);

  const created = await createApiAccessKeyCallable.run({
    auth: { uid, token: { email } },
    data: { label: 'Zapier Primary' },
  });

  assert.equal(created.success, true);
  assert.equal(created.key.label, 'Zapier Primary');
  assert.equal(created.key.keyId.startsWith('key_'), true);
  assert.equal(created.rawKey.startsWith('vvk_'), true);

  const listBeforeRevoke = await listApiAccessKeysCallable.run({
    auth: { uid, token: { email } },
  });

  assert.equal(listBeforeRevoke.success, true);
  assert.equal(Array.isArray(listBeforeRevoke.keys), true);
  assert.equal(
    listBeforeRevoke.keys.some(key => key.keyId === created.key.keyId),
    true
  );

  const revoked = await revokeApiAccessKeyCallable.run({
    auth: { uid, token: { email } },
    data: { keyId: created.key.keyId },
  });

  assert.equal(revoked.success, true);
  assert.equal(revoked.keyId, created.key.keyId);

  const listAfterRevoke = await listApiAccessKeysCallable.run({
    auth: { uid, token: { email } },
  });

  const revokedRecord = listAfterRevoke.keys.find(
    key => key.keyId === created.key.keyId
  );
  assert.ok(revokedRecord);
  assert.equal(revokedRecord.active, false);
});

test('getZapierWebhookConfigCallable returns configured webhook URL for entitled user', async () => {
  const uid = `zapier-config-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousBaseUrl = process.env.API_WEBHOOK_BASE_URL;

  process.env.API_WEBHOOK_BASE_URL = 'https://example.test/functions';
  await enablePremiumApiFeatures(uid, email);

  try {
    const result = await getZapierWebhookConfigCallable.run({
      auth: { uid, token: { email } },
    });

    assert.equal(result.success, true);
    assert.equal(
      result.webhookUrl,
      'https://example.test/functions/zapierMaintenanceWebhook'
    );
  } finally {
    if (typeof previousBaseUrl === 'undefined') {
      delete process.env.API_WEBHOOK_BASE_URL;
    } else {
      process.env.API_WEBHOOK_BASE_URL = previousBaseUrl;
    }
  }
});

test('zapierMaintenanceWebhook enforces signature when webhook secret is configured', async () => {
  const uid = `zapier-signature-${Date.now()}`;
  const email = `${uid}@example.com`;
  const vin = `VIN-ZAPIER-${Date.now()}`;
  const previousSecret = process.env.ZAPIER_WEBHOOK_SECRET;
  process.env.ZAPIER_WEBHOOK_SECRET = 'test-zapier-secret';

  await enablePremiumApiFeatures(uid, email);

  const admin = require('firebase-admin');
  await admin.firestore().doc(`users/${uid}/vehicles/${vin}`).set({
    vin,
    make: 'Honda',
    model: 'Civic',
    year: 2022,
  });

  const created = await createApiAccessKeyCallable.run({
    auth: { uid, token: { email } },
    data: { label: 'Zapier Signed' },
  });

  const payload = {
    vin,
    title: 'Webhook Oil Change',
    description: 'Created by Zapier',
    frequency: 'Webhook trigger',
    interval: 1,
  };

  try {
    const missingSigReq = {
      method: 'POST',
      headers: {
        ...baseHeaders(),
        'x-api-key': created.rawKey,
      },
      body: payload,
      ip: '198.51.100.30',
    };
    const missingSigRes = makeResponse();
    await zapierMaintenanceWebhook(missingSigReq, missingSigRes);
    assert.equal(missingSigRes.state.statusCode, 401);
    assert.equal(missingSigRes.state.body.error, 'Invalid webhook signature');

    const signedReq = {
      method: 'POST',
      headers: {
        ...baseHeaders(),
        'x-api-key': created.rawKey,
        'x-vv-signature': buildWebhookSignature(payload, 'test-zapier-secret'),
      },
      body: payload,
      ip: '198.51.100.31',
    };
    const signedRes = makeResponse();
    await zapierMaintenanceWebhook(signedReq, signedRes);

    assert.equal(signedRes.state.statusCode, 200);
    assert.equal(signedRes.state.body.success, true);
    assert.equal(signedRes.state.body.uid, uid);
    assert.equal(signedRes.state.body.vin, vin);

    const reminderSnap = await admin
      .firestore()
      .doc(
        `users/${uid}/vehicles/${vin}/reminders/${signedRes.state.body.reminderId}`
      )
      .get();
    assert.equal(reminderSnap.exists, true);
    assert.equal(reminderSnap.data().source, 'zapier_webhook');
  } finally {
    if (typeof previousSecret === 'undefined') {
      delete process.env.ZAPIER_WEBHOOK_SECRET;
    } else {
      process.env.ZAPIER_WEBHOOK_SECRET = previousSecret;
    }
  }
});

test('stripeSubscriptionWebhook reconciles subscription for signed checkout event', async () => {
  const uid = `stripe-webhook-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'stripe-webhook-test-secret';

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  const eventPayload = {
    id: `evt_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_${Date.now()}`,
        customer: `cus_${Date.now()}`,
        subscription: `sub_${Date.now()}`,
        metadata: {
          uid,
          targetTier: 'pro',
          billingPeriod: 'monthly',
        },
      },
    },
  };

  const signedReq = {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      'stripe-signature': buildStripeSignature(
        eventPayload,
        'stripe-webhook-test-secret'
      ),
    },
    body: eventPayload,
    rawBody: Buffer.from(JSON.stringify(eventPayload)),
    ip: '198.51.100.32',
  };
  const signedRes = makeResponse();

  try {
    await stripeSubscriptionWebhook(signedReq, signedRes);
    assert.equal(signedRes.state.statusCode, 200);
    assert.equal(signedRes.state.body.success, true);
    assert.equal(signedRes.state.body.uid, uid);

    const admin = require('firebase-admin');
    const subscriptionSnap = await admin
      .firestore()
      .doc(`users/${uid}/subscription/current`)
      .get();
    assert.equal(subscriptionSnap.exists, true);
    assert.equal(subscriptionSnap.data().tier, 'pro');
    assert.equal(subscriptionSnap.data().status, 'active');
    assert.equal(subscriptionSnap.data().paymentMethod, 'stripe');
  } finally {
    if (typeof previousSecret === 'undefined') {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    }
  }
});

test('stripeSubscriptionWebhook marks subscription past_due on invoice.payment_failed', async () => {
  const uid = `stripe-failed-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'stripe-webhook-test-secret';

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  const eventPayload = {
    id: `evt_fail_${Date.now()}`,
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: `in_${Date.now()}`,
        customer: `cus_fail_${Date.now()}`,
        subscription: `sub_fail_${Date.now()}`,
        metadata: {
          uid,
        },
      },
    },
  };

  const req = {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      'stripe-signature': buildStripeSignature(
        eventPayload,
        'stripe-webhook-test-secret'
      ),
    },
    body: eventPayload,
    rawBody: Buffer.from(JSON.stringify(eventPayload)),
    ip: '198.51.100.33',
  };
  const res = makeResponse();

  try {
    await stripeSubscriptionWebhook(req, res);
    assert.equal(res.state.statusCode, 200);
    assert.equal(res.state.body.success, true);

    const admin = require('firebase-admin');
    const subscriptionSnap = await admin
      .firestore()
      .doc(`users/${uid}/subscription/current`)
      .get();
    assert.equal(subscriptionSnap.exists, true);
    assert.equal(subscriptionSnap.data().status, 'past_due');
    assert.equal(
      subscriptionSnap.data().lastPaymentError,
      'stripe_invoice_payment_failed'
    );
  } finally {
    if (typeof previousSecret === 'undefined') {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    }
  }
});

test('stripeSubscriptionWebhook downgrades and revokes premium on customer.subscription.deleted', async () => {
  const uid = `stripe-cancel-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'stripe-webhook-test-secret';

  await enablePremiumApiFeatures(uid, email);

  const eventPayload = {
    id: `evt_cancel_${Date.now()}`,
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: `sub_cancel_${Date.now()}`,
        customer: `cus_cancel_${Date.now()}`,
        current_period_end: Math.floor(Date.now() / 1000) + 3600,
        metadata: {
          uid,
        },
      },
    },
  };

  const req = {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      'stripe-signature': buildStripeSignature(
        eventPayload,
        'stripe-webhook-test-secret'
      ),
    },
    body: eventPayload,
    rawBody: Buffer.from(JSON.stringify(eventPayload)),
    ip: '198.51.100.34',
  };
  const res = makeResponse();

  try {
    await stripeSubscriptionWebhook(req, res);
    assert.equal(res.state.statusCode, 200);
    assert.equal(res.state.body.success, true);

    const admin = require('firebase-admin');
    const [subscriptionSnap, premiumSnap] = await Promise.all([
      admin.firestore().doc(`users/${uid}/subscription/current`).get(),
      admin.firestore().doc(`users/${uid}/entitlements/premium`).get(),
    ]);

    assert.equal(subscriptionSnap.exists, true);
    assert.equal(subscriptionSnap.data().tier, 'free');
    assert.equal(subscriptionSnap.data().status, 'canceled');
    assert.equal(subscriptionSnap.data().autoRenew, false);

    assert.equal(premiumSnap.exists, true);
    assert.equal(premiumSnap.data().active, false);
    assert.equal(
      premiumSnap.data().verificationState,
      'revoked_by_webhook_cancellation'
    );
  } finally {
    if (typeof previousSecret === 'undefined') {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    }
  }
});

test('stripeSubscriptionWebhook preserves trialing status from customer.subscription.updated', async () => {
  const uid = `stripe-trialing-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'stripe-webhook-test-secret';

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  const eventPayload = {
    id: `evt_trial_${Date.now()}`,
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: `sub_trial_${Date.now()}`,
        customer: `cus_trial_${Date.now()}`,
        status: 'trialing',
        metadata: {
          uid,
          targetTier: 'premium',
          billingPeriod: 'monthly',
        },
      },
    },
  };

  const req = {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      'stripe-signature': buildStripeSignature(
        eventPayload,
        'stripe-webhook-test-secret'
      ),
    },
    body: eventPayload,
    rawBody: Buffer.from(JSON.stringify(eventPayload)),
    ip: '198.51.100.35',
  };
  const res = makeResponse();

  try {
    await stripeSubscriptionWebhook(req, res);
    assert.equal(res.state.statusCode, 200);
    assert.equal(res.state.body.success, true);
    assert.equal(res.state.body.status, 'trialing');

    const admin = require('firebase-admin');
    const subscriptionSnap = await admin
      .firestore()
      .doc(`users/${uid}/subscription/current`)
      .get();

    assert.equal(subscriptionSnap.exists, true);
    assert.equal(subscriptionSnap.data().tier, 'premium');
    assert.equal(subscriptionSnap.data().status, 'trialing');
  } finally {
    if (typeof previousSecret === 'undefined') {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    }
  }
});

test('stripeSubscriptionWebhook marks subscription past_due on charge.dispute.created', async () => {
  const uid = `stripe-dispute-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'stripe-webhook-test-secret';

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  const eventPayload = {
    id: `evt_dispute_${Date.now()}`,
    type: 'charge.dispute.created',
    data: {
      object: {
        id: `dp_${Date.now()}`,
        customer: `cus_dispute_${Date.now()}`,
        subscription: `sub_dispute_${Date.now()}`,
        metadata: {
          uid,
        },
      },
    },
  };

  const req = {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      'stripe-signature': buildStripeSignature(
        eventPayload,
        'stripe-webhook-test-secret'
      ),
    },
    body: eventPayload,
    rawBody: Buffer.from(JSON.stringify(eventPayload)),
    ip: '198.51.100.36',
  };
  const res = makeResponse();

  try {
    await stripeSubscriptionWebhook(req, res);
    assert.equal(res.state.statusCode, 200);
    assert.equal(res.state.body.success, true);
    assert.equal(res.state.body.status, 'past_due');

    const admin = require('firebase-admin');
    const subscriptionSnap = await admin
      .firestore()
      .doc(`users/${uid}/subscription/current`)
      .get();

    assert.equal(subscriptionSnap.exists, true);
    assert.equal(subscriptionSnap.data().status, 'past_due');
    assert.equal(
      subscriptionSnap.data().lastPaymentError,
      'stripe_charge_dispute'
    );
  } finally {
    if (typeof previousSecret === 'undefined') {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    }
  }
});

test('stripeSubscriptionWebhook marks subscription past_due on charge.refunded', async () => {
  const uid = `stripe-refund-${Date.now()}`;
  const email = `${uid}@example.com`;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'stripe-webhook-test-secret';

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email } },
  });

  const eventPayload = {
    id: `evt_refund_${Date.now()}`,
    type: 'charge.refunded',
    data: {
      object: {
        id: `ch_${Date.now()}`,
        customer: `cus_refund_${Date.now()}`,
        subscription: `sub_refund_${Date.now()}`,
        metadata: {
          uid,
        },
      },
    },
  };

  const req = {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      'stripe-signature': buildStripeSignature(
        eventPayload,
        'stripe-webhook-test-secret'
      ),
    },
    body: eventPayload,
    rawBody: Buffer.from(JSON.stringify(eventPayload)),
    ip: '198.51.100.37',
  };
  const res = makeResponse();

  try {
    await stripeSubscriptionWebhook(req, res);
    assert.equal(res.state.statusCode, 200);
    assert.equal(res.state.body.success, true);
    assert.equal(res.state.body.status, 'past_due');

    const admin = require('firebase-admin');
    const subscriptionSnap = await admin
      .firestore()
      .doc(`users/${uid}/subscription/current`)
      .get();

    assert.equal(subscriptionSnap.exists, true);
    assert.equal(subscriptionSnap.data().status, 'past_due');
    assert.equal(
      subscriptionSnap.data().lastPaymentError,
      'stripe_charge_refunded'
    );
  } finally {
    if (typeof previousSecret === 'undefined') {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    }
  }
});

test('bootstrapEnterpriseContextCallable rejects without auth context', async () => {
  await assert.rejects(
    () => bootstrapEnterpriseContextCallable.run({}),
    error => {
      assert.equal(error.code, 'unauthenticated');
      return true;
    }
  );
});

test('bootstrapEnterpriseContextCallable returns org and entitlements for authenticated user', async () => {
  const uid = `enterprise-bootstrap-${Date.now()}`;
  const result = await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email: `${uid}@example.com` } },
  });

  assert.equal(result.success, true);
  assert.equal(result.orgId, `personal_${uid}`);
  assert.equal(result.entitlements.orgId, `personal_${uid}`);
  assert.equal(result.entitlements.tier, 'free');
  assert.equal(result.entitlements.vehicleLimit, 2);
});

test('getEffectiveEntitlementsCallable returns premium tier when premium entitlement is active', async () => {
  process.env.PREMIUM_VERIFICATION_REQUIRED = 'false';
  const uid = `enterprise-entitlement-${Date.now()}`;

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email: `${uid}@example.com` } },
  });

  await verifyPremiumPurchase.run({
    auth: { uid },
    data: {
      productId: 'premium_ad_free',
      purchaseId: `purchase-${uid}`,
      verificationData: `receipt-${uid}`,
      source: 'unknown_store',
    },
  });

  const entitlements = await getEffectiveEntitlementsCallable.run({
    auth: { uid, token: { email: `${uid}@example.com` } },
  });

  assert.equal(entitlements.success, true);
  assert.equal(entitlements.entitlements.tier, 'premium');
  assert.equal(entitlements.entitlements.vehicleLimit, 25);
  assert.equal(entitlements.entitlements.features.ad_free, true);
});

const runFirestoreIntegration =
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.ALLOW_LIVE_FIRESTORE_TESTS === 'true';

(runFirestoreIntegration ? test : test.skip)(
  'getEffectiveEntitlementsCallable elevates to enterprise for org enterprise tier',
  async () => {
    const uid = `enterprise-org-tier-${Date.now()}`;
    const context = await bootstrapEnterpriseContextCallable.run({
      auth: { uid, token: { email: `${uid}@example.com` } },
    });

    const admin = require('firebase-admin');
    await admin.firestore().doc(`orgs/${context.orgId}`).set(
      {
        planTier: 'enterprise',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const entitlements = await getEffectiveEntitlementsCallable.run({
      auth: { uid, token: { email: `${uid}@example.com` } },
      data: { orgId: context.orgId },
    });

    assert.equal(entitlements.success, true);
    assert.equal(entitlements.entitlements.tier, 'enterprise');
    assert.equal(entitlements.entitlements.vehicleLimit, 999999);
    assert.equal(entitlements.entitlements.features.ad_free, true);
    assert.equal(entitlements.entitlements.features.api_access, true);
  }
);

test('organization membership and role management callables work for org owner', async () => {
  const ownerUid = `org-owner-${Date.now()}`;
  const targetUid = `${ownerUid}-member`;

  const ownerContext = await bootstrapEnterpriseContextCallable.run({
    auth: { uid: ownerUid, token: { email: `${ownerUid}@example.com` } },
  });

  const orgId = ownerContext.orgId;

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid: targetUid, token: { email: `${targetUid}@example.com` } },
  });

  const admin = require('firebase-admin');
  await admin
    .firestore()
    .doc(`orgs/${orgId}/members/${targetUid}`)
    .set(
      {
        uid: targetUid,
        email: `${targetUid}@example.com`,
        role: 'read_only',
        status: 'active',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  await admin.firestore().doc(`users/${targetUid}/orgMemberships/${orgId}`).set(
    {
      orgId,
      role: 'read_only',
      status: 'active',
    },
    { merge: true }
  );

  const membersBefore = await getOrganizationMembersCallable.run({
    auth: { uid: ownerUid },
    data: { orgId },
  });
  assert.equal(membersBefore.success, true);
  assert.equal(
    membersBefore.members.some(member => member.uid === targetUid),
    true
  );

  const roleUpdate = await setOrganizationMemberRoleCallable.run({
    auth: { uid: ownerUid },
    data: {
      orgId,
      targetUid,
      role: 'org_admin',
      idempotencyKey: `role-update-${Date.now()}`,
    },
  });

  assert.equal(roleUpdate.success, true);
  assert.equal(roleUpdate.role, 'org_admin');
});

const runFinanceCallableTests =
  typeof createInvoiceDraftCallable?.run === 'function' &&
  typeof createPayableDraftCallable?.run === 'function';

const runFinanceFirestoreIntegration =
  runFinanceCallableTests && runFirestoreIntegration;

(runFinanceCallableTests ? test : test.skip)(
  'createInvoiceDraftCallable rejects without auth context',
  async () => {
    await assert.rejects(
      () =>
        createInvoiceDraftCallable.run({
          data: {
            orgId: 'org_test',
            customerName: 'Fleet Ops',
            dueDate: '2026-07-01',
          },
        }),
      error => {
        assert.equal(error.code, 'unauthenticated');
        return true;
      }
    );
  }
);

(runFinanceCallableTests ? test : test.skip)(
  'createPayableDraftCallable rejects invalid payload without required fields',
  async () => {
    await assert.rejects(
      () =>
        createPayableDraftCallable.run({
          auth: { uid: `finance-test-${Date.now()}` },
          data: {
            orgId: '',
            vendorName: '',
            dueDate: '',
          },
        }),
      error => {
        assert.equal(error.code, 'invalid-argument');
        return true;
      }
    );
  }
);

(runFinanceFirestoreIntegration ? test : test.skip)(
  'createInvoiceDraftCallable creates draft invoice and audit event',
  async () => {
    const uid = `finance-invoice-${Date.now()}`;
    const context = await bootstrapEnterpriseContextCallable.run({
      auth: { uid, token: { email: `${uid}@example.com` } },
    });
    const admin = require('firebase-admin');

    const result = await createInvoiceDraftCallable.run({
      auth: { uid },
      data: {
        orgId: context.orgId,
        customerName: 'Acme Fleet Services',
        dueDate: '2026-08-01',
        issueDate: '2026-07-15',
        currency: 'usd',
        notes: 'Quarterly maintenance services',
        lineItems: [
          { description: 'Service labor', quantity: 2, unitPrice: 100 },
          { description: 'Parts', quantity: 1, unitPrice: 49.99 },
        ],
        idempotencyKey: `invoice-${Date.now()}`,
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.orgId, context.orgId);
    assert.equal(result.status, 'draft');
    assert.ok(result.invoiceId);

    const invoiceSnap = await admin
      .firestore()
      .doc(`orgs/${context.orgId}/financeInvoices/${result.invoiceId}`)
      .get();

    assert.equal(invoiceSnap.exists, true);
    const invoice = invoiceSnap.data();
    assert.equal(invoice.customerName, 'Acme Fleet Services');
    assert.equal(invoice.currency, 'USD');
    assert.equal(invoice.status, 'draft');
    assert.equal(invoice.createdByUid, uid);
    assert.equal(invoice.amountDue, 249.99);
    assert.equal(Array.isArray(invoice.lineItems), true);
    assert.equal(invoice.lineItems.length, 2);

    const auditSnap = await admin
      .firestore()
      .collection(`orgs/${context.orgId}/audit`)
      .where('action', '==', 'finance.create_invoice_draft')
      .where('targetId', '==', result.invoiceId)
      .get();

    assert.equal(auditSnap.empty, false);
    const auditEntry = auditSnap.docs[0].data();
    assert.equal(auditEntry.targetType, 'invoice');
    assert.equal(auditEntry.actorUid, uid);
    assert.equal(auditEntry.details.customerName, 'Acme Fleet Services');
  }
);

(runFinanceFirestoreIntegration ? test : test.skip)(
  'createPayableDraftCallable creates draft payable and audit event',
  async () => {
    const uid = `finance-payable-${Date.now()}`;
    const context = await bootstrapEnterpriseContextCallable.run({
      auth: { uid, token: { email: `${uid}@example.com` } },
    });
    const admin = require('firebase-admin');

    const result = await createPayableDraftCallable.run({
      auth: { uid },
      data: {
        orgId: context.orgId,
        vendorName: 'Northwind Repair Co',
        dueDate: '2026-08-10',
        billDate: '2026-07-20',
        currency: 'usd',
        category: 'operations',
        notes: 'Shop tooling invoice',
        amountDue: 120.456,
        idempotencyKey: `payable-${Date.now()}`,
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.orgId, context.orgId);
    assert.equal(result.status, 'draft');
    assert.ok(result.payableId);

    const payableSnap = await admin
      .firestore()
      .doc(`orgs/${context.orgId}/financePayables/${result.payableId}`)
      .get();

    assert.equal(payableSnap.exists, true);
    const payable = payableSnap.data();
    assert.equal(payable.vendorName, 'Northwind Repair Co');
    assert.equal(payable.currency, 'USD');
    assert.equal(payable.status, 'draft');
    assert.equal(payable.createdByUid, uid);
    assert.equal(payable.category, 'operations');
    assert.equal(payable.amountDue, 120.46);

    const auditSnap = await admin
      .firestore()
      .collection(`orgs/${context.orgId}/audit`)
      .where('action', '==', 'finance.create_payable_draft')
      .where('targetId', '==', result.payableId)
      .get();

    assert.equal(auditSnap.empty, false);
    const auditEntry = auditSnap.docs[0].data();
    assert.equal(auditEntry.targetType, 'payable');
    assert.equal(auditEntry.actorUid, uid);
    assert.equal(auditEntry.details.vendorName, 'Northwind Repair Co');
  }
);

test('transferVehicleCallable moves vehicle document and related subcollections', async () => {
  const senderUid = `transfer-sender-${Date.now()}`;
  const recipientUid = `transfer-recipient-${Date.now()}`;
  const senderEmail = `${senderUid}@example.com`;
  const recipientEmail = `${recipientUid}@example.com`;
  const vin = `TRANSFER-${Date.now()}`;
  const admin = require('firebase-admin');

  await admin.auth().createUser({
    uid: senderUid,
    email: senderEmail,
  });
  await admin.auth().createUser({
    uid: recipientUid,
    email: recipientEmail,
  });

  await bootstrapEnterpriseContextCallable.run({
    auth: { uid: senderUid, token: { email: senderEmail } },
  });
  await bootstrapEnterpriseContextCallable.run({
    auth: { uid: recipientUid, token: { email: recipientEmail } },
  });

  const sourceVehicleRef = admin
    .firestore()
    .doc(`users/${senderUid}/vehicles/${vin}`);
  await sourceVehicleRef.set({
    vin,
    make: 'Ford',
    model: 'Bronco',
    year: 2022,
    mileage: 12000,
    vehicleStatus: 'stored',
  });
  await sourceVehicleRef.collection('maintenance').doc('entry-1').set({
    title: 'Battery tender',
    date: '2025-05-01',
  });
  await sourceVehicleRef.collection('reminders').doc('reminder-1').set({
    title: 'Start engine monthly',
    status: 'active',
  });

  const result = await transferVehicleCallable.run({
    auth: { uid: senderUid, token: { email: senderEmail } },
    data: {
      vin,
      recipientEmail,
      idempotencyKey: `transfer-${Date.now()}`,
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.recipientUid, recipientUid);
  assert.equal(result.recipientEmail, recipientEmail);

  const [sourceVehicleSnap, targetVehicleSnap, targetMaintenanceSnap] =
    await Promise.all([
      admin.firestore().doc(`users/${senderUid}/vehicles/${vin}`).get(),
      admin.firestore().doc(`users/${recipientUid}/vehicles/${vin}`).get(),
      admin
        .firestore()
        .collection(`users/${recipientUid}/vehicles/${vin}/maintenance`)
        .get(),
    ]);

  assert.equal(sourceVehicleSnap.exists, false);
  assert.equal(targetVehicleSnap.exists, true);
  assert.equal(targetVehicleSnap.data().vehicleStatus, 'stored');
  assert.equal(targetVehicleSnap.data().transferredFromUid, senderUid);
  assert.equal(targetMaintenanceSnap.size, 1);
});

test('applyRetentionPolicyCallable requires super-admin context', async () => {
  const uid = `retention-${Date.now()}`;
  const context = await bootstrapEnterpriseContextCallable.run({
    auth: { uid, token: { email: `${uid}@example.com` } },
  });

  await assert.rejects(
    () =>
      applyRetentionPolicyCallable.run({
        auth: { uid },
        data: { orgId: context.orgId, retentionDays: 365 },
      }),
    error => {
      assert.equal(error.code, 'permission-denied');
      return true;
    }
  );

  const result = await applyRetentionPolicyCallable.run({
    auth: { uid, token: { superAdmin: true } },
    data: {
      orgId: context.orgId,
      retentionDays: 400,
      idempotencyKey: `retention-${Date.now()}`,
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.retentionDays, 400);
});

test('compliance request callables return requested status', async () => {
  const uid = `compliance-${Date.now()}`;

  const exportRequest = await requestUserDataExportCallable.run({
    auth: { uid },
    data: { idempotencyKey: `export-${Date.now()}` },
  });

  assert.equal(exportRequest.success, true);
  assert.equal(exportRequest.status, 'requested');

  const deletionRequest = await requestUserDataDeletionCallable.run({
    auth: { uid },
    data: { idempotencyKey: `deletion-${Date.now()}` },
  });

  assert.equal(deletionRequest.success, true);
  assert.equal(deletionRequest.status, 'requested');
});

test('submitSupportRequestCallable rejects an invalid email', async () => {
  process.env.EMAIL_PROVIDER = 'log';

  await assert.rejects(
    () =>
      submitSupportRequestCallable.run({
        auth: null,
        data: {
          name: 'Jamie Driver',
          email: 'not-an-email',
          topic: 'Bug Report',
          message: 'The app crashes when I add a vehicle.',
        },
      }),
    err => {
      assert.equal(err.code, 'invalid-argument');
      return true;
    }
  );
});

test('submitSupportRequestCallable rejects an unknown topic', async () => {
  process.env.EMAIL_PROVIDER = 'log';

  await assert.rejects(
    () =>
      submitSupportRequestCallable.run({
        auth: null,
        data: {
          name: 'Jamie Driver',
          email: 'jamie@example.com',
          topic: 'Not A Real Topic',
          message: 'The app crashes when I add a vehicle.',
        },
      }),
    err => {
      assert.equal(err.code, 'invalid-argument');
      return true;
    }
  );
});

test('submitSupportRequestCallable succeeds for a valid submission', async () => {
  process.env.EMAIL_PROVIDER = 'log';

  const result = await submitSupportRequestCallable.run({
    auth: null,
    rawRequest: { ip: `198.51.100.${Date.now() % 250}` },
    data: {
      name: 'Jamie Driver',
      email: 'jamie@example.com',
      topic: 'Bug Report',
      message: 'The app crashes when I add a vehicle.',
    },
  });

  assert.equal(result.success, true);
});

test('submitSupportRequestCallable rate-limits repeated submissions', async () => {
  process.env.EMAIL_PROVIDER = 'log';
  const ip = `203.0.113.${Date.now() % 250}`;
  const submit = () =>
    submitSupportRequestCallable.run({
      auth: null,
      rawRequest: { ip },
      data: {
        name: 'Jamie Driver',
        email: 'jamie@example.com',
        topic: 'Bug Report',
        message: 'The app crashes when I add a vehicle.',
      },
    });

  for (let i = 0; i < 5; i += 1) {
    await submit();
  }

  await assert.rejects(submit, err => {
    assert.equal(err.code, 'resource-exhausted');
    return true;
  });
});

test.after(() => {
  global.fetch = originalFetch;
});
