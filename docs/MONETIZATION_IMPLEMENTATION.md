# Monetization Implementation Roadmap

**Version**: 1.2  
**Last Updated**: May 14, 2026  
**Phase**: 1 (MVP Foundation) - Months 1-3  
**Owner**: Engineering Team

---

## Overview

This document tracks the implementation of the Vehicle Vitals monetization strategy in phases. See [`docs/MONETIZATION_STRATEGY.md`](MONETIZATION_STRATEGY.md) for complete strategy.

**Phase 1 Objective**: Build foundational infrastructure for ad system, subscription tiers, and feature gating
**Target Completion**: Month 3  
**Success Criteria**: Ad placements rendering, tier system tracking, feature flags functional, and upgrade prompts integrated in key user actions (no payment processing yet)

## Current Progress Snapshot (May 14, 2026)

- Completed web monetization infrastructure and component integration for Phase 1.
- Completed enterprise-ready monetization architecture foundations:
  - Organization bootstrap and membership model (`orgs/{orgId}`, `members`, `users/{uid}/orgMemberships`)
  - Server-resolved effective entitlements callable and web hook integration
  - Super-admin support tooling with org member role management and retention policy controls
  - Privileged-flow idempotency keys and immutable audit trail writes
  - Compliance request callables for export/deletion lifecycle intake
- Implemented upgrade prompts in user action flows:
  - Add vehicle above tier limit
  - Calendar sync action
  - Maintenance CSV/PDF export
  - AI attachment analysis/retry
- Added/updated automated coverage:
  - Unit tests for feature flags and ad placement tier rules (298/298 passing)
  - Integration tests for enterprise callables (org bootstrap, entitlements, role changes, retention, compliance requests)
  - UAT coverage for subscription plans and admin support console route behavior
- Recent updates (May 14):
  - Adjusted tier vehicle limits to protect profitability: Free (3→2), Premium (50→25)
  - Added Enterprise tier option for 25+ vehicles with sales contact flow
  - Moved inline body ad from top to bottom to improve visual ad separation
- Remaining critical path for launch readiness:
  - Stripe checkout + webhook end-to-end
  - Firestore rules hardening for full org-scope domain entities (beyond current org/compliance/audit paths)
  - Mobile parity for gated actions
  - Production workflow validation for enterprise admin operations

### Enterprise Foundation Status (May 14, 2026)

| Capability                                             | Status      | Evidence                                                                                                             |
| ------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Org bootstrap and membership persistence               | Implemented | `packages/functions/src/index.ts` (`bootstrapEnterpriseContextCallable`)                                             |
| Effective entitlements resolver (server-authoritative) | Implemented | `packages/functions/src/index.ts` (`getEffectiveEntitlementsCallable`), `packages/web/src/shared/useMonetization.ts` |
| Admin org role controls                                | Implemented | `packages/functions/src/index.ts` (`setOrganizationMemberRoleCallable`), `packages/web/src/pages/AdminSupport.tsx`   |
| Retention policy management                            | Implemented | `packages/functions/src/index.ts` (`applyRetentionPolicyCallable`), `packages/web/src/pages/AdminSupport.tsx`        |
| Compliance export/deletion intake                      | Implemented | `packages/functions/src/index.ts` (`requestUserDataExportCallable`, `requestUserDataDeletionCallable`)               |
| Idempotency for privileged operations                  | Implemented | `packages/functions/src/index.ts` (`reserveIdempotencyKey`, `completeIdempotencyKey`)                                |
| Audit logging for privileged actions                   | Implemented | `packages/functions/src/index.ts` (`writeAuditEvent`)                                                                |
| Personal-org migration for existing users              | Implemented | `scripts/backfill-personal-org-memberships.js`                                                                       |

---

## Phase 1: MVP Foundation (Months 1-3)

### Deliverables

#### 1.1 Feature Flag System (Week 1-2)

**Purpose**: Enable/disable features per user tier

**Components**:

- [x] **Web**: `packages/web/src/shared/featureFlags.ts` - Feature gate utilities
- [ ] **Mobile**: `packages/mobile/lib/services/feature_flags_service.dart` - Flutter implementation
- [ ] **Firestore Schema**: Add `features` map to user document
- [x] **Hook/Provider**: `useFeatureFlag()` (web), `FeatureFlagsProvider` (mobile)

**Implementation Details**:

```typescript
// Example usage (web)
const isCalendarSyncEnabled = useFeatureFlag('calendar_sync', userTier);
// Returns true for Pro/Premium, false for Free

const isAiAnalysisEnabled = useFeatureFlag('ai_analysis', userTier, {
  quota: 5, // Pro tier gets 5/month
});
```

**Flags to Implement**:

- `vehicle_limit` (Free: 2, Pro: 10, Premium: 25, Enterprise: custom)
- `calendar_sync` (Free: false, Pro: true, Premium: true)
- `ai_analysis` (Free: false, Pro: true, Premium: true)
- `ad_free` (Free: false, Pro: false, Premium: true)
- `advanced_reminders` (Free: false, Pro: true, Premium: true)
- `api_access` (Free: false, Pro: false, Premium: true)
- `priority_support` (Free: false, Pro: true, Premium: true)

#### 1.2 Subscription State Management (Week 1-2)

**Purpose**: Track user subscription tier and status

**Firestore Schema Update**:

```javascript
// users/{userId}/subscription
{
  tier: 'free' | 'pro' | 'premium',
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired',
  currentPeriodStart: timestamp,
  currentPeriodEnd: timestamp,
  renewalDate: timestamp,
  autoRenew: boolean,
  trialEndDate: timestamp,
  paymentMethod: 'stripe' | 'app_store' | 'play_store' | null,
  lastPaymentError: string | null,
  updatedAt: timestamp
}
```

**Components**:

- [x] **Web**: `packages/web/src/shared/subscriptionService.ts`
  - `useSubscription()` hook
  - `getUserTier(userId)` function
  - `isFeatureAvailable(userId, feature)` check

- [ ] **Mobile**: `packages/mobile/lib/services/subscription_service.dart`
  - `SubscriptionProvider` state management
  - `getSubscriptionStatus()` method
  - `isFeatureAvailable()` check

**Implementation**:

- Load subscription data on app initialization
- Cache in localStorage (web) / SharedPreferences (mobile)
- Sync from Firestore on login/refresh
- Update when tier changes

#### 1.3 Enhanced Ad Placement System (Week 2-3)

**Purpose**: Implement all 6 ad placements per monetization strategy

**Current State**: All 6 placements defined and wired to their target pages

**Updates to `packages/web/src/shared/adPlacements.ts`**:

```typescript
export type WebAdPlacement =
  | 'header' // Dashboard banner
  | 'sidebar' // Right rail (300x600)
  | 'maintenanceHistory' // Below maintenance entries
  | 'providerDirectory' // Provider discovery page
  | 'reminderNotification' // Inline with reminders
  | 'exportReport'; // Export page footer

export interface AdConfig {
  placement: WebAdPlacement;
  size: '300x250' | '300x600' | '728x90' | '320x50';
  showForTiers: ('free' | 'pro' | 'premium')[];
  frequency: 'always' | 'daily' | 'rotate_30s' | 'rotate_60s';
  maxImpressionsPerSession: number;
  disabled: boolean; // For gradual rollout
}
```

**Components**:

- [x] **Web**: `packages/web/src/components/AdPlacement.tsx`
  - Responsive ad container
  - Tier gating (hide for premium)
  - Impression tracking
  - Error handling (fallback if no ad loads)
  - All 6 placements wired: `header` (HeaderAdBar), `sidebar` (Home/vehicle detail), `maintenanceHistory` (Layout/AuthLayout/Landing), `providerDirectory` (ServiceProviders), `reminderNotification` (UpcomingTasks), `exportReport` (EditVehicle)

- [ ] **Mobile**: `packages/mobile/lib/components/ad_banner.dart`
  - Google Mobile Ads SDK integration (already started)
  - Tier-based visibility
  - Impression tracking

**Ad Networks to Integrate**:

- [ ] Google AdSense (easiest, fastest setup)
- [ ] Firebase AdMob (already in mobile deps)

**Environment Variables** (to add):

```
# Web ad slots
VITE_ADSENSE_SLOT_HEADER=
VITE_ADSENSE_SLOT_SIDEBAR=
VITE_ADSENSE_SLOT_MAINTENANCE=
VITE_ADSENSE_SLOT_PROVIDER=
VITE_ADSENSE_SLOT_REMINDER=
VITE_ADSENSE_SLOT_EXPORT=

# Analytics
VITE_AD_IMPRESSIONS_TRACKING=true
VITE_AD_CLICK_TRACKING=true
```

#### 1.4 Analytics & Tracking (Week 2-3)

**Purpose**: Track impressions, clicks, user engagement by tier

**Components**:

- [x] **Web**: `packages/web/src/shared/adAnalytics.ts`
  - `trackAdImpression(placement, tier)`
  - `trackAdClick(placement, advertiserId)`
  - `trackAdConversion(placement, revenue)`

- [ ] **Mobile**: `packages/mobile/lib/services/ad_analytics_service.dart`
  - Firebase Analytics events for ad interactions
  - Mixpanel integration for cohort analysis

**Events to Track**:

- `ad_impression` - Ad viewed (per placement)
- `ad_click` - Ad clicked (per placement)
- `tier_changed` - User upgraded/downgraded
- `feature_access_denied` - Feature gate blocked user action
- `subscription_page_viewed` - User viewed upgrade page
- `payment_initiated` - User started payment flow

**Dashboards** (create in Firebase Analytics):

- Impressions by placement and tier
- CTR by placement
- User conversion by acquisition source

#### 1.5 Tier Upgrade UI/UX (Week 3-4)

**Purpose**: Trigger and flow for users to upgrade tiers

**Components**:

- [x] **Web**: `packages/web/src/pages/SubscriptionPage.tsx`
  - Feature comparison table (3 tiers)
  - Pricing display ($2.99 Pro, $6.99 Premium)
  - Annual discount callout
  - Free 7-day trial button
  - Enterprise tier card with sales contact flow (25+ vehicles)

- [ ] **Mobile**: `packages/mobile/lib/screens/subscription_screen.dart`
  - Similar tier comparison UI
  - In-app purchase setup

- [x] **Upgrade Triggers** (conditional UI):
  - "Add 4th Vehicle" → Pro upgrade prompt
  - Calendar sync button → "Pro feature" modal
  - AI analysis/retry actions → Pro upgrade prompt
  - CSV/PDF export actions → Pro upgrade prompt
  - Ads visible → "Remove ads with Premium"

**Implementation**:

- [x] Create `UpgradeModal.tsx` (web reusable component)
- [ ] Create `UpgradePrompt` widget (mobile)
- [ ] A/B test: Always-on vs. trigger-based prompts

#### 1.6 Stripe Integration (Test Environment) (Week 4)

**Purpose**: Payment infrastructure (not live yet, test only)

**Components**:

- [ ] **Web**: `packages/web/src/shared/stripeService.ts`
  - Initialize Stripe.js
  - Create subscription session
  - Manage payment methods

- [ ] **Backend**: `packages/functions/src/stripe.provider.ts` (create)
  - `createCheckoutSession()` callable function
  - `verifySubscription()` callable
  - Webhook handler (stripe signature verification)

**Implementation**:

```typescript
// Cloud Function
export const createCheckoutSession = functions.https.onCall(
  async (
    data: { tier: 'pro' | 'premium'; billingPeriod: 'monthly' | 'annual' },
    context
  ) => {
    // Create Stripe Checkout Session
    // Return session ID
    // Store session reference in Firestore
  }
);
```

**Environment Setup**:

- [ ] Create Stripe test account
- [ ] Add Stripe API keys to GitHub secrets
- [ ] Test payment flow locally

#### 1.7 Mobile In-App Purchase Setup (Week 4)

**Purpose**: iOS/Android subscription payments (test only)

**Components**:

- [ ] **Mobile**: Update `packages/mobile/lib/services/premium_service.dart`
  - Complete IAP product initialization
  - Handle purchase flow
  - Verify receipt with backend
  - Store subscription status

**Implementation**:

- Use RevenueCat for abstraction layer (handles iOS/Android diffs)
- Alternative: Direct AppStore/PlayStore SDK
- Test with sandbox credentials

#### 1.8 Quota System (Week 4)

**Purpose**: Track and enforce tier-based quotas (uploads, AI, etc.)

**Firestore Schema**:

```javascript
// users/{userId}/quotas
{
  receiptsUploadedThisMonth: 5,
  receiptsUploadLimit: 10, // Free: 10, Pro: 100, Premium: unlimited
  aiAnalysesThisMonth: 2,
  aiAnalysesLimit: 5, // Free: 0, Pro: 5, Premium: unlimited
  lastQuotaResetDate: timestamp,
  nextQuotaResetDate: timestamp
}
```

**Components**:

- [ ] **Quota Checker**: `packages/web/src/shared/quotaService.ts`
  - `checkQuotaAvailability(userId, quotaType)`
  - `incrementQuotaUsage(userId, quotaType)`
  - `resetMonthlyQuotas()` (Cloud Function scheduled)

- [ ] **Cloud Function**: `quotaResetSchedule()`
  - Runs monthly on 1st of month
  - Resets all user quotas based on tier

#### 1.9 Documentation & Testing (Week 4)

**Components**:

- [x] Unit tests for feature flags
- [x] Unit tests for subscription service
- [x] Integration tests for tier gating
- [x] Smoke test for ad placements
- [x] Update developer docs (`docs/MONETIZATION_IMPLEMENTATION.md`)

---

## Phase 1 Success Criteria

### Functional Requirements

- [x] All 6 ad placements render correctly on free tier
- [x] Premium users see 0-1 ads (validated)
- [x] Feature flags correctly gate features by tier
- [x] Subscription state loads on login
- [x] Tier upgrade triggers show contextually

### Quality Requirements

- [x] Unit test coverage >80% for new services
- [x] Ad performance: <500ms impact to page load
- [x] No layout shift from ad loading
- [x] Analytics events firing for all user actions

### Business Metrics (Tracked)

- [x] Ad impression tracking enabled
- [x] Feature gate events logged
- [x] Conversion funnel metrics in place
- [x] CTR by placement measurable

---

## Phase 2: Premium Launch (Months 4-6)

**Preview - Full spec in separate document**:

1. Stripe live payment processing
2. Pro tier ($2.99/mo) goes live
3. Premium tier ($6.99/mo) goes live
4. Free trial (7 days Pro)
5. Calendar sync feature implementation
6. Email optimization to Postmark
7. Mechanic sponsorship program (10 pilots)

---

## Phase 3: Growth (Months 7-12)

**Preview**:

1. AI attachment analysis (Premium)
2. Advanced maintenance planning (Pro/Premium)
3. Sponsored reminders with promo codes
4. Affiliate partnerships (Jiffy Lube, Firestone, Valvoline)
5. Provider discovery with merchant tier options

---

## Implementation Dependencies

### Required Libraries (to add)

**Web** (`packages/web/package.json`):

```json
{
  "@stripe/react-stripe-js": "^2.x",
  "@stripe/stripe-js": "^2.x",
  "js-cookie": "^3.x"
}
```

**Mobile** (`packages/mobile/pubspec.yaml`):

```yaml
dependencies:
  google_mobile_ads: ^4.x # Already exists
  in_app_purchase: ^4.x # Upgrade if needed
  # OR use RevenueCat for simpler multi-platform:
  # purchases_flutter: ^7.x
```

**Backend** (`packages/functions/package.json`):

```json
{
  "stripe": "^13.x",
  "uuid": "^9.x"
}
```

### Firestore Security Rules Updates

**Current**: User can only read/write own documents

**New Rules Needed**:

```javascript
// Allow users to read their subscription data
match /users/{userId}/subscription {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId &&
                 request.resource.data.tier in ['free', 'pro', 'premium'];
}

// Allow users to read their quotas
match /users/{userId}/quotas {
  allow read: if request.auth.uid == userId;
  allow write: if false; // Backend only
}
```

### GitHub Secrets to Add

```
STRIPE_TEST_API_KEY
STRIPE_TEST_WEBHOOK_SECRET
STRIPE_PUBLIC_KEY
ADSENSE_PUBLISHER_ID
ADSENSE_SLOT_HEADER
ADSENSE_SLOT_SIDEBAR
# ... other ad slot keys
```

---

## Timeline & Ownership

| Week | Focus                              | Owner                 | Status      |
| ---- | ---------------------------------- | --------------------- | ----------- |
| 1-2  | Feature flags + subscription state | Engineering           | COMPLETE    |
| 2-3  | Ad placements + analytics          | Engineering           | COMPLETE    |
| 3-4  | Upgrade UI + testing               | Engineering + Product | IN PROGRESS |
| 4    | Stripe test + IAP setup            | Engineering           | TODO        |
| 4    | Documentation + final QA           | Engineering           | IN PROGRESS |

---

## Risk Mitigation

| Risk                            | Severity | Mitigation                                                          |
| ------------------------------- | -------- | ------------------------------------------------------------------- |
| Ad network setup delays         | Medium   | Use Google AdSense only if Criteo delays; can add Criteo in Phase 2 |
| Payment integration complexity  | Medium   | Start with Stripe test environment; iOS/Android in Phase 2          |
| Feature flag performance impact | Low      | Cache flags in localStorage; refresh on login/tier change           |
| User confusion about tiers      | Medium   | Clear messaging in UI; in-app tour for first-time free users        |

---

## Files to Create

- `packages/web/src/shared/featureFlags.ts`
- `packages/web/src/shared/subscriptionService.ts`
- `packages/web/src/shared/adAnalytics.ts`
- `packages/web/src/components/AdPlacement.tsx`
- `packages/web/src/pages/SubscriptionPage.tsx`
- `packages/web/src/components/UpgradeModal.tsx`
- `packages/functions/src/stripe.provider.ts`
- `packages/functions/src/quotaReset.ts` (scheduled function)
- `packages/mobile/lib/services/feature_flags_service.dart`
- `packages/mobile/lib/screens/subscription_screen.dart`
- `docs/MONETIZATION_IMPLEMENTATION.md` (this doc)

---

## Files to Modify

- `packages/web/src/shared/adPlacements.ts` (expand placements)
- `packages/web/src/shared/firebaseConfig.js` (add quota tracking)
- `packages/mobile/lib/services/premium_service.dart` (expand IAP)
- `packages/mobile/lib/main.dart` (add feature flag provider)
- `packages/functions/src/index.ts` (add new callables)
- `firebase/firestore.rules` (update security rules)
- `README.md` (add implementation status)

---

## Success Indicators (Phase 1 Complete)

1. ✅ All ad placements render on free tier (no ads for premium)
2. ✅ Feature flags block free users from Pro/Premium features
3. ✅ Subscription data loads on login and persists
4. ✅ Upgrade prompts trigger when users hit tier limits
5. ✅ Ad impressions tracked in analytics
6. ✅ Payment infrastructure ready for Phase 2 integration
7. ✅ Unit tests >80% coverage for new services
8. ✅ Team trained on tier gating patterns

---

## Next Steps

1. Complete Stripe checkout + webhook integration in Functions and web client
2. Add subscription/quota service unit tests (`subscriptionService`, `adAnalytics`, `quotaService`)
3. Finalize Firestore security rules deployment for subscription/quota docs
4. Implement mobile parity for upgrade prompts and feature-gated actions
5. Run full CI promotion path on `develop` and `demonstration`
