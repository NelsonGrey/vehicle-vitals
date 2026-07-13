# App Alignment Plan

Last updated: June 28, 2026

This document captures the changes needed on the web app (authenticated side) and iOS app to bring the product experience into alignment with the marketing site direction established in the June 2026 redesign.

The marketing site establishes the vision — persona-driven messaging, dark-and-teal aesthetic, plain-language copy, four clear tiers, proof-and-planning value props. The authenticated app and iOS app are where that promise gets kept. This plan closes the gap.

---

## What the marketing site now promises

### Identity
- Product name: Vehicle Vitals
- Tagline: "One garage for every vehicle record, reminder, and repair cost"
- Visual identity: dark slate-950 background, teal accent (#14b8a6), white text, Inter sans + Playfair Display serif headings
- Support: support@vehicle-vitals.com / sales@vehicle-vitals.com

### Five personas (with recommended tier paths)

| Persona | Title | Tier path |
|---|---|---|
| Ownership Records | Keep every service record ready when it matters | Free → Pro |
| Shared Garage | Coordinate every vehicle in one shared garage | Pro |
| Guided Setup | Know what to track from day one | Free → Pro |
| Hands-On Maintenance | Document the work you do yourself | Pro → Premium |
| Work Vehicles | Keep business vehicles ready, documented, and accountable | Premium → Enterprise |

### Four tiers

| Tier | Price | Vehicles | Tagline |
|---|---|---|---|
| Free | Free | 2 | Learn and document |
| Pro | $2.99/month | 10 | Plan and coordinate |
| Premium | $6.99/month | 25 | Forecast and automate |
| Enterprise | Custom | 25+ | Govern and integrate |

### Core product promises

1. **Proof when you need it** — maintenance history for resale, warranty, insurance, and mechanic conversations
2. **Fewer missed service moments** — visibility into upcoming work before it becomes urgent
3. **Plans that grow with the garage** — same product from first vehicle to household to light fleet

### Key product surfaces (as marketed)

- 3-step onboarding: Add vehicle → Track service and costs → Stay on top of what's next
- VIN Lookup — look up and auto-populate vehicle profile
- Maintenance Planning — schedule, reminders, upcoming tasks
- Ownership History — timeline, document portfolio, export
- Cross-Platform Access — same account on web and iOS

---

## Web App: Changes Needed

### 1. Post-signup onboarding flow (High priority)

**Gap**: After account creation, users land in the app with no structured path. The marketing site promises "Start in 3 simple steps" (`/start-steps`) but the in-app experience after sign-up does not walk users through those 3 steps.

**Change**: On first login (no vehicles in garage), redirect to or prominently surface a 3-step in-app onboarding guide:
1. Add your first vehicle (link to `/app/add-vehicle`)
2. Log your first service record (link to vehicle edit/records)
3. Review upcoming maintenance (link to `/app/upcoming`)

This should be a lightweight card or guided banner in the Home page when `vehicles.length === 0`, not a blocking modal.

### 2. Document Portfolio discoverability (High priority)

**Gap**: The Records/Portfolio page (`/app/records/:vin`) is a key marketed feature ("Proof when you need it") but it is hard to find. It requires navigating into a specific vehicle's detail view first, and there is no visual cue on the Garage page that it exists.

A top-level nav link is not the right fix — the route requires a VIN, so linking from the header would need to arbitrarily pick a vehicle or add a vehicle-selector step that adds friction.

**Change**: Surface Records directly on each vehicle card in the Garage (`Home.tsx`). Add a "Records" button or badge to the vehicle card that shows the document portfolio completion state (e.g., "3 of 8 documents ready" or a colored status dot). Clicking it navigates to `/app/records/:vin` for that vehicle. This puts the entry point exactly where users are already looking at their vehicles, which is the correct context for a per-vehicle feature.

### 3. Planning horizon indicator in Upcoming Tasks (Medium priority)

**Gap**: The marketing site promises 12-month planning (Pro) and 36-month planning (Premium), but the Upcoming Tasks UI does not visually communicate which horizon is active for the current user or prompt Free users to upgrade for longer visibility.

**Change**: Add a small "Showing next 3 months · Upgrade to Pro for 12-month view" banner at the top of the Upcoming Tasks page for Free tier users. Show equivalent messaging for Pro users re: Premium's 36-month horizon.

### 4. Tier taglines in Upgrade Modal and Subscription Page (Medium priority)

**Gap**: The upgrade modal and subscription page use tier names but not the marketing taglines ("Learn and document", "Plan and coordinate", "Forecast and automate", "Govern and integrate"). The marketing site uses these as the primary framing for each tier.

**Change**: Add the tagline as a subtitle below the tier name in the `UpgradeModal` component and on the `SubscriptionPage` tier cards. The taglines are already established in the marketing copy and should be consistent end-to-end.

### 5. Getting Started page routing (Low priority)

**Gap**: The `/getting-started` page is currently linked from the authenticated header nav as "Getting Started" for logged-in users. But `/getting-started` is a marketing/help page, not an in-app experience. This creates a jarring context switch for authenticated users.

**Change**: For logged-in users, the "Getting Started" header nav link should route to the in-app onboarding flow (change 1 above) or to the Help center (`/help`), not to the marketing guide page. Remove it from the authenticated header nav once the in-app onboarding surface exists.

### 6. Visual accent color alignment (Low priority / phased)

**Gap**: The marketing site uses teal (#14b8a6) as the primary accent. The authenticated app uses a mix of teal, green, and amber accent classes. The footer now uses the marketing dark-slate-950 / teal combination consistently, but the app interior pages still use lighter tones and inconsistent accent colors.

**Change**: Standardize authenticated app accent colors to teal (`teal-500` / `#14b8a6`) across interactive elements (buttons, active states, badges, focus rings). This is a phased cleanup — start with the most visible surfaces (primary CTAs, nav active states) and work inward. Do not redesign app page layouts; just normalize the accent token.

### 7. Persona-aware first-use messaging (Low priority / phased)

**Gap**: The marketing site invests heavily in persona-specific messaging (5 persona pages with tailored pain/outcome/workflow copy). Once a user signs up, all persona context is lost — the app treats all users identically.

**Change**: During sign-up or first login, optionally capture "What best describes your garage?" with the 5 persona options. Store the selection in user preferences. Use it to:
- Prioritize the relevant workflow suggestions in the onboarding banner (change 1)
- Show a persona-specific "recommended next step" on the Home page for new users
- Pre-select a suggested subscription tier in upgrade prompts

This does not gate or restrict any features — it just personalizes the initial experience.

---

## iOS App: Changes Needed

### 1. Document Portfolio parity (High priority)

**Gap**: The web Records page is a full document portfolio with file upload, AI-powered document analysis (extract cost, date, mileage from PDFs), ownership insights (maintenance spend, estimated value, monthly payment), and status tracking. The iOS `RecordsScreen` is more limited — it lacks the full portfolio category structure, in-app analysis display, and ownership insights panel.

**Change**: Elevate the iOS RecordsScreen to match web portfolio behavior:
- Show document portfolio categories and per-item status (missing / in-progress / ready)
- Display extracted analysis results (document category, service type, total cost, date, mileage) after upload
- Show ownership insights panel (maintenance spend, value estimates) matching the web
- This is the single largest feature parity gap between web and iOS.

### 2. Premium screen tier taglines (High priority)

**Gap**: The iOS `PremiumScreen` / `MarketingWelcomeScreen` shows tier names and feature lists but not the marketing taglines. Users who move from the marketing site to the iOS app encounter inconsistent framing.

**Change**: Add tier taglines ("Learn and document", "Plan and coordinate", "Forecast and automate", "Govern and integrate") as subtitles in the iOS subscription/premium screens. Ensure pricing ($2.99/$6.99/Custom) matches `TIER_PRICING` constants in `featureFlags.ts`.

### 3. 3-step onboarding alignment (High priority)

**Gap**: The iOS `OnboardingScreen` shows welcome messaging and premium highlights, but does not walk users through the "3 simple steps" promised on `/start-steps` (Add vehicle → Track service → Upcoming tasks). New users on iOS get a different first-run experience than what the marketing site leads them to expect.

**Change**: Restructure the iOS onboarding flow to mirror the 3-step model:
1. Step 1: Add your first vehicle (or VIN scan)
2. Step 2: Log a service record
3. Step 3: See your upcoming maintenance

This can be an onboarding carousel shown only on first launch (`hasCompletedOnboarding` flag in preferences).

### 4. Service Provider finder parity (Medium priority)

**Gap**: The web app has a full "Mechanics" feature with provider type filtering, radius selection, vehicle make matching for dealerships, and undo/broaden search behavior. The iOS app has a more limited service provider surface.

**Change**: Build iOS service provider finder to match web capability:
- Location-based search with configurable radius
- Provider type filtering (repair shops, dealerships, body shops, vehicle washes)
- Vehicle make matching for dealer results
- Surface via bottom nav or profile screen (currently accessible only through Profile on iOS)

### 5. Reminder preference controls (Medium priority)

**Gap**: The web Profile page exposes lead time (1–90 days) and average daily mileage (1–250 mi) sliders for reminder calculation. The iOS `ReminderPreferencesScreen` exists but may not expose the full range of Pro/Premium controls.

**Change**: Ensure iOS `ReminderPreferencesScreen` exposes the same controls as web, gated by subscription tier:
- Free: basic controls
- Pro/Premium: lead time slider (1–90 days) and daily miles slider (1–250 mi)
- Show upgrade prompt for Free users trying to access advanced controls

### 6. Planning horizon indicator (Medium priority)

**Gap**: Same gap as web — iOS Upcoming Tasks screen does not communicate the active planning horizon or prompt upgrades for longer visibility.

**Change**: Add "Showing next 3 months" / "Showing next 12 months" / "Showing next 36 months" indicator at the top of the iOS Upcoming Tasks screen, with a tier-appropriate upgrade nudge for Free and Pro users.

### 7. API key management (Low priority)

**Gap**: Web Profile page lets Premium users create/revoke API keys and configure a Zapier webhook endpoint. iOS has no equivalent.

**Change**: Add a "Developer Access" section to the iOS Account screen, visible to Premium/Enterprise users, with API key display and copy. Full key creation/revocation can route to the web Profile page for now (deep link or in-app browser).

### 8. Account consolidation flow (Low priority)

**Gap**: The web Profile page has an "account consolidation" feature to merge vehicles from a secondary account into a primary account. This is important for users who accidentally created separate web and mobile accounts. iOS does not surface this.

**Change**: Add a consolidation prompt to the iOS `AccountScreen` for users with `consolidationEligible` state. The prompt should explain the issue plainly ("Your web account may have vehicles not visible here") and guide users to the consolidation flow, which can initially route to the web app for completion.

---

## Shared / Cross-Cutting Changes

### Copy voice alignment

Both platforms should use plain-language, non-technical copy consistent with the marketing site. Specific terms to align:

| Current in app | Marketing site term | Notes |
|---|---|---|
| "Service records" | "Maintenance records" or "Records" | Either is fine; be consistent |
| "Provider" | "Mechanic" | Use "Mechanic" in user-facing copy, "provider" in code |
| "Garage" | "Garage" | Consistent — keep |
| "Upcoming tasks" | "What's next" / "Upcoming" | Use "Upcoming" in nav, fuller phrases in headings |
| "Portfolio" | "Records" | "Records" is the user-facing label; "portfolio" is internal |

### Support contact

Both web app and iOS app route to a Support form (name/email/topic/message) rather than displaying `support@vehicle-vitals.com` directly — submissions are emailed to that address server-side, with the submitter's address set as reply-to. The sales email (`sales@vehicle-vitals.com`) belongs only on the marketing/pricing surface, not in the authenticated app.

---

## Priority Order Summary

| Priority | Platform | Change |
|---|---|---|
| 1 | Web | Post-signup in-app onboarding flow (3 steps) |
| 2 | Web | Records badge/button on vehicle card in Garage (shows portfolio completion) |
| 3 | iOS | Document portfolio parity with web |
| 4 | iOS | 3-step onboarding alignment |
| 5 | iOS | Premium screen tier taglines |
| 6 | Web | Planning horizon indicator in Upcoming Tasks |
| 7 | iOS | Service provider finder parity |
| 8 | Web | Tier taglines in upgrade modal and subscription page |
| 9 | iOS | Reminder preference controls parity |
| 10 | iOS | Planning horizon indicator |
| 11 | Web | Getting Started link routing for authenticated users |
| 12 | iOS | API key management surface |
| 13 | iOS | Account consolidation prompt |
| 14 | Web | Persona-aware first-use messaging |
| 15 | Web | Visual accent color normalization |

Items 1–5 should be addressed before or alongside R1 launch (web-only free tier path). Items 6–10 should be completed before iOS public launch. Items 11–15 are R2 polish work.

---

## What does NOT need to change

- The authenticated app's overall page structure (Garage, Timeline, Upcoming, Mechanics, Profile) is sound and does not need restructuring.
- The existing Firestore data model supports all of these changes — no schema migrations are required.
- The subscription/entitlement backend is already implemented; these are UI alignment changes only.
- The marketing site's dark-slate-950 aesthetic is correct for marketing pages. The authenticated app can remain lighter — the key alignment is accent color and copy voice, not a dark-mode-everywhere mandate.
