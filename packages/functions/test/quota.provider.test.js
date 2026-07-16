const test = require('node:test');
const assert = require('node:assert/strict');

// Loading index.js (not just quota.provider.js directly) ensures
// admin.initializeApp() has run before any Firestore call, matching the
// pattern integration.endpoints.test.js relies on.
const { analyzeAttachmentTextCallable } = require('../lib/index.js');
const { consumeQuota, resolveQuotaState } = require('../lib/quota.provider.js');

const runFirestoreIntegration =
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.ALLOW_LIVE_FIRESTORE_TESTS === 'true';

(runFirestoreIntegration ? test : test.skip)(
  'consumeQuota allows pro tier up to its monthly limit, then blocks without incrementing further',
  async () => {
    const uid = `quota-pro-${Date.now()}`;

    for (let i = 1; i <= 5; i += 1) {
      const result = await consumeQuota(uid, 'pro', 'aiAnalysis');
      assert.equal(result.allowed, true);
      assert.equal(result.used, i);
      assert.equal(result.limit, 5);
    }

    const sixth = await consumeQuota(uid, 'pro', 'aiAnalysis');
    assert.equal(sixth.allowed, false);
    assert.equal(sixth.used, 5); // unchanged — the blocked attempt did not increment
    assert.equal(sixth.limit, 5);

    const state = await resolveQuotaState(uid, 'pro', 'aiAnalysis');
    assert.equal(state.used, 5);
    assert.equal(state.remaining, 0);
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'consumeQuota never blocks premium tier (effectively unlimited)',
  async () => {
    const uid = `quota-premium-${Date.now()}`;

    for (let i = 0; i < 10; i += 1) {
      const result = await consumeQuota(uid, 'premium', 'aiAnalysis');
      assert.equal(result.allowed, true);
    }
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'consumeQuota always blocks free tier — ai_analysis is not entitled at all',
  async () => {
    const uid = `quota-free-${Date.now()}`;

    const result = await consumeQuota(uid, 'free', 'aiAnalysis');
    assert.equal(result.allowed, false);
    assert.equal(result.limit, 0);
  }
);

(runFirestoreIntegration ? test : test.skip)(
  'analyzeAttachmentTextCallable rejects with resource-exhausted once quota is used up, before ever attempting Gemini',
  async () => {
    const uid = `quota-callable-${Date.now()}`;
    const vin = '1HGCM82633A123456';

    const admin = require('firebase-admin');
    await admin.firestore().doc(`users/${uid}/subscription/current`).set({
      tier: 'pro',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Exhaust the pro-tier monthly limit (5) directly, then confirm the
    // callable itself refuses the 6th request rather than silently
    // degrading or charging Gemini usage past the cap.
    for (let i = 0; i < 5; i += 1) {
      await consumeQuota(uid, 'pro', 'aiAnalysis');
    }

    await assert.rejects(
      () =>
        analyzeAttachmentTextCallable.run({
          auth: { uid, token: { email: `${uid}@example.com` } },
          data: {
            vin,
            storagePath: `users/${uid}/vehicles/${vin}/maintenance/entry1/receipt.pdf`,
            ocrText: '', // force through the Gemini-eligible path, not forceOcrText
          },
        }),
      err => {
        assert.equal(err.code, 'resource-exhausted');
        return true;
      }
    );

    const state = await resolveQuotaState(uid, 'pro', 'aiAnalysis');
    assert.equal(state.used, 5); // the rejected attempt did not consume further quota
  }
);
