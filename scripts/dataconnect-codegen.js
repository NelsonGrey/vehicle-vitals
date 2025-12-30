#!/usr/bin/env node
/*
 Wrapper to run Firebase Data Connect code generation pointed at dataconnect/dataconnect.yaml.
 Requires Firebase CLI with Data Connect plugin/support. This script does not install the CLI.

 Usage:
   npm run dataconnect:codegen
*/

const { spawn } = require('node:child_process');
const path = require('node:path');

const configPath = path.resolve(__dirname, '..', 'dataconnect', 'dataconnect.yaml');

console.log(`[DataConnect] Generating clients from ${configPath}\n`);

// Prefer a local firebase binary if available via npm-run PATH.
// Try these in order:
// 1) firebase data-connect:codegen
// 2) firebase dataconnect:codegen (older CLI spelling)
// 3) $FIREBASE_TOOLS_CMD data-connect:codegen (if env override provided)
// 4) $FIREBASE_TOOLS_CMD dataconnect:codegen
// 5) npx -y firebase-tools@${FIREBASE_TOOLS_VERSION|latest} data-connect:codegen (no install needed)
// 6) npx -y firebase-tools@${FIREBASE_TOOLS_VERSION|latest} dataconnect:codegen

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
    child.on('error', reject);
  });
}

(async () => {
  let done = false;
  const overrideCmd = process.env.FIREBASE_TOOLS_CMD;
  const pinnedVersion = process.env.FIREBASE_TOOLS_VERSION || 'latest';
  try {
    await run('firebase', ['data-connect:codegen', '--config', configPath]);
    done = true;
  } catch (e1) {
    console.warn('[DataConnect] Falling back to alternate command form...', e1.message);
  }

  if (!done) {
    try {
      await run('firebase', ['dataconnect:codegen', '--config', configPath]);
      done = true;
    } catch (_) {
      // continue
    }
  }

  if (!done) {
    if (overrideCmd) {
      try {
        await run(overrideCmd, ['data-connect:codegen', '--config', configPath]);
        done = true;
      } catch (_) {}
    }
  }

  if (!done) {
    if (overrideCmd) {
      try {
        await run(overrideCmd, ['dataconnect:codegen', '--config', configPath]);
        done = true;
      } catch (_) {}
    }
  }

  if (!done) {
    try {
      await run('npx', ['-y', `firebase-tools@${pinnedVersion}`, 'data-connect:codegen', '--config', configPath]);
      done = true;
    } catch (_) {}
  }

  if (!done) {
    await run('npx', ['-y', `firebase-tools@${pinnedVersion}`, 'dataconnect:codegen', '--config', configPath]);
  }
  console.log('\n[DataConnect] Codegen complete. Verify outputs in:');
  console.log(' - src/dataconnect-generated');
  console.log(' - web/src/dataconnect-generated');
  console.log(' - mobile/src/dataconnect-generated');
})().catch((err) => {
  console.error('\n[DataConnect] Codegen failed:', err.message);
  console.error('\nTroubleshooting:');
  console.error('- Your firebase-tools version may not include Data Connect codegen yet.');
  console.error('- Try the IDE workflow (Firebase VS Code extension) and point it at dataconnect/dataconnect.yaml.');
  console.error('- You can also keep using the vendored clients already in this repo:');
  console.error('   • src/dataconnect-generated');
  console.error('   • web/src/dataconnect-generated');
  console.error('   • mobile/src/dataconnect-generated');
  console.error('\nIf you want to use the CLI, ensure firebase-tools is recent and you are logged in:');
  console.error('  npx -y firebase-tools@latest --version');
  console.error('  npx -y firebase-tools@latest login');
  process.exit(1);
});
