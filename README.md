# Vehicle Vitals Monorepo

A modern vehicle management application with web and mobile clients, built with React, Flutter, and Firebase.

## 🏗️ Architecture

This is a monorepo containing multiple packages that work together:

```
packages/
├── shared/           # Common utilities, Firebase services, types
├── web/             # React web application (Vite + React 18)
└── mobile/          # Flutter mobile application (iOS + Android)
```

## Quick overview
- Web: React app with pages in `web/src/pages/` and a router wired in `App.jsx`.
- Mobile: Flutter app under `mobile/` with screens in `lib/screens/` and go_router navigation.
- Shared: `shared/firebaseConfig.js`, `shared/azureConfig.js`, and `shared/types.js` contain cross-cutting config and types.

## Project structure (important files)
- `App.jsx` — web entry that registers routes to `web/src/pages/*`.
- `web/src/pages/Home.jsx` — example page that lists Firestore vehicles for the current user.
- `web/src/utils/vehicleService.js` — VIN decoding against NHTSA VPIC and example `fetchVehicleByVINAndSave(vin)` that writes to Firestore.
- `mobile/lib/main.dart` — Flutter app entry with go_router navigation and Provider state management.
- `mobile/lib/screens/` — Flutter screens (HomeScreen, AddVehicleScreen, EditVehicleScreen, ScanVINScreen, MaintenanceListScreen, etc.).
- `shared/firebaseConfig.js` — Firebase initialization exporting `auth`, `db`, and `messaging`.
- `shared/azureConfig.js` — Azure/MSAL placeholders and example backend helpers (`/api/data`, `/api/notify`).
- `shared/types.js` — `defaultVehicle` shape used across the app.

## Setup & run (developer notes)
The repository contains a web app and a Flutter mobile app. Check each folder for setup instructions.

Web
1. **Optimized Installation (Recommended)**: Use the memory-optimized installation script:

```bash
./install.sh
```

2. **Manual Installation**: If you prefer to install manually:

```bash
# Ensure you have Node.js v20.x
node --version

# Install with memory optimization
NODE_OPTIONS="--max-old-space-size=4096" npm install
```

3. Start development server:

```bash
npm run dev:web
```

4. Build for production:

```bash
npm run build:web
```

**Note**: This project uses a dual-installation approach (root + web) to prevent npm hanging and memory issues. Each workspace manages its own dependencies independently.

Mobile (Flutter)
1. Navigate to mobile directory and install dependencies:

```bash
cd mobile
flutter pub get
```

2. **Firebase Configuration Status:**
   - **✅ iOS**: Configured with GoogleService-Info.plist
   - **✅ Android**: Configured with google-services.json

3. **Generate platform files (if needed):**

```bash
flutter create --platforms=ios,android .
```

4. **Run on simulator / device:**

```bash
flutter run -d ios      # iOS is ready!
flutter run -d android  # Android is ready!
```

See setup guides:
- `mobile/iOS-Firebase-Setup.md` for iOS instructions
- `mobile/Android-Firebase-Setup.md` for Android instructions

## Firebase & credentials

**⚠️ IMPORTANT: Firebase is not configured yet!** The project uses placeholder values and will not connect to Firebase until properly configured.

### Quick Firebase Setup:
1. **Run the setup helper**: `./setup-firebase.sh` (provides step-by-step guidance)
2. **Or follow manual setup**:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password + Google)
   - Create Firestore Database
   - Get your web app config from Project Settings
   - Copy `web/.env.example` to `web/.env.local`
   - Replace placeholder values with your Firebase config

### Configuration Files:
- **Web**: `web/.env.local` (create from `web/.env.example`)
- **Mobile**: Run `flutterfire configure` in the `mobile/` directory
- **Firestore Rules**: `firebase/firestore.rules` (deploy with `firebase deploy --only firestore:rules`)

### Data Convention:
- User data is stored under `users/${userId}/vehicles/${vin}`
- Preserve this path structure when modifying database code

## 🚀 Deployment & Environments

This project supports multiple Firebase environments for development, staging, and production.

### Environments
- **Production**: `vehicle-vitals-prod` - Live application
- **Staging**: `vehicle-vitals-staging` - Testing environment
- **Development**: `vehicle-vitals-development` - Development environment

### Quick Deploy
Use the deployment script for easy environment switching:

```bash
# Deploy to production
./deploy.sh production

# Deploy to staging
./deploy.sh staging

# Deploy to development
./deploy.sh development
```

### Manual Deployment
```bash
# Build for specific environment
cd packages/web
npm run build:staging    # or build:development

# Deploy using Firebase CLI
firebase use staging     # or development
firebase deploy --only hosting
```

See `DEPLOY.md` for detailed deployment instructions and GitHub Actions setup.

## 📱 Android App Distribution

The Android app can be built and distributed to testers using Firebase App Distribution.

#### Manual Distribution

```bash
cd packages/mobile
./distribute-android.sh [debug|release] "Release notes"
```

#### Automated Distribution

Push to `main` or `develop` branches to trigger automated distribution via GitHub Actions:

- `main` → Production testers (`production-testers` group)
- `develop` → Internal testers (`internal-testers` group)

Or use manual workflow dispatch in GitHub Actions → "Android App Distribution".

#### Required GitHub Secrets

Add these to your repository secrets:
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Service account JSON key with Firebase App Distribution permissions
- `ANDROID_STORE_PASSWORD`: Android keystore password  
- `ANDROID_KEY_PASSWORD`: Android key password

#### Tester Groups

Configure tester groups in Firebase Console under App Distribution:
- `internal-testers`: Development and testing builds
- `production-testers`: Release candidate builds

## 🍎 iOS App Distribution

The iOS app can be built and distributed to testers using Firebase App Distribution with Fastlane.

#### Manual Distribution

```bash
cd packages/mobile
./distribute-ios.sh [debug|release] "Release notes"
```

#### Automated Distribution

Push to `main` or `develop` branches to trigger automated distribution via GitHub Actions:

- `main` → Production testers (`production-testers` group)
- `develop` → Internal testers (`internal-testers` group)

Or use manual workflow dispatch in GitHub Actions → "iOS App Distribution".

#### Required GitHub Secrets

Add these to your repository secrets:
- `IOS_SERVICE_ACCOUNT_KEY`: Service account JSON key with Firebase App Distribution permissions
- `IOS_APP_ID`: iOS app ID from Firebase (e.g., `1:489413148337:ios:...`)

#### Setup Requirements

1. **Install Fastlane**: The workflow will install Fastlane automatically
2. **Code Signing**: Configure code signing certificates if distributing release builds
3. **Tester Groups**: Configure tester groups in Firebase Console (same as Android)

#### Fastlane Configuration

The iOS distribution uses Fastlane with the following lanes:
- `fastlane ios debug` - Debug builds for internal testing
- `fastlane ios release` - Release builds for production testing
- `fastlane ios distribute` - Custom distribution with parameters

## 🔧 Mobile App Configuration

### Environment-Specific Firebase Config Files

Mobile apps require different Firebase configuration files for each environment. These are stored in:

```
packages/mobile/config/
├── development/
│   ├── android/
│   │   └── google-services.json          # vehicle-vitals-development
│   └── ios/
│       └── GoogleService-Info.plist      # vehicle-vitals-development
├── staging/
│   ├── android/
│   │   └── google-services.json          # vehicle-vitals-staging
│   └── ios/
│       └── GoogleService-Info.plist      # vehicle-vitals-staging
└── production/
    ├── android/
    │       └── google-services.json          # vehicle-vitals-prod
    └── ios/
        └── GoogleService-Info.plist      # vehicle-vitals-prod
```

#### How to Set Up Config Files

1. **Download from Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select the appropriate project for each environment
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

2. **Place files in correct directories**:
   - Development files → `config/development/`
   - Staging files → `config/staging/`
   - Production files → `config/production/`

3. **Build scripts automatically copy** the correct config based on environment

#### Important Notes

- **Never commit actual config files** - They contain sensitive API keys
- **Files are gitignored** - Only placeholder files are tracked
- **Environment mapping**:
  - `main` branch → Production config
  - `develop` branch → Development config
  - Manual builds default to Development config

## Conventions and patterns
- Auth: components read `auth.currentUser?.uid` directly. Avoid changing this auth model without updating all consumers.
- Data shape: use `shared/types.js` `defaultVehicle` when creating/updating vehicles.
- VIN lookup: `web/src/utils/vehicleService.js` demonstrates using the NHTSA VPIC API and persisting a decoded vehicle object keyed by VIN.

## Useful files to open first
- `web/src/pages/Home.jsx`
- `web/src/utils/vehicleService.js`
- `mobile/lib/main.dart`
- `mobile/lib/screens/home_screen.dart`
- `shared/firebaseConfig.js`

## Troubleshooting
- If Firestore calls silently fail, confirm `auth.currentUser` is set and your Firebase config is valid.
- If Flutter commands fail, verify your development machine has the required native toolchains (Xcode for iOS, Android SDK for Android).

### Git push gotchas (GitHub)
- Symptom: `git push` fails with `HTTP 400` / `send-pack: unexpected disconnect`.
	- Cause: Some Git/libcurl versions over HTTP/2 can error on large pushes.
	- Fix (safe, reversible):
		```bash
		git config --global http.version HTTP/1.1
		git config --global http.postBuffer 524288000
		```
		Revert later with:
		```bash
		git config --global --unset http.version
		git config --global --unset http.postBuffer
		```

- Auth options:
	- HTTPS with a GitHub Personal Access Token (PAT)
	- SSH (recommended if you prefer key-based auth)

- Switch `origin` to SSH (optional):
	```bash
	git remote set-url origin git@github.com:mnelson3/vehicle-vitals-react-project.git
	# test
	ssh -T git@github.com
	git push -u origin main
	```

## How to help next
If you want, I can:
- Add exact `package.json`-driven run commands after reading `package.json` files.
- Add a minimal `.env.example` and local Firebase setup guide.
- Create a small smoke-test script that asserts the shared `defaultVehicle` shape and that Firestore path functions build expected IDs.
# Test commit to trigger CI/CD workflows
