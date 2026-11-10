// Backward-compatible barrel for Firestore, Cloud Functions, and Storage.
//
// Auth, the Firebase app, and analytics helpers live in firebaseCore.ts.
// Remote Config lives in firebaseRemoteConfig.ts. Keep this module off the
// marketing entry graph: importing it downloads the data-plane SDKs.
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  connectFunctionsEmulator,
  getFunctions,
  type Functions,
} from 'firebase/functions';
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';
import { app } from './firebaseCore';

export {
  app,
  auth,
  firebaseConfig,
  gateAuth,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseConfig,
  resolveEnvironmentName,
  trackEvent,
} from './firebaseCore';
export type { FirebaseConfig } from './firebaseCore';
export {
  remoteConfig,
  remoteConfigFlag,
  remoteConfigReady,
} from './firebaseRemoteConfig';

const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);
const storage: FirebaseStorage = getStorage(app);

// Emulators are explicit opt-in. Auth's emulator is connected in firebaseCore
// because Auth loads with the entry; these connect when this module loads.
if (
  !import.meta.env.SSR &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.warn('Could not connect to Firebase emulators:', error);
  }
}

export { db, functions, storage };

export const getFirebaseFunctions = (): Functions => functions;
