import { beforeEach, describe, expect, it } from 'vitest';

import { createFirestoreService } from '../src/firestoreServiceFactory.js';

function createGarageScopeHelpers({
  orgDocData = {},
  vehicleDocExists = false,
} = {}) {
  const writes: Array<Record<string, unknown>> = [];
  const reads: Array<string> = [];

  const collection = (_db: unknown, path: string) => ({
    __kind: 'collection',
    path,
  });

  const doc = (_db: unknown, path: string) => ({
    __kind: 'doc',
    path,
  });

  const where = (field: string, op: string, value: unknown) => ({
    type: 'where',
    field,
    op,
    value,
  });

  const limit = (count: number) => ({
    type: 'limit',
    count,
  });

  const startAfter = (cursor: unknown) => ({
    type: 'startAfter',
    cursor,
  });

  const orderBy = (field: string, direction: string) => ({
    type: 'orderBy',
    field,
    direction,
  });

  const query = (
    ref: { path: string },
    ...constraints: Array<Record<string, unknown>>
  ) => ({
    __kind: 'query',
    path: ref.path,
    constraints,
  });

  const getDocs = async (ref: { path: string }) => {
    reads.push(ref.path);

    if (ref.path === 'users/user-123/orgMemberships') {
      return {
        docs: [
          {
            id: 'org-household-1',
            data: () => ({ status: 'active' }),
          },
        ],
      };
    }

    return { docs: [] };
  };

  const getDoc = async (ref: { path: string }) => {
    reads.push(ref.path);

    if (ref.path === 'orgs/org-household-1') {
      return {
        exists: () => true,
        data: () => ({
          type: 'household',
          garageStorageMode: 'org_scoped',
          ...orgDocData,
        }),
      };
    }

    if (ref.path === 'orgs/org-household-1/vehicles/VIN001') {
      return {
        exists: () => vehicleDocExists,
        data: () => (vehicleDocExists ? { vin: 'VIN001', make: 'Honda' } : null),
      };
    }

    if (ref.path === 'users/user-123/vehicles/VIN001') {
      return {
        exists: () => true,
        data: () => ({ vin: 'VIN001', make: 'Fallback User Vehicle' }),
      };
    }

    return {
      exists: () => false,
      data: () => null,
    };
  };

  const setDoc = async (
    docRef: { path: string },
    data: Record<string, unknown>
  ) => {
    writes.push({ op: 'setDoc', path: docRef.path, data });
  };

  const addDoc = async (
    collectionRef: { path: string },
    data: Record<string, unknown>
  ) => {
    writes.push({ op: 'addDoc', path: collectionRef.path, data });
    return { id: 'doc-1' };
  };

  const updateDoc = async (
    docRef: { path: string },
    data: Record<string, unknown>
  ) => {
    writes.push({ op: 'updateDoc', path: docRef.path, data });
  };

  const deleteDoc = async (docRef: { path: string }) => {
    writes.push({ op: 'deleteDoc', path: docRef.path });
  };

  return {
    writes,
    reads,
    helpers: {
      collection,
      doc,
      where,
      limit,
      startAfter,
      orderBy,
      query,
      getDocs,
      getDoc,
      setDoc,
      addDoc,
      updateDoc,
      deleteDoc,
      serverTimestamp: () => 'SERVER_TS',
    },
  };
}

describe('createFirestoreService garage scope', () => {
  let auth: { currentUser: { uid: string } };

  beforeEach(() => {
    auth = { currentUser: { uid: 'user-123' } };
  });

  it('resolves active household garage context', async () => {
    const { helpers } = createGarageScopeHelpers();
    const service = createFirestoreService({ db: {}, auth, helpers });

    const context = await service.resolveGarageContext();

    expect(context).toEqual({
      userId: 'user-123',
      orgId: 'org-household-1',
      orgType: 'household',
      garageStorageMode: 'org_scoped',
    });
  });

  it('writes vehicle updates to org-scoped garage paths when enabled', async () => {
    const { helpers, writes } = createGarageScopeHelpers();
    const service = createFirestoreService({ db: {}, auth, helpers });

    await service.addOrUpdateVehicle({
      vin: 'VIN001',
      make: 'Honda',
      model: 'Pilot',
    });

    expect(writes[0].path).toBe('orgs/org-household-1/vehicles/VIN001');
  });

  it('keeps preferences on the user-scoped path even for household garages', async () => {
    const { helpers, writes } = createGarageScopeHelpers();
    const service = createFirestoreService({ db: {}, auth, helpers });

    await service.updateVehicle('preferences', { fcmToken: 'abc123' });

    expect(writes[0]).toEqual({
      op: 'updateDoc',
      path: 'users/user-123/vehicles/preferences',
      data: {
        fcmToken: 'abc123',
        updatedAt: 'SERVER_TS',
      },
    });
  });

  it('falls back to user-scoped vehicle reads during dual-write migration', async () => {
    const { helpers } = createGarageScopeHelpers({
      orgDocData: { garageStorageMode: 'dual_write' },
      vehicleDocExists: false,
    });
    const service = createFirestoreService({ db: {}, auth, helpers });

    const vehicle = await service.getVehicle('VIN001');

    expect(vehicle).toEqual({
      vin: 'VIN001',
      make: 'Fallback User Vehicle',
    });
  });
});
