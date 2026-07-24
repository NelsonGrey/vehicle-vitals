# Monetization Implementation Guide

> **Current boundary (July 20, 2026):** This is a client integration reference.
> Effective entitlements, billing, quotas, and privileged operations are owned
> by the private Functions companion mounted at `packages/functions`. Use
> `REQUIREMENTS.md` for delivery status and `GO_LIVE_RUNBOOK.md` for release
> readiness.

**For**: Vehicle-Vitals Engineering Team  
**Status**: Phase 1 Complete - Use This Guide for Integration  
**Updated**: May 13, 2026

---

## Quick Start: Using Feature Flags in Components

### Basic Feature Gate

```typescript
import { useFeatureFlag, useSubscription } from '@/shared/useMonetization';

export function CalendarSyncButton() {
  const hasCalendarSync = useFeatureFlag('calendar_sync');
  const { tier } = useSubscription();

  if (!hasCalendarSync) {
    return (
      <button disabled title="Calendar sync is a Pro feature">
        Sync Calendar (Pro)
      </button>
    );
  }

  return <button>Sync Calendar</button>;
}
```

### Trigger Upgrade Prompt

```typescript
import { useUpgradePrompt, useFeatureFlag } from '@/shared/useMonetization';

export function AIAnalysisButton() {
  const hasAI = useFeatureFlag('ai_analysis');
  const { openUpgradeModal } = useUpgradePrompt();

  const handleClick = () => {
    if (!hasAI) {
      openUpgradeModal('pro', 'ai_analysis_button');
      return;
    }
    // Proceed with AI analysis
  };

  return (
    <button onClick={handleClick}>
      {hasAI ? 'Analyze Receipt' : 'Analyze Receipt (Pro)'}
    </button>
  );
}
```

### Check Vehicle Limit

```typescript
import { useVehicleLimit, useUpgradePrompt } from '@/shared/useMonetization';

export function AddVehicleButton() {
  const vehicleLimit = useVehicleLimit();
  const currentVehicles = useVehicleList();
  const { openUpgradeModal } = useUpgradePrompt();

  const handleAddVehicle = () => {
    if (currentVehicles.length >= vehicleLimit) {
      openUpgradeModal('pro', 'vehicle_limit_reached');
      return;
    }
    // Show add vehicle form
  };

  return (
    <button onClick={handleAddVehicle}>
      Add Vehicle ({currentVehicles.length} / {vehicleLimit})
    </button>
  );
}
```

---

## Quick Start: Using Ad Placements

### Add Ad to Component

```typescript
import { AdPlacement } from '@/components/AdPlacement';
import { shouldShowAd } from '@/shared/adPlacements';
import { useSubscription } from '@/shared/useMonetization';

export function Dashboard() {
  const { tier } = useSubscription();

  return (
    <div>
      <SiteHeader />

      {shouldShowAd('header', tier) && (
        <AdPlacement placement="header" />
      )}

      <VehicleList />
    </div>
  );
}
```

### Conditional Ad Rendering with Responsive Layout

```typescript
import { useAdCount } from '@/shared/useMonetization';
import { getActiveAdsForTier } from '@/shared/adPlacements';

export function EditVehicle() {
  const { tier } = useSubscription();
  const adCount = useAdCount();
  const ads = getActiveAdsForTier(tier);

  // Adjust grid: more ads = narrower main content
  const gridCols = adCount > 0 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      <MainContent />

      {ads.includes('sidebar') && (
        <aside>
          <AdPlacement placement="sidebar" />
        </aside>
      )}
    </div>
  );
}
```

---

## Quick Start: Quota System

### Check Quota Before Action

```typescript
import { getQuotaUsage, shouldPromptUpgrade } from '@/shared/quotaService';
import { useUpgradePrompt } from '@/shared/useMonetization';
import { useAuth } from '@/shared/AuthContext';

export function ReceiptUploadButton() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const { openUpgradeModal } = useUpgradePrompt();
  const [quotaUsage, setQuotaUsage] = useState(null);

  const handleUpload = async () => {
    const usage = await getQuotaUsage(
      user!.uid,
      'receiptsUpload',
      tier
    );

    if (usage.remainingInCycle <= 0) {
      alert(`Receipt quota exceeded. Resets ${usage.resetDate.toLocaleDateString()}`);
      if (shouldPromptUpgrade(usage, tier)) {
        openUpgradeModal('pro', 'receipt_quota_exceeded');
      }
      return;
    }

    // Proceed with upload
  };

  return <button onClick={handleUpload}>Upload Receipt</button>;
}
```

### Display Quota Usage

```typescript
import { getQuotaUsage, getQuotaWarningLevel, getQuotaMessage } from '@/shared/quotaService';

export function QuotaIndicator() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (user && tier !== 'free') {
      getQuotaUsage(user.uid, 'aiAnalysis', tier).then(setUsage);
    }
  }, [user, tier]);

  if (!usage) return null;

  const level = getQuotaWarningLevel(usage);
  const colors = {
    ok: 'bg-green-100',
    warning: 'bg-yellow-100',
    critical: 'bg-orange-100',
    exceeded: 'bg-red-100',
  };

  return (
    <div className={`p-2 rounded ${colors[level]}`}>
      <p>{getQuotaMessage(usage)}</p>
      <div className="w-full bg-gray-300 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full"
          style={{ width: `${usage.percentageUsed}%` }}
        />
      </div>
    </div>
  );
}
```

---

## Quick Start: Subscription Data

### Display User's Tier

```typescript
import { useSubscription } from '@/shared/useMonetization';
import { getTierBadge } from '@/shared/subscriptionService';

export function UserMenu() {
  const { tier, subscription } = useSubscription();
  const badge = getTierBadge(tier);

  return (
    <div>
      <span>{badge.badge} {badge.name}</span>
      {subscription && (
        <p className="text-xs">
          Renews {new Date(subscription.renewalDate?.toDate()).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
```

### Show Trial Countdown

```typescript
import { getTrialDaysRemaining, isInTrial } from '@/shared/subscriptionService';

export function TrialBanner() {
  const { subscription } = useSubscription();

  if (!subscription || !isInTrial(subscription)) {
    return null;
  }

  const daysLeft = getTrialDaysRemaining(subscription);

  return (
    <div className="bg-blue-100 p-4 rounded">
      <p>
        {daysLeft === 1
          ? 'Trial ends today!'
          : `${daysLeft} days left in your trial`}
      </p>
      <button onClick={() => navigateTo('/subscribe')}>
        Choose a plan
      </button>
    </div>
  );
}
```

---

## Analytics Events to Track

### When Creating Events

All analytics events are automatically tracked by the services. Here's what's tracked:

| Event                      | Triggered By              | Data Included                       |
| -------------------------- | ------------------------- | ----------------------------------- |
| `ad_impression`            | Ad rendered               | placement, tier, advertiser_id      |
| `ad_click`                 | User clicks ad            | placement, tier, campaign_id        |
| `tier_upgraded`            | Subscription upgraded     | old_tier, new_tier, source          |
| `feature_access_denied`    | User blocked from feature | feature, user_tier, required_tier   |
| `subscription_page_viewed` | User visits pricing page  | source, from_tier                   |
| `upgrade_modal_shown`      | Upgrade prompt displayed  | trigger, current_tier               |
| `payment_initiated`        | User starts checkout      | target_tier, billing_period, source |

### Manual Event Tracking (if needed)

```typescript
import {
  trackAdImpression,
  trackFeatureDenied,
  trackUpgradeModalAction,
} from '@/shared/adAnalytics';

// Track ad click manually
trackAdClick('sidebar', tier, 'firestone_shop');

// Track when user denies upgrade
trackUpgradeModalAction('closed', 'pro', 'free');
```

---

## Integration Checklist

### Before Launching Phase 1:

- [ ] Add feature flag checks to 5 most important features
- [ ] Add ad placements to Dashboard and MaintenanceList
- [ ] Update EditVehicle to enforce vehicle limit
- [ ] Create UpgradeModal component
- [ ] Create SubscriptionPage component
- [ ] Add unit tests (80%+ coverage)
- [ ] Update Firestore security rules
- [ ] Add environment variables to all envs
- [ ] Train team on new patterns
- [ ] Document any component-specific changes

### Before Each Release:

- [ ] Verify feature flags correctly gate features
- [ ] Verify ads only show to free/pro users
- [ ] Verify quota resets monthly
- [ ] Verify tier changes sync to Firestore
- [ ] Test upgrade flow end-to-end
- [ ] Verify analytics events firing

---

## Troubleshooting

### "Feature gate not working"

```typescript
// Debug: Check if feature is enabled
import { isFeatureEnabled, FEATURE_FLAGS } from '@/shared/featureFlags';

console.log(FEATURE_FLAGS.calendar_sync); // Check flag definition
console.log(isFeatureEnabled('calendar_sync', 'free')); // Should be false
console.log(isFeatureEnabled('calendar_sync', 'pro')); // Should be true
```

### "Subscription not loading"

```typescript
// Debug: Check if subscription loads
import { getSubscription } from '@/shared/subscriptionService';

const sub = await getSubscription(userId);
console.log('Subscription:', sub);
console.log('Tier:', sub.tier);
```

### "Ads not rendering"

```typescript
// Debug: Check ad system configuration
import { getAdSystemStatus, shouldShowAd } from '@/shared/adPlacements';

console.log(getAdSystemStatus());
// Check:
// - configured: true?
// - publisherId not 'NOT_SET'?
// - placementsConfigured has your placement?

console.log(shouldShowAd('header', 'free')); // Should be true
console.log(shouldShowAd('header', 'premium')); // Should be false
```

### "Quota not incrementing"

⚠️ **Quotas only increment from backend/Cloud Functions**. Client can read, but not write to quota documents. If quota isn't incrementing:

1. Check Cloud Function is calling `incrementQuotaUsage()`
2. Verify user has quota document for current month
3. Check Firestore security rules allow backend writes

---

## Performance Tips

1. **Memoize Subscription Hook**:

   ```typescript
   const subscription = useMemo(() => useSubscription(), []);
   ```

2. **Defer Ad Loading**:

   ```typescript
   // Load ads after main content renders
   <Suspense fallback={null}>
     <AdPlacement placement="sidebar" />
   </Suspense>
   ```

3. **Cache Quota Locally**:

   ```typescript
   import { quotaCache } from '@/shared/quotaService';

   // Quota cached for 5 minutes
   let usage = quotaCache.get(userId, 'aiAnalysis');
   if (!usage) {
     usage = await getQuotaUsage(userId, 'aiAnalysis', tier);
     quotaCache.set(userId, 'aiAnalysis', usage);
   }
   ```

---

## More Resources

- **Feature Flag Definitions**: `packages/web/src/shared/featureFlags.ts`
- **Subscription Schema**: `packages/web/src/shared/subscriptionService.ts` (comments)
- **Ad Placements Config**: `packages/web/src/shared/adPlacements.ts`
- **Strategy & Rationale**: `docs/MONETIZATION_STRATEGY.md`
- **Implementation Roadmap**: `docs/MONETIZATION_IMPLEMENTATION.md`

---

## Questions or Issues?

Contact: Mark Nelson (@mnelson3)  
Slack: #monetization-implementation  
GitHub: Create issue with `monetization:` prefix
