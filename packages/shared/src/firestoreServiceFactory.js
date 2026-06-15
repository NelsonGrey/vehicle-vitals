// shared/firestoreServiceFactory.js
// Factory that creates service functions given platform-specific db/auth and firestore helpers.
import { createStandardVehiclePortfolio } from './vehiclePortfolio.js';

export function createFirestoreService({ db, auth, helpers }) {
  const {
    collection,
    doc,
    setDoc,
    getDocs,
    getDoc,
    getDocsFromServer,
    getDocFromServer,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    startAfter,
    where,
  } = helpers;

  const readDocs = getDocsFromServer || getDocs;
  const readDoc = getDocFromServer || getDoc;

  function withTimestamps(data, { create = false } = {}) {
    const stamp = { updatedAt: serverTimestamp() };
    if (create) stamp.createdAt = serverTimestamp();
    return { ...data, ...stamp };
  }

  function isPreferencesVehicle(vin) {
    return String(vin || '').trim().toLowerCase() === 'preferences';
  }

  function vehiclesCollectionRef(userId) {
    return collection(db, `users/${userId}/vehicles`);
  }

  function orgVehiclesCollectionRef(orgId) {
    return collection(db, `orgs/${orgId}/vehicles`);
  }

  async function resolveGarageContext() {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return {
        userId: null,
        orgId: null,
        orgType: null,
        garageStorageMode: 'user_scoped',
      };
    }

    if (!where) {
      return {
        userId,
        orgId: null,
        orgType: null,
        garageStorageMode: 'user_scoped',
      };
    }

    const membershipsRef = collection(db, `users/${userId}/orgMemberships`);
    const membershipQuery = query(
      membershipsRef,
      where('status', '==', 'active'),
      limit(1)
    );
    const membershipSnap = await readDocs(membershipQuery);
    const membershipDoc = membershipSnap.docs?.[0];

    if (!membershipDoc) {
      return {
        userId,
        orgId: null,
        orgType: null,
        garageStorageMode: 'user_scoped',
      };
    }

    const orgId = membershipDoc.id;
    const orgSnap = await readDoc(doc(db, `orgs/${orgId}`));
    const orgData =
      orgSnap && typeof orgSnap.exists === 'function'
        ? orgSnap.exists()
          ? orgSnap.data() || {}
          : {}
        : orgSnap || {};

    return {
      userId,
      orgId,
      orgType: orgData.type || null,
      garageStorageMode: orgData.garageStorageMode || 'user_scoped',
    };
  }

  async function resolveVehicleScope(vin) {
    const context = await resolveGarageContext();
    if (!context.userId) {
      return { ...context, scope: 'user' };
    }

    if (isPreferencesVehicle(vin)) {
      return { ...context, scope: 'user' };
    }

    if (
      context.orgId &&
      (context.garageStorageMode === 'org_scoped' ||
        context.garageStorageMode === 'dual_write')
    ) {
      return { ...context, scope: 'org' };
    }

    return { ...context, scope: 'user' };
  }

  function buildVehicleDocRef(scope, vin) {
    return scope.scope === 'org'
      ? doc(db, `orgs/${scope.orgId}/vehicles/${vin}`)
      : doc(db, `users/${scope.userId}/vehicles/${vin}`);
  }

  function buildSubcollectionRef(scope, vin, childCollection) {
    return scope.scope === 'org'
      ? collection(db, `orgs/${scope.orgId}/vehicles/${vin}/${childCollection}`)
      : collection(
          db,
          `users/${scope.userId}/vehicles/${vin}/${childCollection}`
        );
  }

  function buildSubdocumentRef(scope, vin, childCollection, childId) {
    return scope.scope === 'org'
      ? doc(db, `orgs/${scope.orgId}/vehicles/${vin}/${childCollection}/${childId}`)
      : doc(
          db,
          `users/${scope.userId}/vehicles/${vin}/${childCollection}/${childId}`
        );
  }

  async function addOrUpdateVehicle(vehicle) {
    const scope = await resolveVehicleScope(vehicle.vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildVehicleDocRef(scope, vehicle.vin);
    let portfolio;
    const current = await readDoc(ref);
    if (current && typeof current.exists === 'function' && current.exists()) {
      const existing = current.data() || {};
      portfolio = existing.documentPortfolio || null;
    }

    const payload = withTimestamps({
      ...vehicle,
      documentPortfolio: portfolio || createStandardVehiclePortfolio(),
    });

    await setDoc(ref, payload);

    if (scope.garageStorageMode === 'dual_write' && scope.orgId) {
      const userScopedRef = doc(db, `users/${scope.userId}/vehicles/${vehicle.vin}`);
      if (userScopedRef.path !== ref.path) {
        await setDoc(userScopedRef, payload);
      }
    }

    return vehicle;
  }

  function mapVehicleDocs(docs) {
    return docs.map(d => {
      const data = d.data();
      return { ...data, vin: data.vin || d.id };
    });
  }

  async function getVehicles(options = {}) {
    const scope = await resolveVehicleScope();
    const userId = scope.userId;
    const isPaginated =
      options.paginate === true || options.pageSize != null;
    if (!userId) {
      return isPaginated
        ? { data: [], lastDoc: null, hasMore: false }
        : [];
    }

    const ref =
      scope.scope === 'org' && scope.orgId
        ? orgVehiclesCollectionRef(scope.orgId)
        : vehiclesCollectionRef(userId);
    let queryRef = ref;

    if (isPaginated) {
      const { pageSize = 50, startAfter: startAfterDoc } = options;
      const constraints = [orderBy('updatedAt', 'desc'), limit(pageSize)];
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }
      queryRef = query(ref, ...constraints);
    }

    const snap = await readDocs(queryRef);
    const data = mapVehicleDocs(snap.docs);

    if (isPaginated) {
      const pageSize = options.pageSize ?? 50;
      return {
        data,
        lastDoc:
          snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore: snap.docs.length === pageSize,
      };
    }

    return data;
  }

  async function getVehicle(vin) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) return null;
    const ref = buildVehicleDocRef(scope, vin);
    const snap = await readDoc(ref);

    if (snap && typeof snap.exists === 'function') {
      if (snap.exists()) {
        return snap.data();
      }

      if (scope.garageStorageMode === 'dual_write' && scope.scope === 'org') {
        const fallbackSnap = await readDoc(
          doc(db, `users/${scope.userId}/vehicles/${vin}`)
        );
        if (fallbackSnap && typeof fallbackSnap.exists === 'function') {
          return fallbackSnap.exists() ? fallbackSnap.data() : null;
        }
        return fallbackSnap || null;
      }

      return null;
    }

    return snap || null;
  }

  async function addMaintenanceEntry(vin, entry) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const collRef = buildSubcollectionRef(scope, vin, 'maintenance');
    const docRef = await addDoc(
      collRef,
      withTimestamps(entry, { create: true })
    );
    return { id: docRef.id, ...entry };
  }

  function mapMaintenanceDocs(docs) {
    return docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getMaintenanceEntries(vin, options = {}) {
    const scope = await resolveVehicleScope(vin);
    const isPaginated =
      options.paginate === true || options.pageSize != null;
    if (!scope.userId) {
      return isPaginated
        ? { data: [], lastDoc: null, hasMore: false }
        : [];
    }

    const collRef = buildSubcollectionRef(scope, vin, 'maintenance');
    let queryRef = collRef;

    if (isPaginated) {
      const { pageSize = 50, startAfter: startAfterDoc } = options;
      const constraints = [orderBy('date', 'desc'), limit(pageSize)];
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }
      queryRef = query(collRef, ...constraints);
    }

    const snap = await readDocs(queryRef);
    const data = mapMaintenanceDocs(snap.docs);

    if (isPaginated) {
      const pageSize = options.pageSize ?? 50;
      return {
        data,
        lastDoc:
          snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore: snap.docs.length === pageSize,
      };
    }

    return data;
  }

  async function getMaintenanceEntry(vin, entryId) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) return null;
    const ref = buildSubdocumentRef(scope, vin, 'maintenance', entryId);
    const snap = await readDoc(ref);
    if (snap && typeof snap.exists === 'function') {
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
    return snap || null;
  }

  async function updateMaintenanceEntry(vin, entryId, updates) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildSubdocumentRef(scope, vin, 'maintenance', entryId);
    await updateDoc(ref, withTimestamps(updates));
  }

  async function deleteMaintenanceEntry(vin, entryId) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildSubdocumentRef(scope, vin, 'maintenance', entryId);
    await deleteDoc(ref);
  }

  async function updateVehicle(vin, updates) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildVehicleDocRef(scope, vin);
    await updateDoc(ref, withTimestamps(updates));
  }

  async function addReminder(vin, reminder) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const collRef = buildSubcollectionRef(scope, vin, 'reminders');
    const docRef = await addDoc(
      collRef,
      withTimestamps(reminder, { create: true })
    );
    return { id: docRef.id, ...reminder };
  }

  async function getReminders(vin) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) return [];
    const collRef = buildSubcollectionRef(scope, vin, 'reminders');
    const snap = await readDocs(collRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function completeReminder(vin, reminderId) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildSubdocumentRef(scope, vin, 'reminders', reminderId);
    await updateDoc(
      ref,
      withTimestamps({
        status: 'completed',
        completedAt: serverTimestamp(),
      })
    );
  }

  async function snoozeReminder(vin, reminderId, untilDateISO) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildSubdocumentRef(scope, vin, 'reminders', reminderId);
    await updateDoc(
      ref,
      withTimestamps({
        status: 'snoozed',
        snoozedUntil: untilDateISO,
      })
    );
  }

  async function dismissReminder(vin, reminderId) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildSubdocumentRef(scope, vin, 'reminders', reminderId);
    await updateDoc(
      ref,
      withTimestamps({
        status: 'dismissed',
        dismissedAt: serverTimestamp(),
      })
    );
  }

  async function reopenReminder(vin, reminderId) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildSubdocumentRef(scope, vin, 'reminders', reminderId);
    await updateDoc(
      ref,
      withTimestamps({
        status: 'active',
      })
    );
  }

  async function markReminderDelivery(vin, reminderId, delivery) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildSubdocumentRef(scope, vin, 'reminders', reminderId);
    await updateDoc(ref, withTimestamps(delivery));
  }

  async function deleteVehicle(vin) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) throw new Error('Not authenticated');
    const ref = buildVehicleDocRef(scope, vin);
    await deleteDoc(ref);
  }

  async function getAttachmentAnalysis(vin, storagePath) {
    const scope = await resolveVehicleScope(vin);
    if (!scope.userId) return null;
    if (!vin || !storagePath) return null;

    const analysisId = encodeURIComponent(storagePath);
    const ref = buildSubdocumentRef(
      scope,
      vin,
      'attachmentAnalyses',
      analysisId
    );
    const snap = await readDoc(ref);

    if (snap && typeof snap.exists === 'function') {
      return snap.exists() ? snap.data() : null;
    }

    return snap || null;
  }

  async function getAttachmentAnalyses(vin, storagePaths = []) {
    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return [];
    }

    const analyses = await Promise.all(
      storagePaths.map(path => getAttachmentAnalysis(vin, path))
    );

    return analyses.filter(Boolean);
  }

  return {
    resolveGarageContext,
    addOrUpdateVehicle,
    getVehicles,
    getVehicle,
    addMaintenanceEntry,
    getMaintenanceEntries,
    getMaintenanceEntry,
    updateMaintenanceEntry,
    deleteMaintenanceEntry,
    updateVehicle,
    deleteVehicle,
    getAttachmentAnalysis,
    getAttachmentAnalyses,
    addReminder,
    getReminders,
    completeReminder,
    snoozeReminder,
    dismissReminder,
    reopenReminder,
    markReminderDelivery,
  };
}
