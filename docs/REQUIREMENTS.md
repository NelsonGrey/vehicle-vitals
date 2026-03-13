# Vehicle Vitals - Project Requirements & Status

**Project Overview**: A comprehensive vehicle management application with web and mobile frontends, featuring vehicle tracking, maintenance logging, VIN scanning, and user authentication.

**Last Updated**: March 2026
**Project Status**: ⚠️ **PARTIALLY IMPLEMENTED** | Web core flows implemented, mobile currently running TestFlight mock services, backend reminders/export integrations partial

---

## Document Relationship & Scope Contract

This file is the delivery contract for what is implemented now versus what is partial or planned.

- `docs/PRODUCT_DESIGN.md` defines vision, UX intent, and roadmap direction.
- `docs/REQUIREMENTS.md` defines implementation truth for active releases.
- If a conflict exists between these documents, treat this file as source of truth for delivery status.

## Feature Traceability Baseline (March 2026)

| Feature Area                 | Product Design Intent | Current Delivery Reality                          | Primary Tracking Location       |
| ---------------------------- | --------------------- | ------------------------------------------------- | ------------------------------- |
| Core web vehicle workflows   | Required              | 🟡 Partial                                        | Implementation Reality Snapshot |
| Mobile production parity     | Required              | 🔴 Not production-capable in current build config | Implementation Reality Snapshot |
| Reminder lifecycle actions   | Required              | 🔴 Not implemented end-to-end                     | Implementation Reality Snapshot |
| Reminder scheduling pipeline | Required              | 🟡 Partial                                        | Implementation Reality Snapshot |
| Export records               | Required              | 🟡 Partial                                        | Implementation Reality Snapshot |
| Service provider directory   | Planned               | ⏸ Not implemented                                | PRODUCT_DESIGN roadmap          |
| Fleet manager workflows      | Planned               | ⏸ Not implemented                                | PRODUCT_DESIGN roadmap          |

Planning companion:

- `docs/RELEASE_SCOPE_MATRIX.md` defines Must/Should/Later scope tiers and milestone targets.

---

## Implementation Reality Snapshot (Code-Verified: March 2026)

| Capability                                                | Delivery Status | Code Evidence                                                                                                                                     |
| --------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web app core (auth, vehicles, timeline, maintenance CRUD) | 🟡 Partial      | `packages/web/src/pages/Home.tsx`, `packages/web/src/pages/EditVehicle.tsx`, `packages/web/src/pages/TimelineDashboard.tsx`                       |
| Mobile runtime parity                                     | � Partial       | Firebase/Auth/Firestore/notifications use real SDKs; push notification end-to-end delivery not fully validated in production                      |
| Reminder lifecycle (add/snooze/dismiss/complete)          | � Implemented   | Full CRUD in `packages/shared/src/firestoreServiceFactory.js`; connected on web (`UpcomingTasks.tsx`) and mobile (`upcoming_tasks_screen.dart`)   |
| Scheduled reminder checks                                 | � Implemented   | Scheduled sweep + injectable `runMaintenanceReminderSweep` / `runMaintenanceReminderSchedule` in `packages/functions/src/index.ts`; tested        |
| Reminder delivery integration                             | 🟡 Partial      | `sendMaintenanceReminder` HTTP endpoint and `sendEmail` provider implemented; production SendGrid delivery not yet end-to-end validated           |
| Data export                                               | � Implemented   | Web CSV/PDF in `packages/web/src/utils/dataExport.js`; mobile CSV/PDF via `packages/mobile/lib/services/data_export_service.dart` and share sheet |

Legend: `🟢 Implemented`, `🟡 Partial`, `🔴 Not implemented`.

---

## 🏗️ Architecture Overview

### Core Platforms

| Platform         | Technology                  | Status     | Notes                                                                          |
| ---------------- | --------------------------- | ---------- | ------------------------------------------------------------------------------ |
| **Web Frontend** | React + Vite + React Router | 🟡 Partial | Core user flows implemented; some roadmap capabilities still missing           |
| **Mobile App**   | Flutter                     | � Partial  | Real Firebase services in use; push notification end-to-end validation pending |
| **Backend**      | Firebase Suite              | 🟡 Partial | Core functions exist; reminder delivery integrations not fully wired           |
| **Deployment**   | Firebase Hosting + CI/CD    | 🟡 Partial | Web delivery path works; mobile production parity pending                      |

### Package Structure

```
vehicle-vitals/
├── web/                    # React web application
├── mobile/                 # Flutter mobile application
├── shared/                 # Cross-platform utilities
├── dataconnect/           # GraphQL schema & operations
├── firebase/              # Firebase configuration
└── scripts/               # Build & utility scripts
```

---

## 📱 Frontend Applications

### Web Application (React)

**Status**: 🟡 **PARTIAL** | **Location**: `/web/`

| Feature                  | Status         | Implementation                        |
| ------------------------ | -------------- | ------------------------------------- |
| **Authentication**       | 🟡 Partial     | Firebase Auth in web runtime          |
| **Vehicle Management**   | 🟡 Partial     | CRUD operations with VIN validation   |
| **VIN Decoding**         | 🟡 Partial     | NHTSA VPIC API via backend function   |
| **Maintenance Tracking** | 🟡 Partial     | CRUD and timeline UI on web           |
| **Responsive UI**        | 🟢 Implemented | Mobile-friendly design                |
| **Routing**              | 🟢 Implemented | React Router protected routes         |
| **State Management**     | 🟡 Partial     | Context + Firebase integration on web |

#### Web Pages Inventory

| Page               | File                                      | Status      | Functionality                       |
| ------------------ | ----------------------------------------- | ----------- | ----------------------------------- |
| Home               | `Home.jsx`                                | ✅ Complete | Vehicle list, delete, navigation    |
| Add Vehicle        | `AddVehicle.jsx`                          | ✅ Complete | VIN decode, form validation         |
| Edit Vehicle       | `EditVehicle.jsx`                         | ✅ Complete | Update vehicle, maintenance list    |
| Login/SignUp       | `Login.jsx`, `SignUp.jsx`                 | ✅ Complete | Firebase authentication             |
| Profile            | `Profile.jsx`                             | ✅ Complete | User account management             |
| Landing            | `Landing.jsx`                             | ✅ Complete | Marketing page                      |
| Legal Pages        | `Terms.jsx`, `Privacy.jsx`, `Contact.jsx` | ✅ Complete | Static content                      |
| Instructions       | `Instructions.jsx`                        | ✅ Complete | User guide                          |
| Dev Tools          | `DevSeed.jsx`                             | ✅ Complete | Development utilities               |
| Timeline Dashboard | `TimelineDashboard.tsx`                   | ✅ Complete | Visual maintenance history timeline |
| Coming Soon        | `ComingSoon.jsx`                          | ✅ Complete | Placeholder page                    |

### Mobile Application (Flutter)

**Status**: 🔴 **MOCK MODE (CURRENT BUILD CONFIG)** | **Location**: `/mobile/`

| Feature                  | Status         | Implementation                                                                 |
| ------------------------ | -------------- | ------------------------------------------------------------------------------ |
| **Authentication**       | 🔴 Mocked      | Mock user/auth service in current build                                        |
| **Vehicle Management**   | 🔴 Mocked      | Mock Firestore service in current build                                        |
| **VIN Scanning**         | 🟡 Partial     | Screens exist; end-to-end live backend path not verified in current build mode |
| **Maintenance Tracking** | 🔴 Mocked      | Uses mock maintenance data source                                              |
| **Navigation**           | 🟢 Implemented | GoRouter route structure                                                       |
| **State Management**     | 🟢 Implemented | Provider pattern                                                               |
| **Platform Support**     | 🟡 Partial     | Targets defined, but runtime parity depends on re-enabling disabled services   |

#### Mobile Screens Inventory

| Screen             | File                                                              | Status      | Functionality                      |
| ------------------ | ----------------------------------------------------------------- | ----------- | ---------------------------------- |
| Home               | `home_screen.dart`                                                | ✅ Complete | Vehicle cards with maintenance nav |
| Add Vehicle        | `add_vehicle_screen.dart`                                         | ✅ Complete | Form with validation               |
| Edit Vehicle       | `edit_vehicle_screen.dart`                                        | ✅ Complete | Update vehicle details             |
| VIN Scanner        | `scan_vin_screen.dart`                                            | ✅ Complete | Camera barcode scanning            |
| Maintenance List   | `maintenance_list_screen.dart`                                    | ✅ Complete | List with add/edit/delete          |
| Maintenance Detail | `maintenance_detail_screen.dart`                                  | ✅ Complete | View/edit/delete entry             |
| Account            | `account_screen.dart`                                             | ✅ Complete | Profile with password reset        |
| Login/SignUp       | `login_screen.dart`, `signup_screen.dart`                         | ✅ Complete | Authentication flows               |
| Legal Pages        | `terms_screen.dart`, `privacy_screen.dart`, `contact_screen.dart` | ✅ Complete | Static content                     |
| Instructions       | `instructions_screen.dart`                                        | ✅ Complete | User guide                         |

#### Mobile Package Configuration

| Platform              | Package Name                               | Status      |
| --------------------- | ------------------------------------------ | ----------- |
| **Android**           | `com.nelsongrey.vehiclevitals.app.android` | ✅ Complete |
| **iOS**               | `com.nelsongrey.vehiclevitals.app.ios`     | ✅ Complete |
| **Deployment Target** | iOS 15.0+                                  | ✅ Complete |

---

## 🔧 Backend Services

### Firebase Configuration

**Status**: 🟡 **PARTIAL** | **Location**: `/firebase/`, `/shared/`

| Service                | Status         | Configuration                                                |
| ---------------------- | -------------- | ------------------------------------------------------------ |
| **Authentication**     | 🟡 Partial     | Auth configured, but mobile runtime currently mock-backed    |
| **Firestore Database** | 🟡 Partial     | Data model present; reminder lifecycle not fully implemented |
| **Firebase Hosting**   | 🟢 Implemented | Web deployment path active                                   |
| **Security Rules**     | 🟢 Implemented | User-based access control                                    |

### Data Model

**Status**: ✅ **COMPLETE** | **Location**: `shared/types.js`, Firestore collections

#### Firestore Collections Structure

```
users/{userId}/
├── vehicles/{vin}/           # Vehicle documents keyed by VIN
│   ├── maintenance/{id}/     # Maintenance subcollection
│   └── reminders/{id}/       # Planned: reminder system
```

#### Data Types

| Type            | Status      | Fields                                                  | Validation                  |
| --------------- | ----------- | ------------------------------------------------------- | --------------------------- |
| **Vehicle**     | ✅ Complete | make, model, year, vin, mileage, purchaseDate           | VIN format, year range      |
| **Maintenance** | ✅ Complete | title, notes, date, cost, mileage, createdAt, updatedAt | Required fields, timestamps |
| **User**        | ✅ Complete | Firebase Auth UID                                       | Authentication-based        |

### External Integrations

| Service            | Status      | Purpose      | Implementation      |
| ------------------ | ----------- | ------------ | ------------------- |
| **NHTSA VPIC API** | ✅ Complete | VIN decoding | Web vehicle service |

---

## 🚀 DataConnect & GraphQL

### Firebase DataConnect

**Status**: ✅ **CONFIGURED** | **Location**: `/dataconnect/`

| Component                | Status      | Notes                            |
| ------------------------ | ----------- | -------------------------------- |
| **Schema Definition**    | ✅ Complete | Movie review example schema      |
| **Code Generation**      | ✅ Complete | TypeScript & React clients       |
| **Web Integration**      | ✅ Complete | `@dataconnect/generated` package |
| **Connector Operations** | ✅ Complete | Queries and mutations            |

#### Generated Clients

| Platform      | Location                         | Status      |
| ------------- | -------------------------------- | ----------- |
| **Shared**    | `src/dataconnect-generated/`     | ✅ Complete |
| **Web React** | `web/src/dataconnect-generated/` | ✅ Complete |

---

## 🧪 Testing & Quality

### Test Coverage

**Status**: ✅ **IMPLEMENTED** | **Location**: `/web/tests/`

| Test Type            | Status      | Framework                    | Coverage            |
| -------------------- | ----------- | ---------------------------- | ------------------- |
| **Unit Tests**       | ✅ Complete | Vitest                       | Firestore service   |
| **Smoke Tests**      | ✅ Complete | Vitest                       | Factory patterns    |
| **Firebase Rules**   | ✅ Complete | @firebase/rules-unit-testing | Security validation |
| **Flutter Analysis** | ✅ Complete | `flutter analyze`            | No issues found     |

### Code Quality

| Tool                        | Status         | Result                   |
| --------------------------- | -------------- | ------------------------ |
| **Flutter Analyze**         | ✅ Passing     | 0 issues                 |
| **Web Tests**               | ✅ Implemented | Firestore emulator tests |
| **Firebase Security Rules** | ✅ Configured  | User-scoped access       |

---

## 🔄 Development & Deployment

### Build System

**Status**: ✅ **COMPLETE**

| Platform            | Command         | Status     | Output          |
| ------------------- | --------------- | ---------- | --------------- |
| **Web Development** | `npm run dev`   | ✅ Working | Vite dev server |
| **Web Production**  | `npm run build` | ✅ Working | Static assets   |
| **Mobile Debug**    | `flutter run`   | ✅ Working | Debug APK/IPA   |
| **Mobile Release**  | `flutter build` | ✅ Working | Release builds  |

### CI/CD Pipeline

**Status**: ✅ **COMPLETE** | **Location**: `.github/workflows/`

| Workflow            | Status        | Trigger      | Actions                     |
| ------------------- | ------------- | ------------ | --------------------------- |
| **Firebase Deploy** | ✅ Active     | Push to main | Build web → Deploy hosting  |
| **Emulator Tests**  | ✅ Configured | PR/Push      | Run Firebase emulator tests |

#### Deployment Configuration

| Environment     | Service           | Status        | URL                        |
| --------------- | ----------------- | ------------- | -------------------------- |
| **Production**  | Firebase Hosting  | ✅ Configured | Auto-deploy from main      |
| **Development** | Local dev servers | ✅ Working    | Web: Vite, Mobile: Flutter |

---

## 📦 Dependencies & Environment

### Node.js/Web Dependencies

**Status**: ✅ **UP TO DATE**

| Package          | Version | Purpose          | Status     |
| ---------------- | ------- | ---------------- | ---------- |
| **React**        | ^18.0.0 | UI framework     | ✅ Current |
| **Firebase**     | ^10.0.0 | Backend services | ✅ Current |
| **React Router** | ^6.0.0  | Navigation       | ✅ Current |
| **Vite**         | ^5.0.0  | Build tool       | ✅ Current |
| **Vitest**       | ^1.0.0  | Testing          | ✅ Current |

### Flutter Dependencies

**Status**: ✅ **UP TO DATE**

| Package             | Version | Purpose              | Status     |
| ------------------- | ------- | -------------------- | ---------- |
| **Flutter SDK**     | ^3.8.0  | Framework            | ✅ Current |
| **firebase_core**   | ^4.1.1  | Firebase integration | ✅ Current |
| **firebase_auth**   | ^6.1.0  | Authentication       | ✅ Current |
| **cloud_firestore** | ^6.0.2  | Database             | ✅ Current |
| **go_router**       | ^16.2.4 | Navigation           | ✅ Current |
| **provider**        | ^6.1.2  | State management     | ✅ Current |
| **mobile_scanner**  | ^7.1.2  | Barcode scanning     | ✅ Current |

### Environment Configuration

| Platform   | File                    | Status      | Variables             |
| ---------- | ----------------------- | ----------- | --------------------- |
| **Web**    | `.env.example`          | ✅ Complete | Firebase config vars  |
| **Mobile** | `firebase_options.dart` | ✅ Complete | FlutterFire generated |

---

## 🛠️ Utilities & Scripts

### Build Scripts

**Status**: ✅ **COMPLETE** | **Location**: `/scripts/`

| Script                     | Purpose                       | Status     |
| -------------------------- | ----------------------------- | ---------- |
| **export-logo.js**         | Generate logo assets          | ✅ Working |
| **dataconnect-codegen.js** | DataConnect client generation | ✅ Working |

### Shared Utilities

**Status**: ✅ **COMPLETE** | **Location**: `/shared/`

| Utility                        | Purpose                          | Status      |
| ------------------------------ | -------------------------------- | ----------- |
| **firestoreServiceFactory.js** | Cross-platform Firestore service | ✅ Complete |
| **firestoreClient.js**         | Expo/React Native client         | ✅ Complete |
| **types.js**                   | Shared data models               | ✅ Complete |

---

## 📋 Core Features Completeness Analysis

Based on the attached core features requirements, here's the comprehensive status assessment:

### 1. User Account System

| Requirement             | Web         | Mobile      | Status          | Notes                                 |
| ----------------------- | ----------- | ----------- | --------------- | ------------------------------------- |
| Email Sign up/login     | ✅ Complete | ✅ Complete | ✅ **COMPLETE** | Firebase Auth implementation          |
| Google OAuth            | ✅ Complete | ✅ Complete | ✅ **COMPLETE** | Web: popup, Mobile: expo-auth-session |
| Apple OAuth             | ✅ Complete | ✅ Complete | ✅ **COMPLETE** | Firebase Auth with Apple provider     |
| Cloud sync multi-device | ✅ Complete | ✅ Complete | ✅ **COMPLETE** | Firebase Firestore real-time sync     |

### 2. Vehicle Management

| Requirement              | Web         | Mobile      | Status          | Notes                                         |
| ------------------------ | ----------- | ----------- | --------------- | --------------------------------------------- |
| Add/Edit/Delete vehicles | ✅ Complete | ✅ Complete | ✅ **COMPLETE** | Full CRUD operations                          |
| Vehicle info fields      | ✅ Complete | ✅ Complete | ✅ **COMPLETE** | make, model, year, VIN, mileage, purchaseDate |
| VIN decoding (NHTSA)     | ✅ Complete | ✅ Complete | ✅ **COMPLETE** | Firebase Functions implementation             |
| VIN scanning             | ❌ N/A      | ✅ Complete | 🔄 **PARTIAL**  | Mobile only (camera barcode)                  |

### 3. Maintenance Tracking

| Requirement                    | Web              | Mobile           | Status          | Notes                                     |
| ------------------------------ | ---------------- | ---------------- | --------------- | ----------------------------------------- |
| Custom maintenance entries     | ✅ Complete      | ✅ Complete      | ✅ **COMPLETE** | Title, notes, cost, date                  |
| Log completed services         | ✅ Complete      | ✅ Complete      | ✅ **COMPLETE** | Full CRUD with timestamps                 |
| Preset schedule (manufacturer) | ✅ Complete      | ✅ Complete      | ✅ **COMPLETE** | Toyota, Honda, Ford schedules implemented |
| Upload photos/receipts         | ✅ Complete      | ✅ Complete      | ✅ **COMPLETE** | Firebase Storage with file management     |
| Mileage-based alerts           | 🚧 Backend Ready | 🚧 Backend Ready | 🚧 **PARTIAL**  | Backend stubs, no UI                      |
| Time-based alerts              | 🚧 Backend Ready | 🚧 Backend Ready | 🚧 **PARTIAL**  | Backend stubs, no UI                      |

### 4. Reminders & Notifications

| Requirement          | Web        | Mobile     | Status                 | Notes                                                                        |
| -------------------- | ---------- | ---------- | ---------------------- | ---------------------------------------------------------------------------- |
| Push reminders       | 🟡 Partial | 🟡 Partial | 🟡 **PARTIAL**         | Scaffolding exists but lifecycle UX and reliability are not fully end-to-end |
| Email reminders      | 🟡 Partial | 🟡 Partial | 🟡 **PARTIAL**         | Delivery path exists but full product flow remains incomplete                |
| Calendar integration | ❌ Missing | ❌ Missing | ❌ **NOT IMPLEMENTED** | No calendar API integration                                                  |

### 5. Dashboard/History

| Requirement               | Web         | Mobile        | Status          | Notes                                                                           |
| ------------------------- | ----------- | ------------- | --------------- | ------------------------------------------------------------------------------- |
| Timeline view             | ✅ Complete | 🔄 Basic List | 🟡 **PARTIAL**  | Web timeline is mature; mobile list exists but parity is incomplete             |
| Cost tracking             | ✅ Complete | 🔄 Mocked     | 🟡 **PARTIAL**  | Web has tracked costs; mobile analytics path uses mock services                 |
| Upcoming tasks view       | ✅ Complete | ✅ Complete   | ✅ **COMPLETE** | Reminder actions (complete/snooze/dismiss/restore) wired on both web and mobile |
| Export history (PDF, CSV) | ✅ Complete | ✅ Complete   | ✅ **COMPLETE** | Web export works; mobile CSV/PDF export via share sheet fully implemented       |

### 6. Ad Integration

| Requirement          | Web         | Mobile     | Status                 | Notes                                |
| -------------------- | ----------- | ---------- | ---------------------- | ------------------------------------ |
| Google AdSense (web) | ✅ Complete | N/A        | ✅ **COMPLETE**        | `AdBanner` component with env config |
| AdMob (mobile)       | N/A         | ❌ Missing | ❌ **NOT IMPLEMENTED** | No mobile ads integration            |
| Rewarded ads premium | ❌ Missing  | ❌ Missing | ❌ **NOT IMPLEMENTED** | No premium features or rewarded ads  |

## 📊 Feature Implementation Summary

### Current Maturity Snapshot

- **Web application**: High maturity, production-deployed, broad feature coverage.
- **iOS mobile application**: Medium maturity, buildable but still blocked by mock/stub service paths and release validation work.
- **Android mobile application**: On hold by project decision (testing/deployment path not active).

### Current Gaps

1. **iOS backend integration**: Replace mock/stub data and service flows with production Firebase-backed behavior.
2. **iOS release confidence**: Expand automated tests and complete App Store distribution readiness checks.
3. **Cross-platform parity**: Keep scope aligned while Android remains paused.

**Implementation Status: Partial**

- Web: ✅ Mostly complete
- iOS: ⚠️ Partial
- Android: ⏸️ On hold

---

## 🚦 Project Health Status

### Overall Status: ⚠️ **PARTIALLY IMPLEMENTED**

| Category                 | Status         | Score | Assessment                                                                   |
| ------------------------ | -------------- | ----- | ---------------------------------------------------------------------------- |
| **Core Functionality**   | ⚠️ Partial     | 65%   | Web core is solid; mobile remains in mocked runtime mode                     |
| **Feature Completeness** | ⚠️ Partial     | 55%   | Major roadmap capabilities remain incomplete across platforms                |
| **Code Quality**         | ✅ Good        | 75%   | Web checks are healthy; mobile quality cannot be fully assessed while mocked |
| **User Experience**      | ⚠️ Partial     | 65%   | Web UX is stronger than current mobile parity                                |
| **Monetization**         | ⚠️ Partial     | 55%   | Monetization assumptions need validation against true runtime feature set    |
| **Testing**              | ⚠️ Partial     | 55%   | Additional integration tests needed for reminder/notification/export flows   |
| **Documentation**        | ⚠️ In Progress | 75%   | This file is being normalized to match code reality                          |
| **Deployment**           | ⚠️ Partial     | 60%   | Web deploy path is active; mobile production parity pending                  |

### Current Assessment (March 2026)

Vehicle Vitals is live and operational on web, while the iOS app remains in a pre-release hardening phase. The Android track is explicitly paused until testing and deployment constraints are resolved.

### Known Issues

| Issue                     | Severity | Platform | Status              |
| ------------------------- | -------- | -------- | ------------------- |
| CocoaPods config warning  | Low      | iOS      | ⚠️ Harmless warning |
| VIN decode mobile missing | Medium   | Mobile   | 📋 Enhancement      |

### Priority Next Steps (Reality-Aligned)

#### Sprint 1 - Re-enable Real Mobile Runtime

1. Replace mocked mobile auth/data services with real Firebase-backed services.
2. Re-enable and validate mobile notifications in production-capable build configs.
3. Re-enable mobile export and calendar integrations behind controlled feature flags.

#### Sprint 2 - Complete Reminder Lifecycle

4. Implement Firestore-backed reminder CRUD (`add`, `get`, `complete`, `snooze`) in shared service layer.
5. Connect upcoming task actions to reminder state transitions on both web and mobile.
6. Add integration tests for reminder generation, actioning, and notification delivery.

#### Sprint 3 - Delivery Hardening and Parity

7. Validate end-to-end email delivery integration for scheduled reminders.
8. Align mobile/web feature availability and remove stale "complete" claims from remaining docs.
9. Reassess premium/monetization assumptions after parity milestones are met.

#### 🛠️ **Technical Debt (Ongoing)**

14. **Test Coverage**: Expand test coverage for mobile app (Flutter widget tests)
15. **Performance**: Optimize Firestore queries and implement pagination
16. **Security**: Review and enhance Firebase security rules
17. **Accessibility**: Improve WCAG compliance across platforms

---

## 📞 Support & Maintenance

### Key Files for Reference

- **Configuration**: `docs/.github/Copilot-Instructions.md`
- **Setup Guides**: `README.md`, `mobile/README.md`
- **Deployment**: `DEPLOY.md`
- **Architecture**: `shared/firestoreServiceFactory.js`

### Development Commands

| Platform   | Command                    | Purpose                        |
| ---------- | -------------------------- | ------------------------------ |
| **Web**    | `cd web && npm run dev`    | Start development server       |
| **Mobile** | `cd mobile && flutter run` | Run on device/simulator        |
| **Tests**  | `cd web && npm test`       | Run test suite                 |
| **Deploy** | `git push origin main`     | Auto-deploy via GitHub Actions |

### Development Notes

#### Data Operations

- **Vehicle Deletion**: Web UI exposes "Delete Vehicle" action which removes vehicle documents at `users/{userId}/vehicles/{vin}`
- **Cascade Deletes**: Single-document delete does NOT cascade to maintenance subcollections. For cascading deletes, implement Cloud Function or recursive delete utility
- **Maintenance Data**: Stored in subcollections under vehicle documents

#### Future Improvements

- Implement recursive delete for complete vehicle removal (including maintenance entries)
- Add undo/snackbar notifications for delete operations to improve UX
- Add pagination or real-time listeners for vehicle lists with larger datasets

---

**Project Status**: Web delivery is strong, while mobile and cross-platform parity remain in progress. Core workflows are partially implemented overall, and roadmap features are still pending.
