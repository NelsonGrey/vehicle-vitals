# Deploying the web app to Firebase Hosting

This repository supports multiple Firebase environments: Production, Staging, Development, and Demonstration. Each environment has environment-specific configuration.

## Environment Setup

### 2. Firebase Projects

- **Production**: `vehicle-vitals-prod`
- **Staging**: `vehicle-vitals-staging`
- **Development**: `vehicle-vitals-dev`
- **Demonstration**: Uses `vehicle-vitals-dev` with `demonstration` build mode

### 2. Environment Configuration

Each environment has its own `.env` file:

- `.env` - Production (default)
- `.env.staging` - Staging environment
- `.env.development` - Development environment
- `.env.demonstration` - Demonstration environment

Update the placeholder values in `.env.staging` and `.env.development` with your actual Firebase project configurations.

## Deployment Methods

### Option A: GitHub Actions (Recommended)

The active deployment workflow is `.github/workflows/master-pipeline.yml`
(`Master CI/CD Pipeline`). It builds and deploys based on the target
environment.

#### Setup GitHub Secrets

In your repository settings -> Secrets -> Actions, add:

- `FIREBASE_TOKEN` = your CI token from `firebase login:ci`
- `FIREBASE_PROJECT_PROD` = `vehicle-vitals-prod`
- `FIREBASE_PROJECT_STAGING` = `vehicle-vitals-staging`
- `FIREBASE_PROJECT_DEV` = `vehicle-vitals-dev`

#### Automatic Deployment Triggers

- **Production**: Push to `main` branch
- **Staging**: Push to `staging` branch or create PR to `main`
- **Development**: Push to `develop` branch

#### Manual Workflow Dispatch

```bash
gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=staging

gh workflow run master-pipeline.yml \
  -f action=build_and_deploy \
  -f environment=production
```

Use `deploy_only` only for an intentional Firebase-only redeploy. Production
`deploy_only` skips Functions and deploys Firestore, Storage, and Hosting.

### Option B: Manual Deployment

#### Build for specific environment:

```bash
# Production (default)
npm run build

# Staging
npm run build:staging

# Development
npm run build:development

# Demonstration
npm run build:demonstration
```

#### Deploy to specific environment:

```bash
# Production
firebase use production
firebase deploy --only firestore,storage,functions,hosting

# Staging
firebase use staging
firebase deploy --only firestore,storage,functions,hosting

# Development
firebase use development
firebase deploy --only firestore,storage,functions,hosting

# Demonstration (project alias may remain development depending on local firebase aliases)
firebase use development
firebase deploy --only hosting
```

## Environment URLs

- **Production**: https://vehicle-vitals-prod.web.app
- **Staging**: https://vehicle-vitals-staging.web.app
- **Development**: https://vehicle-vitals-dev.web.app
- **Demonstration**: https://vehicle-vitals-dev.web.app (demonstration branch release)

## Notes

- Always test builds locally before deploying: `npm run build:staging` etc.
- The workflow installs dependencies and runs the appropriate build command based on the target environment.
- For manual deployments, ensure you're using the correct Firebase project with `firebase use <environment>`.
- Firestore and Storage rules are launch-critical; do not use Hosting-only
  deploys for release candidates unless rules and Functions are intentionally
  unchanged.
