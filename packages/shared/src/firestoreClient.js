// shared/firestoreClient.js
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import * as firestoreHelpers from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig as _fc } from './firebaseConfig';
import { createFirestoreService } from './firestoreServiceFactory';

// initialize app using shared/firebaseConfig placeholders (mobile will use process.env)
const app = initializeApp(_fc);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);

export const firestoreService = createFirestoreService({
  db,
  auth,
  helpers: firestoreHelpers,
});

// Also export named methods for convenience/consistency with web wiring
export const {
  addOrUpdateVehicle,
  getVehicles,
  getVehicle,
  addMaintenanceEntry,
  getMaintenanceEntries,
  getMaintenanceEntry,
  updateMaintenanceEntry,
  deleteMaintenanceEntry,
  updateVehicle,
  deleteVehicle,
  // reminder lifecycle
  addReminder,
  getReminders,
  completeReminder,
  snoozeReminder,
  dismissReminder,
  reopenReminder,
} = firestoreService;
