# Vehicle Vitals - Troubleshooting Guide

**Version**: 1.0  
**Last Updated**: February 16, 2026  
**Status**: ✅ ACTIVE  
**Owner**: Mark Nelson

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Development Environment](#development-environment)
4. [Firebase Issues](#firebase-issues)
5. [Build & Deployment](#build--deployment)
6. [Mobile App Issues](#mobile-app-issues)
7. [Performance Issues](#performance-issues)
8. [User-Reported Issues](#user-reported-issues)
9. [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check Commands

Run these commands to quickly diagnose common issues:

```bash
# Check Node.js version (should be 20.x)
node --version

# Check npm version (should be 9.x+)
npm --version

# Check Flutter version (should be 3.24+)
flutter --version

# Check Firebase CLI
firebase --version

# Verify Firebase project
firebase projects:list

# Check for dependency issues
npm ls

# Run linter
npm run lint

# Run tests
npm run test:web
```

### Environment Verification

```bash
# Verify environment variables are set (web)
cat packages/web/.env.development

# Check Firebase config (should have all required keys)
grep VITE_FIREBASE packages/web/.env.development

# Check Git status
git status

# Check for uncommitted changes
git diff
```

---

## Common Issues

### Issue: "Module not found" errors

**Symptoms**:

```
Error: Cannot find module '@vehicle-vitals/shared'
```

**Causes**:

- Dependencies not installed
- Workspace configuration incorrect
- Package linking broken

**Solutions**:

```bash
# Solution 1: Reinstall dependencies
npm run install:all

# Solution 2: Clean install
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json
npm install

# Solution 3: Rebuild shared package
cd packages/shared
npm run build
cd ../..

# Solution 4: Clear npm cache
npm cache clean --force
npm install
```

### Issue: "Permission denied" when accessing Firestore

**Symptoms**:

```
FirebaseError: Missing or insufficient permissions
```

**Causes**:

- User not authenticated
- Security rules deny access
- Trying to access another user's data

**Solutions**:

```typescript
// Verify user is authenticated
import { useAuth } from '../shared/AuthContext';

const { user } = useAuth();
if (!user) {
  console.error('User not authenticated');
  // Redirect to login page
}

// Check security rules (firestore.rules)
// Ensure userId matches document owner
const q = query(
  collection(db, 'vehicles'),
  where('userId', '==', user.uid)  // ✅ Correct
  // NOT: where('userId', '==', 'some-other-user')  // ❌ Will fail
);

// Test security rules locally
npm run test:emulator
```

**Debug Security Rules**:

```javascript
// Add logging to security rules (development only)
match /vehicles/{vehicleId} {
  allow read: if request.auth != null
              && resource.data.userId == request.auth.uid
              && debug("userId: " + request.auth.uid);  // Add debug logging
}
```

### Issue: Firebase emulator not starting

**Symptoms**:

```
Error: Port 8080 is already in use
```

**Solutions**:

```bash
# Solution 1: Find and kill process using port
lsof -ti:8080 | xargs kill -9

# Solution 2: Use different port
firebase emulators:start --port=9000

# Solution 3: Stop all Java processes (Firebase emulator uses Java)
pkill -f firebase

# Solution 4: Clear emulator data and restart
firebase emulators:start --import=./emulator-data --export-on-exit
```

### Issue: VIN decoding fails

**Symptoms**:

```
Error: Failed to decode VIN
```

**Causes**:

- Invalid VIN format
- NHTSA API down
- CORS issues
- Network error

**Solutions**:

```typescript
// Validate VIN format before calling API
const validateVIN = (vin: string): boolean => {
  // 17 characters, alphanumeric, no I, O, Q
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
};

if (!validateVIN(vin)) {
  console.error('Invalid VIN format:', vin);
  return;
}

// Test NHTSA API directly
fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/1HGBH41JXMN109186?format=json')
  .then(res => res.json())
  .then(data => console.log('NHTSA Response:', data))
  .catch(err => console.error('NHTSA API Error:', err));

// Check Firebase Function logs
firebase functions:log --only decodeVIN

// Test function locally
firebase emulators:start --only functions
```

### Issue: Build fails with "out of memory" error

**Symptoms**:

```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions**:

```bash
# Solution 1: Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:web

# Solution 2: Clear build cache
rm -rf packages/web/dist
rm -rf packages/web/node_modules/.vite
npm run build:web

# Solution 3: Build with memory optimization
NODE_OPTIONS="--max-old-space-size=4096" npm run build:web

# Solution 4: Use optimized install script
./install.sh
```

### Issue: "Cannot read properties of undefined" in React

**Symptoms**:

```
TypeError: Cannot read properties of undefined (reading 'map')
```

**Causes**:

- Data not loaded yet (async)
- API error
- Missing null checks

**Solutions**:

```typescript
// ❌ BAD: No loading or error state
const VehicleList = () => {
  const [vehicles, setVehicles] = useState();

  return (
    <div>
      {vehicles.map(v => <div>{v.make}</div>)}  {/* Crashes if vehicles undefined */}
    </div>
  );
};

// ✅ GOOD: Handle loading and error states
const VehicleList = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (vehicles.length === 0) return <div>No vehicles found</div>;

  return (
    <div>
      {vehicles.map(v => <div key={v.id}>{v.make}</div>)}
    </div>
  );
};
```

---

## Development Environment

### Issue: Vite dev server not hot-reloading

**Symptoms**:

- Code changes don't reflect in browser
- Need to manually refresh page

**Solutions**:

```bash
# Solution 1: Clear Vite cache
rm -rf packages/web/node_modules/.vite
npm run dev:web

# Solution 2: Restart dev server
# Press Ctrl+C to stop
npm run dev:web

# Solution 3: Check file watcher limits (Linux/macOS)
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Solution 4: Update Vite
cd packages/web
npm update vite
```

### Issue: ESLint errors not showing in VS Code

**Symptoms**:

- Linting errors not highlighted
- No squiggly lines under errors

**Solutions**:

1. **Install ESLint Extension**:
   - Press `Cmd/Ctrl+Shift+X`
   - Search "ESLint"
   - Install by Microsoft

2. **Check VS Code Settings**:

```json
// .vscode/settings.json
{
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

3. **Restart ESLint Server**:
   - Press `Cmd/Ctrl+Shift+P`
   - Type "ESLint: Restart ESLint Server"
   - Press Enter

### Issue: TypeScript errors in VS Code but build succeeds

**Symptoms**:

- Red squiggly lines in editor
- `npm run build` completes successfully

**Solutions**:

```bash
# Solution 1: Restart TypeScript server in VS Code
# Press Cmd/Ctrl+Shift+P
# Type "TypeScript: Restart TS Server"

# Solution 2: Delete TypeScript cache
rm -rf packages/web/tsconfig.tsbuildinfo
rm -rf packages/shared/tsconfig.tsbuildinfo

# Solution 3: Ensure VS Code uses workspace TypeScript
# VS Code Command Palette: "TypeScript: Select TypeScript Version"
# Choose "Use Workspace Version"

# Solution 4: Run type check manually
npm run check
```

---

## Firebase Issues

### Issue: Firebase deployment fails

**Symptoms**:

```
Error: HTTP Error: 403, Permission denied
```

**Solutions**:

```bash
# Solution 1: Re-authenticate with Firebase
firebase logout
firebase login

# Solution 2: Verify correct project
firebase use --project vehicle-vitals-dev

# Solution 3: Check Firebase project permissions
# Go to Firebase Console > Project Settings > Users and permissions
# Ensure your account has "Owner" or "Editor" role

# Solution 4: Use specific target
firebase deploy --only hosting:web

# Solution 5: Check .firebaserc configuration
cat .firebaserc
# Should contain:
# {
#   "projects": {
#     "default": "vehicle-vitals-dev"
#   }
# }
```

### Issue: Firestore offline persistence not working (mobile)

**Symptoms**:

- App requires network connection to load data
- Cached data not accessible offline

**Solutions**:

```dart
// Ensure persistence is enabled BEFORE any Firestore calls
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();

  // Enable offline persistence
  FirebaseFirestore.instance.settings = Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );

  runApp(MyApp());
}

// Clear cache if corrupted
await FirebaseFirestore.instance.clearPersistence();
```

### Issue: Firebase Function cold starts too slow

**Symptoms**:

- First function call takes 5-10 seconds
- Subsequent calls fast (<1s)

**Solutions**:

```typescript
// Solution 1: Increase minimum instances (keeps functions warm)
export const decodeVIN = onRequest(
  {
    cors: true,
    minInstances: 1, // Keep 1 instance always running (costs $)
  },
  async (req, res) => {
    // Function logic
  }
);

// Solution 2: Reduce function dependencies
// Move heavy imports inside function (lazy load)
export const heavyFunction = onRequest(async (req, res) => {
  // Import only when needed
  const heavyLibrary = await import('heavy-library');
  // Use library
});

// Solution 3: Use scheduled function to keep warm
export const keepWarm = onSchedule('every 5 minutes', async event => {
  console.log('Keeping functions warm');
});
```

---

## Build & Deployment

### Issue: Production build different from development

**Symptoms**:

- Works locally but fails in production
- Environment variables not resolved

**Solutions**:

```bash
# Build for production locally to test
npm run build:production

# Preview production build locally
cd packages/web/dist
npx serve

# Check environment variables
cat packages/web/.env.production

# Verify build output
ls -la packages/web/dist

# Test with Firebase Hosting emulator
firebase emulators:start --only hosting
```

### Issue: Tailwind CSS classes not applied in production

**Symptoms**:

- Styles work in development
- Styles missing in production build

**Solutions**:

```javascript
// tailwind.config.js - Ensure content paths are correct
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',  // ✅ Include all source files
  ],
  theme: {
    extend: {},
  },
};

// Verify Tailwind is processing files
npm run build:web -- --debug
```

---

## Mobile App Issues

### Issue: Flutter app won't build for iOS

**Symptoms**:

```
Error: Signing for "Runner" requires a development team
```

**Solutions**:

```bash
# Solution 1: Open Xcode and select team
open packages/mobile/ios/Runner.xcworkspace
# In Xcode: Runner > Signing & Capabilities > Select Team

# Solution 2: Run from Xcode instead of CLI
# Open workspace in Xcode
# Press Play button to build and run

# Solution 3: Clean build folder
cd packages/mobile
flutter clean
flutter pub get
cd ios
pod install
cd ..
flutter run
```

### Issue: Firebase not initialized in Flutter app

**Symptoms**:

```
[core/no-app] No Firebase App '[DEFAULT]' has been created
```

**Solutions**:

```dart
// Ensure Firebase is initialized before runApp()
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(MyApp());
}

// Regenerate Firebase options if needed
flutter pub run flutterfire configure
```

### Issue: VIN scanner not working (mobile)

**Symptoms**:

- Camera doesn't open
- Barcode not detected

**Solutions**:

```dart
// Check camera permissions
// iOS: Info.plist should have NSCameraUsageDescription
// Android: AndroidManifest.xml should have camera permission

// iOS: packages/mobile/ios/Runner/Info.plist
<key>NSCameraUsageDescription</key>
<string>Camera is used to scan vehicle VIN barcodes</string>

// Android: packages/mobile/android/app/src/main/AndroidManifest.xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />

// Request permission at runtime
import 'package:permission_handler/permission_handler.dart';

Future<void> requestCameraPermission() async {
  final status = await Permission.camera.request();
  if (status.isDenied) {
    print('Camera permission denied');
  }
}
```

---

## Performance Issues

### Issue: Firestore queries slow

**Symptoms**:

- Queries take >2 seconds to complete
- App feels sluggish

**Solutions**:

```typescript
// Solution 1: Add composite indexes
// Check Firebase Console > Firestore > Indexes
// Auto-created when you run a query that needs one

// Solution 2: Paginate large collections
const q = query(
  collection(db, 'vehicles'),
  where('userId', '==', user.uid),
  orderBy('createdAt', 'desc'),
  limit(20)  // ✅ Limit results
);

// Solution 3: Use real-time listeners instead of repeated getDocs()
const unsubscribe = onSnapshot(
  query(collection(db, 'vehicles'), where('userId', '==', user.uid)),
  (snapshot) => {
    const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setVehicles(vehicles);
  }
);

// Clean up listener
return () => unsubscribe();

// Solution 4: Enable offline persistence (web)
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence disabled');
    } else if (err.code == 'unimplemented') {
      console.log('Browser doesn't support persistence');
    }
  });
```

### Issue: Web app slow to load

**Symptoms**:

- Initial page load >3 seconds
- Lighthouse performance score <80

**Solutions**:

```typescript
// Solution 1: Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const EditVehicle = lazy(() => import('./pages/EditVehicle'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/home" element={<Home />} />
    <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
  </Routes>
</Suspense>

// Solution 2: Optimize images
// Use WebP format, compress images
// Lazy load images below fold

// Solution 3: Analyze bundle size
npm run build:web
npx vite-bundle-visualizer

// Solution 4: Remove unused dependencies
npm uninstall unused-package
```

---

## User-Reported Issues

### Issue: "Cannot log in" - Email/password not working

**Troubleshooting Steps**:

1. **Verify email format**:

   ```typescript
   const isValidEmail = (email: string) => {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   };
   ```

2. **Check Firebase Auth console**:
   - Firebase Console > Authentication > Users
   - Verify user exists
   - Check if email is verified

3. **Reset password**:

   ```typescript
   await sendPasswordResetEmail(auth, email);
   ```

4. **Check browser console for errors**:
   - Press F12
   - Go to Console tab
   - Look for Firebase Auth errors

### Issue: "My vehicles disappeared"

**Troubleshooting Steps**:

1. **Verify user is logged in**:

   ```typescript
   const { user } = useAuth();
   console.log('Current user:', user?.uid);
   ```

2. **Check Firestore Console**:
   - Firebase Console > Firestore Database
   - Search for vehicles collection
   - Filter by userId

3. **Check query**:

   ```typescript
   const q = query(collection(db, 'vehicles'), where('userId', '==', user.uid));
   const snapshot = await getDocs(q);
   console.log('Vehicles found:', snapshot.size);
   ```

4. **Check network connectivity**:
   - Verify internet connection
   - Check if Firebase is down: https://status.firebase.google.com

### Issue: "VIN scanner not working" (mobile)

**Troubleshooting Steps**:

1. **Check camera permission**:
   - iOS: Settings > Vehicle Vitals > Camera
   - Android: Settings > Apps > Vehicle Vitals > Permissions > Camera

2. **Verify VIN format**:
   - VIN must be Code39 or Code128 barcode
   - 17 characters
   - No spaces or special characters

3. **Try manual VIN entry**:
   - Use "Enter VIN Manually" option
   - Type 17-character VIN

4. **Update app**:
   - Check for app updates in App Store / Google Play

---

## Getting Help

### Self-Help Resources

1. **Documentation**:
   - [Architecture](/docs/ARCHITECTURE.md)
   - [API & Data Models](/docs/API_DATA_MODELS.md)
   - [Developer Guide](/docs/DEVELOPER_GUIDE.md)
   - [Security Implementation](/docs/SECURITY_IMPLEMENTATION.md)

2. **Firebase Docs**:
   - [Firestore](https://firebase.google.com/docs/firestore)
   - [Firebase Auth](https://firebase.google.com/docs/auth)
   - [Firebase Functions](https://firebase.google.com/docs/functions)

3. **Community**:
   - [React Docs](https://react.dev)
   - [Flutter Docs](https://flutter.dev/docs)
   - [Stack Overflow](https://stackoverflow.com)

### Escalation Path

1. **Search existing issues**: Check GitHub issues for similar problems
2. **Create detailed issue**:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs
   - Environment details (OS, browser, versions)

3. **Contact support**:
   - **Email**: support@vehiclevitals.com
   - **GitHub Issues**: https://github.com/mnelson3/vehicle-vitals/issues
   - **Slack** (internal): #vehicle-vitals-support

### Bug Report Template

```markdown
## Bug Description

[Brief description of the issue]

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Screenshots

[If applicable]

## Environment

- OS: [e.g., macOS 13.0, Windows 11, iOS 16]
- Browser: [e.g., Chrome 120, Safari 17]
- Device: [e.g., iPhone 14, Desktop]
- App Version: [e.g., 1.2.3]

## Console Logs
```

[Paste any error messages from browser console]

```

## Additional Context
[Any other relevant information]
```

---

## Appendix

### Useful Debug Commands

```bash
# Check all Firebase projects
firebase projects:list

# Check current Firebase project
firebase use

# View Firebase config
firebase apps:sdkconfig

# Check Firestore indexes
firebase firestore:indexes

# View function logs
firebase functions:log

# Check app dependencies
npm ls @vehicle-vitals/shared
npm ls firebase

# Verify versions
node --version
npm --version
firebase --version
flutter --version

# Network diagnostics
ping google.com
curl https://firebaseio.com
```

### Firebase Status

Check Firebase service status:

- **Firebase Status Dashboard**: https://status.firebase.google.com
- **Google Cloud Status**: https://status.cloud.google.com

### Known Issues

**Issue**: iOS app rejected for IDFA usage

- **Status**: In Progress
- **Workaround**: Disable Firebase Analytics in iOS build
- **ETA**: Next release

**Issue**: Android app crashes on old devices (<API 21)

- **Status**: Won't Fix
- **Reason**: Minimum SDK version is API 21 (Android 5.0)

---

**Document Revision History**:

- **v1.0** (Feb 16, 2026): Initial troubleshooting guide

**Maintained By**: Mark Nelson  
**Review Cycle**: Monthly or when new issues discovered  
**Next Review**: March 16, 2026  
**Feedback**: Create GitHub issue or email support@vehiclevitals.com
