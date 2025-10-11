// -----------------------------
// File: web/src/utils/vehicleService.js

// -----------------------------
// File: web/src/utils/vehicleService.js

// -----------------------------
// File: web/src/utils/vehicleService.js

// Create async Firebase service using global Firebase objects
const createFirebaseService = async () => {
  try {
    // Wait for global Firebase to be available
    const checkFirebase = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        const check = () => {
          attempts++;
          if (window.firebase && window.firebase.firestore && window.firebase.functions && window.firebase.auth) {
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

    // Import config
    const { firebaseConfig } = await import('../shared/firebaseConfig');

    // Initialize Firebase app if not already initialized
    let app;
    try {
      app = firebase.app.getApp();
    } catch {
      app = firebase.app.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore.getFirestore(app);
    const auth = firebase.auth.getAuth(app);
    const functions = firebase.functions.getFunctions(app);

    return { db, auth, functions, doc: firebase.firestore.doc, setDoc: firebase.firestore.setDoc, httpsCallable: firebase.functions.httpsCallable };
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
