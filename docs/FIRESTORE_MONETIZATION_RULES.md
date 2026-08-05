/\*\*

- Firestore Security Rules Updates for Monetization
-
- Add these rules to firebase/firestore.rules
-
- Key principles:
- - Users can only read their own subscription/quota data
- - Backend (Cloud Functions) can write to subscription/quota
- - Quota data is write-only from backend
- - Admins can override for support/debugging
    \*/

// ============================================================================
// SUBSCRIPTION DATA RULES
// ============================================================================

// Match: users/{userId}/subscription/{document}
match /users/{userId}/subscription/{document=\*\*} {
// Allow users to read their own subscription
allow read: if request.auth.uid == userId;

// Allow write only from authenticated backend services
// (Cloud Functions authenticated as admin)
allow write: if request.auth.uid == userId &&
request.resource.data.tier in ['free', 'pro', 'premium'] &&
// Prevent direct client writes - only backend updates
request.auth.token.firebase.sign_in_provider == 'service_account';

// Allow creation for new users (automatic from Cloud Function)
allow create: if request.auth.uid == userId;

// Stricter delete rules - prevent accidental deletion
allow delete: if false;
}

// ============================================================================
// QUOTA DATA RULES
// ============================================================================

// Match: users/{userId}/quotas/{month}
match /users/{userId}/quotas/{month} {
// Allow users to read their quota (for display)
allow read: if request.auth.uid == userId;

// Backend only: Create and update quota documents
// Quota documents should only be modified by scheduled functions
allow write: if request.auth.token.firebase.sign_in_provider == 'service_account';

// Prevent client-side deletes
allow delete: if false;
}

// ============================================================================
// HELPER FUNCTION: Check if backend/admin service
// ============================================================================

function isBackendService() {
return request.auth.token.firebase.sign_in_provider == 'service_account';
}

function isAdmin() {
return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// ============================================================================
// ADMIN OVERRIDES (optional - for support/debugging)
// ============================================================================

// Allow admins to bypass rules for support
match /users/{userId}/subscription/{document=\*\*} {
allow read, write: if isAdmin();
}

match /users/{userId}/quotas/{month} {
allow read, write: if isAdmin();
}

// ============================================================================
// TESTING RULES (for development only - remove in production)
// ============================================================================

// Development: Allow direct reads for testing
match /users/{userId}/subscription/{document=\*\*} {
allow read: if request.auth != null; // Any authenticated user can read (dev only)
}

match /users/{userId}/quotas/{month} {
allow read: if request.auth != null; // Any authenticated user can read (dev only)
}

// ============================================================================
// NOTES FOR DEPLOYMENT
// ============================================================================

/\*
BEFORE DEPLOYING TO PRODUCTION:

1. Remove the "TESTING RULES" section (lines 60-70)

2. Verify Cloud Functions are deployed with admin SDK:
   - Functions must use admin.initializeApp()
   - Functions must have correct Firestore write rules

3. Test rules with Firebase Rules Simulator:
   - Simulate user read of own subscription
   - Simulate service account write to subscription
   - Verify client cannot write to subscription

4. Monitor Firestore logs after deployment:
   - Watch for "Permission denied" errors
   - Check that subscriptions load correctly

5. Update Firestore indexes if needed:
   - Collection: users/{userId}/quotas
   - Index: month (Ascending), user_id (Ascending)

RELATED FILES:

- packages/web/src/shared/subscriptionService.ts (uses these rules)
- packages/web/src/shared/quotaService.ts (uses these rules)
- packages/functions/src/subscription.provider.ts (writes to subscription)
- packages/functions/src/quotaReset.ts (writes to quotas)

DEBUGGING:

If you get "Permission denied" errors:

1. Check auth.uid matches userId in path
2. Verify Cloud Functions are authenticated as admin
3. Check request.auth.token.firebase.sign_in_provider
4. Use Firebase Console > Firestore > Security Rules > Simulator

Example error fix:

- Error: "Missing or insufficient permissions"
- Cause: Client trying to write to subscription
- Fix: Use Cloud Function for writes instead

CLOUD FUNCTION EXAMPLE:

// This should work (server-side write):
const admin = require('firebase-admin');
await admin.firestore()
.collection('users')
.doc(userId)
.collection('subscription')
.doc('current')
.update({
tier: 'pro',
updatedAt: admin.firestore.Timestamp.now(),
});

// This should fail (client-side write):
// import { updateDoc } from 'firebase/firestore';
// updateDoc(subscription_doc, { tier: 'pro' }); // ❌ Permission denied

PRODUCTION CHECKLIST:

Before going live:

- [ ] Remove development rules
- [ ] Test rules in simulator (100% success)
- [ ] Deploy to staging first
- [ ] Monitor for 24 hours
- [ ] Deploy to production
- [ ] Monitor Firestore logs
- [ ] Set up alerts for permission errors

SUPPORT & DEBUGGING:

If customers report tier not working:

1. Check Firestore subscription document exists
2. Verify tier field matches expected value
3. Check updatedAt is recent
4. Run rules simulator with customer's user ID
5. Check Cloud Function logs for errors

\*/
