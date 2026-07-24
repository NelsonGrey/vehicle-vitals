# OAuth Environment-Gate Migration Record

> **Historical record — migration not present in current code.** The original
> May 10, 2026 document reported a completed password-to-OAuth migration. A
> repository audit on July 20, 2026 found no `EnvironmentGate` component and no
> client use of the documented email allowlist variables.

## Reconciled Status

- The password-based site gate is not present.
- The proposed OAuth-based site gate is not present.
- Standard Firebase Authentication still protects application routes.
- The workflow contains legacy password and OAuth allowlist configuration that
  the current client does not enforce.
- Development and staging are public hosts with search-engine indexing blocked
  by Firebase Hosting headers.

This document is preserved so the prior migration claim is not mistaken for
current evidence. Operational guidance is now in `SECURE_ENVIRONMENTS.md`.

If a site-wide non-production gate is needed, treat it as new security work:
define the authorization boundary, implement server-enforced checks, test
direct-route and session-revocation behavior, update the workflow, and only
then publish a new migration guide.
