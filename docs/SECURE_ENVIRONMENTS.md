# Environment Access and Exposure

Last reviewed: July 20, 2026

This document describes the access controls that are implemented now. It does
not prescribe a future site-wide gate.

## Current Behavior

| Surface | Current control |
| --- | --- |
| Marketing pages | Public in development, staging, and production |
| `/auth/*` | Public sign-in, sign-up, and password-reset routes unless marketing-only mode is enabled |
| `/app/*` | Requires a non-anonymous Firebase Authentication user |
| `/app/admin/*` | Requires the application's super-admin authorization check |
| Development seed tools | Registered only when the resolved environment is `development` |
| Development and staging indexing | Blocked with `X-Robots-Tag: noindex, nofollow` in the Firebase Hosting configuration |

There is no `EnvironmentGate` component and no site-wide password or email
allowlist gate in the current web application. Development and staging URLs
should therefore be treated as publicly reachable hosts whose protected data
depends on Firebase Authentication, Firestore rules, Storage rules, callable
authorization, and App Check.

## Environment Modes

The web client resolves its environment from `VITE_ENVIRONMENT`, Firebase
project ID, hostname, and finally the Vite mode. The implementation is
`packages/web/src/shared/environment.ts`.

- `VITE_SHOW_COMING_SOON=true` replaces the application with the Coming Soon
  page.
- `VITE_MARKETING_ONLY_MODE=true` redirects `/app/*`, `/auth/*`, and legacy app
  routes to `/`.
- Firebase Remote Config `app_offline=true` disables app-entry links and shows
  the current-unavailable state. It is an operational kill switch, not an
  authorization boundary.
- `VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS` controls hosted demo PDF uploads.
- `VITE_ENABLE_ADS` controls ad rendering; its default is enabled only for the
  production environment aligned to the production Firebase project.

## Known CI Configuration Debt

`.github/workflows/master-pipeline.yml` still requires either a legacy
`VITE_ACCESS_PASSWORD_*` value or a `VITE_ALLOWED_EMAIL_*` value for development
and staging builds, and writes the selected value into the generated web env
file. The current client does not read either family of variables. Satisfying
that build check does not create an access gate.

Do not describe those secrets as active security controls. A future gate must
be implemented and tested in the client (or at an authenticated edge/proxy)
before the workflow check and the retired OAuth documents are reactivated.

## Verification

For each environment:

1. Confirm the Firebase project ID and `VITE_ENVIRONMENT` align.
2. Confirm unauthenticated access to `/app` redirects to the authentication
   flow when marketing-only mode is false.
3. Confirm authenticated users cannot read another user's Firestore or Storage
   data.
4. Confirm development and staging responses contain
   `X-Robots-Tag: noindex, nofollow`.
5. Confirm production does not expose development seed routes.
6. If `app_offline` is enabled, verify every public app-entry CTA is disabled.

Use `TESTING_INSTRUCTIONS.md` for the current automated test commands and
`SECURITY_IMPLEMENTATION.md` for the wider security model.
