# Security Best Practices Report

## Executive Summary

I reviewed the repo's web runtime, Firebase rules, request guards, and secret-management helpers. The highest-signal issues were weak validation on anonymous Firestore writes, overly permissive writes in Firebase Storage, spoofable client-IP handling in backend rate limiting, untrusted push payload navigation, and a repo script that still encoded environment-access defaults instead of requiring explicit operator input. All of those issues were fixed in this pass.

## High

### SBP-001: Anonymous Firestore write paths accepted extra fields and weakly typed input
- Location: `firebase/firestore.rules:31-56`
- Evidence: `launch_signups` and `user_suggestions` only required key presence before this fix.
- Impact: Anonymous clients could submit unexpected fields or malformed payloads into public write collections.
- Fix: Added exact-key checks, type validation, size limits, and basic email format validation.
- Status: Fixed

### SBP-002: Firebase Storage allowed any authenticated user to write under `/public`
- Location: `firebase/storage.rules:10-14`
- Evidence: `/public/{allPaths=**}` previously allowed `write` for any authenticated user.
- Impact: Any signed-in account could publish arbitrary objects into the public bucket namespace.
- Fix: Disabled client writes to `/public`; only reads remain public.
- Status: Fixed

### SBP-003: Integration rate limiting trusted spoofable `x-forwarded-for`
- Location: `packages/functions/src/request.guards.ts:12-66`
- Evidence: Request IP resolution previously preferred `x-forwarded-for` whenever present.
- Impact: Public callers could rotate spoofed header values and evade fixed-window throttling.
- Fix: Forwarded headers are now honored only when the direct peer address is a trusted local/private proxy.
- Status: Fixed

### SBP-004: Push notification payloads could drive arbitrary in-app navigation targets
- Location: `packages/web/public/firebase-messaging-sw.js:16-80`
- Evidence: Notification click handling previously used `payload.data.path` directly.
- Impact: A malicious or malformed push payload could trigger navigation outside the intended `/app` namespace.
- Fix: Added path sanitization and fallback to a safe `/app/upcoming` route.
- Status: Fixed

## Medium

### SBP-005: App Hosting static server shipped without browser hardening headers
- Location: `scripts/apphosting-server.js:27-123`
- Evidence: Responses previously only set `Content-Type`.
- Impact: Reduced protection against framing, MIME sniffing, and overly broad browser capabilities.
- Fix: Added CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`.
- Status: Fixed

### SBP-006: Monitoring server lacked defensive headers and rejected malformed URLs poorly
- Location: `monitoring/server.js:7-107`
- Evidence: No security headers were set, and URL decoding errors were not handled explicitly.
- Impact: Reduced browser-side hardening and avoidable bad-request edge cases.
- Fix: Added standard hardening headers and explicit `400` handling for invalid URL encodings.
- Status: Fixed

### SBP-007: Secret bootstrap helper encoded insecure defaults and obsolete environment-gate passwords
- Location: `setup-prod-secrets.sh:33-135`
- Evidence: The script previously embedded default staging/development access passwords and wrote canned secret values directly.
- Impact: Operators could accidentally provision weak or stale values into GitHub Actions secrets.
- Fix: The script now requires explicit environment variables for sensitive/runtime values and uses the current allowlist-based environment gate.
- Status: Fixed

## Validation

- `node --test packages/functions/test/request.guards.test.js`
- `node --check scripts/apphosting-server.js`
- `node --check monitoring/server.js`

## Notes

- `npm --workspace=functions run build` currently fails because `packages/functions/tsconfig.json` is not compatible with the installed TypeScript 6 behavior around `rootDir`. That is a pre-existing build configuration issue, not introduced by these hardening changes.
