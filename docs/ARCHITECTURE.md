# Vehicle Vitals - Architecture Design Document

**Version**: 1.0  
**Last Updated**: February 16, 2026  
**Status**: ✅ PRODUCTION READY  
**Owner**: Mark Nelson

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Principles](#architecture-principles)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Data Architecture](#data-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Integration Points](#integration-points)

---

## Executive Summary

Vehicle Vitals is a cross-platform vehicle management application built on a **Firebase-First Architecture**, enabling users to track vehicle information, maintenance history, and receive proactive notifications. The system consists of three primary applications:

- **Web Application**: React 18 + Vite SPA hosted on Firebase Hosting
- **Mobile Application**: Flutter app for iOS (15.0+) and Android
- **Backend Services**: Firebase Suite (Auth, Firestore, Functions, Storage)

**Key Architectural Decisions**:

- **Serverless-First**: No custom API servers; all business logic in Firebase Functions
- **Multi-Tenant**: User-scoped data with Firestore security rules
- **Offline-First Mobile**: Flutter app supports offline data access and sync
- **Real-Time Sync**: Firestore real-time listeners for live data updates
- **Monorepo Structure**: npm workspaces for code sharing and consistency

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐       │
│  │   Web Frontend   │              │  Mobile Frontend │       │
│  │   React + Vite   │              │     Flutter      │       │
│  │   (Firebase SDK) │              │  (Firebase SDK)  │       │
│  └────────┬─────────┘              └────────┬─────────┘       │
│           │                                  │                 │
│           └──────────────┬───────────────────┘                 │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           │ HTTPS/WebSocket
                           │
┌──────────────────────────┼─────────────────────────────────────┐
│                    FIREBASE LAYER                               │
├──────────────────────────┼─────────────────────────────────────┤
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────┐         │
│  │         Firebase Authentication                  │         │
│  │         (Email/Password + Anonymous)             │         │
│  └───────────────────┬──────────────────────────────┘         │
│                      │                                         │
│  ┌───────────────────▼──────────────────────────────┐         │
│  │         Firebase Firestore                       │         │
│  │         (NoSQL Database + Real-time Sync)        │         │
│  │   Collections: users, vehicles, maintenance      │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Firebase Functions                       │         │
│  │         (Serverless Business Logic)              │         │
│  │   - VIN Decoding (NHTSA API)                     │         │
│  │   - Maintenance Scheduling                       │         │
│  │   - Data Validation                              │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Firebase Storage                         │         │
│  │         (File Storage for Images/PDFs)           │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Firebase Hosting                         │         │
│  │         (Static Web App Hosting + CDN)           │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────┼─────────────────────────────────────┐
│                  EXTERNAL SERVICES                              │
├──────────────────────────┼─────────────────────────────────────┤
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────┐         │
│  │         NHTSA VPIC API                           │         │
│  │         (Vehicle VIN Decoding Service)           │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### System Boundaries

**In-Scope**:

- User authentication and authorization
- Vehicle CRUD operations
- Maintenance history tracking
- VIN decoding and vehicle data enrichment
- Real-time data synchronization
- Offline mobile data access
- Multi-device data sync

**Out-of-Scope** (Future Enhancements):

- Third-party mechanic integrations
- Parts ordering systems
- Insurance integrations
- Vehicle diagnostics (OBD-II)
- Fleet management analytics dashboard

---

## Architecture Principles

### 1. Firebase-First Architecture

**Principle**: All client applications communicate directly with Firebase services. No custom API servers.

**Rationale**:

- **Reduced Infrastructure Complexity**: No server provisioning or management
- **Auto-Scaling**: Firebase handles traffic spikes automatically
- **Real-Time Capabilities**: Built-in WebSocket support for live updates
- **Cost Efficiency**: Pay-per-use model scales with adoption
- **Security**: Firestore security rules provide declarative access control

**Implementation**:

```javascript
// Web: Direct Firebase SDK usage
import { collection, query, where, getDocs } from 'firebase/firestore';

const q = query(collection(db, 'vehicles'), where('userId', '==', user.uid));
const vehicles = await getDocs(q);
```

### 2. Serverless Business Logic

**Principle**: All business logic resides in Firebase Functions, not in clients.

**Rationale**:

- **Consistent Validation**: Server-side validation prevents data corruption
- **Security**: Sensitive operations (VIN API calls) hidden from clients
- **Flexibility**: Update logic without redeploying clients
- **Cost Control**: Functions scale to zero when not in use

**Implementation**:

```typescript
// Firebase Function: VIN decoding
export const decodeVIN = onRequest(
  { cors: true },
  async (request, response) => {
    const { vin } = request.body;

    // Server-side validation
    if (!vin || vin.length !== 17) {
      response.status(400).json({ error: 'Invalid VIN' });
      return;
    }

    // Call external NHTSA API
    const vehicleData = await fetchFromNHTSA(vin);
    response.json(vehicleData);
  }
);
```

### 3. Offline-First Mobile Experience

**Principle**: Mobile app works without network connectivity, syncing when online.

**Rationale**:

- **Reliability**: Users can access data in garages, underground parking
- **Performance**: No loading spinners for cached data
- **User Trust**: App always responsive regardless of connectivity

**Implementation**:

```dart
// Flutter: Firestore offline persistence
await FirebaseFirestore.instance.settings = Settings(
  persistenceEnabled: true,
  cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED
);
```

### 4. Monorepo Code Sharing

**Principle**: Shared code (types, utilities, Firebase config) lives in `@vehicle-vitals/shared` package.

**Rationale**:

- **Consistency**: Single source of truth for data models
- **DRY**: No duplicate Firebase initialization logic
- **Type Safety**: Shared TypeScript types across web/functions
- **Maintainability**: Update shared code once, benefits all apps

**Implementation**:

```
packages/
├── shared/              # @vehicle-vitals/shared
│   ├── firebaseConfig.js
│   ├── types.js
│   └── maintenanceSchedules.js
├── web/                 # Uses @vehicle-vitals/shared
├── mobile/              # Uses shared Dart models (mirrored)
└── functions/           # Uses @vehicle-vitals/shared
```

### 5. Environment Isolation

**Principle**: Separate Firebase projects for dev, staging, production.

**Rationale**:

- **Safety**: No accidental production data corruption during development
- **Testing**: Isolated environments for integration testing
- **Compliance**: Production data never leaves production environment

**Implementation**:

```bash
# Environment-specific Firebase configs
firebase.dev.json       # Development Firebase project
firebase.staging.json   # Staging Firebase project
firebase.prod.json      # Production Firebase project
```

---

## Technology Stack

### Frontend Technologies

#### Web Application

| Component       | Technology           | Version  | Rationale                                      |
| --------------- | -------------------- | -------- | ---------------------------------------------- |
| **Framework**   | React                | 18.0+    | Component-based, large ecosystem, performance  |
| **Build Tool**  | Vite                 | 7.1+     | Fast HMR, optimized production builds          |
| **Routing**     | React Router         | 6.0+     | De facto standard for React SPAs               |
| **State**       | React Context        | Built-in | Simple global state without external deps      |
| **Styling**     | Tailwind CSS         | 3.4+     | Utility-first, consistent design system        |
| **Type Safety** | TypeScript           | 5.6+     | Catch errors at compile-time                   |
| **Testing**     | Vitest + Testing Lib | Latest   | Fast, Jest-compatible, React testing utilities |
| **Linting**     | ESLint + Prettier    | Latest   | Code quality and consistency                   |

**Key Dependencies**:

```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "firebase": "^12.3.0",
  "tailwindcss": "^3.4.18",
  "vite": "^7.1.11"
}
```

#### Mobile Application

| Component         | Technology         | Version | Rationale                                    |
| ----------------- | ------------------ | ------- | -------------------------------------------- |
| **Framework**     | Flutter            | 3.24+   | Cross-platform, native performance           |
| **Language**      | Dart               | Latest  | Type-safe, modern, Flutter-native            |
| **Navigation**    | go_router          | Latest  | Declarative routing, deep linking support    |
| **State**         | Provider           | Latest  | Simple, Flutter-recommended state management |
| **Firebase**      | FlutterFire        | Latest  | Official Firebase SDK for Flutter            |
| **Barcode Scan**  | mobile_scanner     | Latest  | VIN barcode scanning (Code39/128)            |
| **Local Storage** | shared_preferences | Latest  | Persistent key-value storage                 |

**Key Dependencies**:

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: latest
  firebase_auth: latest
  cloud_firestore: latest
  go_router: latest
  provider: latest
  mobile_scanner: latest
```

### Backend Technologies

| Component     | Technology         | Version | Rationale                                   |
| ------------- | ------------------ | ------- | ------------------------------------------- |
| **Auth**      | Firebase Auth      | 12.3+   | OAuth2, social login, passwordless options  |
| **Database**  | Cloud Firestore    | 12.3+   | NoSQL, real-time, scalable, offline support |
| **Functions** | Firebase Functions | v2      | Serverless compute, auto-scaling            |
| **Storage**   | Firebase Storage   | 12.3+   | CDN-backed file storage                     |
| **Hosting**   | Firebase Hosting   | 12.3+   | Global CDN, SSL, custom domains             |
| **Runtime**   | Node.js            | 22      | LTS, stable, large ecosystem                |

### Development & Deployment

| Component           | Technology       | Rationale                                      |
| ------------------- | ---------------- | ---------------------------------------------- |
| **CI/CD**           | GitHub Actions   | Native GitHub integration, free for OSS        |
| **Package Manager** | npm              | Industry standard, npm workspaces for monorepo |
| **Monorepo**        | npm workspaces   | Native, no external tools needed               |
| **Build System**    | Turbo (optional) | Parallel builds, caching                       |
| **Version Control** | Git + GitHub     | Industry standard, collaboration features      |

---

## System Architecture

### Component Architecture

#### Web Application Architecture

```
packages/web/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component with routing
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── Layout.tsx             # Page layout wrapper
│   │   ├── ProtectedRoute.tsx     # Auth-gated routes
│   │   ├── SiteHeader.tsx         # Navigation header
│   │   ├── SiteFooter.tsx         # Footer with links
│   │   └── EnvironmentGate.tsx    # Environment-specific rendering
│   │
│   ├── pages/                      # Page-level components
│   │   ├── Home.tsx               # Vehicle list dashboard
│   │   ├── AddVehicle.tsx         # Add vehicle form
│   │   ├── EditVehicle.tsx        # Edit vehicle + maintenance
│   │   ├── Login.tsx              # Authentication
│   │   ├── SignUp.tsx             # User registration
│   │   ├── Profile.tsx            # User profile management
│   │   ├── TimelineDashboard.tsx  # Maintenance timeline view
│   │   ├── UpcomingTasks.tsx      # Upcoming maintenance alerts
│   │   └── Landing.tsx            # Marketing landing page
│   │
│   ├── shared/                     # Shared utilities
│   │   ├── AuthContext.tsx        # Authentication state management
│   │   └── firebaseConfig.js      # Firebase SDK initialization
│   │
│   ├── utils/                      # Utility functions
│   │   ├── vehicleService.js      # Vehicle CRUD operations
│   │   ├── vpicService.js         # NHTSA VIN API client
│   │   ├── dataExport.js          # CSV/PDF export utilities
│   │   └── logger.js              # Logging & analytics wrapper
│   │
│   └── hooks/                      # Custom React hooks
│       └── useVehicles.ts         # Vehicle data fetching hook
│
├── public/                         # Static assets
│   ├── 404.html                   # Custom 404 page
│   └── index.html                 # HTML template
│
└── package.json                    # Dependencies & scripts
```

**Routing Structure**:

```typescript
// App.tsx routing configuration
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<SignUp />} />

  {/* Protected routes require authentication */}
  <Route element={<ProtectedRoute />}>
    <Route path="/home" element={<Home />} />
    <Route path="/add-vehicle" element={<AddVehicle />} />
    <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
    <Route path="/timeline" element={<TimelineDashboard />} />
    <Route path="/upcoming-tasks" element={<UpcomingTasks />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
</Routes>
```

#### Mobile Application Architecture

```
packages/mobile/
├── lib/
│   ├── main.dart                   # App entry point + routing
│   │
│   ├── screens/                    # Full-screen views
│   │   ├── home_screen.dart       # Vehicle cards dashboard
│   │   ├── add_vehicle_screen.dart
│   │   ├── edit_vehicle_screen.dart
│   │   ├── scan_vin_screen.dart   # Camera-based VIN scanning
│   │   ├── maintenance_list_screen.dart
│   │   ├── maintenance_detail_screen.dart
│   │   ├── account_screen.dart    # User profile
│   │   ├── login_screen.dart
│   │   ├── signup_screen.dart
│   │   ├── premium_screen.dart    # In-app purchases (future)
│   │   ├── analytics_screen.dart  # Maintenance analytics
│   │   └── upcoming_tasks_screen.dart
│   │
│   ├── models/                     # Data models
│   │   ├── vehicle.dart           # Vehicle entity
│   │   ├── maintenance.dart       # Maintenance record entity
│   │   └── maintenance_schedule.dart
│   │
│   ├── services/                   # Business logic layer
│   │   ├── auth_service.dart      # Firebase Auth wrapper
│   │   ├── firestore_service.dart # Firestore CRUD operations
│   │   ├── notification_service.dart
│   │   ├── offline_service.dart   # Offline data management
│   │   ├── analytics_service.dart # Usage tracking
│   │   ├── premium_service.dart   # In-app purchase (future)
│   │   └── data_export_service.dart
│   │
│   ├── components/                 # Reusable widgets
│   │   └── ad_banner.dart         # Ad integration (future)
│   │
│   ├── theme/                      # App theming
│   │   ├── app_theme.dart         # Material theme config
│   │   ├── design_tokens.dart     # Colors, spacing, typography
│   │   └── tailwind_utilities.dart
│   │
│   └── firebase_options.dart       # Firebase config (generated)
│
└── pubspec.yaml                    # Dependencies
```

**Navigation Structure** (go_router):

```dart
// main.dart routing configuration
final router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (context, state) => LoginScreen()),
    GoRoute(path: '/signup', builder: (context, state) => SignUpScreen()),

    // Protected routes with auth guard
    GoRoute(
      path: '/',
      redirect: _authGuard,
      builder: (context, state) => HomeScreen(),
    ),
    GoRoute(path: '/add-vehicle', builder: (context, state) => AddVehicleScreen()),
    GoRoute(path: '/edit-vehicle/:id', builder: (context, state) => EditVehicleScreen()),
    GoRoute(path: '/scan-vin', builder: (context, state) => ScanVINScreen()),
    GoRoute(path: '/maintenance/:vehicleId', builder: (context, state) => MaintenanceListScreen()),
  ],
);
```

#### Shared Package Architecture

```
packages/shared/
├── src/
│   ├── index.js                    # Main exports
│   ├── types.js                    # Shared data models
│   ├── firebaseConfig.js           # Firebase initialization
│   ├── firestoreService.js         # Firestore helpers
│   ├── firestoreClient.js          # Client factory
│   ├── firestoreServiceFactory.js  # Service factory pattern
│   └── maintenanceSchedules.js     # Maintenance recommendation logic
│
└── package.json
```

**Shared Types** (used across web and functions):

```javascript
// types.js
export const defaultVehicle = {
  make: '',
  model: '',
  year: '',
  vin: '',
  mileage: '',
  purchaseDate: '',
  nextDueByMiles: '',
  nextDueByDate: '',
  services: [],
};

export const MAINTENANCE_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection',
  'Air Filter',
  'Transmission Service',
  'Coolant Flush',
  'Spark Plugs',
  'Battery',
  'Inspection',
  'Other',
];
```

### Data Flow Architecture

#### User Authentication Flow

```
┌──────────┐         ┌─────────────────┐         ┌──────────────────┐
│  Client  │         │  Firebase Auth  │         │    Firestore     │
└─────┬────┘         └────────┬────────┘         └────────┬─────────┘
      │                       │                           │
      │  1. signInWithEmail   │                           │
      ├──────────────────────>│                           │
      │                       │                           │
      │  2. ID Token          │                           │
      │<──────────────────────┤                           │
      │                       │                           │
      │  3. Set auth header   │                           │
      ├───────────────────────┼──────────────────────────>│
      │                       │                           │
      │                       │  4. Verify token          │
      │                       │<──────────────────────────┤
      │                       │                           │
      │                       │  5. Allow/Deny access     │
      │                       │──────────────────────────>│
      │                       │                           │
      │  6. User data         │                           │
      │<──────────────────────┼───────────────────────────┤
      │                       │                           │
```

**Implementation**:

```typescript
// Web: AuthContext.tsx
const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Firebase SDK automatically attaches ID token to Firestore requests
  setUser(user);
};
```

#### Vehicle CRUD Flow

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Client  │    │  Firestore  │    │   Security   │    │  Functions  │
└────┬─────┘    └──────┬──────┘    └──────┬───────┘    └──────┬──────┘
     │                 │                  │                    │
     │ 1. Add vehicle  │                  │                    │
     ├────────────────>│                  │                    │
     │                 │                  │                    │
     │                 │ 2. Check rules   │                    │
     │                 ├─────────────────>│                    │
     │                 │                  │                    │
     │                 │ 3. Allow if      │                    │
     │                 │    userId match  │                    │
     │                 │<─────────────────┤                    │
     │                 │                  │                    │
     │                 │ 4. Write data    │                    │
     │                 │  + timestamps    │                    │
     │ 5. Success      │                  │                    │
     │<────────────────┤                  │                    │
     │                 │                  │                    │
     │ (Optional)      │                  │                    │
     │ 6. Enrich data  │                  │                    │
     │ via function    │                  │                    │
     ├─────────────────┼──────────────────┼───────────────────>│
     │                 │                  │                    │
     │                 │                  │  7. Call NHTSA API │
     │                 │                  │  + validate VIN    │
     │                 │                  │                    │
     │ 8. Return data  │                  │                    │
     │<────────────────┼──────────────────┼────────────────────┤
     │                 │                  │                    │
```

**Firestore Security Rules**:

```javascript
// firestore.rules
match /vehicles/{vehicleId} {
  allow read, write: if request.auth != null
                     && request.resource.data.userId == request.auth.uid;
}

match /vehicles/{vehicleId}/maintenance/{maintenanceId} {
  allow read, write: if request.auth != null
                     && get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.userId == request.auth.uid;
}
```

#### VIN Decoding Flow

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Client  │    │   Firebase   │    │   NHTSA     │    │  Firestore   │
│          │    │   Functions  │    │   VPIC API  │    │              │
└────┬─────┘    └──────┬───────┘    └──────┬──────┘    └──────┬───────┘
     │                 │                   │                   │
     │ 1. Decode VIN   │                   │                   │
     │ (17-char)       │                   │                   │
     ├────────────────>│                   │                   │
     │                 │                   │                   │
     │                 │ 2. Validate VIN   │                   │
     │                 │    format         │                   │
     │                 │                   │                   │
     │                 │ 3. Call VPIC API  │                   │
     │                 ├──────────────────>│                   │
     │                 │                   │                   │
     │                 │ 4. Vehicle data   │                   │
     │                 │    (make, model,  │                   │
     │                 │     year)         │                   │
     │                 │<──────────────────┤                   │
     │                 │                   │                   │
     │                 │ 5. Transform &    │                   │
     │                 │    validate       │                   │
     │                 │                   │                   │
     │ 6. Return data  │                   │                   │
     │<────────────────┤                   │                   │
     │                 │                   │                   │
     │ 7. Save vehicle │                   │                   │
     ├─────────────────┼───────────────────┼──────────────────>│
     │                 │                   │                   │
     │ 8. Confirm save │                   │                   │
     │<────────────────┼───────────────────┼───────────────────┤
     │                 │                   │                   │
```

**Firebase Function Implementation**:

```typescript
// packages/functions/src/index.ts
export const decodeVIN = onRequest(
  { cors: true },
  async (request, response) => {
    const { vin } = request.body;

    if (!vin || typeof vin !== 'string' || vin.length !== 17) {
      response.status(400).json({ error: 'Valid 17-character VIN required' });
      return;
    }

    try {
      // Call NHTSA VPIC API
      const vpicUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
      const vpicResponse = await fetch(vpicUrl);
      const vpicData = await vpicResponse.json();

      // Extract relevant fields
      const results = vpicData.Results || [];
      const vehicleData = {
        make: findValue(results, 'Make'),
        model: findValue(results, 'Model'),
        year: findValue(results, 'ModelYear'),
        vin: vin.toUpperCase(),
      };

      response.json(vehicleData);
    } catch (error) {
      logger.error('VIN decode error', error);
      response.status(500).json({ error: 'Failed to decode VIN' });
    }
  }
);
```

---

## Data Architecture

### Database Design (Firestore)

#### Collection Structure

```
firestore/
├── users/                             # User profiles
│   └── {userId}/                      # Document ID = Firebase Auth UID
│       ├── email: string
│       ├── displayName: string
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       └── preferences: object
│
├── vehicles/                          # Vehicle records
│   └── {vehicleId}/                   # Auto-generated document ID
│       ├── userId: string             # Owner reference (indexed)
│       ├── vin: string                # 17-character VIN (unique)
│       ├── make: string
│       ├── model: string
│       ├── year: number
│       ├── mileage: number
│       ├── purchaseDate: string       # ISO date
│       ├── nextDueByMiles: string
│       ├── nextDueByDate: string      # ISO date
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       │
│       └── maintenance/               # Subcollection
│           └── {maintenanceId}/       # Auto-generated document ID
│               ├── serviceType: string
│               ├── description: string
│               ├── date: string       # ISO date
│               ├── mileage: number
│               ├── cost: number
│               ├── provider: string
│               ├── notes: string
│               ├── createdAt: timestamp
│               └── updatedAt: timestamp
```

#### Data Model Schemas

**User Document**:

```typescript
interface User {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark';
  };
}
```

**Vehicle Document**:

```typescript
interface Vehicle {
  userId: string; // Foreign key to users collection
  vin: string; // 17-character uppercase VIN
  make: string;
  model: string;
  year: number;
  mileage: number;
  purchaseDate: string; // ISO 8601 format: "2024-01-15"
  nextDueByMiles?: string; // e.g., "50000"
  nextDueByDate?: string; // ISO 8601 format
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Maintenance Document**:

```typescript
interface Maintenance {
  serviceType: string; // From MAINTENANCE_TYPES enum
  description: string;
  date: string; // ISO 8601 format: "2024-12-01"
  mileage: number;
  cost?: number;
  provider: string;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Indexes

**Composite Indexes** (defined in `firestore.indexes.json`):

```json
{
  "indexes": [
    {
      "collectionGroup": "vehicles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "maintenance",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "mileage", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Query Patterns**:

```javascript
// Get all vehicles for a user (sorted by creation date)
const vehiclesQuery = query(
  collection(db, 'vehicles'),
  where('userId', '==', user.uid),
  orderBy('createdAt', 'desc')
);

// Get maintenance history for a vehicle (sorted by date)
const maintenanceQuery = query(
  collection(db, `vehicles/${vehicleId}/maintenance`),
  orderBy('date', 'desc'),
  limit(50)
);

// Get upcoming maintenance (across all vehicles for user)
const upcomingQuery = query(
  collectionGroup(db, 'maintenance'),
  where('userId', '==', user.uid),
  where('nextDueByDate', '>=', today),
  orderBy('nextDueByDate', 'asc')
);
```

#### Data Relationships

```
┌──────────────────┐
│      users       │
│  (userId: UID)   │
└────────┬─────────┘
         │ 1
         │
         │ N
┌────────▼─────────┐
│     vehicles     │
│  (vehicleId)     │
│  userId: string  │<──── Indexed for fast user queries
└────────┬─────────┘
         │ 1
         │
         │ N
┌────────▼─────────────┐
│    maintenance       │  (Subcollection)
│  (maintenanceId)     │
│  Inherits userId     │
│  via parent vehicle  │
└──────────────────────┘
```

**Design Rationale**:

- **Denormalization**: `userId` copied to vehicles for efficient queries
- **Subcollections**: Maintenance under vehicles for hierarchical grouping
- **Timestamps**: Automatic `createdAt`/`updatedAt` for audit trails
- **Strings for Dates**: ISO 8601 strings for cross-platform compatibility

### Caching Strategy

#### Web Application Caching

- **Firestore SDK Cache**: Auto-caches documents client-side
- **Service Worker** (future): PWA offline support
- **React State**: In-memory component state for UI responsiveness

#### Mobile Application Caching

```dart
// Flutter: Enable offline persistence
FirebaseFirestore.instance.settings = Settings(
  persistenceEnabled: true,
  cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED
);
```

**Cache Invalidation**:

- Firestore real-time listeners auto-update cache
- Manual refresh via pull-to-refresh gestures
- Background sync when app returns to foreground

---

## Security Architecture

### Authentication & Authorization

#### Authentication Methods

1. **Email/Password**: Primary authentication method

   ```typescript
   await createUserWithEmailAndPassword(auth, email, password);
   await signInWithEmailAndPassword(auth, email, password);
   ```

2. **Anonymous Authentication** (Development Only):

   ```typescript
   // Only enabled in development environment
   if (import.meta.env.DEV) {
     await signInAnonymously(auth);
   }
   ```

3. **Password Reset**:
   ```typescript
   await sendPasswordResetEmail(auth, email);
   ```

#### Authorization Model

**User-Scoped Data Access**:

- All data belongs to a specific user (via `userId` field)
- Firestore security rules enforce user isolation
- No cross-user data access (except future shared fleet features)

**Security Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Vehicles: must be owned by authenticated user
    match /vehicles/{vehicleId} {
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;

      allow update, delete: if request.auth != null
                            && resource.data.userId == request.auth.uid;

      // Maintenance subcollection inherits vehicle ownership
      match /maintenance/{maintenanceId} {
        allow read, write: if request.auth != null
                           && get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.userId == request.auth.uid;
      }
    }
  }
}
```

### Data Protection

#### Encryption

- **At Rest**: Firestore encrypts all data automatically (AES-256)
- **In Transit**: HTTPS/TLS 1.3 for all Firebase communications
- **Credentials**: Firebase API keys stored in environment variables (`.env` files, never committed)

#### Secrets Management

**Environment Variables**:

```bash
# .env.development
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=vehicle-vitals-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vehicle-vitals-dev

# .env.production
VITE_FIREBASE_API_KEY=[different-key]
VITE_FIREBASE_AUTH_DOMAIN=vehicle-vitals.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vehicle-vitals-prod
```

**GitHub Secrets** (CI/CD):

- Stored in GitHub repository settings
- Injected at build time for deployments
- Never logged or exposed in build outputs

#### Input Validation

**Client-Side Validation**:

```typescript
// Web: Form validation before submission
const validateVIN = (vin: string): boolean => {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

**Server-Side Validation** (Firebase Functions):

```typescript
export const decodeVIN = onRequest({ cors: true }, async (req, res) => {
  const { vin } = req.body;

  // Validate VIN format
  if (!vin || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    res.status(400).json({ error: 'Invalid VIN format' });
    return;
  }

  // Additional validation...
});
```

**Firestore Rules Validation**:

```javascript
match /vehicles/{vehicleId} {
  allow create: if request.auth != null
                && request.resource.data.vin is string
                && request.resource.data.vin.size() == 17
                && request.resource.data.year is int
                && request.resource.data.year >= 1900
                && request.resource.data.year <= 2100;
}
```

### CORS & API Security

**Firebase Functions CORS**:

```typescript
export const decodeVIN = onRequest(
  {
    cors: true, // Allows cross-origin requests
  },
  async (req, res) => {
    // Function implementation
  }
);
```

**Rate Limiting** (Future):

- Firebase App Check for bot protection
- Cloud Armor for DDoS protection
- Function concurrency limits

---

## Deployment Architecture

### Environment Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      ENVIRONMENTS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  DEVELOPMENT                                         │  │
│  │  - Firebase Project: vehicle-vitals-dev              │  │
│  │  - Web: localhost:5173 (Vite dev server)             │  │
│  │  - Mobile: Firebase emulators                        │  │
│  │  - Database: Local Firestore emulator                │  │
│  │  - CI/CD: Manual deployments only                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  STAGING                                             │  │
│  │  - Firebase Project: vehicle-vitals-staging          │  │
│  │  - Web: staging.vehiclevitals.com                    │  │
│  │  - Mobile: TestFlight (iOS) / Internal Track (Android)│  │
│  │  - Database: Staging Firestore (test data)           │  │
│  │  - CI/CD: Auto-deploy on 'develop' branch push       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  PRODUCTION                                          │  │
│  │  - Firebase Project: vehicle-vitals-prod             │  │
│  │  - Web: www.vehiclevitals.com                        │  │
│  │  - Mobile: App Store / Google Play Store             │  │
│  │  - Database: Production Firestore (live data)        │  │
│  │  - CI/CD: Manual approval required for deploy        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

**GitHub Actions Workflow**:

```yaml
# .github/workflows/master-pipeline.yml
name: Master CI/CD Pipeline

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm run test:web

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Firebase Staging
        run: firebase deploy --only hosting,functions --project staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production # Requires manual approval
    steps:
      - name: Deploy to Firebase Production
        run: firebase deploy --only hosting,functions --project production
```

### Hosting Architecture

```
┌────────────────────────────────────────────────────────┐
│              FIREBASE HOSTING (CDN)                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  Edge Locations (Global CDN)                 │    │
│  │  - Automatic SSL/TLS (Firebase-managed)      │    │
│  │  - Brotli/Gzip compression                   │    │
│  │  - Cache-Control headers                     │    │
│  │  - HTTP/2 server push                        │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  Custom Domains                              │    │
│  │  - Production: www.vehiclevitals.com         │    │
│  │  - Staging: staging.vehiclevitals.com        │    │
│  │  - Auto-renewal SSL certificates             │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  SPA Rewrite Rules                           │    │
│  │  - All routes → index.html (client routing)  │    │
│  │  - 404.html for not found pages              │    │
│  │  - Cache static assets (max-age=1year)       │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Firebase Hosting Configuration** (`firebase.json`):

```json
{
  "hosting": {
    "public": "packages/web/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Mobile App Distribution

**iOS (TestFlight & App Store)**:

```
Development → TestFlight Internal → TestFlight External → App Store
    ↓              ↓                       ↓                  ↓
  Local        Team Members            Beta Testers      Public Release
   Xcode         (25 max)               (10k max)         (unlimited)
```

**Android (Internal Testing & Play Store)**:

```
Development → Internal Track → Closed Testing → Open Testing → Production
    ↓              ↓               ↓                ↓             ↓
Android Studio   Team Only     Invited Testers  Public Beta   Public Release
  Local            (100)          (custom)        (unlimited)   (unlimited)
```

---

## Scalability & Performance

### Performance Optimizations

#### Web Application

1. **Code Splitting**:

   ```typescript
   // Lazy load pages for smaller initial bundle
   const Home = lazy(() => import('./pages/Home'));
   const EditVehicle = lazy(() => import('./pages/EditVehicle'));

   <Suspense fallback={<Loading />}>
     <Routes>
       <Route path="/home" element={<Home />} />
       <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
     </Routes>
   </Suspense>
   ```

2. **Tree Shaking**: Vite automatically removes unused code
3. **Asset Optimization**: Images compressed, lazy-loaded
4. **CDN Caching**: Firebase Hosting caches static assets at edge

#### Mobile Application

1. **Offline Persistence**: Firestore cache reduces network calls
2. **ListView Pagination**: Lazy load maintenance records
3. **Image Optimization**: Compress photos before upload
4. **Provider State**: Avoid unnecessary rebuilds with selective listeners

### Scalability Targets

| Metric                   | Target      | Current Capacity | Bottleneck Mitigation           |
| ------------------------ | ----------- | ---------------- | ------------------------------- |
| **Concurrent Users**     | 100,000 DAU | Unlimited        | Firebase auto-scales            |
| **Firestore Reads**      | 10M/day     | 50M/day (quota)  | Implement client-side caching   |
| **Firestore Writes**     | 1M/day      | 10M/day (quota)  | Batch writes, optimize updates  |
| **Function Invocations** | 1M/day      | 10M/day (quota)  | Cache VIN decodes, rate limit   |
| **Storage**              | 100GB       | Unlimited (paid) | Implement file size limits      |
| **Database Size**        | 10GB        | Unlimited (paid) | Archive old maintenance records |

### Monitoring & Observability

**Firebase Performance Monitoring**:

```typescript
// Web: Track custom metrics
import { trace } from 'firebase/performance';

const vinDecodeTrace = trace(performance, 'vin_decode');
vinDecodeTrace.start();
await decodeVIN(vin);
vinDecodeTrace.stop();
```

**Cloud Functions Logging**:

```typescript
import * as logger from 'firebase-functions/logger';

logger.info('VIN decoded successfully', { vin, make, model, year });
logger.error('VIN decode failed', { vin, error: error.message });
```

**Metrics to Track**:

- Page load time (Web Vitals: LCP, FID, CLS)
- Function cold start latency
- Firestore query performance
- App crash rate (Crashlytics)
- User engagement (Firebase Analytics)

---

## Integration Points

### External APIs

#### NHTSA VPIC API (VIN Decoding)

**Endpoint**: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{VIN}?format=json`

**Rate Limits**: No official limit (public API)

**Error Handling**:

```typescript
try {
  const response = await fetch(vpicUrl);
  if (!response.ok) {
    throw new Error(`NHTSA API error: ${response.status}`);
  }
  const data = await response.json();

  // VPIC returns 200 even for invalid VINs, check Results array
  if (!data.Results || data.Results.length === 0) {
    throw new Error('Invalid VIN or no data returned');
  }

  return parseVPICResponse(data);
} catch (error) {
  logger.error('VPIC API error', { vin, error });
  // Fallback: allow manual entry
  return null;
}
```

**Caching Strategy**:

- Cache decoded VINs in Firestore for 90 days
- Check cache before calling NHTSA API to reduce external calls

### Future Integrations (Roadmap)

1. **Mechanic Network APIs**: Integrations with RepairPal, YourMechanic, CarMD
2. **Parts Suppliers**: AutoZone, O'Reilly Auto Parts APIs
3. **Insurance Integrations**: API connections for proof of maintenance
4. **OBD-II Diagnostics**: Bluetooth readers for real-time vehicle health
5. **Payment Gateway**: Stripe/PayPal for premium subscriptions

---

## Appendix

### Technology Upgrade Path

| Technology   | Current Version | Next Upgrade | Breaking Changes?     |
| ------------ | --------------- | ------------ | --------------------- |
| React        | 18.0            | 19.0 (2026)  | Minimal (concurrent)  |
| Flutter      | 3.24            | 3.30+        | None expected         |
| Firebase SDK | 12.3            | 13.0 (TBD)   | Review changelog      |
| Node.js      | 22              | 24 (LTS)     | None (LTS compatible) |
| Vite         | 7.1             | 8.0 (future) | Review plugin compat  |

### Performance Benchmarks

**Web Application** (Lighthouse Scores):

- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**Mobile Application**:

- App Startup: <2 seconds
- VIN Scan: <1 second (camera init)
- Firestore Query: <500ms (cached), <2s (network)

### Glossary

- **DAU**: Daily Active Users
- **VIN**: Vehicle Identification Number (17-character unique code)
- **NHTSA**: National Highway Traffic Safety Administration
- **VPIC**: Vehicle Product Information Catalog (NHTSA's VIN decoder)
- **CDN**: Content Delivery Network
- **SPA**: Single Page Application
- **PWA**: Progressive Web App
- **SDK**: Software Development Kit
- **CRUD**: Create, Read, Update, Delete
- **LCP**: Largest Contentful Paint (Web Vital)
- **FID**: First Input Delay (Web Vital)
- **CLS**: Cumulative Layout Shift (Web Vital)

---

**Document Revision History**:

- **v1.0** (Feb 16, 2026): Initial architecture documentation

**Maintained By**: Mark Nelson  
**Review Cycle**: Quarterly or on major architecture changes  
**Feedback**: Submit issues or PRs to [GitHub repository](https://github.com/mnelson3/vehicle-vitals)
