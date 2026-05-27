# Beta Access Matrix

This document is the working checklist for beta-testers and QA. It turns the tier model into explicit accounts, capabilities, and proof points.

## Scope

- Free, Pro, Premium, and Enterprise are monetization tiers.
- Super-admin is a separate support role, not a monetization tier.
- The repository currently uses mocked or synthetic identities in automated tests, so the named accounts below need to be provisioned in the auth provider used for beta.

## Required Test Identities

| Identity           | Classification    | Required proof                                                                                               |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Free tester        | Monetization tier | Free plan loads, 2-vehicle limit applies, upgrade prompts appear for gated features                          |
| Pro tester         | Monetization tier | Pro-only features are enabled, 10-vehicle limit applies, calendar/reminder/export flows are available        |
| Premium tester     | Monetization tier | Premium-only features are enabled, 25-vehicle limit applies, ad-free and cloud-sync features are available   |
| Enterprise tester  | Monetization tier | Enterprise card and contract messaging render, enterprise entitlements resolve, org-level support flows work |
| Super-admin tester | Support role      | Support console access is granted, organization controls and finance drafts render                           |

## Tier Capability Checklist

### Free

- Verify the subscription page shows the Free plan as the active baseline.
- Verify the vehicle limit is 2.
- Verify gated features such as advanced reminders, calendar sync, AI analysis, export, and premium support are blocked.

### Pro

- Verify the vehicle limit is 10.
- Verify advanced reminders, calendar sync, AI analysis, PDF/Excel export, reduced ads, priority support, and multi-vehicle dashboard are enabled.
- Verify premium-only features remain blocked.

### Premium

- Verify the vehicle limit is 25.
- Verify ad-free, phone support, cloud sync, API access, predictive maintenance, and automation features are enabled.
- Verify enterprise contract messaging is still shown as a higher-tier path when applicable.

### Enterprise

- Verify contract-based vehicle messaging is shown.
- Verify enterprise entitlements resolve from the backend.
- Verify org bootstrap and support/admin handoff flows work end to end.

### Super-Admin

- Verify `/app/admin` is accessible only when support access resolves `isSuperAdmin: true`.
- Verify organization controls, member management, retention controls, and finance draft workflows are visible.

## Automated Coverage

- `packages/web/src/shared/__tests__/featureFlags.test.ts` covers the core tier rules.
- `packages/web/src/shared/__tests__/tierMatrix.test.ts` locks the full capability matrix.
- `packages/web/tests/SubscriptionPage.test.jsx` covers the plan card surface.
- `packages/web/tests/uat.spec.ts` covers the hosted subscription/admin smoke paths.
- `packages/web/tests/AdminSupport.test.tsx` covers the super-admin support console.

## Beta Exit Criteria

- Every required identity can sign in in the beta environment.
- Every tier check above is proven at least once in a live browser run.
- Any tier-specific blocker has a reproducible test case and owner.
