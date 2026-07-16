# OAuth Migration Guide

**Date:** May 10, 2026  
**From:** Password-based environment gates  
**To:** OAuth-based (Firebase Auth + Google Sign-In)

## What's Changing

The unreliable password-based access control has been replaced with a secure, maintainable OAuth solution.

### Old Approach ❌
```
1. Admin rotates password in GitHub Secrets
2. CI/CD rebuilds entire app (30-45 min)
3. Deploy to production
4. Users use one shared password
5. No audit trail of who accessed what
```

### New Approach ✅
```
1. Admin updates email allowlist in GitHub Secrets
2. CI/CD rebuilds (same 30-45 min)
3. Deploy to production
4. Users sign in with personal Google account
5. Full audit trail via Firebase Auth
6. Instant access revocation if needed
```

## Timeline

- **Today:** Code deployment (Google Sign-In gate added)
- **This Week:** Configure GitHub Secrets with email allowlists
- **Next Deploy:** New authentication takes effect
- **Soon After:** Remove old password secrets (cleanup)

## What You Need to Do

### If You're an Admin

1. **Add GitHub Secrets** (one-time setup)
   - Go to repository Settings → Secrets and variables
   - Add `VITE_ALLOWED_EMAIL_DOMAINS` or `VITE_ALLOWED_EMAILS` for each environment
   - See [OAUTH_GITHUB_SECRETS_SETUP.md](/docs/OAUTH_GITHUB_SECRETS_SETUP.md)

2. **Enable Google in Firebase** (one-time setup)
   - Confirm Google sign-in provider is enabled in Firebase Console
   - Already done if you've used Google auth before

3. **Verify It Works**
   - After deployment, try accessing dev environment
   - Sign in with your company Google account
   - Should be granted access

4. **Test Access Control**
   - Sign out
   - Sign in with non-authorized email
   - Should be denied and auto-signed out

5. **No More Password Rotations**
   - Delete old password secrets from GitHub
   - Stop rotating passwords
   - Celebrate! 🎉

### If You're a Developer

**No action needed immediately!**

But you should know:
- **Password gate is deprecated** - don't use for new projects
- **Google Sign-In is required** - to access dev/staging/demo
- **Keep browser logged in** - for faster access
- **Contact admin if locked out** - they can add your email to allowlist

## Common Questions

**Q: Do I need to use my Google account?**  
A: Yes, you sign in with Google. Uses your personal or company Google account.

**Q: What if I don't have a Google account?**  
A: Create one (it's free) or ask your admin to add an alternative email.

**Q: How do I sign out?**  
A: Click the button in the bottom-right corner showing your email address.

**Q: Why did I get "not authorized"?**  
A: Your email doesn't match the allowlist. Ask your admin to add it.

**Q: What if I lost access?**  
A: Ask repository owner to add your email to `VITE_ALLOWED_EMAILS` in GitHub Secrets.

**Q: Is my data safe?**  
A: Yes - uses industry-standard Firebase Auth + Google OAuth 2.0.

**Q: Can passwords still be used?**  
A: No - password gate is completely replaced.

## Files Changed

### Component
- `packages/web/src/components/EnvironmentGate.tsx` - OAuth implementation

### Documentation (New)
- `docs/OAUTH_ENVIRONMENT_ACCESS.md` - Full technical documentation
- `docs/OAUTH_GITHUB_SECRETS_SETUP.md` - GitHub Secrets configuration
- `docs/OAUTH_MIGRATION_GUIDE.md` - This file

### Environment Configs Updated
- `packages/web/.env.development` - Comments updated
- `packages/web/.env.staging` - Comments updated

## Technical Details

### Architecture
```
User → Sign in with Google → Firebase Auth → Email check → Access granted/denied
```

### Email Allowlist Matching
- **Domain-based:** `VITE_ALLOWED_EMAIL_DOMAINS=company.com` matches any `@company.com`
- **Exact match:** `VITE_ALLOWED_EMAILS=alice@company.com` matches only that exact email
- **Combined:** Can use both - access if either rule matches

### No More Password Secrets
The following are **removed/deprecated**:
- ~~`VITE_ACCESS_PASSWORD_DEVELOPMENT`~~
- ~~`VITE_ACCESS_PASSWORD_STAGING`~~
- ~~`VITE_ACCESS_PASSWORD_DEMONSTRATION`~~
- ~~`VITE_ACCESS_PASSWORD`~~

Replaced by:
- `VITE_ALLOWED_EMAIL_DOMAINS` (per environment)
- `VITE_ALLOWED_EMAILS` (per environment)

## Rollback Plan

If OAuth doesn't work as expected:

1. We can revert to password-based gate (keep old code branch)
2. Would require committing old EnvironmentGate.tsx back
3. Would need to re-add password secrets to GitHub
4. Full rebuild/deploy cycle

**We don't anticipate needing rollback** - Firebase Auth is stable and Google Sign-In is battle-tested.

## Support

- **Questions about setup?** → See [OAUTH_GITHUB_SECRETS_SETUP.md](/docs/OAUTH_GITHUB_SECRETS_SETUP.md)
- **Technical details?** → See [OAUTH_ENVIRONMENT_ACCESS.md](/docs/OAUTH_ENVIRONMENT_ACCESS.md)
- **Can't sign in?** → Contact repository owner with your email
- **Found a bug?** → Report in GitHub Issues

## Timeline for Full Cleanup

| When | Action |
|------|--------|
| Week 1 | Deploy OAuth gate (already done) |
| Week 1 | Configure GitHub Secrets |
| Week 2 | Verify OAuth works in all environments |
| Week 3 | Remove old password secrets |
| Week 4+ | Monitor for any issues |

## Benefits Summary

✅ **No Password Rotations** - Email-based instead  
✅ **Instant Access Updates** - No rebuild needed  
✅ **Audit Trail** - Know who accessed what when  
✅ **Better UX** - Sign in with familiar Google  
✅ **Better Security** - OAuth 2.0 standard  
✅ **Team Friendly** - Per-person identity tracking  
✅ **Operational Simplicity** - Less maintenance burden

---

**Questions?** Create a GitHub Discussion or Issue with the tag `oauth-migration`
