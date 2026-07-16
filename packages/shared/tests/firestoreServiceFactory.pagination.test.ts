import { beforeEach, describe, expect, it } from 'vitest';

import { createFirestoreService } from '../src/firestoreServiceFactory.js';

function createPaginatedMockHelpers() {
  const vehicleDocs = [
    {
      id: 'VIN001',
      data: () => ({
        vin: 'VIN001',
        make: 'Toyota',
        model: 'Camry',
        updatedAt: '2026-01-01',
      }),
    },
    {
      id: 'VIN002',
      data: () => ({
        vin: 'VIN002',
        make: 'Honda',
        model: 'Civic',
        updatedAt: '2026-01-02',
      }),
    },
  ];

  const maintenanceDocs = [
    {
      id: 'maint-1',
      data: () => ({ date: '2026-02-01', serviceType: 'Oil Change' }),
    },
  ];

  const collection = (_db: unknown, path: string) => ({
    __kind: 'collection',
    path,
  });
  const doc = (_db: unknown, path: string) => ({ __kind: 'doc', path });

  let activeConstraints: Array<{ type?: string; count?: number }> = [];

  const query = (
    ref: { path: string },
    ...constraints: Array<{ type?: string; count?: number }>
  ) => {
    activeConstraints = constraints;
    return {
      __kind: 'query',
      path: ref.path,
      constraints,
    };
  };

  const orderBy = (field: string, direction: string) => ({
    type: 'orderBy',
    field,
    direction,
  });
  const limit = (count: number) => ({ type: 'limit', count });
  const startAfter = (cursor: unknown) => ({ type: 'startAfter', cursor });

  const getDocs = async (ref: { path: string; constraints?: unknown[] }) => {
    const constraints =
      (ref.constraints as Array<{ type?: string; count?: number }> | undefined) ||
      activeConstraints;
    const limitConstraint = constraints.find(item => item.type === 'limit');
    const pageSize = limitConstraint?.count;

    if (ref.path.endsWith('/maintenance')) {
      const docs = pageSize
        ? maintenanceDocs.slice(0, pageSize)
        : maintenanceDocs;
      return { docs };
    }

    const docs = pageSize ? vehicleDocs.slice(0, pageSize) : vehicleDocs;
    return { docs };
  };

  const getDoc = async () => ({
    exists: () => false,
    data: () => null,
  });

  return {
    collection,
    doc,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    getDoc,
    setDoc: async () => undefined,
    addDoc: async () => ({ id: 'doc-1' }),
    updateDoc: async () => undefined,
    deleteDoc: async () => undefined,
    serverTimestamp: () => 'SERVER_TS',
  };
}

describe('createFirestoreService pagination', () => {
  const auth = {
    currentUser: { uid: 'user-123' },
  };

  let service: ReturnType<typeof createFirestoreService>;

  beforeEach(() => {
    service = createFirestoreService({
      db: {},
      auth,
      helpers: createPaginatedMockHelpers(),
    });
  });

  it('returns an array when getVehicles is called without pagination options', async () => {
    const result = await service.getVehicles();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('returns paginated vehicle results when pageSize is provided', async () => {
    const result = await service.getVehicles({ pageSize: 1 });
    expect(Array.isArray(result)).toBe(false);
    if (Array.isArray(result)) {
      return;
    }

    expect(result.data).toHaveLength(1);
    expect(result.data[0].vin).toBe('VIN001');
    expect(result.lastDoc).toBeTruthy();
    expect(result.hasMore).toBe(true);
  });

  it('returns paginated maintenance results when pageSize is provided', async () => {
    const result = await service.getMaintenanceEntries('VIN001', {
      pageSize: 25,
    });
    expect(Array.isArray(result)).toBe(false);
    if (Array.isArray(result)) {
      return;
    }

    expect(result.data).toHaveLength(1);
    expect(result.data[0].serviceType).toBe('Oil Change');
    expect(result.hasMore).toBe(false);
  });
});
