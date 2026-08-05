# Vehicle-Vitals - Flutter Mobile App

This is the Flutter version of the Vehicle-Vitals mobile app, converted from React Native. It provides the same functionality as the React Native version with native Flutter performance and UI.

## Features

- Firebase Authentication (email/password)
- Firestore integration for vehicle data
- VIN barcode scanning
- Vehicle management (add, edit, delete)
- Material Design 3 UI

## Setup

### Prerequisites

1. Install Flutter: https://docs.flutter.dev/get-started/install
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Configure Firebase project (see Firebase Configuration section)

### Installation

1. Navigate to the Flutter app directory:

   ```bash
   cd mobile_flutter
   ```

2. Install dependencies:

   ```bash
   flutter pub get
   ```

3. Configure Firebase (see Firebase Configuration section)

4. Run the app:

   ```bash
   # For iOS
   flutter run -d ios

   # For Android
   flutter run -d android

   # For debugging
   flutter run --debug
   ```

## Firebase Configuration

This app requires Firebase configuration for authentication and Firestore. You need to:

1. Create or use an existing Firebase project
2. Enable Authentication (Email/Password provider)
3. Enable Firestore Database
4. Generate Firebase configuration files

### Generate Firebase Config

Run the FlutterFire CLI to generate the configuration:

```bash
# Install FlutterFire CLI (if not already installed)
dart pub global activate flutterfire_cli

# Configure Firebase for your project
flutterfire configure
```

This will:

- Update `lib/firebase_options.dart` with your project configuration
- Add platform-specific config files (GoogleService-Info.plist for iOS, google-services.json for Android)

### Manual Configuration (Alternative)

If you can't use the FlutterFire CLI, manually update `lib/firebase_options.dart` with your Firebase project values:

```dart
static const FirebaseOptions android = FirebaseOptions(
  apiKey: 'your-android-api-key',
  appId: 'your-android-app-id',
  messagingSenderId: 'your-messaging-sender-id',
   projectId: 'vehicle-vitals-dev',
  storageBucket: 'your-storage-bucket',
);

static const FirebaseOptions ios = FirebaseOptions(
  apiKey: 'your-ios-api-key',
  appId: 'your-ios-app-id',
  messagingSenderId: 'your-messaging-sender-id',
   projectId: 'vehicle-vitals-dev',
  storageBucket: 'your-storage-bucket',
  iosBundleId: 'com.example.vehicleVitalsFlutter',
);
```

## Project Structure

```
lib/
├── main.dart                    # App entry point with routing
├── firebase_options.dart        # Firebase configuration
├── models/
│   └── vehicle.dart            # Vehicle data model
├── screens/
│   ├── home_screen.dart        # Vehicle list/welcome screen
│   ├── login_screen.dart       # Authentication
│   ├── signup_screen.dart      # User registration
│   ├── add_vehicle_screen.dart # Add new vehicle
│   ├── edit_vehicle_screen.dart # Edit existing vehicle
│   └── scan_vin_screen.dart    # VIN barcode scanning
└── services/
    ├── auth_service.dart       # Firebase Auth wrapper
    └── firestore_service.dart  # Firestore database operations
```

## Architecture

The Flutter app follows the same patterns as the React Native version:

- **Authentication**: Firebase Auth with email/password
- **Database**: Firestore with path structure `users/{userId}/vehicles/{vin}`
- **State Management**: Provider pattern for auth state
- **Navigation**: go_router for declarative routing
- **VIN Scanning**: mobile_scanner package for barcode detection

## Dependencies

Key Flutter packages used:

- `firebase_core` & `firebase_auth` - Firebase integration
- `cloud_firestore` - Firestore database
- `provider` - State management
- `go_router` - Navigation
- `mobile_scanner` - Barcode/VIN scanning

## Development

### Running Tests

```bash
flutter test
```

### Build for Release

```bash
# Android APK
flutter build apk --release

# iOS (requires Xcode and Apple Developer account)
flutter build ios --release
```

### Code Analysis

```bash
flutter analyze
```

## Migration from React Native

This Flutter app provides the same functionality as the React Native version:

- ✅ Firebase Authentication
- ✅ Vehicle CRUD operations
- ✅ VIN barcode scanning
- ✅ Firestore integration
- ✅ Material Design UI matching the RN app colors and layout

The data structure and Firebase paths remain identical, so both apps can share the same Firebase project and data.

## Troubleshooting

### Common Issues

1. **Firebase not initialized**: Ensure `firebase_options.dart` is properly configured
2. **Camera permissions**: VIN scanning requires camera permissions on device
3. **Build errors**: Run `flutter clean && flutter pub get` to reset dependencies
4. **iOS signing**: iOS builds require proper development team and bundle ID configuration

### Getting Help

- Flutter Documentation: https://docs.flutter.dev/
- Firebase Flutter: https://firebase.flutter.dev/
- Package Issues: Check individual package documentation on pub.dev
