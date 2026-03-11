// Initialize Firestore service with dynamic imports to avoid build-time resolution
let service = null;

const initializeFirestoreService = async () => {
  if (service) return service;

  try {
    // Import config and factory
    const firebaseModule = await import('./firebaseConfig');
    const { createFirestoreService } = await import('@vehicle-vitals/shared');

    let db = firebaseModule.db;
    let auth = firebaseModule.auth;
    let helpers = await import('firebase/firestore');

    // Fallback for legacy global Firebase bootstraps.
    if ((!db || !auth) && window.firebase) {
      const firebase = window.firebase;
      const firebaseConfig =
        firebaseModule.firebaseConfig ||
        firebaseModule.getFirebaseConfig?.() ||
        null;
      let app;
      try {
        app = firebase.app.getApp();
      } catch {
        app = firebase.app.initializeApp(firebaseConfig);
      }
      db = firebase.firestore.getFirestore(app);
      auth = firebase.auth.getAuth(app);
      helpers = firebase.firestore;
    }

    if (!db || !auth) {
      throw new Error('Firebase SDKs failed to load');
    }

    service = createFirestoreService({
      db,
      auth,
      helpers,
    });

    return service;
  } catch (error) {
    console.warn('Firebase Firestore not available:', error.message);
    // Return mock service
    return {
      addOrUpdateVehicle: () => Promise.reject('Firestore not available'),
      getVehicles: () => Promise.resolve([]),
      getVehicle: () => Promise.resolve(null),
      updateVehicle: () => Promise.reject('Firestore not available'),
      addMaintenanceEntry: () => Promise.reject('Firestore not available'),
      getMaintenanceEntries: () => Promise.resolve([]),
      deleteVehicle: () => Promise.reject('Firestore not available'),
      deleteMaintenanceEntry: () => Promise.reject('Firestore not available'),
    };
  }
};

// Initialize service asynchronously
const servicePromise = initializeFirestoreService();

// Export async functions that wait for service initialization
const createAsyncMethod =
  methodName =>
  async (...args) => {
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
// Reminder helpers (stubs)
export const getUpcomingReminders = createAsyncMethod('getUpcomingReminders');
export const addReminder = createAsyncMethod('addReminder');
export const deleteReminder = createAsyncMethod('deleteReminder');
export const markReminderComplete = createAsyncMethod('markReminderComplete');
