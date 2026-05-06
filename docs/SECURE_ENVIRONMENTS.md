# Securing Development Lifecycle Environments

## Overview

This guide secures all non-production lifecycle environments with password protection while keeping production marketing-only.

## Environment URLs

- **Staging**: `https://vehicle-vitals-staging.web.app`
- **Development**: `https://vehicle-vitals-dev.web.app`
- **Demonstration**: `https://vehicle-vitals-dev.web.app` (demonstration branch deployment)
- **Production (Marketing Only)**: `https://vehicle-vitals-prod.web.app`

## Security Implementation

The app includes an `EnvironmentGate` component that requires password authentication for development, demonstration, and staging environments.

### Password Variables

Set these variables in each environment's deployment configuration:

- `VITE_ACCESS_PASSWORD_STAGING`
- `VITE_ACCESS_PASSWORD_DEVELOPMENT`
- `VITE_ACCESS_PASSWORD_DEMONSTRATION`

Optional shared fallback:

- `VITE_ACCESS_PASSWORD`

## Setting Custom Passwords

### Via GitHub Secrets (Recommended)

Set custom passwords using GitHub secrets:

```bash
# Set staging password
gh secret set VITE_ACCESS_PASSWORD_STAGING --body 'your-secure-staging-password'

# Set development password
gh secret set VITE_ACCESS_PASSWORD_DEVELOPMENT --body 'your-secure-dev-password'

# Set demonstration password
gh secret set VITE_ACCESS_PASSWORD_DEMONSTRATION --body 'your-secure-demo-password'
```

### Via Environment Variables (Local Development)

For local development, you can set these in your `.env.staging` and `.env.development` files:

```bash
# .env.staging
VITE_ACCESS_PASSWORD_STAGING=your-secure-staging-password

# .env.development
VITE_ACCESS_PASSWORD_DEVELOPMENT=your-secure-dev-password

# .env.demonstration
VITE_ACCESS_PASSWORD_DEMONSTRATION=your-secure-demo-password
```

## How It Works

1. **Environment Detection**: The app checks `VITE_ENVIRONMENT`.
2. **Password Gate**: If environment is `development`, `demonstration`, or `staging`, users must enter the configured password before access.
3. **Production Lockdown**: If environment is `production`, app/auth routes are redirected to `/`, exposing only marketing routes.
4. **Session Persistence**: Gate authentication persists until browser session ends.

## User Experience

When accessing development, demonstration, or staging environments, users will see:

- A clean password entry screen with environment branding
- Error messages for incorrect passwords
- Loading states during authentication
- Full app access after successful authentication

## Deployment

After setting the passwords, deploy the environments:

```bash
# Deploy staging
gh workflow run ci-cd-pipeline.yml -f environment=STAGING

# Deploy development
gh workflow run ci-cd-pipeline.yml -f environment=DEVELOPMENT

# Deploy demonstration
gh workflow run ci-cd-pipeline.yml -f environment=DEMONSTRATION
```

## Verification

1. Visit development, demonstration, and staging URLs.
2. Confirm password protection is active
3. Test with correct and incorrect passwords
4. Confirm production redirects `/app/*` and `/auth/*` to `/`.

## Security Best Practices

1. **Use Strong Passwords**: Avoid default passwords in production
2. **Regular Rotation**: Change passwords periodically
3. **Access Control**: Limit knowledge of passwords to authorized team members
4. **Monitoring**: Monitor access logs for unusual activity
5. **IP Restrictions**: Consider additional IP-based restrictions if needed

## Troubleshooting

- **Password not working**: Check that secrets are set correctly and deployments are current
- **Firebase auth issues**: Ensure Firebase configuration is correct for the environment
- **Environment detection**: Verify `VITE_ENVIRONMENT` is set correctly (`development`, `demonstration`, `staging`, `production`)

## Emergency Access

If you lose access to the passwords:

1. Update the GitHub secrets with new passwords
2. Redeploy the affected environments
3. Communicate new passwords to authorized users
