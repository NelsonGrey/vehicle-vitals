const test = require('node:test');
const assert = require('node:assert/strict');

const {
  enforceRateLimit,
  requireAuthenticatedUser,
} = require('../lib/request.guards.js');

function makeResponse() {
  const state = {
    statusCode: 200,
    body: null,
  };

  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(payload) {
      state.body = payload;
      return this;
    },
  };
}

test('enforceRateLimit allows first request in window', { concurrency: false }, () => {
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'true';
  process.env.INTEGRATION_RATE_LIMIT_MAX = '1';
  process.env.INTEGRATION_RATE_LIMIT_WINDOW_MS = '60000';

  const req = {
    headers: { 'x-forwarded-for': '203.0.113.2' },
    ip: '203.0.113.2',
  };
  const res = makeResponse();

  const allowed = enforceRateLimit(req, res, 'testEndpointAllow');
  assert.equal(allowed, true);
  assert.equal(res.state.statusCode, 200);
  assert.equal(res.state.body, null);
});

test('enforceRateLimit blocks request over limit', { concurrency: false }, () => {
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'true';
  process.env.INTEGRATION_RATE_LIMIT_MAX = '1';
  process.env.INTEGRATION_RATE_LIMIT_WINDOW_MS = '60000';

  const req = {
    headers: { 'x-forwarded-for': '203.0.113.3' },
    ip: '203.0.113.3',
  };

  const firstRes = makeResponse();
  const secondRes = makeResponse();

  const firstAllowed = enforceRateLimit(req, firstRes, 'testEndpointBlock');
  const secondAllowed = enforceRateLimit(req, secondRes, 'testEndpointBlock');

  assert.equal(firstAllowed, true);
  assert.equal(secondAllowed, false);
  assert.equal(secondRes.state.statusCode, 429);
  assert.equal(secondRes.state.body.success, false);
  assert.equal(secondRes.state.body.error, 'Rate limit exceeded');
});

test('enforceRateLimit ignores spoofed x-forwarded-for headers from public clients', { concurrency: false }, () => {
  process.env.INTEGRATION_RATE_LIMIT_ENABLED = 'true';
  process.env.INTEGRATION_RATE_LIMIT_MAX = '1';
  process.env.INTEGRATION_RATE_LIMIT_WINDOW_MS = '60000';

  const firstReq = {
    headers: { 'x-forwarded-for': '198.51.100.10' },
    ip: '203.0.113.44',
  };
  const secondReq = {
    headers: { 'x-forwarded-for': '198.51.100.11' },
    ip: '203.0.113.44',
  };

  const firstRes = makeResponse();
  const secondRes = makeResponse();

  assert.equal(enforceRateLimit(firstReq, firstRes, 'testEndpointSpoof'), true);
  assert.equal(
    enforceRateLimit(secondReq, secondRes, 'testEndpointSpoof'),
    false
  );
  assert.equal(secondRes.state.statusCode, 429);
});

test('requireAuthenticatedUser returns synthetic uid when auth disabled', { concurrency: false }, async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'false';
  const req = {
    headers: {},
  };
  const res = makeResponse();

  const uid = await requireAuthenticatedUser(req, res);

  assert.equal(uid, 'auth-not-required');
  assert.equal(res.state.statusCode, 200);
});

test('requireAuthenticatedUser rejects missing bearer token', { concurrency: false }, async () => {
  process.env.INTEGRATION_AUTH_REQUIRED = 'true';
  const req = {
    headers: {},
  };
  const res = makeResponse();

  const uid = await requireAuthenticatedUser(req, res);

  assert.equal(uid, null);
  assert.equal(res.state.statusCode, 401);
  assert.equal(res.state.body.success, false);
  assert.equal(res.state.body.error, 'Missing Bearer token');
});
