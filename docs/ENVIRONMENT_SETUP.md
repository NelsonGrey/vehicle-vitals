# Environment Setup Guide

This guide explains how to set up and configure the three Firebase environments (Production, Staging, Development) for the Vehicle-Vitals project.

## Overview

The project supports three environments:

- **Production**: Live environment for end users
- **Staging**: Pre-production environment for testing
- **Development**: Development environment for active development

## Firebase Projects

The following Firebase projects have been set up:

| Environment | Firebase Project ID      | Purpose                         |
| ----------- | ------------------------ | ------------------------------- |
| Production  | `vehicle-vitals-prod`    | Live production environment     |
| Staging     | `vehicle-vitals-staging` | Pre-production testing          |
| Development | `vehicle-vitals-dev`     | Development and feature testing |

# Environment Setup Guide

This guide explains how to set up and configure the three Firebase environments (Production, Staging, Development) for the Vehicle-Vitals project. All environment configuration is stored securely in GitHub repository secrets.

## Overview

The project supports three environments:

- **Production**: Live environment for end users
- **Staging**: Pre-production environment for testing
- **Development**: Development environment for active development

Environment variables are stored as GitHub secrets with environment-specific naming (e.g., `VITE_FIREBASE_API_KEY_PRODUCTION`, `VITE_FIREBASE_API_KEY_STAGING`, etc.). The CI/CD pipeline automatically creates `.env` files from these secrets during the build process.

## Firebase Projects

The following Firebase projects have been set up:

| Environment | Firebase Project ID      | Purpose                         |
| ----------- | ------------------------ | ------------------------------- |
| Production  | `vehicle-vitals-prod`    | Live production environment     |
| Staging     | `vehicle-vitals-staging` | Pre-production testing          |
| Development | `vehicle-vitals-dev`     | Development and feature testing |

## GitHub Secrets Configuration

### Environment Variables as Secrets

All environment variables are stored as GitHub repository secrets with the naming pattern: `{VARIABLE_NAME}_{ENVIRONMENT}`

#### Production Environment Secrets:

```
VITE_FIREBASE_API_KEY_PRODUCTION
VITE_FIREBASE_AUTH_DOMAIN_PRODUCTION
VITE_FIREBASE_PROJECT_ID_PRODUCTION
VITE_FIREBASE_STORAGE_BUCKET_PRODUCTION
VITE_FIREBASE_MESSAGING_SENDER_ID_PRODUCTION
VITE_FIREBASE_APP_ID_PRODUCTION
VITE_FIREBASE_MEASUREMENT_ID_PRODUCTION
VITE_DEBUG_PRODUCTION
VITE_SHOW_COMING_SOON_PRODUCTION
VITE_ANALYTICS_ID_PRODUCTION
VITE_GTM_ID_PRODUCTION
VITE_SENTRY_DSN_PRODUCTION
VITE_ADSENSE_CLIENT
VITE_ADSENSE_SLOT
VITE_ENABLE_DEBUG_TOOLS_PRODUCTION
VITE_ENABLE_ANALYTICS_PRODUCTION
VITE_ENABLE_ERROR_REPORTING_PRODUCTION
```

#### Staging Environment Secrets:

```
VITE_FIREBASE_API_KEY_STAGING
VITE_FIREBASE_AUTH_DOMAIN_STAGING
VITE_FIREBASE_PROJECT_ID_STAGING
VITE_FIREBASE_STORAGE_BUCKET_STAGING
VITE_FIREBASE_MESSAGING_SENDER_ID_STAGING
VITE_FIREBASE_APP_ID_STAGING
VITE_FIREBASE_MEASUREMENT_ID_STAGING
VITE_DEBUG_STAGING
VITE_SHOW_COMING_SOON_STAGING
VITE_ANALYTICS_ID_STAGING
VITE_SENTRY_DSN_STAGING
VITE_ADSENSE_CLIENT
VITE_ADSENSE_SLOT
VITE_ENABLE_DEBUG_TOOLS_STAGING
VITE_ENABLE_ANALYTICS_STAGING
VITE_ENABLE_ERROR_REPORTING_STAGING
```

#### Development Environment Secrets:

```
VITE_FIREBASE_API_KEY_DEVELOPMENT
VITE_FIREBASE_AUTH_DOMAIN_DEVELOPMENT
VITE_FIREBASE_PROJECT_ID_DEVELOPMENT
VITE_FIREBASE_STORAGE_BUCKET_DEVELOPMENT
VITE_FIREBASE_MESSAGING_SENDER_ID_DEVELOPMENT
VITE_FIREBASE_APP_ID_DEVELOPMENT
VITE_FIREBASE_MEASUREMENT_ID_DEVELOPMENT
VITE_DEBUG_DEVELOPMENT
VITE_SHOW_COMING_SOON_DEVELOPMENT
VITE_ANALYTICS_ID_DEVELOPMENT
VITE_SENTRY_DSN_DEVELOPMENT
VITE_ADSENSE_CLIENT
VITE_ADSENSE_SLOT
VITE_ENABLE_DEBUG_TOOLS_DEVELOPMENT
VITE_ENABLE_ANALYTICS_DEVELOPMENT
VITE_ENABLE_ERROR_REPORTING_DEVELOPMENT
```

#### Mobile App Secrets (Environment-Specific):

```
FIREBASE_SERVICE_ACCOUNT_KEY (shared across environments)
IOS_SERVICE_ACCOUNT_KEY (for iOS distribution)
GOOGLE_SERVICES_JSON_DEVELOPMENT
GOOGLE_SERVICES_JSON_STAGING
GOOGLE_SERVICES_JSON_PRODUCTION
GOOGLE_SERVICE_INFO_PLIST_DEVELOPMENT
GOOGLE_SERVICE_INFO_PLIST_STAGING
GOOGLE_SERVICE_INFO_PLIST_PRODUCTION
```

### Mobile Firebase Configuration

#### Google Services JSON Files

The mobile app requires `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) files for Firebase integration. These files contain sensitive API keys and must be stored as GitHub secrets.

##### Setting up Google Services JSON Secrets:

1. **Download from Firebase Console:**
   - Go to Firebase Console → Project Settings → General → Your apps
   - Download `google-services.json` for Android app
   - Download `GoogleService-Info.plist` for iOS app

2. **Convert to GitHub Secrets:**
   - Copy the entire JSON/PLIST content as a single line
   - Add as repository secrets:
     - `GOOGLE_SERVICES_JSON_DEVELOPMENT` (Android)
     - `GOOGLE_SERVICES_JSON_STAGING` (Android)
     - `GOOGLE_SERVICES_JSON_PRODUCTION` (Android)
     - `GOOGLE_SERVICE_INFO_PLIST_DEVELOPMENT` (iOS)
     - `GOOGLE_SERVICE_INFO_PLIST_STAGING` (iOS)
     - `GOOGLE_SERVICE_INFO_PLIST_PRODUCTION` (iOS)

3. **CI/CD Pipeline:**
   - The Android workflow automatically creates `google-services.json` from the secret during build
   - The iOS workflow automatically creates `GoogleService-Info.plist` from the secret during build

## Firebase Configuration

### 1. Get Firebase Config Values

For each Firebase project, get the configuration values from the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the appropriate project
3. Go to Project Settings → General → Your apps
4. Copy the config values for web app

### 2. Add to GitHub Secrets

Add the Firebase configuration values as GitHub secrets using the environment-specific naming:

- `VITE_FIREBASE_API_KEY_{ENVIRONMENT}`
- `VITE_FIREBASE_AUTH_DOMAIN_{ENVIRONMENT}`
- etc.

The CI/CD pipeline will automatically use these secrets to create the `.env` file during deployment.

## Deployment URLs

### Production Environment:

- **Web App**: https://vehicle-vitals-prod.web.app
- **Mobile PWA**: https://vehicle-vitals-prod.web.app

### Staging Environment:

- **Web App**: https://vehicle-vitals-staging.web.app
- **Mobile PWA**: https://vehicle-vitals-staging.web.app

### Development Environment:

- **Web App**: https://vehicle-vitals-dev.web.app
- **Mobile PWA**: https://vehicle-vitals-dev.web.app

## CI/CD Pipeline

The CI/CD pipeline automatically deploys based on branches:

- **`main` branch** → Production environment
- **`staging` branch** → Staging environment
- **`develop` branch** → Development environment

### Manual Deployment

You can also trigger manual deployments using the workflow dispatch:

1. Go to GitHub Actions
2. Select "🚀 CI/CD Pipeline" workflow
3. Click "Run workflow"
4. Select the desired environment

## Environment-Specific Settings

### Production Environment:

- Debug tools: Disabled
- Analytics: Enabled
- Error reporting: Enabled
- **Coming Soon Page: Controlled by VITE_SHOW_COMING_SOON_PRODUCTION**

### Staging Environment:

- Debug tools: Enabled
- Analytics: Disabled
- Error reporting: Enabled
- **Coming Soon Page: Controlled by VITE_SHOW_COMING_SOON_STAGING**

### Development Environment:

- Debug tools: Enabled
- Analytics: Disabled
- Error reporting: Disabled
- **Coming Soon Page: Controlled by VITE_SHOW_COMING_SOON_DEVELOPMENT**

## Firebase Service Account Setup

### 1. Create Service Account

For each Firebase project:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file

### 2. Add to GitHub Secrets

1. Copy the entire JSON content
2. Add as a GitHub secret with the appropriate name (e.g., `FIREBASE_SERVICE_ACCOUNT_PRODUCTION`)
3. The CI/CD pipeline will use this to authenticate with Firebase

## Functions Integration Environment Flags

The new integration endpoints in `packages/functions/src/index.ts` are controlled
by runtime environment flags. Configure these in your Functions environment
(and as CI secrets where applicable).

### Email Provider

```
EMAIL_PROVIDER
WORKSPACE_SMTP_USER
WORKSPACE_SMTP_APP_PASSWORD
```

Recommended values:

- `EMAIL_PROVIDER=log` for local/dev simulation
- `EMAIL_PROVIDER=workspace` for staging/production delivery via Google
  Workspace's Gmail SMTP (smtp.gmail.com:465)

`WORKSPACE_SMTP_USER` is the sending mailbox (e.g. `no-reply@yourdomain.com`).
`WORKSPACE_SMTP_APP_PASSWORD` is an app password generated for that account
(requires 2-Step Verification to be enabled on it). To configure per Firebase
project:

```bash
cd packages/functions
firebase functions:secrets:set WORKSPACE_SMTP_USER --project <project-id>
firebase functions:secrets:set WORKSPACE_SMTP_APP_PASSWORD --project <project-id>
```

### Integration Providers and Feature Flags

```
MANUALS_ENABLED
MANUALS_PROVIDER
WARRANTY_ENABLED
WARRANTY_PROVIDER
MAINTENANCE_PLAN_ENABLED
SCHEDULE_PROVIDER
CALENDAR_ENABLED
CALENDAR_PROVIDER
```

Current provider values supported in code:

- `MANUALS_PROVIDER=manuals_primary`
- `WARRANTY_PROVIDER=warranty_primary`
- `SCHEDULE_PROVIDER=schedule_primary`
- `CALENDAR_PROVIDER=calendar_primary`

Recommended staging/production feature toggles:

```bash
MANUALS_ENABLED=true
WARRANTY_ENABLED=true
MAINTENANCE_PLAN_ENABLED=true
CALENDAR_ENABLED=true
```

### Auth and Rate Limiting Guards

```
INTEGRATION_AUTH_REQUIRED
INTEGRATION_RATE_LIMIT_ENABLED
INTEGRATION_RATE_LIMIT_MAX
INTEGRATION_RATE_LIMIT_WINDOW_MS
INTEGRATION_CACHE_ENABLED
INTEGRATION_CACHE_TTL_MS
```

Default behavior when unset:

- `INTEGRATION_AUTH_REQUIRED=true`
- `INTEGRATION_RATE_LIMIT_ENABLED=true`
- `INTEGRATION_RATE_LIMIT_MAX=60`
- `INTEGRATION_RATE_LIMIT_WINDOW_MS=60000`
- `INTEGRATION_CACHE_ENABLED=false`
- `INTEGRATION_CACHE_TTL_MS=86400000`

### Premium Purchase Verification (Apple + Google Play)

```
PREMIUM_VERIFICATION_REQUIRED
PREMIUM_UNKNOWN_SOURCE_UNVERIFIED
APPLE_SHARED_SECRET
GOOGLE_PLAY_PACKAGE_NAME
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL
GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY
GOOGLE_PLAY_ACCESS_TOKEN
```

Behavior summary:

- `PREMIUM_VERIFICATION_REQUIRED=true` enforces strict verification in
  `verifyPremiumPurchase`. Unverified purchases are rejected.
- `PREMIUM_VERIFICATION_REQUIRED=false` allows provisional entitlement states
  when provider verification is unavailable.
- `PREMIUM_UNKNOWN_SOURCE_UNVERIFIED=true` treats unknown purchase sources as
  `unverified` (recommended default).
- `APPLE_SHARED_SECRET` enables App Store `verifyReceipt` checks.
- `GOOGLE_PLAY_PACKAGE_NAME` + service account credentials enable Android
  Publisher product purchase checks.
- `GOOGLE_PLAY_ACCESS_TOKEN` is an optional override for deterministic tests or
  controlled staging workflows; do not rely on this for production.

Supported purchase source values for `verifyPremiumPurchase`:

- App Store canonical: `app_store`
- App Store aliases: `apple_app_store`, `appstore`
- Play Store canonical: `play_store`
- Play Store aliases: `google_play`, `playstore`

Unknown values are handled by `PREMIUM_UNKNOWN_SOURCE_UNVERIFIED`.

Recommended production/staging values:

```bash
PREMIUM_VERIFICATION_REQUIRED=true
PREMIUM_UNKNOWN_SOURCE_UNVERIFIED=true
```

Recommended rollout sequence:

1. Deploy with `PREMIUM_VERIFICATION_REQUIRED=false` while setting all Apple/
   Play credentials.
2. Validate purchase paths in staging (`app_store` and `play_store`).
3. Confirm entitlement documents include:
   - `verificationState` (`verified` expected for valid receipts)
   - `verificationProvider`
   - `verificationReason` (empty for successful verification)
4. Enable `PREMIUM_VERIFICATION_REQUIRED=true` in production after staging
   verification passes.

To configure sensitive values in Firebase Functions:

```bash
cd packages/functions
firebase functions:secrets:set APPLE_SHARED_SECRET
firebase functions:secrets:set GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY
```

These settings are enforced by `packages/functions/src/request.guards.ts` on:

- `getOwnerManuals`
- `getWarrantySummary`
- `getMaintenancePlan`
- `createCalendarEvent`

Optional cache behavior:

- When `INTEGRATION_CACHE_ENABLED=true`, manual and warranty results are cached
  at `users/{uid}/vehicles/{vin}/integrations/{manuals|warranty}/current`.
- `INTEGRATION_CACHE_TTL_MS` controls cache expiration.

## Deployed Calendar Auth Smoke Test

Use the repo smoke script to verify HTTP auth behavior for calendar fallback in
staging/production environments.

1. Generate a Firebase ID token for a signed-in user in the target project.
   Example using repo helper script:

```bash
FIREBASE_API_KEY=<target-project-web-api-key> \
FIREBASE_EMAIL=<test-user-email> \
FIREBASE_PASSWORD=<test-user-password> \
./scripts/generate-firebase-id-token.sh
```

2. Run:

```bash
FUNCTIONS_BASE_URL=https://us-central1-<project-id>.cloudfunctions.net \
ID_TOKEN=<firebase-id-token> \
EXPECT_AUTH_REQUIRED=true \
./scripts/smoke-calendar-auth.sh
```

Expected outcome when auth is enforced:

- anonymous request returns `401`
- authenticated request returns any non-`401` status (`200`, `501`, or `503`)

This validates the auth guard path required for HTTP fallback from web/mobile
calendar clients.

### One-command Staging + Production Run

Use the wrapper script to run both environments in one command:

```bash
STAGING_ID_TOKEN=$(FIREBASE_API_KEY=<staging-web-api-key> FIREBASE_EMAIL=<staging-user-email> FIREBASE_PASSWORD=<staging-user-password> ./scripts/generate-firebase-id-token.sh)
PRODUCTION_ID_TOKEN=$(FIREBASE_API_KEY=<prod-web-api-key> FIREBASE_EMAIL=<prod-user-email> FIREBASE_PASSWORD=<prod-user-password> ./scripts/generate-firebase-id-token.sh)
```

```bash
STAGING_FUNCTIONS_BASE_URL=https://us-central1-<staging-project-id>.cloudfunctions.net \
STAGING_ID_TOKEN=<staging-firebase-id-token> \
PRODUCTION_FUNCTIONS_BASE_URL=https://us-central1-<prod-project-id>.cloudfunctions.net \
PRODUCTION_ID_TOKEN=<prod-firebase-id-token> \
./scripts/smoke-calendar-auth-all.sh
```

The command exits non-zero if either environment fails verification.
It also writes a timestamped evidence log to `artifacts/smoke/` by default.

To force a specific evidence file path:

```bash
EVIDENCE_LOG_FILE=artifacts/smoke/calendar-auth-staging-prod.log \
STAGING_FUNCTIONS_BASE_URL=https://us-central1-<staging-project-id>.cloudfunctions.net \
STAGING_ID_TOKEN=<staging-firebase-id-token> \
PRODUCTION_FUNCTIONS_BASE_URL=https://us-central1-<prod-project-id>.cloudfunctions.net \
PRODUCTION_ID_TOKEN=<prod-firebase-id-token> \
./scripts/smoke-calendar-auth-all.sh
```

## Testing Environment Setup

### 1. Local Development

For local development, create a `.env` file in the `packages/web/` directory with your development values:

```bash
cd packages/web
cat > .env << EOF
# Development Environment Configuration - Local Development

# Firebase Configuration (use development project values)
VITE_FIREBASE_API_KEY=your_dev_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=vehicle-vitals-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vehicle-vitals-dev
VITE_FIREBASE_STORAGE_BUCKET=vehicle-vitals-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
VITE_FIREBASE_APP_ID=your_dev_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_dev_measurement_id

# Environment
VITE_ENVIRONMENT=development
VITE_DEBUG=true

# Analytics & Monitoring (disabled for local dev)
VITE_ANALYTICS_ID=
VITE_SENTRY_DSN=

# Third-party Services (use test keys)
VITE_ADSENSE_CLIENT=your_adsense_client
VITE_ADSENSE_SLOT=your_adsense_slot

# Feature Flags
VITE_ENABLE_DEBUG_TOOLS=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
EOF
```

Then run the development server:

```bash
npm run dev
```

### 2. Environment Switching

The application automatically detects the environment based on the hostname and configuration. For local development, it uses the values from your local `.env` file.

## Troubleshooting

### Common Issues:

1. **Deployment Fails**: Check that all required secrets are set for the target environment
2. **Firebase Connection Issues**: Verify Firebase config values and service account permissions

### Debug Steps:

1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are properly set in repository settings
3. Ensure Firebase projects exist and service accounts have correct permissions
4. Test deployments manually using workflow dispatch

### Environment Variable Validation:

For local development, check that your `.env` file exists and has the required variables:

```bash
# Check if local .env file exists
ls -la packages/web/.env

# View the contents to verify
cat packages/web/.env
```

For CI/CD deployments, the environment variables are automatically created from GitHub secrets, so no manual validation is needed.

## Coming Soon Page Control

The `VITE_SHOW_COMING_SOON_*` environment variables control whether the Coming Soon page is displayed instead of the full application. This allows you to:

- Show a landing page to collect email signups during pre-launch
- Control access to the full app independently of the environment
- Gradually roll out access to different user groups

### Setting Values:

- `true`: Show Coming Soon page (blocks access to full app)
- `false`: Show full application

### Recommended Settings:

- **Production**: `true` (during pre-launch), `false` (after launch)
- **Staging**: `false` (for testing full functionality)
- **Development**: `false` (for development work)

## Next Steps

1. **Set up all GitHub secrets** for each environment using the naming convention `{VARIABLE_NAME}_{ENVIRONMENT}`
2. **Configure Firebase projects** and add service account keys as GitHub secrets
3. **Create local development .env file** for development work
4. **Test deployments** to each environment
5. **Update documentation** with actual deployment URLs once everything is working
