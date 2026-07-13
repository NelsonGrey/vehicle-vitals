# Vehicle Vitals - Product Design & Feature Specifications

**Version**: 1.2
**Last Updated**: June 28, 2026
**Status**: 🟡 CORE SHIPPED — web and iOS core flows active; app/marketing alignment in progress (see docs/APP_ALIGNMENT_PLAN.md)
**Owner**: Mark Nelson

---

## Document Relationship

This document describes product vision, persona definitions, tier structure, UX direction, and phased roadmap.

- Delivery truth for active releases is tracked in `docs/REQUIREMENTS.md`.
- App and iOS changes needed to align with marketing direction are in `docs/APP_ALIGNMENT_PLAN.md`.
- Planned and aspirational capabilities in this document are not implied as currently shipped.
- When delivery status differs between documents, defer to `docs/REQUIREMENTS.md` for implementation state.

---

## Product Vision

**Tagline**: "One garage for every vehicle record, reminder, and repair cost."

**Positioning**: Vehicle Vitals is a cross-platform vehicle management platform that lets owners track service history, plan upcoming maintenance, and build a credible ownership record — across personal vehicles, shared household vehicles, and light business fleets.

**Core value propositions**:

- **Proof when you need it**: Maintenance history for resale conversations, warranty claims, insurance discussions, and mechanic visits. A clean record makes every ownership moment more confident.
- **Fewer missed service moments**: Visibility into upcoming work before it becomes urgent or expensive. Planning beats reacting.
- **Plans that grow with the garage**: The same product works from a first vehicle to a household fleet to a light business — tiered to match the level of coordination needed.

---

## Personas

Vehicle Vitals serves five core personas. Each has a distinct pain point, outcome, and recommended tier path.

| ID | Nav label | Title | Pain | Outcome | Tier path |
|---|---|---|---|---|---|
| `owners` | Ownership Records | Ownership records | Records scattered; no clear service history | Keep every service record ready when it matters | Free → Pro |
| `households` | Shared Garage | Shared garage | Multiple vehicles, multiple drivers, no coordination | Coordinate every vehicle in one shared garage | Pro |
| `new-drivers` | Guided Setup | Guided setup | Unfamiliar with maintenance; uncertain what to do next | Know what to track from day one | Free → Pro |
| `diy-maintainers` | Hands-On Maintenance | Hands-on maintenance | No good way to document self-performed work | Document the work you do yourself, with receipts | Pro → Premium |
| `light-fleets` | Work Vehicles | Work vehicles | Vehicle spreadsheets; no operating visibility | Keep business vehicles ready, documented, and accountable | Premium → Enterprise |

Persona detail pages live at `/personas/:id`. Each page shows the pain/outcome narrative, a 3-step workflow, a recommended plan path, and a link to the relevant feature demo.

---

---

## Implementation Reality Snapshot (Code-Verified: June 28, 2026)

This document contains both product vision and delivery claims. The matrix below reflects current implementation evidence in the repository.

| Capability | Current Status | Evidence / Notes |
| --- | --- | --- |
| Multi-vehicle management | 🟢 Implemented | Web CRUD in `Home.tsx`, `AddVehicle.tsx`, `EditVehicle.tsx`; iOS in `firestore_service.dart`; active/stored status on both platforms |
| VIN lookup / auto-populate | 🟢 Implemented | Callable in `functions/src/index.ts`; web `AddVehicle.tsx` and iOS `ScanVinScreen` consume it |
| Maintenance logging + timeline | 🟢 Implemented | Web: `EditVehicle.tsx`, `TimelineDashboard.tsx`; iOS: `MaintenanceListScreen`, `TimelineDashboardScreen` |
| Document portfolio + AI analysis | 🟡 Partial (web only) | Web: full portfolio with file upload and analysis in `Records.tsx`; iOS: `RecordsScreen` exists but lacks analysis display and ownership insights — see APP_ALIGNMENT_PLAN.md |
| Smart reminders (dismiss/snooze/complete) | 🟢 Implemented | Full lifecycle on web (`UpcomingTasks.tsx`) and iOS (`upcoming_tasks_screen.dart`); delivery outcome persisted |
| Reminder scheduling and delivery | 🟡 Partial | Scheduled sweep in functions; web manual send works; production delivery reliability not yet validated |
| Email + push notifications | 🟡 Partial | Email via `email.provider.ts`; web FCM in `notificationService.js`; iOS FCM in `notification_service.dart`; production reliability open |
| Calendar integration | 🟢 Implemented | Callable in functions; web and iOS both create calendar events (Google/Apple/ICS); provider-account validation still needed |
| Data export (PDF/CSV) | 🟡 Partial | Web: PDF + CSV in `dataExport.js`; iOS: `data_export_service.dart`; cross-platform output parity not formally validated |
| Service provider directory | 🟡 Partial (web only) | Web: `ServiceProviders.tsx` with location, radius, and type filters; iOS parity still needed |
| Four-tier subscriptions + entitlements | 🟢 Implemented | Web: `featureFlags.ts` + backend callable; iOS: `premium_service.dart` + subscription screen; production billing not yet validated |
| Marketing site + persona pages | 🟢 Implemented | 5 persona pages, 4 feature demos, pricing, help, video tours, screen gallery — deployed |
| App / marketing alignment | 🟡 In progress | See `docs/APP_ALIGNMENT_PLAN.md` — onboarding, Records nav, tier taglines, iOS portfolio parity are priority items |
| Fleet manager workflows | ⏸ Planned | Enterprise org plumbing exists; fleet dashboard and role controls not yet built |
| Budget forecasting depth | 🟡 Partial | Web: `CostAnalysisReportlet.tsx`; iOS: `analytics_screen.dart`; richer models and filters not yet built |

Legend:

- `🟢 Implemented`: production-capable in current code paths
- `🟡 Partial`: implemented in limited surfaces or missing complete UX/operational coverage
- `🔴 Not implemented`: interface or contract exists but behavior not built
- `⏸ Planned`: product intent only

---

## Subscription Tiers & Feature Gating

**Strategy**: Freemium model with four tiers. Each tier has a clear tagline that doubles as the positioning statement used in marketing copy and in-app upgrade prompts.

### Tier Overview

| Tier | Price | Vehicles | Tagline | Primary audience |
|---|---|---|---|---|
| **Free** | Free | 2 | Learn and document | First-time users, single-vehicle owners exploring the product |
| **Pro** | $2.99/month | 10 | Plan and coordinate | Shared garages and active owners who want planning and calendar sync |
| **Premium** | $6.99/month | 25 | Forecast and automate | Hands-on maintainers, power users who want AI, exports, and API access |
| **Enterprise** | Custom | 25+ | Govern and integrate | Work vehicle operators and business users who need policy controls and integrations |

### Feature Comparison

| Feature | Free | Pro | Premium | Enterprise |
|---|---|---|---|---|
| **Vehicles** | 2 | 10 | 25 | 25+ (contract) |
| **Maintenance reminders** | Basic (mileage) | Advanced (time + mileage) | Advanced + predictive AI | Org policies + automation |
| **Planning horizon** | 3 months | 12 months | 36 months | Fleet / portfolio planning |
| **Calendar sync** | — | Google / Apple / ICS | All platforms | Org-wide |
| **Document portfolio & analysis** | Basic | Full | Full + cloud sync | Full + policy controls |
| **Export formats** | CSV | PDF, CSV | PDF, CSV, Excel | Accounting-grade + scheduled |
| **AI analysis** | — | Document analysis | Unlimited + predictions | Unlimited + workflow automation |
| **API access** | — | — | Zapier / webhook | ERP integrations |
| **Ads** | Yes | Reduced | None | None |
| **Support** | Standard email | Email (48h) | Email (8h) | Dedicated success + SLA |

### Upgrade Trigger Points (UX Design)

**Free → Pro Trigger**:

- User attempts to add 3rd vehicle → "Add more vehicles with Pro"
- User attempts to enable calendar sync → "Calendar sync is a Pro feature"
- User attempts to upload 11th receipt → "Unlimited uploads with Pro"

**Pro → Premium Trigger**:

- Power user (10+ vehicles) views Pro limit → "Manage more vehicles with Premium"
- User attempts unlimited AI analysis → "Unlimited AI with Premium"
- User attempts API access → "Integrations available with Premium"

**Ad Reduction as Motivation**:

- Premium tier prominently marketed as "Ad-free experience"
- Pro tier shows: "Fewer ads (1-2 vs 3-5)"

### Ad Placement Strategy by Tier

**Free Tier (3-5 Ad Placements)**:

1. Dashboard banner (320x50 mobile, 728x90 web)
2. Sidebar rectangle (300x600 desktop)
3. Below maintenance history (300x250)
4. Within reminders (native)
5. Export report footer (728x90)

**Pro Tier (1-2 Ad Placements)**:

- Sidebar removed (main revenue trade)
- Reduced frequency: dashboard banner rotates daily instead of hourly
- Below maintenance history removed
- Reminders ad-free

**Premium Tier (0-1 Ad Placements)**:

- Fully ad-free experience
- Maximum UX polish
- Optional: "Sponsored content" section (educational, non-intrusive)

**Enterprise Tier**:

- Contracted, sales-led deployment
- Org-wide controls and support handoff
- No consumer ad placements

See [`docs/MONETIZATION_STRATEGY.md`](MONETIZATION_STRATEGY.md) for detailed ad placement specifications and CPM targets.

---

## 🎨 Design Language & UX Principles

### Design Principles

1. **Trust & Reliability**: Utility app demands confidence (accurate data, secure storage, transparent operations)
2. **Quick Access**: Minimal taps to see vehicle status or access critical info
3. **Clear Organization**: Vehicle-scoped hierarchy (multiple vehicles clearly separated)
4. **Actionable Insights**: Alerts prioritize what needs immediate attention
5. **Compliance Confidence**: Make it obvious when warranty is protected or compliance is met

### Visual Language

**Color Palette**:

- Primary: Navy Blue (#1E3A8A) - trust, stability
- Success: Green (#10B981) - maintenance complete, safe to drive
- Alert: Amber (#F59E0B) - maintenance due soon
- Critical: Red (#EF4444) - urgent attention required, do not delay
- Neutral: Gray (#6B7280) - archive, history, past records

**Typography**:

- Headers: Inter, Montserrat (modern, professional)
- Body: System fonts (SF Pro Display iOS, Roboto Android) - accessible, legible
- Data: Monospace (vehicle data, VINs, cost breakdowns)

**UI Components**:

- Vehicle Cards: Standard card with vehicle image, quick stats
- Maintenance Timeline: Chronological left-aligned visual timeline
- Alerts: Prominent, color-coded, dismissible
- CTA Buttons: Clear action (Log Maintenance, Schedule Service)

---

## 👥 User Personas & Use Cases

### Primary User: "Responsible Vehicle Owner"

**Scenario**: Monthly vehicle maintenance check

1. Opens app to check vehicle status
2. Views maintenance timeline (see past 6 months)
3. Sees alert: "Oil change due in 500 miles"
4. Plans next service appointment
5. Sets reminder
6. Closes app until next appointment

**Pain Points Addressed**:

- Forgotten maintenance schedules (prevented by alerts)
- Lost maintenance records (centralized storage)
- Warranty anxiety (proof of maintenance)
- Budget surprises (cost tracking and forecasting)

---

### Secondary User: "Fleet Manager"

**Scenario**: Weekly fleet oversight

1. Opens app dashboard (all vehicles at glance)
2. Reviews upcoming maintenance across fleet
3. Prioritizes which vehicle needs service first (by cost, urgency)
4. Sends service reminders to drivers
5. Tracks cumulative maintenance costs for budget
6. Exports maintenance report for compliance

**Pain Points Addressed**:

- No visibility into fleet health (centralized dashboard)
- Coordination challenges across drivers (assignment system)
- Cost control (budget tracking per vehicle, department)
- Compliance documentation (easy export for audits)

---

### Tertiary User: "Young Vehicle Owner"

**Scenario**: First vehicle, learning maintenance responsibility

1. Opens app, unsure what "O2 sensor" means
2. Views maintenance details with plain-language explanations
3. Reads: "O2 sensor improves fuel efficiency and emissions"
4. Sees cost estimate: "$300-500 repair"
5. Decides to schedule service, makes appointment
6. Tracks progress until completion

**Pain Points Addressed**:

- Mechanical intimidation (plain language explanations)
- Price shock (cost estimates from community)
- Decision paralysis (education + price transparency)
- Accountability (reminder system prevents procrastination)

---

## 🎮 Core User Flows

### Flow 1: New User Setup

```
Install App
  ↓
[Authentication]
  ├→ Email/Password
  ├→ Apple Sign-In / Google Sign-In
  └→ Confirm email (for sensitive operations)
  ↓
[Add First Vehicle]
  ├→ Option A: Scan VIN (camera barcode scanner)
  │   └→ VIN looked up → Auto-populate (make, model, year, engine)
  ├→ Option B: Manual entry (Make / Model / Year / VIN)
  ├→ Option C: Skip & enter later
  └→ Vehicle added, ready to track
  ↓
[Setup Complete - Home Screen]
  ├→ Your Vehicles (1 vehicle card visible)
  ├→ Upcoming Maintenance (none yet)
  ├→ Quick Actions (Log Maintenance)
  └→ Next: Log current mileage & maintenance history
```

**Time Investment**: 2-3 minutes (VIN scan shortest path)

---

### Flow 2: Log Maintenance Record

```
Home Screen → [Log Maintenance] or [Vehicle Card] → [Add Record]
  ↓
[Maintenance Entry Form]
  ├→ Maintenance Type (Dropdown: Oil Change, Tire Rotation, Inspection, etc.)
  ├→ Mileage (Auto-filled with last known, editable)
  ├→ Cost (Optional, used for budgeting)
  ├→ Notes (Optional, free-form)
  ├→ Service Provider (Dropdown or new entry)
  ├→ Date (Default: today, editable)
  └→ [Save Record]
  ↓
[Confirmation]
  ├→ "Maintenance logged"
  ├→ Next scheduled maintenance suggested
  └→ [Return to Vehicle]
```

**Expected Frequency**: 1-2 times per month per vehicle

---

### Flow 3: View Maintenance Timeline

```
Vehicle Card
  ↓
[Vehicle Detail Screen]
  ├→ Vehicle Info (Year, Make, Model, VIN)
  ├→ Quick Stats
  │   ├→ Current Mileage
  │   ├→ Last Maintenance
  │   └→ Warranty Status (if applicable)
  └→ [Maintenance Timeline Tab]
  ↓
[Timeline View] (Chronological, newest first)
  ├→ Scroll through records:
  │   ├→ [Oil Change] - 1/15/2026 - 25,000 mi - $45
  │   ├→ [Tire Rotation] - 12/15/2025 - 24,500 mi - Free
  │   ├→ [Inspection] - 11/20/2025 - 24,000 mi - $75
  │   └→ More... (load history)
  ├→ [Tap to expand] - see notes, provider details, receipt
  └→ Filters: By type, by date range (optional)
```

**Interaction Pattern**: Scrollable, expandable, searchable

---

### Flow 4: Receive & Act on Alerts

```
Home Screen
  ↓
[Alert Badge] (red dot on vehicle card)
  ↓
[Alert Notification]
  ├→ "Oil change due in 500 miles"
  ├→ "Your vehicle will exceed warranty coverage without maintenance"
  └→ Or "Service overdue - last oil change was 12 months ago"
  ↓
[User Actions]
  ├→ [Log Maintenance] → Confirm when complete
  ├→ [Schedule Service] → Save appointment date/time
  ├→ [Find Service Provider] → View mechanics near me
  ├→ [Dismiss] → Mark as acknowledged (hidden, can resurrect)
  └→ [Snooze] → Remind me in 2 weeks
```

**Alert Frequency**: Adaptive (more frequent as due date approaches)

---

### Flow 5: Export Records (Privacy/Resale)

```
[Vehicle Detail] → [Menu/Actions] → [Export Records]
  ↓
[Export Options]
  ├→ PDF Report (printable, professional format)
  ├→ CSV Data (spreadsheet format, data portability)
  └→ Share via Email/AirDrop
  ↓
[Report Generated]
  ├→ Cover page: Vehicle info, owner, date range
  ├→ Maintenance table: All records with costs
  ├→ Summary: Total cost, percentage of vehicle value
  └→ Warranty proof: Dates and mileage validation
  ↓
[Actions]
  ├→ Share (email, AirDrop, cloud storage)
  ├→ Print
  └→ Download
```

**Use Case**: Selling vehicle, insurance claim, warranty verification

---

## 🏗️ Feature Specifications

### Feature 1: Multi-Vehicle Management

**Status**: 🟡 Partial (web implemented, mobile runtime active; release validation pending)

**Hierarchical Organization**:

```
My Vehicles (Dashboard)
├── Vehicle 1: 2019 Toyota RAV4
│   ├── Current Mileage: 45,200 mi
│   ├── Next Maintenance: Oil change (500 mi due)
│   ├── Total Spend: $1,200 YTD
│   └── [Tap to view details]
│
├── Vehicle 2: 2022 Honda Civic
│   ├── Current Mileage: 12,500 mi
│   ├── Next Maintenance: None scheduled yet
│   ├── Total Spend: $0 YTD
│   └── [Tap to view details]
│
└── [+ Add Vehicle]
```

**UI Specifications**:

- Vehicle cards: 100% width, rounded corners, vehicle image (optional)
- Quick stats below card (3 key metrics)
- Swipe-to-delete (with confirmation)
- Reorder vehicles (drag-and-drop on mobile, or settings)

---

### Feature 2: VIN Scanning & Auto-Population

**Status**: 🟡 Partial

**VIN Lookup Process**:

1. User taps "Scan VIN" button
2. Camera opens (with preview, focus guides)
3. User positions VIN barcode/plate in frame
4. App recognizes barcode (Code39 or Code128)
5. VIN transmitted to NHTSA VPIC API
6. VPIC returns: Make, Model, Year, Engine, Transmission
7. Form pre-populated, user confirms or corrects

**Manual Entry Fallback** (if barcode unreadable):

- User manually enters 17-digit VIN
- Same NHTSA lookup applies
- Form populated, user confirms

**Validation**:

- VIN format check (17 characters, alphanumeric)
- Check digit validation (VIN digit 9 is check digit)
- Age validation (vehicle year < current year)

---

### Feature 3: Maintenance Logging & Tracking

**Status**: 🟡 Partial

**Maintenance Type Taxonomy**:

- **Routine** (track & alert): Oil change, coolant flush, brake fluid, transmission fluid
- **Time-Based** (track & alert): Inspection, emissions test, tire rotation
- **Mileage-Based** (track & alert): Spark plugs, air filter, cabin filter, brake pads
- **Major** (track only): Transmission service, engine overhaul, suspension rebuild
- **Repair** (ad-hoc): Check engine light, window motor, electrical

**Record Structure**:

```json
{
  "maintenanceType": "Oil Change",
  "date": "2026-02-12",
  "mileage": 45200,
  "cost": 45.99,
  "provider": "Local mechanic - John's Auto",
  "notes": "Synthetic 0W-30, also rotated tires",
  "receipt": "image/receipt.jpg",
  "warranty": "still_valid"
}
```

**Display**:

- Chronological timeline (newest first)
- Expandable cards show full details
- Filter by type, date range, provider
- Search by keyword ("oil", "tire", "$100")

---

### Feature 4: Smart Maintenance Alerts

**Status**: 🔴 Not implemented end-to-end

**Alert Generation**:

- Baseline: Manufacturer maintenance schedule (from VIN lookup)
- Customization: User can adjust intervals (if prefer more frequent service)
- Triggers: Automatically generate when vehicle is within:
  - 500 miles (high priority, yellow)
  - 1,000 miles (medium priority, amber)
  - Next season (low priority, gray)

**Alert Example**:

```
Oil change recommended
You've driven 9,500 miles since last oil change
Standard interval: 10,000 miles
[Schedule Now] [Dismiss] [Snooze 2 weeks]
```

**Notification Delivery**:

- In-app badge (red dot on vehicle card)
- Push notifications (if enabled, 1/week)
- Email digest (optional, weekly summary)

**User Customization**:

- Adjust alert thresholds (e.g., alert at 4 weeks instead of 500 miles)
- Turn off alerts for specific maintenance types
- Select preferred notification times

---

### Feature 5: Service Provider Directory

**Status**: ⏸️ Planned

**Mechanic/Dealership Directory** (integrated feature):

- Search nearby mechanics (GPS, address)
- Ratings and reviews (VV user reviews + Google Maps)
- Services offered (oil change, brakes, hybrid, diesel, etc.)
- Pricing transparency (display avg costs from VV community)
- Booking contact (phone, email, online scheduling)

**User Data Integration**:

- Save preferred providers in vehicle profile
- Auto-assign provider when logging maintenance
- Track cost by provider (see if one is more expensive)

**Example**:

```
📍 John's Auto Repair
⭐ 4.6 (45 reviews)
📍 0.3 mi away
Services: General, Oil change, Tires, Brakes
Oil Change: $35-55 (avg from community)
☎️ (555) 123-4567
📅 Open today until 6 PM
```

---

### Feature 6: Budget Tracking & Forecasting

**Status**: 🟡 Partial (limited implementation, forecasting planned)

**Current Implementation** (Tracking):

- Total maintenance spend in current year (YTD)
- Monthly breakdown (bar chart)
- By-category breakdown (oil changes vs. repairs)
- Trend comparison (year-over-year)

**Planned Implementation** (Forecasting):

- Predictive maintenance cost (based on age, mileage, historical data)
- Annual budget forecast (total spend next year)
- Maintenance schedule projection (visual calendar)

**UI Specification**:

- Dashboard widget showing YTD spend
- Chart view with drill-down (by month, by service type)
- Export budget reports (for financial planning)

---

### Feature 7: Account & Data Management

**Status**: 🟡 Partial

**Authentication**:

- Email/password (standard)
- Apple Sign-In (iOS)
- Google Sign-In (Android, web)
- Anonymous login (limited features, upgrade later)

**Account Settings**:

- Change password
- Update email
- Delete account (including all vehicle data)
- Export data (GDPR, data portability)

**Privacy Notice**:

- Clear disclosure of data stored (vehicle info, maintenance records)
- Encryption (vehicle data encrypted at rest, TLS in transit)
- Compliance (GDPR, CCPA, COPPA)
- Sharing policy (data not shared with third parties unless user opts in)

---

## 📱 Platform-Specific Considerations

### iOS

**Technical Stack**:

- Swift + SwiftUI
- Firebase SDK
- Camera2 for VIN scanning
- CoreLocation for GPS

**Apple-Specific Features**:

- HomeKit integration (future: vehicle status on Apple HomeKit)
- Siri Shortcuts (view maintenance status via voice)
- Apple Wallet (vehicle registration, insurance card)
- iCloud sync (across user's devices)

**Target**: iOS 15.0+

---

### Android

**Technical Stack**:

- Kotlin + Jetpack Compose
- Firebase SDK
- ML Kit for barcode detection (camera)
- Google Play Services for location

**Google-Specific Features**:

- Google Home integration (future: voice control)
- Google Drive backup (auto-backup of records)
- Android Wear (quick glance at vehicle status)

**Target**: Android 8.0+

---

### Web

**Technical Stack**:

- React + Vite
- Responsive design (mobile-first)
- PWA capabilities (offline support, installable)
- Canvas/WebGL (optional: vehicle status visualization)

**Features**:

- Full feature parity with mobile
- Keyboard navigation (accessibility)
- Bulk operations (upload historical records via CSV)
- Desktop printing (maintenance records for paper files)

---

## 🗺️ Information Architecture

```
Home / Dashboard
├── My Vehicles (Cards)
│   ├── Vehicle 1
│   │   ├── Status (alert if needed)
│   │   ├── Quick stats (mileage, next maintenance, cost)
│   │   └── [Tap to details]
│   ├── Vehicle 2
│   └── [+ Add Vehicle]
├── Quick Actions
│   ├── Log Maintenance
│   ├── Find Service Provider
│   └── View Budget
└── Navigation (Bottom / Sidebar)
    ├── Home / Dashboard
    ├── My Vehicles
    ├── Budget & Insights
    ├── Profile / Settings
    └── Help & Support

Vehicle Detail
├── Vehicle Info (Year, Make, Model, VIN image)
├── Quick Stats (Mileage, Last Service, Warranty Status)
├── Alert Section (if any)
├── Tabs:
│   ├── Timeline (maintenance history)
│   │   ├── Chronological records
│   │   ├── Filters (type, date range)
│   │   └── [Tap to expand/edit]
│   ├── Upcoming (next scheduled)
│   │   ├── Maintenance due soon
│   │   └── [Schedule Service]
│   ├── Documents (receipts, inspection reports)
│   │   ├── Image gallery
│   │   └── Storage (cloud-backed)
│   └── Details (edit vehicle info)
│       ├── VIN, make, model
│       ├── License plate
│       ├── Warranty info
│       └── [Add field]

Profile / Settings
├── Account Settings
│   ├── Email / Password
│   ├── Authentication methods
│   └── Delete account
├── Notification Preferences
│   ├── Maintenance alerts (on/off)
│   ├── Email digests
│   └── Preferred times
├── Data & Privacy
│   ├── Export data (GDPR)
│   ├── Privacy policy
│   ├── Terms of service
│   └── Data location (EU, US, etc.)
├── Help & Support
│   ├── FAQ
│   ├── Support
│   └── Report bug
└── About
    ├── App version
    └── Release notes

Budget & Insights
├── Overview
│   ├── YTD spending
│   ├── Monthly trend chart
│   └── By-category breakdown
├── Forecast (planned)
│   ├── Estimated annual spend
│   ├── Upcoming maintenance costs
│   └── Maintenance schedule calendar
└── Export
    ├── Download PDF report
    └── Share via email
```

---

## 🎯 Feature Prioritization

| Feature                    | Impact   | Effort    | Priority | Delivery Status               |
| -------------------------- | -------- | --------- | -------- | ----------------------------- |
| Multi-vehicle management   | Critical | Medium    | P0       | 🟡 Partial                    |
| VIN scanning (barcode)     | High     | Medium    | P1       | 🟡 Partial                    |
| Maintenance logging        | Critical | Medium    | P0       | 🟡 Partial                    |
| Smart alerts               | High     | Medium    | P1       | 🔴 Not implemented end-to-end |
| Timeline view              | High     | Low       | P1       | 🟡 Partial                    |
| Cross-platform sync        | Critical | High      | P0       | 🟡 Partial                    |
| Budget tracking            | Medium   | Medium    | P2       | 🟡 Partial                    |
| Service provider directory | Medium   | High      | P2       | ⏸️ Planned                    |
| Cost forecasting           | Medium   | High      | P3       | ⏸️ Planned                    |
| Warranty integration       | Medium   | High      | P3       | ⏸️ Planned                    |
| OBD-II diagnostics         | Low      | Very High | P4       | ⏸️ Future                     |
| Insurance integration      | Medium   | High      | P3       | ⏸️ Future                     |

---

## 🚀 Launch & Rollout

### Pre-Launch

- ✅ Beta testing with target users (responsible vehicle owners)
- ✅ VIN lookup accuracy validation (edge cases, older vehicles)
- ✅ Cross-platform testing (iOS, Android, web)
- ✅ App Store/Play Store listings and screenshots
- ✅ Privacy policy & terms of service published

### Launch

- ✅ iOS App Store release
- ✅ Google Play Store release
- ✅ Web deployment (Firebase Hosting)
- ✅ Social announcement (Twitter, Facebook)
- ✅ Press release to automotive publications

### Post-Launch

- ✅ User feedback collection (surveys, interviews)
- ✅ Monitor adoption metrics (install rate, D7 retention)
- ✅ Respond to reviews and feature requests
- ✅ Iterate based on user data (is alert frequency right? Maintenance types complete?)

---

## 📊 Phased Roadmap

### Phase 1: Foundation (Partially Delivered)

- 🟡 Multi-vehicle support
- 🟡 VIN scanning & auto-population
- 🟡 Maintenance logging & timeline
- 🔴 Smart maintenance alerts
- 🟡 Cross-platform parity (web/mobile parity incomplete)
- 🟡 Basic budget tracking
- 🟡 Data export (web implemented, mobile disabled in current build)

---

### Phase 2: Intelligence (Year 1-2, Q2-Q3 2026)

- 🟡 Predictive maintenance (algorithm learns from maintenance history)
- 🟡 Service provider directory (merchant integrations)
- 🟡 Cost forecasting (annual budgeting)
- 🟡 Insurance integrations (discount partnerships)
- 🟡 OBD-II connector support (real-time diagnostics)

---

### Phase 3: Ecosystem (Year 2-3, Q4 2026+)

- ⏸️ Mechanic/dealership integrations (automated record sharing)
- ⏸️ Fleet management tools (for business users)
- ⏸️ Social features (vehicle community, maintenance tips)
- ⏸️ Advanced diagnostics (partner with mechanic data platforms)

---

## 🔒 Accessibility & Compliance

### WCAG 2.1 AA Compliance

- ✅ Text contrast (≥ 4.5:1)
- ✅ Font sizing (16px min, adjustable to 24px)
- ✅ Keyboard navigation (full game playable)
- ✅ VoiceOver/TalkBack support (maintenance records narrated)
- ✅ Color-blind friendly (not color-only indicators)

### GDPR / CCPA Compliance

- ✅ User data export (CSV, JSON format)
- ✅ Data deletion (right to be forgotten)
- ✅ Privacy policy (clear, transparent)
- ✅ Consent management (for analytics, marketing)

### Data Privacy

- ✅ Vehicle data encrypted (AES-256 at rest, TLS in transit)
- ✅ No third-party tracking (only privacy-focused analytics)
- ✅ Ownership proof (can export full history as proof of maintenance)

---

## ✅ Success Metrics & KPIs

| Metric                          | Target     | Measurement            |
| ------------------------------- | ---------- | ---------------------- |
| **Daily Active Users**          | 10K        | Firebase Analytics     |
| **Monthly Active Users**        | 50K        | Firebase Analytics     |
| **Vehicles Added**              | 100K       | Database count         |
| **Maintenance Records Logged**  | 500K       | Database count         |
| **D30 Retention**               | 35%        | Cohort analysis        |
| **App Store Rating**            | 4.4+ stars | App Store / Play Store |
| **Crash Rate**                  | <0.2%      | Crashlytics            |
| **Premium Conversion**          | 5%         | Stripe                 |
| **Alert Engagement**            | 60%        | Analytics              |
| **Feature Adoption (Timeline)** | 80%        | Analytics              |

---

**Product Design Owner**: Mark Nelson  
**Last Updated**: March 9, 2026  
**Design Status**: 🟡 Vision Complete, Implementation In Progress
