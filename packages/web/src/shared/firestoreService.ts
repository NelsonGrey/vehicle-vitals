import { auth, db } from './firebaseConfig';
import type { Auth, Firestore } from 'firebase/auth';
import {
  getLegacyFirebase,
  getOrInitializeLegacyFirebaseApp,
} from './firebaseLegacy';

// Initialize Firestore service with dynamic imports to avoid build-time resolution
let service: any = null;

const initializeFirestoreService = async (): Promise<any> => {
  if (service) return service;

  try {
    const { createFirestoreService } = await import('@vehicle-vitals/shared');

    let dbInstance: Firestore = db;
    let authInstance: Auth = auth;
    let helpers: any = await import('firebase/firestore');

    // Fallback for legacy global Firebase bootstraps.
    if (!dbInstance || !authInstance) {
      const firebase = getLegacyFirebase();
      const app = getOrInitializeLegacyFirebaseApp(firebase);
      dbInstance = firebase.firestore.getFirestore(app);
      authInstance = firebase.auth.getAuth(app);
      helpers = firebase.firestore;
    }

    if (!dbInstance || !authInstance) {
      throw new Error('Firebase SDKs failed to load');
    }

    service = createFirestoreService({
      db: dbInstance,
      auth: authInstance,
      helpers,
    });

    return service;
  } catch (error) {
    console.warn('Firebase Firestore not available:', (error as Error).message);
    // Return mock service
    return {
      addOrUpdateVehicle: () => Promise.reject('Firestore not available'),
      getVehicles: () => Promise.resolve([]),
      getVehicle: () => Promise.resolve(null),
      updateVehicle: () => Promise.reject('Firestore not available'),
      addMaintenanceEntry: () => Promise.reject('Firestore not available'),
      getMaintenanceEntries: () => Promise.resolve([]),
      addReminder: () => Promise.reject('Firestore not available'),
      getReminders: () => Promise.resolve([]),
      completeReminder: () => Promise.reject('Firestore not available'),
      snoozeReminder: () => Promise.reject('Firestore not available'),
      dismissReminder: () => Promise.reject('Firestore not available'),
      reopenReminder: () => Promise.reject('Firestore not available'),
      markReminderDelivery: () => Promise.reject('Firestore not available'),
      deleteVehicle: () => Promise.reject('Firestore not available'),
      deleteMaintenanceEntry: () => Promise.reject('Firestore not available'),
      getAttachmentAnalysis: () => Promise.resolve(null),
      getAttachmentAnalyses: () => Promise.resolve([]),
    };
  }
};

// Initialize service asynchronously
const servicePromise = initializeFirestoreService();

// Export async functions that wait for service initialization
const createAsyncMethod =
  (methodName: string) =>
  async (...args: unknown[]) => {
    const svc = await servicePromise;
    return svc[methodName](...args);
  };

// Export async methods that wait for service initialization
export const addOrUpdateVehicle = createAsyncMethod('addOrUpdateVehicle');
export const getVehicles = createAsyncMethod('getVehicles');
export const getVehicle = createAsyncMethod('getVehicle');
export const updateVehicle = createAsyncMethod('updateVehicle');
export const addMaintenanceEntry = createAsyncMethod('addMaintenanceEntry');
export const getMaintenanceEntries = createAsyncMethod('getMaintenanceEntries');
export const getMaintenanceEntry = createAsyncMethod('getMaintenanceEntry');
export const updateMaintenanceEntry = createAsyncMethod(
  'updateMaintenanceEntry'
);
export const deleteMaintenanceEntry = createAsyncMethod(
  'deleteMaintenanceEntry'
);
export const deleteVehicle = createAsyncMethod('deleteVehicle');
export const getAttachmentAnalysis = createAsyncMethod('getAttachmentAnalysis');
export const getAttachmentAnalyses = createAsyncMethod('getAttachmentAnalyses');
export const addReminder = createAsyncMethod('addReminder');
export const getReminders = createAsyncMethod('getReminders');
export const completeReminder = createAsyncMethod('completeReminder');
export const snoozeReminder = createAsyncMethod('snoozeReminder');
export const dismissReminder = createAsyncMethod('dismissReminder');
export const reopenReminder = createAsyncMethod('reopenReminder');
export const markReminderDelivery = createAsyncMethod('markReminderDelivery');
