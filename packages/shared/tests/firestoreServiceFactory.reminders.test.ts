import { beforeEach, describe, expect, it } from 'vitest';

import { createFirestoreService } from '../src/firestoreServiceFactory.js';

function createMockFirestoreHelpers() {
  const writes: Array<Record<string, unknown>> = [];

  const collection = (_db: unknown, path: string) => ({
    __kind: 'collection',
    path,
  });
  const doc = (_db: unknown, path: string) => ({ __kind: 'doc', path });

  const addDoc = async (
    collectionRef: { path: string },
    data: Record<string, unknown>
  ) => {
    const id = `doc-${writes.length + 1}`;
    writes.push({ op: 'addDoc', path: `${collectionRef.path}/${id}`, data });
    return { id };
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

  const setDoc = async (
    docRef: { path: string },
    data: Record<string, unknown>
  ) => {
    writes.push({ op: 'setDoc', path: docRef.path, data });
  };

  const getDocs = async () => ({ docs: [] });

  const getDoc = async () => ({
    exists: () => false,
    data: () => null,
  });

  const serverTimestamp = () => 'SERVER_TS';

  return {
    writes,
    helpers: {
      collection,
      doc,
      setDoc,
      getDocs,
      getDoc,
      addDoc,
      updateDoc,
      deleteDoc,
      serverTimestamp,
    },
  };
}

describe('createFirestoreService reminder lifecycle', () => {
  let writes: Array<Record<string, unknown>>;
  let service: ReturnType<typeof createFirestoreService>;

  beforeEach(() => {
    const { writes: capturedWrites, helpers } = createMockFirestoreHelpers();
    writes = capturedWrites;
    const auth = { currentUser: { uid: 'user-123' } };
    service = createFirestoreService({ db: {}, auth, helpers });
  });

  it('adds a reminder under the vehicle reminder collection', async () => {
    const created = await service.addReminder('VIN001', {
      title: 'Oil Change',
      serviceType: 'oil_change',
      status: 'active',
    });

    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Oil Change');
    expect(writes[0].op).toBe('addDoc');
    expect(writes[0].path).toMatch('users/user-123/vehicles/VIN001/reminders/');
    expect((writes[0].data as Record<string, unknown>).createdAt).toBe(
      'SERVER_TS'
    );
    expect((writes[0].data as Record<string, unknown>).updatedAt).toBe(
      'SERVER_TS'
    );
  });

  it('completes a reminder with completion status and timestamp', async () => {
    await service.completeReminder('VIN001', 'rem-1');

    expect(writes[0]).toEqual({
      op: 'updateDoc',
      path: 'users/user-123/vehicles/VIN001/reminders/rem-1',
      data: {
        status: 'completed',
        completedAt: 'SERVER_TS',
        updatedAt: 'SERVER_TS',
      },
    });
  });

  it('snoozes a reminder with target date', async () => {
    await service.snoozeReminder('VIN001', 'rem-2', '2026-03-27');

    expect(writes[0]).toEqual({
      op: 'updateDoc',
      path: 'users/user-123/vehicles/VIN001/reminders/rem-2',
      data: {
        status: 'snoozed',
        snoozedUntil: '2026-03-27',
        updatedAt: 'SERVER_TS',
      },
    });
  });

  it('dismisses and reopens reminders', async () => {
    await service.dismissReminder('VIN001', 'rem-3');
    await service.reopenReminder('VIN001', 'rem-3');

    expect(writes[0]).toEqual({
      op: 'updateDoc',
      path: 'users/user-123/vehicles/VIN001/reminders/rem-3',
      data: {
        status: 'dismissed',
        dismissedAt: 'SERVER_TS',
        updatedAt: 'SERVER_TS',
      },
    });

    expect(writes[1]).toEqual({
      op: 'updateDoc',
      path: 'users/user-123/vehicles/VIN001/reminders/rem-3',
      data: {
        status: 'active',
        updatedAt: 'SERVER_TS',
      },
    });
  });

  it('throws when auth is missing', async () => {
    const { helpers } = createMockFirestoreHelpers();
    const unauthService = createFirestoreService({
      db: {},
      auth: { currentUser: null },
      helpers,
    });

    await expect(
      unauthService.addReminder('VIN001', { title: 'x' })
    ).rejects.toThrow('Not authenticated');
  });

  it('returns reminders mapped from Firestore documents', async () => {
    const { helpers } = createMockFirestoreHelpers();
    const mockDocs = [
      { id: 'rem-a', data: () => ({ title: 'Oil Change', status: 'active' }) },
      {
        id: 'rem-b',
        data: () => ({ title: 'Tire Rotation', status: 'snoozed' }),
      },
    ];
    (helpers as Record<string, unknown>).getDocs = async () => ({
      docs: mockDocs,
    });
    const svc = createFirestoreService({
      db: {},
      auth: { currentUser: { uid: 'user-123' } },
      helpers,
    });

    const reminders = await svc.getReminders('VIN001');

    expect(reminders).toHaveLength(2);
    expect(reminders[0]).toEqual({
      id: 'rem-a',
      title: 'Oil Change',
      status: 'active',
    });
    expect(reminders[1]).toEqual({
      id: 'rem-b',
      title: 'Tire Rotation',
      status: 'snoozed',
    });
  });

  it('returns empty array for getReminders when unauthenticated', async () => {
    const { helpers } = createMockFirestoreHelpers();
    const unauthService = createFirestoreService({
      db: {},
      auth: { currentUser: null },
      helpers,
    });

    const reminders = await unauthService.getReminders('VIN001');

    expect(reminders).toEqual([]);
  });
});
