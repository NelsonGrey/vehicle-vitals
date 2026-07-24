# OAuth Environment Secrets Setup (Retired)

> **Historical configuration note — do not execute.** Reviewed July 20, 2026.
> The environment OAuth gate described by the former version of this guide is
> not implemented in the current web client.

The active workflow still declares these repository-secret families:

- `VITE_ALLOWED_EMAIL_DOMAINS_PRODUCTION`
- `VITE_ALLOWED_EMAIL_DOMAINS_STAGING`
- `VITE_ALLOWED_EMAIL_DOMAINS_DEVELOPMENT`
- `VITE_ALLOWED_EMAILS_PRODUCTION`
- `VITE_ALLOWED_EMAILS_STAGING`
- `VITE_ALLOWED_EMAILS_DEVELOPMENT`

It may use a development/staging value to satisfy its build-time access-control
configuration check. It also writes the selected value as
`VITE_ALLOWED_EMAIL_DOMAINS` or `VITE_ALLOWED_EMAILS` into the generated Vite
environment file. The current client has no code that reads those variables,
so creating or changing the secrets does not grant, deny, or revoke access.

Do not add or rotate these secrets under the assumption that they secure a
host. Repository secret values must never be copied into documentation.

See `SECURE_ENVIRONMENTS.md` for implemented controls and
`OAUTH_ENVIRONMENT_ACCESS.md` for requirements that would have to be met before
this configuration could become active.
