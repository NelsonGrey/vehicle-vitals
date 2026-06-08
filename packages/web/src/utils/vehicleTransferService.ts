import { functions } from '../shared/firebaseConfig';
import {
  getLegacyFirebase,
  getOrInitializeLegacyFirebaseApp,
  hasLegacyFirebaseModules,
} from '../shared/firebaseLegacy';

const createFirebaseService = async () => {
  try {
    if (functions) {
      const fn = await import('firebase/functions');
      return {
        functions,
        httpsCallable: fn.httpsCallable,
      };
    }

    if (hasLegacyFirebaseModules(['functions'])) {
      const firebase = getLegacyFirebase();
      const app = getOrInitializeLegacyFirebaseApp(firebase);

      return {
        functions: firebase.functions.getFunctions(app),
        httpsCallable: firebase.functions.httpsCallable,
      };
    }

    throw new Error('Firebase Functions not available');
  } catch (error) {
    console.warn('Vehicle transfer service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

function secureRandomHex(byteLength: number): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Secure random generator unavailable in this runtime');
  }

  const bytes = new Uint8Array(byteLength);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function transferVehicle(params: {
  vin: string;
  recipientEmail: string;
  idempotencyKey?: string;
}) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'transferVehicleCallable'
  );

  const result = await callable({
    vin: params.vin,
    recipientEmail: params.recipientEmail,
    idempotencyKey:
      params.idempotencyKey ||
      `transfer-${params.vin}-${Date.now()}-${secureRandomHex(8)}`,
  });

  if (!result.data?.success) {
    throw new Error(result.data?.error || 'Vehicle transfer failed');
  }

  return {
    success: true,
    vin: (result.data.vin || params.vin).toString(),
    recipientUid: (result.data.recipientUid || '').toString(),
    recipientEmail: (
      result.data.recipientEmail || params.recipientEmail
    ).toString(),
  };
}
