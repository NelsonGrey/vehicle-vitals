// -----------------------------
// File: web/src/utils/vehicleService.js

// -----------------------------
// File: web/src/utils/vehicleService.js

// Create async Firebase service that hides imports from Vite
const createFirebaseService = async () => {
  try {
    // Use Function constructor to hide imports from Vite's static analysis
    const firestoreFn = new Function('return import("firebase/firestore")');
    const functionsFn = new Function('return import("firebase/functions")');
    const configFn = new Function('return import("../shared/firebaseConfig")');
    
    const [{ doc, setDoc }, { httpsCallable }, { getFirebaseDb, getFirebaseAuth, getFirebaseFunctions }] = await Promise.all([
      firestoreFn(),
      functionsFn(),
      configFn()
    ]);

    const [db, auth, functions] = await Promise.all([
      getFirebaseDb(),
      getFirebaseAuth(),
      getFirebaseFunctions()
    ]);

    return { db, auth, functions, doc, setDoc, httpsCallable };
  } catch (error) {
    console.warn('Firebase service not available:', error);
    // Return mock service for build compatibility
    return {
      db: null,
      auth: { currentUser: null },
      functions: null,
      doc: () => ({}),
      setDoc: async () => {},
      httpsCallable: () => () => Promise.resolve({ data: {} })
    };
  }
};

export async function fetchVehicleByVINAndSave(vin) {
  try {
    const firebaseService = await createFirebaseService();
    
    if (!firebaseService.functions) {
      throw new Error('Firebase Functions not available');
    }

    // Call Firebase Function for VIN decoding
    const decodeVINCallable = firebaseService.httpsCallable(firebaseService.functions, 'decodeVIN');
    const result = await decodeVINCallable({ vin });
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to decode VIN');
    }

    const vehicleData = result.data.vehicle;
    
    // Create vehicle object for Firestore
    const vehicle = {
      ...vehicleData,
      mileage: '',
      purchaseDate: '',
      nextDueDate: '',
      services: []
    };
    
    const userId = firebaseService.auth.currentUser?.uid;
    if (userId && firebaseService.db) {
      const vehicleRef = firebaseService.doc(firebaseService.db, `users/${userId}/vehicles/${vin}`);
      await firebaseService.setDoc(vehicleRef, vehicle);
      alert('Vehicle added successfully!');
    }
    
    return vehicle;
  } catch (err) {
    console.error('VIN lookup failed', err);
    alert('Error fetching vehicle info: ' + err.message);
    return null;
  }
}

// Decode VIN without saving; returns { make, model, year } strings or '' when unknown
export async function decodeVin(vin) {
  try {
    const firebaseService = await createFirebaseService();
    
    if (!firebaseService.functions) {
      throw new Error('Firebase Functions not available');
    }

    // Call Firebase Function for VIN decoding
    const decodeVINCallable = firebaseService.httpsCallable(firebaseService.functions, 'decodeVIN');
    const result = await decodeVINCallable({ vin });
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to decode VIN');
    }

    const vehicle = result.data.vehicle;
    return { 
      make: vehicle.make, 
      model: vehicle.model, 
      year: vehicle.year 
    };
  } catch (err) {
    console.error('VIN decode failed', err);
    throw err;
  }
}
