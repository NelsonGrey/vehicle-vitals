# Firebase Android Configuration for Vehicle Vitals

> **Status**: On hold. Android development and deployment are currently paused for Vehicle Vitals.

## ⚠️ Android Firebase Setup Snapshot (Historical)

Android Firebase artifacts exist in the repository, but Android development and deployment are paused.

### 🤖 **Android Configuration Applied:**

- **API Key**: `AIzaSyB4yx8ABAc5XeU7fbFiz19BOcu9GCkQBvk`
- **App ID**: `1:489413148337:android:0ed732a4b8cd462068ac90`
- **Package Name**: `com.nelsongrey.vehiclevitals.app.android`
- **Client ID**: `489413148337-bkukvjc1ht5k8vlroj2qkq1qmuf20d2p.apps.googleusercontent.com`

### 📁 **Files Updated:**

1. **`mobile/lib/firebase_options.dart`** - Updated with Android configuration
2. **`mobile/android/app/google-services.json`** - Added Android services file

### 🚀 **Next Steps for Android Development (When Resumed):**

1. **Generate Android Platform Files:**

   ```bash
   cd mobile
   flutter create --platforms=android .
   ```

2. **Install Dependencies:**

   ```bash
   flutter pub get
   ```

3. **Run on Android Emulator/Device:**

   ```bash
   # Inactive while Android is on hold.
   # Android runtime commands are intentionally omitted.
   ```

4. **Configure Android Project (when ready):**
   - The google-services.json is placed in `mobile/android/app/`
   - Ensure the package name matches: `com.nelsongrey.vehiclevitals.app.android`
   - The Flutter project will automatically include Firebase dependencies

### 🔧 **Firebase Services Available:**

- ✅ **Authentication** (Ready for sign-in)
- ✅ **Firestore Database** (Data storage ready)
- ✅ **Cloud Messaging** (Push notifications ready)
- ✅ **App Invites** (User invitations enabled)

### 📋 **Project Configuration Summary:**

```dart
// The firebase_options.dart now includes:
static const FirebaseOptions android = FirebaseOptions(
  apiKey: 'AIzaSyB4yx8ABAc5XeU7fbFiz19BOcu9GCkQBvk',
  appId: '1:489413148337:android:0ed732a4b8cd462068ac90',
  messagingSenderId: '489413148337',
  projectId: 'vehicle-vitals-prod',
  storageBucket: 'vehicle-vitals-prod.firebasestorage.app',
);
```

### ⚠️ **Important Notes:**

1. **Package Name**: Must match `com.nelsongrey.vehiclevitals.app.android`
2. **Android Platform Files**: Need to run `flutter create --platforms=android .` to generate Android platform files
3. **Build Configuration**: google-services.json will be automatically processed by Flutter

### 🎯 **Test Android Configuration (When Resumed):**

Once Android platform files are created:

```bash
cd mobile
# Inactive while Android is on hold.
# Android runtime commands are intentionally omitted.
```

### 🔗 **Cross-Platform Integration:**

The google-services.json includes OAuth client configurations for:

- **Android App**: Direct Android authentication
- **iOS App**: Cross-platform app invites and shared authentication

Android runtime validation is deferred until the Android track is resumed.

### 📱 **Platform Status:**

- **✅ Web**: Active
- **✅ iOS**: Active
- **⏸️ Android**: On hold

**Vehicle Vitals currently targets web and iOS in active delivery workflows.**
