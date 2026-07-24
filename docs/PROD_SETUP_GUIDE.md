# Vehicle-Vitals Production Setup Guide

Last verified: July 20, 2026

This guide lists configuration names only. Never place real secret values,
private keys, access tokens, or production test credentials in documentation.

The active consumer is `.github/workflows/master-pipeline.yml`. It reads
repository-level `secrets.*`; GitHub Environment secrets with similar names are
not automatically used unless the workflow job is explicitly bound to that
environment.

Do not use `setup-prod-secrets.sh` as a current bootstrap. It still contains
obsolete secret names, assumes a client allowlist gate that is not implemented,
and references a removed workflow. Use this inventory and the active workflow
instead.

## Workflow Repository Secrets

Not every declared name is required for every target. The workflow validates
the subset needed by the selected environment and enabled targets.

### Firebase project selection and deployment

- `FIREBASE_PROJECT_DEV`
- `FIREBASE_PROJECT_STAGING`
- `FIREBASE_PROJECT_PROD`
- `FIREBASE_TOKEN`
- `FUNCTIONS_REPO_PAT` (read access to
  `NelsonGrey/vehicle-vitals-functions`)

### Production web Firebase configuration

- `VITE_FIREBASE_API_KEY_PRODUCTION`
- `VITE_FIREBASE_AUTH_DOMAIN_PRODUCTION`
- `VITE_FIREBASE_PROJECT_ID_PRODUCTION`
- `VITE_FIREBASE_STORAGE_BUCKET_PRODUCTION`
- `VITE_FIREBASE_MESSAGING_SENDER_ID_PRODUCTION`
- `VITE_FIREBASE_APP_ID_PRODUCTION`
- `VITE_FIREBASE_MEASUREMENT_ID_PRODUCTION`

### Production exposure and build inputs

- `VITE_SHOW_COMING_SOON_PRODUCTION`
- `VITE_ALLOWED_EMAIL_DOMAINS_PRODUCTION`
- `VITE_ALLOWED_EMAILS_PRODUCTION`
- `VITE_ENABLE_HOSTED_DEMO_PDF_UPLOADS_PRODUCTION`

`VITE_ALLOWED_EMAIL_DOMAINS_PRODUCTION` and
`VITE_ALLOWED_EMAILS_PRODUCTION` are residual workflow inputs. The current web
client does not consume them, so they do not implement an access gate. See
`SECURE_ENVIRONMENTS.md`. Production builds do not require these values.

### Production analytics and advertising

- `VITE_GTM_ID_PRODUCTION`
- `VITE_ADSENSE_SLOT_PRODUCTION`
- `VITE_ADSENSE_SLOT_HEADER_PRODUCTION`
- `VITE_ADSENSE_SLOT_MAINTENANCEHISTORY_PRODUCTION`

The AdSense publisher/client identifier is set by the pipeline. Slot secrets
may be blank to suppress a placement, but production behavior must be verified
after build because the app also has placement-specific environment keys.

### iOS signing and upload (only when iOS is enabled)

- `FASTLANE_TEAM_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY`

iOS is currently disabled in `.cicd/projects/vehicle-vitals.yml`, so secret
presence does not prove a current App Store build or review status.

## Firebase Runtime Secrets

Cloud Functions declare their own Secret Manager dependencies in the private
companion repository. Review that repository's current documentation and
declarations before every Functions release. Repository-level GitHub secrets do
not replace Firebase Secret Manager values.

At minimum, validate the live integrations that are enabled for the release,
including email delivery, Stripe/billing, Apple/Google purchase verification,
and any external data providers.

## Set or Rotate a Secret

Use an interactive prompt or a secure file/secret manager. Avoid putting the
value in shell history:

```bash
gh secret set VITE_FIREBASE_API_KEY_PRODUCTION
gh secret set FUNCTIONS_REPO_PAT
```

For a file-backed value:

```bash
gh secret set APP_STORE_CONNECT_KEY < /secure/path/to/AuthKey.p8
```

Do not paste the value into a command stored in documentation or commit it to
an `.env` file.

## Verify Names Without Reading Values

```bash
gh secret list
```

Then compare the names with the workflow's `secrets.*` references:

```bash
rg -o 'secrets\.[A-Z0-9_]+' .github/workflows/master-pipeline.yml \
  | sort -u
```

GitHub does not expose secret values. Presence and update time are not proof
that a credential is valid; a successful least-privilege operation is required.

## Production Readiness Checks

1. Confirm `.firebaserc` maps `production` to `vehicle-vitals-prod`.
2. Confirm `firebase.prod.json` contains the intended Hosting headers,
   Firestore/Storage configuration, and `packages/functions` source path.
3. Confirm the private Functions `main` branch is compatible with public
   `main`.
4. Run the staging-to-production readiness report.
5. Require a green staging workflow and hosted smoke test.
6. Verify live Firebase runtime secrets without printing them.
7. Verify external commercial/legal/App Store approvals.

## Deploy

Prefer promotion from staging followed by the automatic `main` push workflow.
For an intentional manual dispatch:

```bash
gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=production
```

Monitor the Quality Gate, web build, private Functions checkout, and Firebase
deploy. Follow `DEPLOY.md` and `GO_LIVE_RUNBOOK.md` for verification and
rollback.
