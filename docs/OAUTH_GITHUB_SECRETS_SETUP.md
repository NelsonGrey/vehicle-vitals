# OAuth GitHub Secrets Setup

This guide shows how to configure GitHub repository secrets for the new OAuth-based environment access control.

## Required GitHub Secrets

Add these secrets to your GitHub repository via: **Settings → Secrets and variables → Actions**

### Development Environment

**Secret Name:** `VITE_ALLOWED_EMAIL_DOMAINS`  
**Value:** (comma-separated domains your team uses)
```
company.com
```

Or for specific emails:

**Secret Name:** `VITE_ALLOWED_EMAILS`  
**Value:** (comma-separated specific email addresses)
```
alice@company.com,bob@company.com
```

### Staging Environment

**Secret Name:** `VITE_ALLOWED_EMAIL_DOMAINS`  
**Value:**
```
company.com,trusted-partner.com
```

### Demonstration Environment

**Secret Name:** `VITE_ALLOWED_EMAILS`  
**Value:**
```
demo@company.com,client-contact@example.com
```

## How CI/CD Uses These Secrets

The `.github/workflows/master-pipeline.yml` automatically injects these secrets as environment variables when building:

```yaml
# For development build
VITE_ALLOWED_EMAIL_DOMAINS: company.com
VITE_ALLOWED_EMAILS: external@trusted.com

# These are then available in the app at runtime as:
import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS
import.meta.env.VITE_ALLOWED_EMAILS
```

## Step-by-Step Setup

### 1. Add Secrets to GitHub

Go to your repository → Settings → Secrets and variables → Actions

Click **New repository secret** for each:

| Environment | Secret Name | Example Value |
|---|---|---|
| Development | `VITE_ALLOWED_EMAIL_DOMAINS` | `company.com` |
| Staging | `VITE_ALLOWED_EMAIL_DOMAINS` | `company.com` |
| Demonstration | `VITE_ALLOWED_EMAILS` | `demo@company.com,client@example.com` |

### 2. Enable Google Provider in Firebase Console

For each Firebase project (vehicle-vitals-dev, vehicle-vitals-staging, vehicle-vitals-demo):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Google** provider (should already be enabled)
5. Save

### 3. Verify Deployment

After pushing commits to `develop` branch:

1. Go to GitHub → **Actions**
2. Wait for workflow to complete
3. Visit your environment: https://vehicle-vitals-dev.web.app/
4. You should see the Google Sign-In gate
5. Try signing in with an authorized email
6. Should grant access

### 4. Test Access Control

**Test 1: Authorized Access**
- Sign in with email matching your allowlist
- Should show app + sign-out button in bottom-right

**Test 2: Unauthorized Access**
- Try signing in with non-matching email
- Should show "not authorized" error
- Should auto sign-out

**Test 3: Domain Allowlist**
- If domain allowlist is `company.com`, try any `@company.com` email
- Should work without explicit entry

## Migration from Password-Based

### Before (Password)
```
VITE_ACCESS_PASSWORD_DEVELOPMENT: "VV-Dev-Access-2026-05-10"
```

### After (OAuth)
```
VITE_ALLOWED_EMAIL_DOMAINS: "company.com"
```

**No password rotations needed!**

## Troubleshooting

### "Access denied" after sign-in

Check that:
1. Secret is created in GitHub repository settings
2. Secret value is correct (correct domain or email)
3. You signed in with the right Google account
4. No typos in email or domain

### Build fails with "undefined" for VITE_ALLOWED_EMAIL_DOMAINS

Make sure secrets are created before pushing. The CI/CD pipeline needs them to exist when building.

### Google Sign-In button doesn't work

Verify:
1. Google provider is enabled in Firebase Console
2. No browser popup blockers
3. Correct Firebase project is configured
4. Try incognito/private browser window

## Emergency Access

If you lose access:

1. Ask repository owner to temporarily set:
   ```
   VITE_ALLOWED_EMAILS: your-email@company.com
   ```
2. Push a new commit to trigger rebuild
3. Wait for deployment to complete
4. Access should be restored

## Questions

See [OAUTH_ENVIRONMENT_ACCESS.md](/docs/OAUTH_ENVIRONMENT_ACCESS.md) for full documentation.
