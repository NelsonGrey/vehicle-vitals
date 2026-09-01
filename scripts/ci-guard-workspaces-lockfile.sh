#!/usr/bin/env bash
# Guard against the recurring "npm ci fails in Deploy Firebase" bug.
#
# packages/functions is a separate private repo, gitignored here and only
# cloned in at CI deploy time. If the root package.json used a bare
# `packages/*` workspaces glob, any `npm install` run without that dir
# present (e.g. Dependabot) would silently strip its deps from
# package-lock.json, and the Deploy Firebase job (which DOES clone it in)
# would then fail `npm ci` with dozens of "Missing X from lock file".
#
# This guard fails the build if:
#   1. package.json workspaces contains a bare "packages/*" glob, or
#   2. package.json workspaces and package-lock.json's root workspaces disagree, or
#   3. either one lists packages/functions as a workspace.
set -euo pipefail

cd "$(dirname "$0")/.."

node - <<'NODE'
const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

const pkgWs = pkg.workspaces || [];
const lockWs = ((lock.packages && lock.packages[''] && lock.packages[''].workspaces) || []);

const fail = (msg) => {
  console.error(`::error::ci-guard-workspaces-lockfile: ${msg}`);
  process.exitCode = 1;
};

if (pkgWs.some((w) => w === 'packages/*' || w === 'packages/**')) {
  fail(
    'package.json "workspaces" uses a bare packages/* glob. Use an explicit list ' +
    'that excludes packages/functions (see the _workspaces_note in package.json).'
  );
}

if (pkgWs.includes('packages/functions') || lockWs.includes('packages/functions')) {
  fail('packages/functions must NOT be listed as an npm workspace (it is a separate private repo).');
}

const a = JSON.stringify([...pkgWs].sort());
const b = JSON.stringify([...lockWs].sort());
if (a !== b) {
  fail(
    `package.json workspaces ${a} != package-lock.json workspaces ${b}. ` +
    'Regenerate the lockfile: npm install --package-lock-only'
  );
}

if (process.exitCode) {
  console.error('ci-guard-workspaces-lockfile: FAILED');
} else {
  console.log('ci-guard-workspaces-lockfile: OK', JSON.stringify(pkgWs));
}
NODE
