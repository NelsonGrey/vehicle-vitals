const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

const scriptPath = join(
  __dirname,
  '..',
  'smoke-r1-mobile-acceptance-capture.sh'
);

function runCapture(extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vv-r1-capture-'));
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
    const acceptancePath = output.match(/Created acceptance evidence: (.+)/)[1];
    const backendPath = output.match(/Created backend traffic evidence: (.+)/)[1];

    return {
      dir,
      output,
      acceptance: readFileSync(acceptancePath, 'utf8'),
      backend: readFileSync(backendPath, 'utf8'),
    };
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

test('R1 mobile capture marks PASS when all required fields are positive', () => {
  const result = runCapture({
    AUTH_RESULT: 'PASS',
    VEHICLE_CRUD_RESULT: 'PASS',
    MAINTENANCE_CRUD_RESULT: 'PASS',
    REMINDER_ACTIONS_RESULT: 'PASS',
    EXPORT_RESULT: 'PASS',
    FIRESTORE_WRITES_OBSERVED: 'YES',
    FUNCTIONS_INVOCATIONS_OBSERVED: 'YES',
    AUTH_EVENTS_OBSERVED: 'YES',
    TESTER: 'Automated Test',
    REVIEWER: 'Backend Test',
  });

  try {
    assert.match(result.output, /Gate 2 capture status: PASS/);
    assert.match(result.acceptance, /- Status: PASS/);
    assert.match(result.backend, /- Status: PASS/);
    assert.match(result.acceptance, /\[PASS\] Auth sign-in or sign-up/);
  } finally {
    rmSync(result.dir, { recursive: true, force: true });
  }
});

test('R1 mobile capture remains BLOCKED when required fields are missing', () => {
  const result = runCapture({
    AUTH_RESULT: 'PASS',
  });

  try {
    assert.match(result.output, /Gate 2 capture status: BLOCKED/);
    assert.match(result.acceptance, /- Status: BLOCKED/);
    assert.match(result.backend, /- Status: BLOCKED/);
    assert.match(result.acceptance, /\[BLOCKED\] Vehicle create\/edit\/list\/delete/);
  } finally {
    rmSync(result.dir, { recursive: true, force: true });
  }
});
