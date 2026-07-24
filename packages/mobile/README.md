# Vehicle-Vitals Flutter App

Last verified: July 20, 2026

Flutter client for Vehicle-Vitals. The current mobile product is iOS. Android
project files remain in the Flutter tree, but Android build/distribution is on
hold. Automated iOS build/TestFlight upload is temporarily disabled by the
repository's `.cicd/projects/vehicle-vitals.yml` manifest.

## Capabilities

- Firebase authentication and environment-aware routing.
- Personal and organization-scoped Garage/vehicle data.
- Vehicle add/edit, VIN scanning/lookup, photos, service history, and records.
- Maintenance plan, reminders, upcoming work, and timeline.
- Vehicle health and ownership insights.
- Shops & Services, account/privacy/support/preferences.
- CSV/PDF export and sharing.
- Apple Pro/Premium in-app purchase and backend entitlement refresh.
- Messaging/Crashlytics, calendar, local/offline helpers, and AdMob integration.

## Setup

```bash
cd packages/mobile
flutter pub get
flutter run -d ios
```

Firebase environments are described in `config/README.md`. Do not run
`flutterfire configure` casually against the checked-in project: it can replace
multi-environment configuration and bundle identifiers.

## Validation

```bash
flutter analyze
flutter test
flutter build ios --release --no-codesign
```

The no-codesign build validates compilation only. Signed build, TestFlight,
App Store review, purchase/restore, and production backend behavior require
separate evidence.

Avoid concurrent Flutter test/build processes in this package because native
asset outputs can collide.

## Structure

```text
lib/main.dart       Firebase initialization, auth state, and GoRouter routes
lib/screens/        marketing, auth, Garage, records, account, and support UI
lib/services/       Firebase, scope, entitlement, purchase, export, and offline services
lib/models/         Firestore-tolerant domain models
lib/components/     shared mobile presentation components
test/               calculation, model, scope, subscription, and widget tests
ios/                current mobile platform project and Fastlane setup
android/            on-hold platform project
config/             environment placeholders and setup guidance
```

Firebase Cloud Functions are maintained in the private companion repository;
the mobile app contains callable clients, not backend source.
