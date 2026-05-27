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
    console.warn('API access service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

async function callFunction(callableName, payload = {}) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    callableName
  );
  const result = await callable(payload);

  if (!result.data?.success) {
    throw new Error(result.data?.error || 'Request failed');
  }

  return result.data;
}

export async function createApiAccessKey(label) {
  const response = await callFunction('createApiAccessKeyCallable', {
    label: (label || '').toString().trim() || 'Default key',
  });

  return {
    key: response.key,
    rawKey: (response.rawKey || '').toString(),
  };
}

export async function listApiAccessKeys() {
  const response = await callFunction('listApiAccessKeysCallable');
  return Array.isArray(response.keys) ? response.keys : [];
}

export async function revokeApiAccessKey(keyId) {
  const response = await callFunction('revokeApiAccessKeyCallable', {
    keyId: (keyId || '').toString().trim(),
  });

  return {
    keyId: (response.keyId || keyId || '').toString(),
    revoked: Boolean(response.revoked),
  };
}

export async function getZapierWebhookConfig() {
  const response = await callFunction('getZapierWebhookConfigCallable');

  return {
    webhookUrl: (response.webhookUrl || '').toString(),
    instructions: (response.instructions || '').toString(),
    requiresSignature: Boolean(response.requiresSignature),
  };
}
