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
  } = helpers;

  const readDocs = getDocsFromServer || getDocs;
  const readDoc = getDocFromServer || getDoc;

  // Small utility to stamp created/updated times consistently
  function withTimestamps(data, { create = false } = {}) {
    const stamp = { updatedAt: serverTimestamp() };
    if (create) stamp.createdAt = serverTimestamp();
    return { ...data, ...stamp };
  }

  function vehiclesCollectionRef(userId) {
    return collection(db, `users/${userId}/vehicles`);
  }

  async function addOrUpdateVehicle(vehicle) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${userId}/vehicles/${vehicle.vin}`);
    let portfolio;
    const current = await readDoc(ref);
    if (current && typeof current.exists === 'function' && current.exists()) {
      const existing = current.data() || {};
      portfolio = existing.documentPortfolio || null;
    }

    await setDoc(
      ref,
      withTimestamps({
        ...vehicle,
        documentPortfolio: portfolio || createStandardVehiclePortfolio(),
      })
    );
    return vehicle;
  }

  function mapVehicleDocs(docs) {
    return docs.map(d => {
      const data = d.data();
      return { ...data, vin: data.vin || d.id };
    });
  }

  async function getVehicles(options = {}) {
    const userId = auth.currentUser?.uid;
    const isPaginated =
      options.paginate === true || options.pageSize != null;
    if (!userId) {
      return isPaginated
        ? { data: [], lastDoc: null, hasMore: false }
        : [];
    }

    const ref = vehiclesCollectionRef(userId);
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
    const userId = auth.currentUser?.uid;
    if (!userId) return null;
    const ref = doc(db, `users/${userId}/vehicles/${vin}`);
    const snap = await readDoc(ref);
    if (snap && typeof snap.exists === 'function') {
      return snap.exists() ? snap.data() : null;
    } else {
      // Assume snap is the document data directly (for test environment)
      return snap || null;
    }
  }

  async function addMaintenanceEntry(vin, entry) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const collRef = collection(
      db,
      `users/${userId}/vehicles/${vin}/maintenance`
    );
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
    const userId = auth.currentUser?.uid;
    const isPaginated =
      options.paginate === true || options.pageSize != null;
    if (!userId) {
      return isPaginated
        ? { data: [], lastDoc: null, hasMore: false }
        : [];
    }

    const collRef = collection(
      db,
      `users/${userId}/vehicles/${vin}/maintenance`
    );
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
    const userId = auth.currentUser?.uid;
    if (!userId) return null;
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/maintenance/${entryId}`
    );
    const snap = await readDoc(ref);
    if (snap && typeof snap.exists === 'function') {
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
    return snap || null;
  }

  async function updateMaintenanceEntry(vin, entryId, updates) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/maintenance/${entryId}`
    );
    await updateDoc(ref, withTimestamps(updates));
  }

  async function deleteMaintenanceEntry(vin, entryId) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/maintenance/${entryId}`
    );
    await deleteDoc(ref);
  }

  async function updateVehicle(vin, updates) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${userId}/vehicles/${vin}`);
    await updateDoc(ref, withTimestamps(updates));
  }

  // Reminder persistence path: `users/${userId}/vehicles/${vin}/reminders/*`
  async function addReminder(vin, reminder) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const collRef = collection(db, `users/${userId}/vehicles/${vin}/reminders`);
    const docRef = await addDoc(
      collRef,
      withTimestamps(reminder, { create: true })
    );
    return { id: docRef.id, ...reminder };
  }

  async function getReminders(vin) {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];
    const collRef = collection(db, `users/${userId}/vehicles/${vin}/reminders`);
    const snap = await readDocs(collRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function completeReminder(vin, reminderId) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/reminders/${reminderId}`
    );
    await updateDoc(
      ref,
      withTimestamps({
        status: 'completed',
        completedAt: serverTimestamp(),
      })
    );
  }

  async function snoozeReminder(vin, reminderId, untilDateISO) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/reminders/${reminderId}`
    );
    await updateDoc(
      ref,
      withTimestamps({
        status: 'snoozed',
        snoozedUntil: untilDateISO,
      })
    );
  }

  async function dismissReminder(vin, reminderId) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/reminders/${reminderId}`
    );
    await updateDoc(
      ref,
      withTimestamps({
        status: 'dismissed',
        dismissedAt: serverTimestamp(),
      })
    );
  }

  async function reopenReminder(vin, reminderId) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/reminders/${reminderId}`
    );
    await updateDoc(
      ref,
      withTimestamps({
        status: 'active',
      })
    );
  }

  async function markReminderDelivery(vin, reminderId, delivery) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/reminders/${reminderId}`
    );
    await updateDoc(ref, withTimestamps(delivery));
  }

  async function deleteVehicle(vin) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${userId}/vehicles/${vin}`);
    await deleteDoc(ref);
  }

  async function getAttachmentAnalysis(vin, storagePath) {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;
    if (!vin || !storagePath) return null;

    const analysisId = encodeURIComponent(storagePath);
    const ref = doc(
      db,
      `users/${userId}/vehicles/${vin}/attachmentAnalyses/${analysisId}`
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
    // reminder methods
    addReminder,
    getReminders,
    completeReminder,
    snoozeReminder,
    dismissReminder,
    reopenReminder,
    markReminderDelivery,
  };
}
