// Initialize Firestore service with dynamic imports to avoid build-time resolution
let service = null;

const initializeFirestoreService = async () => {
  if (service) return service;
  
  try {
    // Wait for global Firebase to be available
    const checkFirebase = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        const check = () => {
          attempts++;
          if (window.firebase && window.firebase.firestore && window.firebase.auth && window.firebase.app) {
            resolve(window.firebase);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Firebase SDKs failed to load within timeout'));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    const firebase = await checkFirebase();

    // Import config and factory
    const { firebaseConfig } = await import('./firebaseConfig');
    const { createFirestoreService } = await import('@vehicle-vitals/shared');

    // Initialize Firebase app if not already initialized
    let app;
    try {
      app = firebase.app.getApp();
    } catch {
      app = firebase.app.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore.getFirestore(app);
    const auth = firebase.auth.getAuth(app);
    const helpers = firebase.firestore;

    service = createFirestoreService({ 
      db, 
      auth, 
      helpers 
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
const createAsyncMethod = (methodName) => async (...args) => {
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
export const updateMaintenanceEntry = createAsyncMethod('updateMaintenanceEntry');
export const deleteMaintenanceEntry = createAsyncMethod('deleteMaintenanceEntry');
export const deleteVehicle = createAsyncMethod('deleteVehicle');
// Reminder helpers (stubs)
export const getUpcomingReminders = createAsyncMethod('getUpcomingReminders');
export const addReminder = createAsyncMethod('addReminder');
export const deleteReminder = createAsyncMethod('deleteReminder');
export const markReminderComplete = createAsyncMethod('markReminderComplete');
