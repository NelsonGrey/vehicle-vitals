const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getOwnerManuals,
  getWarrantySummary,
  getMaintenancePlan,
  createCalendarEvent,
  createCalendarEventCallable,
  getPremiumEntitlement,
  verifyPremiumPurchase,
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
    const urlValue = String(url);
    if (urlValue.includes('androidpublisher.googleapis.com')) {
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
    const urlValue = String(url);
    if (urlValue.includes('androidpublisher.googleapis.com')) {
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
    const urlValue = String(url);
    if (urlValue.includes('androidpublisher.googleapis.com')) {
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

test.after(() => {
  global.fetch = originalFetch;
});
