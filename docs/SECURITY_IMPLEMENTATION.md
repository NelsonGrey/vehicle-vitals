# Vehicle-Vitals - Security Implementation Guide

**Version**: 1.1
**Last Reviewed**: July 20, 2026
**Status**: Supporting security reference; executable rules/code and current alert state take precedence
**Owner**: Mark Nelson  
**Classification**: INTERNAL USE ONLY

---

> Do not copy embedded rule or code examples into production. The current rule
> sources are `firebase/firestore.rules` and `firebase/storage.rules`; current
> server controls live in the private Functions companion mounted at
> `packages/functions`. See `SECURITY_BEST_PRACTICES_REPORT.md` and
> `GO_LIVE_RUNBOOK.md` for point-in-time validation.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication Security](#authentication-security)
3. [Authorization & Access Control](#authorization--access-control)
4. [Data Protection](#data-protection)
5. [Firestore Security Rules](#firestore-security-rules)
6. [API Security](#api-security)
7. [Client-Side Security](#client-side-security)
8. [Secrets Management](#secrets-management)
9. [Security Best Practices](#security-best-practices)
10. [Incident Response](#incident-response)

---

## Security Overview

### Security Principles

Vehicle-Vitals follows these core security principles:

1. **Defense in Depth**: Multiple layers of security (authentication, authorization, validation)
2. **Least Privilege**: Users can only access their own data
3. **Zero Trust**: Never trust client input, always validate server-side
4. **Encryption Everywhere**: Data encrypted at rest and in transit
5. **Audit Trail**: All data changes tracked with timestamps

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  ┌─────────────────────────────────────────────────┐       │
│  │  - Input Validation                              │       │
│  │  - HTTPS Only                                    │       │
│  │  - XSS Protection                                │       │
│  │  - CSRF Protection (Firebase handles)           │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ HTTPS/TLS 1.3
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  FIREBASE LAYER                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  Firebase Authentication (Auth Layer)           │       │
│  │  - Email/Password (bcrypt hashing)              │       │
│  │  - Session Token (JWT)                          │       │
│  │  - Token Refresh                                │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  Firestore Security Rules (Authorization)       │       │
│  │  - User-scoped data access                      │       │
│  │  - Server-side validation                       │       │
│  │  - Schema enforcement                           │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  Cloud Firestore (Data Layer)                   │       │
│  │  - Encryption at rest (AES-256)                 │       │
│  │  - Encryption in transit (TLS 1.3)              │       │
│  │  - Automatic backups                            │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Threat Model

**Potential Threats**:

1. **Unauthorized Data Access**: User accessing another user's vehicles
2. **Data Manipulation**: Injecting invalid data into Firestore
3. **Credential Theft**: Password/token compromise
4. **XSS Attacks**: Injecting malicious scripts via user input
5. **DDoS**: Overwhelming Firebase Functions with requests

**Mitigations**:

- Firestore security rules enforce user isolation
- Server-side validation in security rules and Functions
- Firebase Auth handles credential storage securely
- React automatically escapes user input
- Firebase Functions have built-in rate limiting

---

## Authentication Security

### Firebase Authentication

**Authentication Methods**:

- **Email/Password**: Primary authentication method
- **Anonymous Auth** (Development only): For testing without account creation

#### Password Requirements

**Client-Side Enforcement**:

```typescript
// Password validation rules
const PASSWORD_MIN_LENGTH = 8;

const validatePassword = (
  password: string
): { valid: boolean; error?: string } => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
};
```

**Firebase Configuration**:

```javascript
// Firebase Console Settings
// Authentication > Sign-in method > Email/Password
// - Require email verification: YES
// - Password recovery: YES
// - Multi-factor authentication: OPTIONAL (future)
```

#### Session Management

**Token Lifecycle**:

```typescript
// Firebase Auth automatically handles:
// - Token generation (JWT with 1-hour expiry)
// - Token refresh (automatic when expired)
// - Token revocation (on sign out or password change)

import { onIdTokenChanged } from 'firebase/auth';

// Monitor auth state changes
onIdTokenChanged(auth, async user => {
  if (user) {
    // User signed in, token refreshed
    const token = await user.getIdToken();
    console.log('Auth token refreshed');
  } else {
    // User signed out
    console.log('User signed out');
  }
});
```

**Session Timeout**:

- Firebase Auth tokens expire after **1 hour**
- Tokens automatically refreshed on Firestore/Functions calls
- User remains authenticated until explicit sign-out

#### Sign-Up Security

```typescript
// Secure user registration
export const signUp = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Send email verification
    await sendEmailVerification(user);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: false,
    });

    return user;
  } catch (error: any) {
    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already registered');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak');
    } else {
      throw error;
    }
  }
};
```

#### Password Reset

```typescript
// Secure password reset flow
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);

    // Firebase sends email with reset link:
    // https://vehicle-vitals.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC123

    console.log('Password reset email sent');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // Don't reveal if email exists (security best practice)
      console.log('If account exists, password reset email sent');
    } else {
      throw error;
    }
  }
};
```

---

## Authorization & Access Control

### User-Scoped Data Model

**Principle**: Every document has a `userId` field that matches the authenticated user's UID.

```typescript
interface Resource {
  userId: string; // Owner of this resource
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // ... other fields
}
```

### Firestore Security Rules

**Rule Structure**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidTimestamp(timestamp) {
      return timestamp is timestamp;
    }

    // ... (See full rules below)
  }
}
```

---

## Data Protection

### Encryption

#### At Rest

- **Firestore**: Automatically encrypts all data with AES-256
- **Firebase Storage**: Files encrypted with AES-256
- **No action required**: Firebase handles encryption transparently

#### In Transit

- **HTTPS/TLS 1.3**: All client-to-Firebase communication encrypted
- **Firebase SDK**: Enforces HTTPS by default
- **No HTTP fallback**: Blocks insecure connections

```typescript
// Firebase SDK automatically uses HTTPS
// No configuration needed

// Example: Firestore write (automatically HTTPS)
await setDoc(doc(db, 'vehicles', vehicleId), vehicleData);
```

### Data Minimization

**Principle**: Only collect and store necessary data.

**What We Store**:

- ✅ Email (required for authentication)
- ✅ Vehicle information (VIN, make, model, year, mileage)
- ✅ Maintenance records (service type, date, cost)
- ✅ User preferences (theme, notification settings)

**What We DON'T Store**:

- ❌ Social Security Numbers
- ❌ Credit card information (use Stripe for payments)
- ❌ Driver's license numbers
- ❌ Precise GPS location (not needed)
- ❌ Phone numbers (unless user provides for notifications)

### PII (Personally Identifiable Information)

**PII Data**:

- Email addresses
- Display names

**PII Protection**:

```javascript
// Firestore Security Rules: Only owner can read PII
match /users/{userId} {
  allow read: if isAuthenticated() && isOwner(userId);
  allow write: if isAuthenticated() && isOwner(userId);
}

// Never expose PII in logs
logger.info('User created vehicle', {
  userId: user.uid,  // ✅ Use UID (not PII)
  email: '[REDACTED]'  // ❌ Don't log email
});
```

### Data Retention

**Policy**:

- **User Data**: Retained until account deletion
- **Audit Logs**: 90 days (Firebase Functions logs)
- **Backups**: Automatic daily backups (30-day retention)

**User Data Deletion**:

```typescript
// Delete user account and all associated data
export const deleteAccount = async (userId: string) => {
  // 1. Delete all vehicles
  const vehiclesSnapshot = await getDocs(
    query(collection(db, 'vehicles'), where('userId', '==', userId))
  );

  const batch = writeBatch(db);
  vehiclesSnapshot.forEach(doc => {
    batch.delete(doc.ref);
    // Note: Subcollections (maintenance) need separate deletion
  });
  await batch.commit();

  // 2. Delete user document
  await deleteDoc(doc(db, 'users', userId));

  // 3. Delete Firebase Auth account
  await deleteUser(auth.currentUser);

  console.log('User account and data deleted');
};
```

---

## Firestore Security Rules

### Complete Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ==================== HELPER FUNCTIONS ====================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function incomingData() {
      return request.resource.data;
    }

    function existingData() {
      return resource.data;
    }

    function isValidTimestamp(field) {
      return incomingData()[field] == request.time;
    }

    // ==================== USERS COLLECTION ====================

    match /users/{userId} {
      // Users can only read/write their own profile
      allow read: if isAuthenticated() && isOwner(userId);

      allow create: if isAuthenticated()
                    && isOwner(userId)
                    && incomingData().email is string
                    && incomingData().email == request.auth.token.email;

      allow update: if isAuthenticated() && isOwner(userId);

      allow delete: if isAuthenticated() && isOwner(userId);
    }

    // ==================== VEHICLES COLLECTION ====================

    match /vehicles/{vehicleId} {

      // Users can read their own vehicles
      allow read: if isAuthenticated() && isOwner(existingData().userId);

      // Users can create vehicles with their userId
      allow create: if isAuthenticated()
                    && isOwner(incomingData().userId)
                    && isValidVehicle();

      // Users can update their own vehicles
      allow update: if isAuthenticated()
                    && isOwner(existingData().userId)
                    && isOwner(incomingData().userId)
                    && isValidVehicle();

      // Users can delete their own vehicles
      allow delete: if isAuthenticated() && isOwner(existingData().userId);

      // Validate vehicle data structure
      function isValidVehicle() {
        let data = incomingData();
        return data.userId is string
            && data.vin is string
            && data.vin.size() == 17
            && data.vin.matches('^[A-HJ-NPR-Z0-9]{17}$')
            && data.make is string
            && data.model is string
            && data.year is int
            && data.year >= 1900
            && data.year <= 2100
            && data.mileage is int
            && data.mileage >= 0
            && data.createdAt is timestamp
            && data.updatedAt is timestamp;
      }

      // ==================== MAINTENANCE SUBCOLLECTION ====================

      match /maintenance/{maintenanceId} {

        // Users can read maintenance if they own parent vehicle
        allow read: if isAuthenticated()
                    && isOwner(get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.userId);

        // Users can create maintenance for their vehicles
        allow create: if isAuthenticated()
                      && isOwner(get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.userId)
                      && isValidMaintenance();

        // Users can update/delete maintenance for their vehicles
        allow update, delete: if isAuthenticated()
                              && isOwner(get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.userId);

        // Validate maintenance record structure
        function isValidMaintenance() {
          let data = incomingData();
          return data.serviceType is string
              && data.date is string
              && data.mileage is int
              && data.mileage >= 0
              && (!('cost' in data) || data.cost is number)
              && data.provider is string
              && data.notes is string
              && data.createdAt is timestamp
              && data.updatedAt is timestamp;
        }
      }
    }

    // ==================== DEFAULT DENY ====================

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Testing Security Rules

**Firebase Emulator Tests**:

```typescript
// firestore.rules.test.ts
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('allows users to read their own vehicles', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const vehicleRef = alice.firestore().collection('vehicles').doc('vehicle1');

    // Create vehicle owned by alice
    await testEnv.withSecurityRulesDisabled(async context => {
      await context.firestore().collection('vehicles').doc('vehicle1').set({
        userId: 'alice',
        vin: 'ABC123',
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        mileage: 25000,
      });
    });

    // Alice can read her own vehicle
    await assertSucceeds(vehicleRef.get());
  });

  it('denies users from reading other users vehicles', async () => {
    const bob = testEnv.authenticatedContext('bob');
    const vehicleRef = bob.firestore().collection('vehicles').doc('vehicle1');

    // Create vehicle owned by alice
    await testEnv.withSecurityRulesDisabled(async context => {
      await context.firestore().collection('vehicles').doc('vehicle1').set({
        userId: 'alice',
        vin: 'ABC123',
      });
    });

    // Bob cannot read alice's vehicle
    await assertFails(vehicleRef.get());
  });
});
```

**Run Tests**:

```bash
npm run test:emulator
```

---

## API Security

### Firebase Functions Security

#### Authentication Enforcement

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Callable function with auth check
export const protectedFunction = onCall(async request => {
  // request.auth is populated by Firebase
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const userEmail = request.auth.token.email;

  // Function logic...
});
```

#### Input Validation

```typescript
// Validate and sanitize all inputs
export const vinLookup = onRequest({ cors: true }, async (req, res) => {
  const { vin } = req.body;

  // Type validation
  if (typeof vin !== 'string') {
    res.status(400).json({ error: 'VIN must be a string' });
    return;
  }

  // Format validation
  if (vin.length !== 17) {
    res.status(400).json({ error: 'VIN must be 17 characters' });
    return;
  }

  // Pattern validation
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    res.status(400).json({ error: 'Invalid VIN format' });
    return;
  }

  // Sanitize input
  const sanitizedVIN = vin.toUpperCase().trim();

  // Process request...
});
```

#### Rate Limiting

```typescript
// Firebase Functions v2 built-in rate limiting
export const vinLookup = onRequest(
  {
    cors: true,
    maxInstances: 10, // Limit concurrent executions
    timeoutSeconds: 60, // Timeout after 60 seconds
    memory: '256MiB', // Resource limits
  },
  async (req, res) => {
    // Function logic...
  }
);
```

**Additional Rate Limiting** (Future):

```typescript
// Use Firebase App Check for additional DDoS protection
import { getAppCheck } from 'firebase-admin/app-check';

export const protectedFunction = onCall(async request => {
  // Verify App Check token
  if (!request.app) {
    throw new HttpsError(
      'failed-precondition',
      'App Check verification failed'
    );
  }

  // Function logic...
});
```

### CORS Configuration

```typescript
// Enable CORS for specific origins (production)
import * as cors from 'cors';

const corsOptions = {
  origin: [
    'https://vehicle-vitals.com',
    'https://www.vehicle-vitals.com',
    'https://staging.vehicle-vitals.com',
  ],
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const vinLookup = onRequest(async (req, res) => {
  cors(corsOptions)(req, res, async () => {
    // Function logic...
  });
});
```

---

## Client-Side Security

### XSS (Cross-Site Scripting) Prevention

**React Auto-Escaping**:

```typescript
// React automatically escapes user input
const VehicleCard = ({ vehicle }) => {
  return (
    <div>
      {/* User input automatically escaped */}
      <h3>{vehicle.make} {vehicle.model}</h3>
      <p>{vehicle.notes}</p>
    </div>
  );
};
```

**Dangerous HTML** (avoid):

```typescript
// ❌ DON'T: Use dangerouslySetInnerHTML unless absolutely necessary
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ DO: Sanitize if you must use HTML
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### CSRF (Cross-Site Request Forgery) Prevention

**Firebase Handles CSRF**:

- Firebase Auth tokens include anti-CSRF protection
- Firestore SDK automatically includes tokens in requests
- No additional CSRF tokens needed

### Content Security Policy (CSP)

**Firebase Hosting Headers** (`firebase.json`):

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ]
  }
}
```

---

## Secrets Management

### Environment Variables

**Web Application**:

```bash
# .env.development (NOT committed to Git)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=vehicle-vitals-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vehicle-vitals-dev
```

**Mobile Application**:

```dart
// Firebase options generated by FlutterFire CLI
// lib/firebase_options.dart (committed, API keys are public)
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return FirebaseOptions(
      apiKey: 'AIza...',  // Public, not a secret
      projectId: 'vehicle-vitals-prod',
      // ...
    );
  }
}
```

**Note**: Firebase API keys are **not secrets**. They identify your Firebase project and are safe to include in client apps. Security is enforced by Firestore security rules, not API keys.

### GitHub Secrets (CI/CD)

**Setting Secrets**:

1. Go to GitHub repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Add only the repository secrets consumed by the active workflow. The
   current Firebase deployment credential is `FIREBASE_TOKEN`; the private
   backend checkout uses `FUNCTIONS_REPO_PAT`. Environment-specific public web
   Firebase values use the `VITE_FIREBASE_*_<ENVIRONMENT>` families.

**Using Secrets in Workflows**:

```yaml
# Excerpt pattern from .github/workflows/master-pipeline.yml
jobs:
  deploy-firebase:
    # ...quality/build dependencies omitted...
    steps:
      - name: Checkout Functions
        uses: actions/checkout@v7
        with:
          repository: NelsonGrey/vehicle-vitals-functions
          token: ${{ secrets.FUNCTIONS_REPO_PAT }}
          path: packages/functions
```

The full active inventory is in `PROD_SETUP_GUIDE.md`. Do not add an unused
service-account secret and assume the workflow consumes it.

### Firebase Admin SDK Credentials

**Service Account Key**:

```typescript
// Firebase Functions automatically have admin credentials
// No manual configuration needed

import * as admin from 'firebase-admin';

// Initialize with default credentials (in Firebase environment)
admin.initializeApp();

// Use admin SDK
const db = admin.firestore();
```

**Local Development**:

```bash
# Download service account key from Firebase Console
# Project Settings > Service Accounts > Generate New Private Key

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"

# Run functions locally
npm run serve
```

---

## Security Best Practices

### Code Review Checklist

Before merging code, verify:

- [ ] **No hardcoded secrets** in code (API keys, passwords)
- [ ] **User input validated** server-side (Firestore rules or Functions)
- [ ] **Authentication required** for protected resources
- [ ] **Authorization enforced** (user can only access own data)
- [ ] **HTTPS only** (no HTTP endpoints)
- [ ] **SQL injection not possible** (Firestore is NoSQL, but validate queries)
- [ ] **XSS prevention** (React auto-escapes, sanitize HTML if needed)
- [ ] **Error messages don't leak sensitive info** (e.g., "user not found" vs "invalid credentials")
- [ ] **Audit logs include userId** for accountability

### Security Testing

**Regular Security Tests**:

```bash
# Run Firestore security rules tests
npm run test:emulator

# Run dependency vulnerability scan
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated
```

**Firebase Security Checklist** (Monthly):

1. Review Firestore security rules
2. Rotate Firebase Admin SDK keys
3. Review Firebase Console access logs
4. Check for unusual API usage patterns
5. Update dependencies

---

## Incident Response

### Security Incident Classifications

**P0 - Critical**: Data breach, unauthorized access
**P1 - High**: Credential compromise, DDoS attack
**P2 - Medium**: Vulnerability discovered, suspicious activity
**P3 - Low**: Policy violation, minor configuration issue

### Response Procedures

#### Data Breach (P0)

1. **Immediate Actions** (within 1 hour):
   - Disable affected user accounts
   - Rotate Firebase API keys
   - Block malicious IP addresses (Cloud Armor)
   - Notify team lead

2. **Investigation** (within 24 hours):
   - Review Firestore access logs
   - Identify scope of breach
   - Document timeline of events

3. **Remediation** (within 48 hours):
   - Patch vulnerability
   - Deploy security fix
   - Notify affected users
   - File incident report

#### Credential Compromise (P1)

1. **Immediately**:
   - Reset compromised passwords
   - Revoke auth tokens
   - Force re-authentication

2. **Within 24 hours**:
   - Audit account activity
   - Check for unauthorized changes
   - Notify user

### Contact Information

**Security Team**:

- **Email**: security@vehicle-vitals.com
- **On-Call**: [PagerDuty/Phone Number]
- **Slack**: #security-incidents

**Reporting Security Issues**:

- Email: security@vehicle-vitals.com
- Subject: [SECURITY] Brief description
- Include: Steps to reproduce, impact assessment

---

## Appendix

### Security Resources

**Firebase Security**:

- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Security Checklist](https://firebase.google.com/docs/rules/security-checklist)
- [Common Security Pitfalls](https://firebase.google.com/docs/rules/pitfalls)

**OWASP Top 10**:

- https://owasp.org/www-project-top-ten/

**Security Testing Tools**:

- **npm audit**: Dependency vulnerability scanning
- **ESLint Security Plugin**: Code security linting
- **Firebase Emulator**: Test security rules locally

### Compliance

**GDPR Compliance** (if applicable):

- Right to access: Users can export data (data export feature)
- Right to deletion: Users can delete accounts and data
- Data minimization: Only collect necessary data
- Consent: Users agree to Terms of Service

**CCPA Compliance** (California residents):

- Privacy Policy disclosure
- User data deletion on request
- No sale of personal information

---

**Document Classification**: INTERNAL USE ONLY  
**Document Revision History**:

- **v1.0** (Feb 16, 2026): Initial security implementation guide

**Maintained By**: Mark Nelson (Security Lead)  
**Review Cycle**: Quarterly or after security incidents  
**Next Review**: May 16, 2026  
**Feedback**: Email security@vehicle-vitals.com
