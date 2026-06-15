const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const repoRoot = join(__dirname, '..', '..');

test('promotion readiness scripts default production branch to main', () => {
  const reportScript = readFileSync(
    join(repoRoot, 'scripts', 'staging-production-readiness-report.sh'),
    'utf8'
  );
  const prScript = readFileSync(
    join(repoRoot, 'scripts', 'open-staging-to-production-pr.sh'),
    'utf8'
  );

  assert.match(reportScript, /PRODUCTION_BRANCH="\$\{PRODUCTION_BRANCH:-main\}"/);
  assert.match(prScript, /PRODUCTION_BRANCH="\$\{PRODUCTION_BRANCH:-main\}"/);
  assert.doesNotMatch(reportScript, /origin\/production/);
  assert.doesNotMatch(prScript, /origin\/production/);
  assert.doesNotMatch(prScript, /--base production/);
});
