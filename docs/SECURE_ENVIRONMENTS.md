# Securing STAGING and DEV Environments

## Overview

This guide will help you secure the staging and development environments with password protection to prevent unauthorized public access.

## Environment URLs

- **Staging**: `https://vehicle-vitals-staging.web.app`
- **Development**: `https://vehicle-vitals-development.web.app`

## Security Implementation

The app now includes an `EnvironmentGate` component that requires password authentication for staging and development environments.

### Default Passwords (Change These!)

- **Staging**: `staging2025`
- **Development**: `dev2025`

## Setting Custom Passwords

### Via GitHub Secrets (Recommended)

Set custom passwords using GitHub secrets:

```bash
# Set staging password
gh secret set VITE_ACCESS_PASSWORD_STAGING --body 'your-secure-staging-password'

# Set development password
gh secret set VITE_ACCESS_PASSWORD_DEVELOPMENT --body 'your-secure-dev-password'
```

### Via Environment Variables (Local Development)

For local development, you can set these in your `.env.staging` and `.env.development` files:

```bash
# .env.staging
VITE_ACCESS_PASSWORD_STAGING=your-secure-staging-password

# .env.development
VITE_ACCESS_PASSWORD_DEVELOPMENT=your-secure-dev-password
```

## How It Works

1. **Environment Detection**: The app checks `VITE_ENVIRONMENT` to determine if it's running in staging or development
2. **Password Gate**: If in staging/dev, users must enter the correct password before accessing the app
3. **Firebase Auth**: After password verification, users are signed in anonymously to Firebase for full app access
4. **Session Persistence**: Authentication persists until the browser session ends

## User Experience

When accessing staging or dev environments, users will see:

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
```

## Verification

1. Visit the staging/dev URLs
2. Confirm password protection is active
3. Test with correct and incorrect passwords
4. Verify full app functionality after authentication

## Security Best Practices

1. **Use Strong Passwords**: Avoid default passwords in production
2. **Regular Rotation**: Change passwords periodically
3. **Access Control**: Limit knowledge of passwords to authorized team members
4. **Monitoring**: Monitor access logs for unusual activity
5. **IP Restrictions**: Consider additional IP-based restrictions if needed

## Troubleshooting

- **Password not working**: Check that secrets are set correctly and deployments are current
- **Firebase auth issues**: Ensure Firebase configuration is correct for the environment
- **Environment detection**: Verify `VITE_ENVIRONMENT` is set to 'staging' or 'development'

## Emergency Access

If you lose access to the passwords:

1. Update the GitHub secrets with new passwords
2. Redeploy the affected environments
3. Communicate new passwords to authorized users
