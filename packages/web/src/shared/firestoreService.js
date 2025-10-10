// Initialize Firestore service with dynamic imports to avoid build-time resolution
let service = null;

const initializeFirestoreService = async () => {
  if (service) return service;
  
  try {
    const importFn = new Function('specifier', 'return import(specifier)');
    
    const [firestoreHelpers, sharedFactory, firebaseConfig] = await Promise.all([
      importFn('firebase' + '/firestore'),
      importFn('@vehicle-vitals/shared/firestore'),
      importFn('./firebaseConfig')
    ]);
    
    const [db, auth] = await Promise.all([
      firebaseConfig.getFirebaseDb(),
      firebaseConfig.getFirebaseAuth()
    ]);
    
    service = sharedFactory.createFirestoreService({ 
      db, 
      auth, 
      helpers: firestoreHelpers 
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
