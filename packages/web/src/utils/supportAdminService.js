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
    console.warn('Support admin service unavailable:', error);
    return {
      functions: null,
      httpsCallable: () => () => Promise.resolve({ data: { success: false } }),
    };
  }
};

export async function getSupportAccessContext() {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'getSupportAccessContextCallable'
  );

  const result = await callable();

  if (!result.data?.success) {
    return {
      isSuperAdmin: false,
      accessReason: 'Support access not granted',
    };
  }

  return {
    isSuperAdmin: Boolean(result.data.isSuperAdmin),
    accessReason: (result.data.accessReason || '').toString(),
  };
}

export async function searchSupportUsers(query = '', limit = 12) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'searchSupportUsersCallable'
  );

  const result = await callable({ query, limit });

  if (!result.data?.success) {
    throw new Error(result.data?.error || 'Support search failed');
  }

  return {
    query: (result.data.query || query || '').toString(),
    results: Array.isArray(result.data.results) ? result.data.results : [],
  };
}

export async function getOrganizationMembers(orgId) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'getOrganizationMembersCallable'
  );

  const result = await callable({ orgId: (orgId || '').toString().trim() });

  if (!result.data?.success) {
    throw new Error(result.data?.error || 'Organization members lookup failed');
  }

  return {
    orgId: (result.data.orgId || '').toString(),
    members: Array.isArray(result.data.members) ? result.data.members : [],
  };
}

export async function setOrganizationMemberRole({
  orgId,
  targetUid,
  role,
  idempotencyKey,
}) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'setOrganizationMemberRoleCallable'
  );

  const result = await callable({
    orgId,
    targetUid,
    role,
    idempotencyKey,
  });

  if (!result.data?.success) {
    throw new Error(result.data?.error || 'Failed to update member role');
  }

  return {
    orgId: (result.data.orgId || '').toString(),
    targetUid: (result.data.targetUid || '').toString(),
    role: (result.data.role || '').toString(),
  };
}

export async function applyRetentionPolicy({
  orgId,
  retentionDays,
  idempotencyKey,
}) {
  const firebaseService = await createFirebaseService();

  if (!firebaseService.functions) {
    throw new Error('Firebase Functions not available');
  }

  const callable = firebaseService.httpsCallable(
    firebaseService.functions,
    'applyRetentionPolicyCallable'
  );

  const result = await callable({
    orgId,
    retentionDays,
    idempotencyKey,
  });

  if (!result.data?.success) {
    throw new Error(result.data?.error || 'Failed to apply retention policy');
  }

  return {
    orgId: (result.data.orgId || '').toString(),
    retentionDays: Number(result.data.retentionDays || retentionDays),
  };
}
