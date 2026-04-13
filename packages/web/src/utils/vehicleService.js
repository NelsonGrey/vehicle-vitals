import { auth, db, functions } from '../shared/firebaseConfig';
import {
  getLegacyFirebase,
  getOrInitializeLegacyFirebaseApp,
  hasLegacyFirebaseModules,
} from '../shared/firebaseLegacy';

// Create async Firebase service using global Firebase objects
const createFirebaseService = async () => {
  try {
    // Prefer module exports from shared firebase config.
    if (db && auth && functions) {
      const firestore = await import('firebase/firestore');
      const fn = await import('firebase/functions');
      return {
        db,
        auth,
        functions,
        doc: firestore.doc,
        setDoc: firestore.setDoc,
        httpsCallable: fn.httpsCallable,
      };
    }

    // Fallback for legacy global Firebase bootstraps.
    if (hasLegacyFirebaseModules(['firestore', 'functions', 'auth'])) {
      const firebase = getLegacyFirebase();
      const app = getOrInitializeLegacyFirebaseApp(firebase);

      const db = firebase.firestore.getFirestore(app);
      const auth = firebase.auth.getAuth(app);
      const functions = firebase.functions.getFunctions(app);

      return {
        db,
        auth,
        functions,
        doc: firebase.firestore.doc,
        setDoc: firebase.firestore.setDoc,
        httpsCallable: firebase.functions.httpsCallable,
      };
    }

    throw new Error('Firebase SDKs failed to load');
  } catch (error) {
    console.warn('Firebase service not available:', error);
    // Return mock service for build compatibility
    return {
      db: null,
      auth: { currentUser: null },
      functions: null,
      doc: () => ({}),
      setDoc: async () => {},
      httpsCallable: () => () => Promise.resolve({ data: {} }),
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
    const decodeVINCallable = firebaseService.httpsCallable(
      firebaseService.functions,
      'decodeVINCallable'
    );
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
      services: [],
    };

    const userId = firebaseService.auth.currentUser?.uid;
    if (userId && firebaseService.db) {
      const vehicleRef = firebaseService.doc(
        firebaseService.db,
        `users/${userId}/vehicles/${vin}`
      );
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

export async function getVehicleInsights(vin) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const getVehicleInsightsCallable = firebaseService.httpsCallable(
    firebaseService.functions,
    'getVehicleInsightsCallable'
  );
  const result = await getVehicleInsightsCallable({ vin });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to fetch vehicle insights');
  }

  return result.data;
}

export function buildPersistedVinInsights(insights) {
  const vinProfile = insights?.free?.vinProfile || {};
  const recalls = insights?.free?.recalls || {};
  const recallCount = Number(recalls?.count || 0);

  return {
    recallsCount: Number.isFinite(recallCount) ? recallCount : 0,
    recallsSource: recalls?.source || 'NHTSA',
    engineType: vinProfile.engineType || '',
    bodyClass: vinProfile.bodyClass || '',
    fuelType: vinProfile.fuelType || '',
    driveType: vinProfile.driveType || '',
    transmissionStyle: vinProfile.transmissionStyle || '',
    trim: vinProfile.trim || '',
    vehicleType: vinProfile.vehicleType || '',
    recallsItems: Array.isArray(recalls?.items) ? recalls.items : [],
    vinProfile,
    vinInsights: {
      ...insights,
      fetchedAt: new Date().toISOString(),
    },
    insightsUpdatedAt: new Date().toISOString(),
  };
}

// Decode VIN without saving; returns { make, model, year } strings or '' when unknown
export async function decodeVin(vin) {
  try {
    const insights = await getVehicleInsights(vin);
    const vehicle = insights?.free?.vinProfile || {};
    const persistedFields = buildPersistedVinInsights(insights);
    return {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      ...persistedFields,
      vinProfile: vehicle,
      rawInsights: insights,
    };
  } catch (err) {
    console.error('VIN decode failed', err);
    throw err;
  }
}
