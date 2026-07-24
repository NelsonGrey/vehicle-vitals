# Security Best Practices Report

Review completed: July 16, 2026
Documentation reconciled: July 20, 2026
Status: Findings fixed in the reviewed change set; this is a point-in-time
remediation record, not a continuous assurance report.

## Executive Summary

I reviewed the repo's web runtime, Firebase rules, request guards, and
secret-management helpers. The highest-signal issues were weak validation on
anonymous Firestore writes, overly permissive writes in Firebase Storage,
spoofable client-IP handling in backend rate limiting, untrusted push payload
navigation, and a repo script that encoded environment-access defaults instead
of requiring explicit operator input. The original embedded-default issue was
fixed; the July 20 documentation reconciliation additionally classifies the
remaining setup script as stale because its allowlist and workflow assumptions
do not match the current client/pipeline.

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
- Fix: The script no longer embeds default access passwords and now requires
  explicit environment variables for values it writes.
- Current caveat: The client has no allowlist-based environment gate, and the
  script still names obsolete/unused secrets and an old workflow. Do not use it
  until it is reconciled with `PROD_SETUP_GUIDE.md`.
- Status: Embedded-default issue fixed; helper remains legacy/configuration debt

## Validation

- Companion backend: `node --test test/request.guards.test.js`
- `node --check scripts/apphosting-server.js`
- `node --check monitoring/server.js`

## Notes

- Functions source moved to the private
  `NelsonGrey/vehicle-vitals-functions` repository after this review. The
  original `packages/functions/...` locations now refer to that companion when
  it is mounted locally or in CI.
- The public repository had zero open Dependabot, CodeQL, and secret-scanning
  alerts when rechecked July 20, 2026. New changes still require fresh review
  and testing.
