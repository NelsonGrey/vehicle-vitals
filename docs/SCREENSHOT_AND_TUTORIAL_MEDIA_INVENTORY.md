# Screenshot and Tutorial Media Inventory

Last updated: 2026-07-14

## 1. New screenshot deliverables

The new capture set is staged under `output/playwright/vehicle-vitals-2026-07-14/`. Existing website media in `packages/web/public/images/features/` was not overwritten.

### Website

- 105 screenshots total.
- 35 routes or UI states at desktop, tablet, and mobile widths.
- Desktop viewport: 1440 × 1000 CSS pixels.
- Tablet viewport: 1024 × 1366 CSS pixels.
- Mobile viewport: 390 × 844 CSS pixels.
- The capture harness temporarily expands the site's internal scroll container so each PNG contains the complete route rather than only the visible application shell.
- Public coverage: landing, five personas, four feature demos, getting started, product tour, help, support, pricing, privacy, terms, login, sign-up, and forgot password.
- Authenticated coverage: garage, garage detail, add/edit vehicle, records, profile, account security, maintenance alerts, account consolidation, API automation, data privacy, shops and services, service history, maintenance plan, and demo-data tooling.
- Source of truth: `output/playwright/vehicle-vitals-2026-07-14/web/manifest.csv` and `manifest.json`.

### iOS

- 28 screenshots total at 1320 × 2868 pixels on iPhone 17 Pro Max.
- Signed-out coverage: welcome, login, sign-up, and forgot password.
- Signed-in coverage: garage, vehicle detail, add vehicle, prefilled add vehicle, edit vehicle, records, scan VIN, maintenance list/detail, account, settings, data privacy, email preferences, support, privacy, terms, instructions, calendar preferences, reminder preferences, shops and services, premium, offline settings, maintenance plan, and service history.
- Screens use deterministic local demo data, light appearance, no ad banner, no debug banner, and a standardized 9:41 status bar.
- Source of truth: `output/playwright/vehicle-vitals-2026-07-14/ios/iphone-17-pro-max/manifest.csv`.

## 2. Website screenshot replacement inventory

The website currently uses one large PNG per product screen for card art, hero art, galleries, and video posters. Replacement work should split each source into responsive derivatives so small cards do not download full-resolution screenshots and hero/poster placements are not forced to crop a portrait source.

### Required derivative sets

| Set | Intended use                          | Required outputs                                                            |
| --- | ------------------------------------- | --------------------------------------------------------------------------- |
| W-P | Full web application screen, portrait | 480 × 675, 768 × 1080, 1280 × 1800, and 1600 × 2250                         |
| W-C | Website card crop                     | 640 × 400, 960 × 600, and 1440 × 900                                        |
| W-H | Website hero/video poster             | 960 × 540, 1280 × 720, and 1920 × 1080                                      |
| I-P | iPhone screen                         | 390 × 844, 780 × 1688, and 1170 × 2532, plus the 1320 × 2868 capture master |
| H-S | Marketing hero scene                  | 640 × 640, 1024 × 1024, and 1600 × 1600                                     |

For each derivative, create AVIF and WebP delivery files plus a PNG/JPEG fallback. Keep the lossless capture master outside the runtime bundle. Use `srcset` and `sizes` rather than swapping only the filename.

### Screenshot assets referenced by website code

| Current asset         | Current size | Website use                                                                              | Replacement shot brief                                                                  | Derivatives   |
| --------------------- | -----------: | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------- |
| `add-vehicle.png`     |  1280 × 1800 | VIN Lookup demo hero/gallery/poster; Product Tour; Getting Started; Guided Setup persona | Clean add-vehicle screen with a realistic VIN lookup result and no personal information | W-P, W-C, W-H |
| `garage-vehicles.png` |  1280 × 1800 | VIN Lookup gallery; Product Tour; Shared Garage persona                                  | Three-vehicle garage showing active/stored state, search, and health indicators         | W-P, W-C      |
| `garage-detail.png`   |  1280 × 1800 | VIN Lookup gallery; Product Tour                                                         | One selected vehicle with mileage, recent work, and next maintenance visible            | W-P, W-C      |
| `records.png`         |  1280 × 1800 | Maintenance and Ownership demos; Product Tour; Getting Started; Owner and DIY personas   | Completed service records with date, mileage, cost, notes, and attachment affordance    | W-P, W-C, W-H |
| `timeline.png`        |  1280 × 1800 | Maintenance and Ownership demos; Product Tour; service-video poster                      | Chronological service history with several realistic entries and clear dates            | W-P, W-C, W-H |
| `upcoming.png`        |  1280 × 1800 | Maintenance demo; Product Tour; Getting Started; Work Vehicles persona                   | Maintenance plan with due-soon, snoozed, and completed task states                      | W-P, W-C      |
| `providers.png`       |  1280 × 1800 | Product Tour                                                                             | Shops and services results with business-type filters and a saved provider              | W-P, W-C      |
| `profile.png`         |  1280 × 1800 | Ownership History gallery                                                                | Account preferences showing reminder lead time, driving assumptions, and location       | W-P, W-C      |
| `ios-home.png`        |  1170 × 2532 | Cross-platform demo hero/gallery/poster; Product Tour; cross-platform video poster       | iOS garage with the same seeded vehicles used by the web capture                        | I-P, W-C, W-H |
| `ios-upcoming.png`    |  1170 × 2532 | Cross-platform demo gallery                                                              | iOS maintenance plan with useful task actions visible                                   | I-P, W-C      |
| `ios-profile.png`     |  1170 × 2532 | Cross-platform demo gallery                                                              | iOS account/settings screen with non-sensitive demo values                              | I-P, W-C      |
| `landing-current.png` |  1280 × 1800 | Generic Feature Demo fallback hero/gallery/poster                                        | Current public landing story, captured without local test banners                       | W-P, W-C, W-H |

### Screenshot files present but not referenced by website code

| Asset               | Current size | Recommendation                                                                                                                               |
| ------------------- | -----------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `edit-vehicle.png`  |  1280 × 1837 | Either add it to Product Tour/Help for the edit workflow or remove it from the runtime feature folder after the replacement set is approved. |
| `ios-login.png`     |  1170 × 2532 | Keep only if an account-access tutorial or product-tour card will reference it.                                                              |
| `ios-marketing.png` |  1170 × 2532 | Keep only if the mobile welcome/marketing screen is restored to a public page.                                                               |
| `landing.png`       |  1280 × 1800 | Retire after `landing-current` is replaced; it duplicates the same conceptual slot.                                                          |

### Other static imagery adjacent to this work

- `images/hero-garage.jpg` is a 512 × 512 marketing photo, not a product screenshot. It needs the H-S derivative set because it is the landing hero background.
- Header marks, icons, favicons, and app icons are brand assets and are not part of the screenshot-replacement queue.
- Vehicle photos and maintenance attachments are user-generated runtime data. They must not be replaced with bundled marketing assets.

## 3. Current video asset inventory

The repository contains ten short MP4 files. Nine are referenced by website code; `help-center-overview.mp4` is generated but currently unreferenced. All clips are approximately 8–11 seconds, shorter than the 30–90 second tutorial standard documented in the video folder, so they should be treated as placeholders or teaser loops rather than complete help tutorials.

| Current clip                     | Duration | Current website placement | Disposition                                                    |
| -------------------------------- | -------: | ------------------------- | -------------------------------------------------------------- |
| `onboarding-walkthrough.mp4`     |  10.13 s | Product Tour              | Re-record as T01/T03 task sequence.                            |
| `maintenance-lifecycle-tour.mp4` |   8.47 s | Product Tour              | Re-record as T07/T09/T12 sequence.                             |
| `cross-platform-continuity.mp4`  |  11.27 s | Product Tour              | Keep as a product teaser; it is not a task tutorial.           |
| `vin-lookup-demo.mp4`            |  10.63 s | VIN Lookup demo           | Re-record as T03 with validation and fallback steps.           |
| `maintenance-planning-demo.mp4`  |   8.67 s | Maintenance Planning demo | Re-record as T09/T10.                                          |
| `cross-platform-access-demo.mp4` |  10.53 s | Cross-platform demo       | Keep as a product teaser or expand into account sync guidance. |
| `ownership-history-demo.mp4`     |   9.00 s | Ownership History demo    | Re-record as T12/T16.                                          |
| `generic-feature-demo.mp4`       |   9.67 s | Feature Demo fallback     | Retire after each feature has a task-specific clip.            |
| `getting-started-help.mp4`       |   8.73 s | Getting Started           | Re-record as the primary first-run tutorial.                   |
| `help-center-overview.mp4`       |  10.16 s | Not referenced            | Connect it to Help or remove it after T17 is produced.         |

## 4. FAQ-derived help/tutorial video backlog

This backlog is derived from the task questions in `packages/web/src/data/helpFaq.ts`, the Getting Started workflow, Product Tour, and the web/iOS route inventories.

| ID  | Tutorial                                                                           | Platforms | Screens/routes                                            |  Target | Priority |
| --- | ---------------------------------------------------------------------------------- | --------- | --------------------------------------------------------- | ------: | -------- |
| T01 | Create an account, sign in, and understand first-run routing                       | Web + iOS | sign-up, login, welcome, onboarding                       | 60–75 s | P0       |
| T02 | Reset a forgotten password                                                         | Web + iOS | forgot-password                                           | 30–45 s | P1       |
| T03 | Add the first vehicle with VIN lookup and manual fallback                          | Web + iOS | add vehicle, VIN lookup                                   | 60–90 s | P0       |
| T04 | Scan a VIN on iOS and handle scan/lookup failure                                   | iOS       | scan VIN, add vehicle                                     | 45–60 s | P0       |
| T05 | Edit or remove a vehicle safely                                                    | Web + iOS | edit vehicle, vehicle detail                              | 45–60 s | P1       |
| T06 | Read the Garage, vehicle health, active/stored state, and next work                | Web + iOS | garage, vehicle detail                                    | 45–60 s | P1       |
| T07 | Log a maintenance record with date, mileage, cost, shop, and notes                 | Web + iOS | records, maintenance detail                               | 60–90 s | P0       |
| T08 | Upload, open, and remove receipts, invoices, or PDFs                               | Web + iOS | records, edit vehicle                                     | 60–75 s | P0       |
| T09 | Complete, snooze, dismiss, and reopen a reminder                                   | Web + iOS | maintenance plan, records                                 | 60–75 s | P0       |
| T10 | Use Maintenance Plan, urgency filters, and “show all” recommendations              | Web + iOS | maintenance plan                                          | 45–60 s | P0       |
| T11 | Add a maintenance event to Google, Apple, or ICS calendar                          | Web + iOS | maintenance plan, calendar preferences                    | 45–60 s | P1       |
| T12 | Review Service History and verify completed work                                   | Web + iOS | service history/timeline                                  | 45–60 s | P0       |
| T13 | Find and save nearby shops and services                                            | Web + iOS | shops and services                                        | 45–60 s | P1       |
| T14 | Configure reminder timing, driving assumptions, location, and calendar preferences | Web + iOS | profile, reminder/calendar preferences                    | 60–75 s | P0       |
| T15 | Compare Free, Pro, Premium, and Enterprise capabilities                            | Web + iOS | pricing, premium                                          | 45–60 s | P1       |
| T16 | Export maintenance history as CSV/PDF and understand tier gates                    | Web + iOS | edit vehicle, data privacy/export                         | 45–60 s | P1       |
| T17 | Contact Support and submit a useful bug report                                     | Web + iOS | help, support                                             | 30–45 s | P1       |
| T18 | Configure iOS notifications, email preferences, and offline behavior               | iOS       | email preferences, offline settings, reminder preferences | 60–75 s | P1       |
| T19 | Coordinate a shared household garage across multiple drivers and vehicles          | Web + iOS | garage, maintenance plan, history                         | 60–90 s | P1       |
| T20 | Review account data, privacy controls, sign out, and account-deletion path         | Web + iOS | account, data privacy                                     | 60–75 s | P0       |

### Recommended production order

1. Wave 1: T01, T03, T04, T07, T09, T10, T12, T14, and T20.
2. Wave 2: T02, T05, T06, T08, T11, T13, T16, and T18.
3. Wave 3: T15, T17, T19, and updated cross-platform/product teaser clips.

### Video delivery standard

- Record one clean 1920 × 1080, 30 fps H.264/AAC master for website help and YouTube.
- Produce a 1080 × 1920 vertical derivative for Shorts/Reels where the workflow remains readable.
- Keep task tutorials between 30 and 90 seconds, with one goal per clip.
- Include burned-in key-step labels plus an `.srt` or `.vtt` caption file.
- Use deterministic demo data and remove email addresses, VINs tied to real people, location history, API credentials, and notification content.
- Start with the task outcome, show the minimum taps/clicks, then end on the completed state.
- Name files `tNN-kebab-case-platform-v1.mp4`, for example `t03-add-first-vehicle-web-v1.mp4`.

## 5. Repeatable capture commands

Website capture requires the local Firebase Auth, Firestore, and Storage emulators plus the development Vite server configured with `VITE_USE_FIREBASE_EMULATORS=true`.

```bash
npx firebase-tools emulators:start --only auth,firestore,storage --project vehicle-vitals-dev
VITE_USE_FIREBASE_EMULATORS=true npm run dev --workspace=@vehicle-vitals/web
VV_SCREENSHOT_USE_EMULATORS=1 npm run screenshots:capture:web
```

Useful scoped website refreshes:

```bash
VV_SCREENSHOT_USE_EMULATORS=1 VV_SCREENSHOT_VIEWPORTS=mobile npm run screenshots:capture:web
VV_SCREENSHOT_USE_EMULATORS=1 VV_SCREENSHOT_ROUTE_IDS=landing,product-tour npm run screenshots:capture:web
```

iOS capture:

```bash
npm run screenshots:capture:ios
VV_IOS_SCREENSHOT_SCOPE=signed-out npm run screenshots:capture:ios
VV_IOS_SCREENSHOT_SCOPE=signed-in npm run screenshots:capture:ios
```
