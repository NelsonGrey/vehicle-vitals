# Vehicle-Vitals Architecture Diagram

## Overview
Vehicle-Vitals is a monorepo containing a vehicle management application with web and mobile clients, built with React, Flutter, and Firebase.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Vehicle-Vitals System                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐   │
│  │   Web Client     │      │  Mobile Client   │      │ Cloud Functions │   │
│  │   (React/Vite)   │      │   (Flutter)      │      │   (Node.js)      │   │
│  └────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘   │
│           │                          │                          │           │
│           │                          │                          │           │
│           └──────────┬───────────────┴──────────┬───────────────┘           │
│                      │                          │                           │
│                      ▼                          ▼                           │
│           ┌──────────────────────────────────────────────┐                  │
│           │              Firebase Backend                │                  │
│           ├──────────────────────────────────────────────┤                  │
│           │  • Authentication (Email/Password, Google)   │                  │
│           │  • Firestore Database                        │                  │
│           │  • Cloud Functions                           │                  │
│           │  • Firebase Hosting                          │                  │
│           │  • Firebase Messaging (Web)                  │                  │
│           └──────────────────────────────────────────────┘                  │
│                      │                          │                           │
│                      └──────────┬───────────────┴──────────┘                 │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌─────────────────────┐                                   │
│                    │  External APIs      │                                   │
│                    │  • NHTSA VPIC API   │                                   │
│                    │    (VIN Lookup)     │                                   │
│                    └─────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
vehicle-vitals/
├── packages/
│   ├── shared/                    # Shared utilities and types
│   │   ├── src/
│   │   │   ├── firebaseConfig.js   # Firebase configuration
│   │   │   ├── firestoreServiceFactory.js  # Firestore CRUD factory
│   │   │   ├── types.js           # Shared types (defaultVehicle, etc.)
│   │   │   └── index.js           # Main exports
│   │   └── package.json
│   │
│   ├── web/                       # React web application
│   │   ├── src/
│   │   │   ├── App.tsx            # Main app with routing
│   │   │   ├── main.tsx           # Entry point
│   │   │   ├── pages/             # Page components
│   │   │   │   ├── Landing.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── SignUp.tsx
│   │   │   │   ├── Home.tsx       # Vehicle list
│   │   │   │   ├── AddVehicle.tsx
│   │   │   │   ├── EditVehicle.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   ├── TimelineDashboard.tsx
│   │   │   │   └── UpcomingTasks.tsx
│   │   │   ├── components/        # Reusable components
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   └── EnvironmentGate.tsx
│   │   │   ├── utils/             # Utility functions
│   │   │   │   ├── vehicleService.js  # VIN lookup
│   │   │   │   └── logger.js      # Analytics & logging
│   │   │   ├── shared/            # Web-specific shared code
│   │   │   │   └── AuthContext.tsx
│   │   │   └── dataconnect-generated/  # Generated Firebase DataConnect code
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── mobile/                    # Flutter mobile application
│   │   ├── lib/
│   │   │   ├── main.dart          # Entry point with routing
│   │   │   ├── screens/           # Flutter screens
│   │   │   │   ├── home_screen.dart
│   │   │   │   ├── login_screen.dart
│   │   │   │   ├── signup_screen.dart
│   │   │   │   ├── add_vehicle_screen.dart
│   │   │   │   ├── edit_vehicle_screen.dart
│   │   │   │   ├── scan_vin_screen.dart
│   │   │   │   ├── maintenance_list_screen.dart
│   │   │   │   ├── account_screen.dart
│   │   │   │   ├── premium_screen.dart
│   │   │   │   └── analytics_screen.dart
│   │   │   ├── services/          # Flutter services
│   │   │   │   ├── auth_service.dart
│   │   │   │   ├── firestore_service.dart
│   │   │   │   ├── notification_service.dart
│   │   │   │   ├── premium_service.dart
│   │   │   │   ├── offline_service.dart
│   │   │   │   ├── analytics_service.dart
│   │   │   │   ├── calendar_service.dart
│   │   │   │   └── email_reminder_service.dart
│   │   │   ├── models/            # Data models
│   │   │   ├── theme/             # App theming
│   │   │   └── firebase_options.dart
│   │   ├── config/                # Environment-specific Firebase configs
│   │   │   ├── development/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── pubspec.yaml
│   │
│   ├── firebase-utils/            # Firebase utilities package
│   │   ├── src/
│   │   │   ├── client.ts          # FirebaseClient with helpers
│   │   │   └── index.ts           # Exports
│   │   └── package.json
│   │
│   └── functions/                 # Firebase Cloud Functions
│       ├── src/
│       │   └── index.ts          # Cloud functions
│       │       ├── vinLookup()   # VIN lookup via NHTSA API
│       │       ├── sendMaintenanceReminder()  # Email reminders
│       │       └── checkMaintenanceReminders()  # Scheduled daily check
│       └── package.json
│
├── firebase/                      # Firebase configuration
│   ├── firestore.rules            # Firestore security rules
│   └── firestore.indexes.json     # Firestore indexes
│
├── dataconnect/                   # Firebase DataConnect
│
├── scripts/                       # Build and utility scripts
│
├── tools/                         # Development tools
│
└── package.json                   # Root package.json (monorepo config)
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Data Flow Diagram                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Action                                                                 │
│      │                                                                      │
│      ▼                                                                      │
│  ┌──────────────┐                                                           │
│  │ Web/Mobile   │                                                           │
│  │   Client     │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 1. Auth Request                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Firebase Auth│                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 2. Auth Token                                                     │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Web/Mobile   │                                                           │
│  │   Client     │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 3. Firestore Operations (CRUD)                                    │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────┐                          │
│  │         Firestore Database                    │                          │
│  │  ┌────────────────────────────────────────┐  │                          │
│  │  │ users/${userId}/vehicles/${vin}        │  │                          │
│  │  │   ├── make, model, year, mileage       │  │                          │
│  │  │   ├── purchaseDate                     │  │                          │
│  │  │   ├── nextDueByMiles, nextDueByDate    │  │                          │
│  │  │   └── services[]                       │  │                          │
│  │  │                                        │  │                          │
│  │  │ users/${userId}/vehicles/${vin}/       │  │                          │
│  │  │   maintenance/${entryId}              │  │                          │
│  │  │   ├── serviceType, description        │  │                          │
│  │  │   ├── date, mileage, cost             │  │                          │
│  │  │   ├── provider, notes                 │  │                          │
│  │  │   └── createdAt, updatedAt             │  │                          │
│  │  └────────────────────────────────────────┘  │                          │
│  └──────────────────────────────────────────────┘                          │
│         │                                                                   │
│         │ 4. VIN Lookup Request                                             │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │                                                           │
│  │ vinLookup()  │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 5. API Call                                                       │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ NHTSA VPIC   │                                                           │
│  │    API       │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 6. Vehicle Data                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │                                                           │
│  │ vinLookup()  │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 7. Vehicle Info                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Web/Mobile   │                                                           │
│  │   Client     │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 8. Save to Firestore                                              │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────┐                          │
│  │         Firestore Database                    │                          │
│  └──────────────────────────────────────────────┘                          │
│         │                                                                   │
│         │ 9. Scheduled (Daily)                                              │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │                                                           │
│  │ checkMaint() │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ 10. Query Upcoming Maintenance                                    │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────┐                          │
│  │         Firestore Database                    │                          │
│  └──────────────────────────────────────────────┘                          │
│         │                                                                   │
│         │ 11. Send Email Reminder                                          │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │ Email Service│                                                           │
│  │ (Workspace)  │                                                           │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### Web Client (React)
- **Framework**: React 18 with Vite
- **Routing**: React Router v7 with lazy loading
- **State Management**: React Context (AuthContext)
- **Styling**: TailwindCSS
- **Authentication**: Firebase Auth (Email/Password, Google)
- **Analytics**: Custom analytics service
- **Pages**:
  - Public: Landing, Login, SignUp, Instructions, Contact, Privacy, Terms
  - Protected: Home, AddVehicle, EditVehicle, Profile, TimelineDashboard, UpcomingTasks
  - Special: ComingSoon (controlled by environment variable)

### Mobile Client (Flutter)
- **Framework**: Flutter
- **Routing**: go_router
- **State Management**: Provider
- **Services**:
  - AuthService: Firebase Authentication
  - FirestoreService: Database operations
  - NotificationService: Push notifications
  - PremiumService: Premium features
  - OfflineService: Offline data caching
  - AnalyticsService: User analytics
  - CalendarService: Calendar integration
  - EmailReminderService: Email preferences
- **Screens**: Home, Login, SignUp, AddVehicle, EditVehicle, ScanVIN, Maintenance, Account, Premium, Analytics, etc.

### Shared Package
- **Firebase Configuration**: Cross-platform Firebase config
- **Types**: Shared TypeScript/JavaScript types
  - `defaultVehicle`: Vehicle data structure
  - `defaultMaintenanceRecord`: Maintenance record structure
  - `MAINTENANCE_TYPES`: Common maintenance types
- **Firestore Service Factory**: Creates Firestore CRUD operations with platform-specific helpers

### Firebase Utils
- **FirebaseClient**: Unified Firebase client with helpers
  - AuthHelpers: Authentication utilities
  - FirestoreCrudHelpers: CRUD operations
  - FunctionsHelpers: Cloud Functions calls
  - StorageHelpers: Storage operations

### Cloud Functions
- **vinLookup**: Looks up VIN using NHTSA VPIC API
- **sendMaintenanceReminder**: Sends email reminders for maintenance
- **checkMaintenanceReminders**: Scheduled function (daily) to check for upcoming maintenance

## Database Schema

### Firestore Structure
```
users/
  ${userId}/
    vehicles/
      ${vin}/
        ├── make: string
        ├── model: string
        ├── year: string
        ├── vin: string
        ├── mileage: string
        ├── purchaseDate: string (ISO)
        ├── nextDueByMiles: string
        ├── nextDueByDate: string (ISO)
        ├── services: array
        ├── createdAt: timestamp
        └── updatedAt: timestamp
      maintenance/
        ${entryId}/
          ├── serviceType: string
          ├── description: string
          ├── date: string (ISO)
          ├── mileage: string
          ├── cost: number
          ├── provider: string
          ├── notes: string
          ├── createdAt: timestamp
          └── updatedAt: timestamp
    emailRemindersEnabled: boolean
```

## Environment Configuration

### Environments
- **Development**: `vehicle-vitals-dev`
- **Staging**: `vehicle-vitals-staging`
- **Production**: `vehicle-vitals-prod`

### Environment Variables
- Web: `.env.development`, `.env.staging`, `.env.production`
- Mobile: Environment-specific Firebase config files in `config/` directory
- Functions: Firebase project-specific configuration

## Deployment

### Web Deployment
- Built with Vite
- Deployed to Firebase Hosting
- Environment-specific builds
- Coming Soon page control via environment variables

### Mobile Deployment
- **iOS**: Firebase App Distribution with Fastlane
- **Android**: Firebase App Distribution
- Automated via GitHub Actions
- Tester groups: internal-testers, production-testers

### Cloud Functions Deployment
- Deployed via Firebase CLI
- Scheduled functions for maintenance reminders
- HTTP-triggered functions for VIN lookup

## External Integrations

- **NHTSA VPIC API**: VIN lookup
- **Google Workspace (Gmail SMTP)**: Email reminders (integration pending — needs secrets configured)
- **Google Mobile Ads**: Ad monetization (mobile)
- **Firebase Analytics**: User analytics

## Key Features

1. **Vehicle Management**: Add, edit, delete vehicles with VIN lookup
2. **Maintenance Tracking**: Log maintenance entries with dates, mileage, costs
3. **Reminders**: Email and push notifications for upcoming maintenance
4. **Timeline View**: Visual timeline of maintenance history
5. **Upcoming Tasks**: View upcoming maintenance tasks
6. **Multi-platform**: Web and mobile apps with shared backend
7. **Offline Support**: Mobile app supports offline data access
8. **Premium Features**: Premium subscription service
9. **Analytics**: User behavior tracking and analytics
10. **Calendar Integration**: Add maintenance to device calendar

## Security

- Firebase Authentication for user access
- Firestore security rules for data access control
- Environment-specific Firebase configurations
- Gitignored sensitive configuration files
- Protected routes in web and mobile apps
