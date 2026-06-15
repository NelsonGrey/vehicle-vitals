const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

const scriptPath = join(
  __dirname,
  '..',
  'smoke-monetization-readiness-capture.sh'
);

function runCapture(extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vv-monetization-capture-'));
  const env = {
    ...process.env,
    EVIDENCE_DIR: dir,
    ...extraEnv,
  };

  try {
    const output = execFileSync('bash', [scriptPath], {
      env,
      encoding: 'utf8',
    });
    const evidencePath = output.match(/Created monetization evidence: (.+)/)[1];

    return {
      dir,
      output,
      evidence: readFileSync(evidencePath, 'utf8'),
    };
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

test('monetization capture marks PASS when all required fields are positive', () => {
  const result = runCapture({
    STRIPE_CHECKOUT_RESULT: 'PASS',
    STRIPE_WEBHOOK_RESULT: 'PASS',
    STRIPE_PORTAL_RESULT: 'PASS',
    STRIPE_FAILURE_RESULT: 'PASS',
    STRIPE_REFUND_CANCEL_RESULT: 'PASS',
    ENTITLEMENT_RECONCILIATION_RESULT: 'PASS',
    QUOTA_ENFORCEMENT_RESULT: 'PASS',
    REVENUECAT_OR_IOS_DEFERRAL_RESULT: 'PASS',
    AD_SUPPRESSION_RESULT: 'PASS',
    SUPPORT_VISIBILITY_RESULT: 'PASS',
    STRIPE_MODE: 'live',
    TESTER: 'Automated Test',
    REVIEWER: 'Release Test',
  });

  try {
    assert.match(result.output, /Monetization readiness status: PASS/);
    assert.match(result.evidence, /- Status: PASS/);
    assert.match(
      result.evidence,
      /\[PASS\] Stripe subscription Checkout Session verified/
    );
    assert.match(
      result.evidence,
      /\[PASS\] RevenueCat\/IAP path verified or native paid features explicitly deferred/
    );
  } finally {
    rmSync(result.dir, { recursive: true, force: true });
  }
});

test('monetization capture remains BLOCKED when required fields are missing', () => {
  const result = runCapture({
    STRIPE_CHECKOUT_RESULT: 'PASS',
  });

  try {
    assert.match(result.output, /Monetization readiness status: BLOCKED/);
    assert.match(result.evidence, /- Status: BLOCKED/);
    assert.match(
      result.evidence,
      /\[BLOCKED\] Stripe webhook signature verification and subscription event processing verified/
    );
  } finally {
    rmSync(result.dir, { recursive: true, force: true });
  }
});
