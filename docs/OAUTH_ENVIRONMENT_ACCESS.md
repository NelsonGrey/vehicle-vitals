# OAuth Environment Access Proposal (Retired)

> **Historical proposal — not implemented.** Reviewed July 20, 2026. The
> previously documented `EnvironmentGate` component is not present in the
> current web application, and the client does not consume
> `VITE_ALLOWED_EMAIL_DOMAINS` or `VITE_ALLOWED_EMAILS`.

This file is retained to explain an abandoned approach. It must not be used as
evidence that development or staging has a site-wide OAuth gate.

## What Exists Today

- Firebase Authentication protects signed-in application routes.
- Firestore, Storage, callable authorization, and App Check protect backend
  resources.
- Development and staging receive `noindex, nofollow` hosting headers.
- `VITE_SHOW_COMING_SOON`, `VITE_MARKETING_ONLY_MODE`, and Remote Config
  `app_offline` can reduce or disable application entry, but are not team
  identity allowlists.

The current behavior and verification procedure are documented in
`SECURE_ENVIRONMENTS.md`.

## Residual Workflow Configuration

The active pipeline still accepts environment-specific
`VITE_ALLOWED_EMAIL_DOMAINS_*` and `VITE_ALLOWED_EMAILS_*` secrets and writes
them into the build env file. No current source module evaluates them. This is
configuration debt, not a functioning control.

## Requirements Before Reintroducing This Design

A future OAuth environment gate would need, at minimum:

1. A maintained client or edge gate applied before all non-production routes.
2. Server-enforced authorization for protected data; client email checks alone
   are insufficient.
3. Exact allowlist semantics, session expiration, revocation behavior, and a
   documented break-glass path.
4. Tests for anonymous, authorized, unauthorized, stale-session, and direct URL
   access.
5. Removal of the obsolete password fallback and alignment of workflow secret
   validation with the actual implementation.

Until those requirements are implemented, follow `SECURE_ENVIRONMENTS.md` and
do not advertise non-production hosts as OAuth-gated.
