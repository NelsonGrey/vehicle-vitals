# Vehicle Vitals

A modern vehicle management application with web and mobile clients, built with React, Flutter, and Firebase.

## Recent Development Highlights (May 22, 2026)

- Added vehicle lifecycle status support (`active` and `stored`) across shared models, web, and mobile.
- Updated Garage experiences to separate active vehicles from storage vehicles on both platforms.
- Added secure vehicle transfer capability between users via backend callable transfer flow.
- Expanded automated coverage for transfer/storage behaviors in web unit tests, mobile model tests, functions integration tests, and web UAT.
- Updated responsive shell quality checks to the 1280px baseline.
- Standardized user-facing nearby service terminology to `Mechanics` across web/mobile UI copy.
- Updated web navigation: `Getting Started` is now the first header link for both marketing and authenticated app headers, marketing `Home` nav link removed, and footer `Getting Started` removed.

### Latest Validation Snapshot

- Web unit tests: pass (`npm --workspace=packages/web run test`)
- Mobile tests: pass (`cd packages/mobile && flutter test`)
- Web UAT (Chromium): pass with environment-based skips (`npm --workspace=packages/web run test:uat:chromium`)

See [docs/DEPLOYMENT_STATUS.md](/docs/DEPLOYMENT_STATUS.md) for full progress details and [docs/DEVELOPER_GUIDE.md](/docs/DEVELOPER_GUIDE.md) for updated testing workflow.

## 🏗️ Architecture

This is a monorepo containing multiple packages that work together:

```
packages/
├── shared/           # Common utilities, Firebase services, types
├── web/             # React web application (Vite + React 18)
└── mobile/          # Flutter mobile application (iOS active, Android on hold)
```

## 📚 Documentation

Comprehensive project documentation is available in the [`docs/`](/docs) folder:

**Product & Business**:

- **[BUSINESS_REQUIREMENTS.md](/docs/BUSINESS_REQUIREMENTS.md)** - Business strategy, market analysis, revenue projections
- **[MONETIZATION_STRATEGY.md](/docs/MONETIZATION_STRATEGY.md)** - Detailed monetization plan (ad placements, subscription tiers, pricing)
- **[PRODUCT_DESIGN.md](/docs/PRODUCT_DESIGN.md)** - Product vision, feature specifications, UX flows
- **[USER_FAQ_WEBSITE_IOS.md](/docs/USER_FAQ_WEBSITE_IOS.md)** - End-user FAQ for performing website and iOS app workflows

**Technical & Deployment**:

- **[REQUIREMENTS.md](/docs/REQUIREMENTS.md)** - Complete project requirements, feature status, and implementation roadmap
- **[GO_LIVE_RUNBOOK.md](/docs/GO_LIVE_RUNBOOK.md)** - Executable go-live readiness checklist, blocker list, validation gates, launch steps, and rollback plan
- **[DEPLOY.md](/docs/DEPLOY.md)** - Detailed deployment guide for all environments (dev/staging/prod)
- **[ENVIRONMENT_SETUP.md](/docs/ENVIRONMENT_SETUP.md)** - Environment configuration and GitHub secrets setup
- **[DEPLOYMENT_STATUS.md](/docs/DEPLOYMENT_STATUS.md)** - Current deployment status and environment details
- **[FIREBASE_CONFIG.md](/docs/FIREBASE_CONFIG.md)** - Firebase configuration patterns and best practices

**Operations & Infrastructure**:

- **[PROD_SETUP_GUIDE.md](/docs/PROD_SETUP_GUIDE.md)** - Production environment setup and secrets management
- **[BETA_TESTING_GUIDE.md](/docs/BETA_TESTING_GUIDE.md)** - Beta testing preparation and distribution guide
- **[SECURE_ENVIRONMENTS.md](/docs/SECURE_ENVIRONMENTS.md)** - Security practices for environment management
- **[ACT_TESTING_GUIDE.md](/docs/ACT_TESTING_GUIDE.md)** - Local GitHub Actions testing with act CLI
- **[COST_EFFECTIVE_CICD.md](/docs/COST_EFFECTIVE_CICD.md)** - CI/CD cost optimization and testing strategies
- **[TECHNICAL_DEBT_REPORT.md](/docs/TECHNICAL_DEBT_REPORT.md)** - Technical debt tracking and resolution status

## Quick overview

- Web: React app with pages in `web/src/pages/` and a router wired in `App.jsx`.
- Mobile: Flutter app under `mobile/` with screens in `lib/screens/` and go_router navigation.
- Shared: `shared/firebaseConfig.js` and `shared/types.js` contain cross-cutting config and types.

## Project structure (important files)

- `App.jsx` — web entry that registers routes to `web/src/pages/*`.
- `web/src/pages/Home.jsx` — example page that lists Firestore vehicles for the current user.
- `web/src/utils/vehicleService.js` — VIN decoding against NHTSA VPIC and example `fetchVehicleByVINAndSave(vin)` that writes to Firestore.
- `mobile/lib/main.dart` — Flutter app entry with go_router navigation and Provider state management.
- `mobile/lib/screens/` — Flutter screens (HomeScreen, AddVehicleScreen, EditVehicleScreen, ScanVINScreen, MaintenanceListScreen, etc.).
- `shared/firebaseConfig.js` — Firebase initialization exporting `auth`, `db`, and `messaging`.
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
cd packages/mobile
flutter pub get
```

2. **Firebase Configuration Status:**
   - **✅ iOS**: Configured with GoogleService-Info.plist

- **⏸️ Android**: On hold pending test/deployment path

3. **Generate platform files (if needed):**

```bash
flutter create --platforms=ios .
```

4. **Run on simulator / device:**

```bash
flutter run -d ios      # iOS is ready!
```

See setup guide:

- `docs/IOS_FIREBASE_SETUP.md` for iOS instructions

## Firebase & credentials

**⚠️ IMPORTANT: Firebase is not configured yet!** The project uses placeholder values and will not connect to Firebase until properly configured.

### Quick Firebase Setup:

1. **Run the setup helper**: `./setup-firebase.sh` (provides step-by-step guidance)
2. **Or follow manual setup**:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password + Google)
   - Create Firestore Database
   - Get your web app config from Project Settings

### Configuration Files:

- **Mobile**: Run `flutterfire configure` in the `mobile/` directory
- **Firestore Rules**: `firebase/firestore.rules` (deploy with `firebase deploy --only firestore`)
- **Storage Rules**: `firebase/storage.rules` (deploy with `firebase deploy --only storage`)

### Data Convention:

- User data is stored under `users/${userId}/vehicles/${vin}`
- Preserve this path structure when modifying database code

## 🧪 Testing & CI/CD

This project uses a cost-effective CI/CD strategy that emphasizes local testing to minimize GitHub Actions usage.

### Local Testing (Recommended - 0 Actions minutes)

Test your changes locally before pushing to avoid costly GitHub Actions failures:

```bash
# Interactive local testing menu
./scripts/test-cicd-local.sh

# Interactive act testing (GitHub Actions simulation)
./scripts/test-act.sh

# Test specific workflows
./scripts/test-act.sh  # Then select option 1 for quality checks
```

### GitHub Actions Testing (Minimal usage)

- **Triggers**: Only on `main` and `staging` branches to control costs
- **Dry-run**: Use `[DRY-RUN]` in commit messages for safe testing
- **Manual**: Use workflow dispatch for controlled testing

### Testing Documentation

- **[ACT_TESTING_GUIDE.md](/docs/ACT_TESTING_GUIDE.md)** - Complete guide for local GitHub Actions testing
- **[COST_EFFECTIVE_CICD.md](/docs/COST_EFFECTIVE_CICD.md)** - Cost optimization strategies and best practices

### Prerequisites for Local Testing

```bash
# Install act CLI
brew install act

# Ensure Docker Desktop is running
docker info

# Setup test secrets (safe for commits)
./scripts/test-act.sh  # Select option 7 to setup Docker images
```

### Testing Workflow

```
Local Development → Local Scripts → Act Testing → GitHub Dry-Run → Production
     ↓                    ↓            ↓              ↓              ↓
   0 minutes          0 minutes    0 minutes    Minimal minutes  Full deployment
```

See `COST_EFFECTIVE_CICD.md` for detailed cost savings and testing strategies.

## Keychain Drift Guard (macOS)

If iOS/CI tooling has modified your local keychain defaults in the past, use the repo guard script to detect and repair drift before prompts resurface.

```bash
# Check keychain health
./scripts/keychain-sanity.sh --check

# Backup + repair if unhealthy
./scripts/keychain-sanity.sh --fix
```

What this guards against:

- `fastlane_tmp_keychain` left as the default user keychain
- duplicate keychains in the user search list
- missing `login.keychain-db` in the user search list

Backups are written to `~/.keychain-backups` before any repair.

This project supports multiple Firebase environments for development, demonstration, staging, and production.

### Environments

- **Production**: `vehicle-vitals-prod` - Live application
- **Staging**: `vehicle-vitals-staging` - Testing environment
- **Development**: `vehicle-vitals-dev` - Development environment
- **Demonstration**: `vehicle-vitals-dev` - Demo branch deployment with separate build mode

### Quick Deploy

Use the deployment script for easy environment switching:

```bash
# Deploy to production
./deploy.sh production

# Deploy to staging
./deploy.sh staging

# Deploy to development
./deploy.sh development

# Deploy to demonstration
./deploy.sh demonstration
```

### Manual Deployment

```bash
# Build for specific environment
cd packages/web
npm run build:staging    # or build:development
npm run build:demonstration

# Deploy using Firebase CLI
firebase use staging     # or development
firebase deploy --only firestore,storage,functions,hosting
```

### Coming Soon Page Control

The application includes configurable Coming Soon page functionality that can be controlled via environment variables:

- **Production**: `VITE_SHOW_COMING_SOON_PRODUCTION` - Set to `true` during pre-launch, `false` after launch
- **Staging**: `VITE_SHOW_COMING_SOON_STAGING` - Typically `false` for testing full functionality
- **Development**: `VITE_SHOW_COMING_SOON_DEVELOPMENT` - Typically `false` for development work

When enabled, the Coming Soon page displays instead of the full application, allowing you to collect email signups during pre-launch periods.

See `DEPLOY.md` for detailed deployment instructions and GitHub Actions setup.

## 📱 Android Status

Android development and distribution are currently on hold. The active mobile roadmap is focused on iOS until Android test and Google Play deployment paths are re-established.

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
  git remote set-url origin git@github.com:mnelson3/vehicle-vitals.git
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

# Test commit to trigger iOS build with APP_STORE_CONNECT_KEY fix
