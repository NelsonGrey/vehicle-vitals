# OAuth-Based Environment Access Control

## Overview

This replaces the unreliable password-based EnvironmentGate with a secure, maintainable OAuth-based approach using Firebase Auth + Google Sign-In. No more password rotations, instant access control, and full audit trails.

## Features

✅ **No Password Rotations** - Access managed via team email allowlists  
✅ **Instant Updates** - No rebuilds needed to add/revoke access  
✅ **Audit Trails** - Full logging of who accessed what when  
✅ **Per-User Identity** - Know exactly who is using the environment  
✅ **Firebase Integrated** - Leverages existing auth infrastructure

## Configuration

### Environment Variables

Set these in GitHub Secrets for each environment (development, staging, demonstration):

```bash
# Option 1: By email domain (anyone from your company)
VITE_ALLOWED_EMAIL_DOMAINS=company.com,trusted-org.com

# Option 2: By specific email addresses
VITE_ALLOWED_EMAILS=alice@company.com,bob@contractor.com,carol@partner.org

# Option 3: Combination (recommended)
VITE_ALLOWED_EMAIL_DOMAINS=company.com
VITE_ALLOWED_EMAILS=external@trusted.com,consultant@agency.org
```

### How It Works

When a user visits a development/staging/demonstration environment:

1. **Check Authorization**: If user email domain or exact email matches the allowlist, grant access
2. **Google Sign-In**: If not authenticated, show Google Sign-In button
3. **Authorization Gate**: After sign-in, check if email is in allowlist
4. **Access Granted/Denied**: If authorized, show the app; if not, display error and sign out
5. **Sign Out Button**: Authorized users get a sign-out button in bottom-right corner

## Setup Steps

### 1. Enable Google Sign-In in Firebase Console

For each Firebase project (dev, staging, demo):

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Google** provider
3. Save

### 2. Configure GitHub Secrets

For each environment, add to repository secrets:

**Development** (`VITE_ALLOWED_EMAIL_DOMAINS`):

```
company.com
```

**Staging** (`VITE_ALLOWED_EMAIL_DOMAINS`):

```
company.com
```

**Demonstration** (`VITE_ALLOWED_EMAILS`):

```
demo-user@company.com,external-reviewer@client.com
```

### 3. Deploy

Commit and push the changes. The CI/CD pipeline will automatically build with the new authentication.

```bash
git add packages/web/src/components/EnvironmentGate.tsx
git commit -m "Implement OAuth-based environment access control"
git push origin develop
```

The next build will include the new auth gate.

## Usage

### For Team Members

1. Visit your development environment (e.g., https://vehicle-vitals-dev.web.app)
2. Click "Sign in with Google"
3. Select your Google account (must match domain/allowlist)
4. Access is automatically granted or denied

### For Admins

#### Add a User

Add their email to the GitHub secret:

```bash
# Current list
company.com
external@trusted.com

# Add new user
company.com
external@trusted.com
new-contractor@agency.com
```

Deploy via CI/CD. No password rotation needed!

#### Remove a User

Simply remove their email from the allowlist and deploy. Their access is instantly revoked.

#### Rotate Access

To revoke all access and require re-authentication:

```bash
# Clear all and rebuild with new list
VITE_ALLOWED_EMAILS=alice@company.com,bob@company.com

# Deploy
```

Existing sessions persist until browser refresh (due to Firebase session storage). Force a full site refresh to clear.

## Troubleshooting

### "Your email is not authorized"

Your email doesn't match the allowlist. Ask your admin to:

- Add your domain to `VITE_ALLOWED_EMAIL_DOMAINS`, OR
- Add your exact email to `VITE_ALLOWED_EMAILS`

### Google Sign-In popup doesn't appear

1. Check browser console for errors
2. Verify Google is enabled in Firebase Console → Authentication
3. Ensure popup blockers aren't interfering
4. Try incognito window

### Can't sign out

Refresh the page and try again. If persistent, clear browser cookies for the domain.

## Architecture

```
User visits dev environment
           ↓
EnvironmentGate checks: Is authenticated?
           ├→ No → Show Google Sign-In button
           ├→ Yes → Check email against allowlist
                    ├→ Match → Show app + sign-out button
                    └→ No match → Show error, auto sign-out
```

## Files Changed

- `packages/web/src/components/EnvironmentGate.tsx` - OAuth implementation
- GitHub Secrets - `VITE_ALLOWED_EMAIL_DOMAINS`, `VITE_ALLOWED_EMAILS` (new)
- No more `VITE_ACCESS_PASSWORD_*` secrets needed (can be deleted)

## Migration from Passwords

### Remove Old Secrets

You can now delete these from GitHub Secrets:

- ~~`VITE_ACCESS_PASSWORD_DEVELOPMENT`~~
- ~~`VITE_ACCESS_PASSWORD_STAGING`~~
- ~~`VITE_ACCESS_PASSWORD_DEMONSTRATION`~~
- ~~`VITE_ACCESS_PASSWORD`~~

### Preserve Build Success

If you're running a deployment that still expects these secrets, add dummy values to GitHub Secrets to prevent CI/CD failures:

```
VITE_ACCESS_PASSWORD_DEVELOPMENT=DEPRECATED_USE_OAUTH
VITE_ACCESS_PASSWORD_STAGING=DEPRECATED_USE_OAUTH
```

Then remove them after verifying the new gate works.

## Benefits Summary

| Aspect             | Password-Based             | OAuth-Based             |
| ------------------ | -------------------------- | ----------------------- |
| Password Rotations | Frequent, error-prone      | None                    |
| Access Changes     | Requires rebuild (30+ min) | Instant (seconds)       |
| Audit Trail        | No                         | Full Firebase Auth logs |
| User Identity      | Unknown                    | Tracked (email)         |
| Offline Access     | Possible                   | Requires internet       |
| Setup Complexity   | Low                        | Medium                  |
| Maintenance Burden | High                       | Low                     |

## Questions?

Refer to [SECURE_ENVIRONMENTS.md](/docs/SECURE_ENVIRONMENTS.md) for the older password-based approach (deprecated).
