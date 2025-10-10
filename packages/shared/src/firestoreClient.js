// shared/firestoreClient.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import * as firestoreHelpers from 'firebase/firestore';
import { createFirestoreService } from './firestoreServiceFactory';
import { firebaseConfig as _fc } from './firebaseConfig';

// initialize app using shared/firebaseConfig placeholders (mobile will use process.env)
const app = initializeApp(_fc);
export const auth = initializeAuth(app, {
	persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);

export const firestoreService = createFirestoreService({ db, auth, helpers: firestoreHelpers });

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
	// reminder stubs
	addReminder,
	getReminders,
	completeReminder,
	snoozeReminder,
} = firestoreService;
