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
  } = helpers;

  const readDocs = getDocsFromServer || getDocs;
  const readDoc = getDocFromServer || getDoc;

  // Small utility to stamp created/updated times consistently
  function withTimestamps(data, { create = false } = {}) {
    const stamp = { updatedAt: serverTimestamp() };
    if (create) stamp.createdAt = serverTimestamp();
    return { ...data, ...stamp };
  }

  function buildEmailDataKey(email) {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();
    if (!normalized) return null;
    return `email__${encodeURIComponent(normalized)}`;
  }

  function getUserIds() {
    const uid = auth.currentUser?.uid;
    const emailDataKey = buildEmailDataKey(auth.currentUser?.email);
    return {
      legacyUserId: uid,
      dataUserId: emailDataKey || uid,
    };
  }

  function vehiclesCollectionRef(userId) {
    return collection(db, `users/${userId}/vehicles`);
  }

  async function addOrUpdateVehicle(vehicle) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${dataUserId}/vehicles/${vehicle.vin}`);
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

  async function getVehicles() {
    const { dataUserId, legacyUserId } = getUserIds();
    if (!dataUserId) return [];

    const primarySnap = await readDocs(vehiclesCollectionRef(dataUserId));
    const primaryVehicles = primarySnap.docs.map(d => d.data());

    if (!legacyUserId || legacyUserId === dataUserId) {
      return primaryVehicles;
    }

    const legacySnap = await readDocs(vehiclesCollectionRef(legacyUserId));
    const mergedByVin = new Map();

    for (const vehicle of legacySnap.docs.map(d => d.data())) {
      const vin = vehicle?.vin || '';
      if (vin) mergedByVin.set(vin, vehicle);
    }

    for (const vehicle of primaryVehicles) {
      const vin = vehicle?.vin || '';
      if (vin) mergedByVin.set(vin, vehicle);
    }

    // Backfill any legacy-only vehicles into the email-linked path.
    for (const [vin, vehicle] of mergedByVin.entries()) {
      const inPrimary = primaryVehicles.some(v => v?.vin === vin);
      if (!inPrimary) {
        const targetRef = doc(db, `users/${dataUserId}/vehicles/${vin}`);
        await setDoc(targetRef, withTimestamps(vehicle), { merge: true });
      }
    }

    return Array.from(mergedByVin.values());
  }

  async function getVehicle(vin) {
    const { dataUserId, legacyUserId } = getUserIds();
    if (!dataUserId) return null;
    const ref = doc(db, `users/${dataUserId}/vehicles/${vin}`);
    const snap = await readDoc(ref);
    if (snap && typeof snap.exists === 'function') {
      if (snap.exists()) return snap.data();
    }

    if (legacyUserId && legacyUserId !== dataUserId) {
      const legacyRef = doc(db, `users/${legacyUserId}/vehicles/${vin}`);
      const legacySnap = await readDoc(legacyRef);
      if (legacySnap && typeof legacySnap.exists === 'function') {
        if (legacySnap.exists()) {
          const data = legacySnap.data();
          await setDoc(ref, withTimestamps(data), { merge: true });
          return data;
        }
      } else if (legacySnap) {
        await setDoc(ref, withTimestamps(legacySnap), { merge: true });
        return legacySnap;
      }
    }

    if (snap && typeof snap.exists === 'function') {
      return null;
    } else {
      // Assume snap is the document data directly (for test environment)
      return snap || null;
    }
  }

  async function addMaintenanceEntry(vin, entry) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const collRef = collection(
      db,
      `users/${dataUserId}/vehicles/${vin}/maintenance`
    );
    const docRef = await addDoc(
      collRef,
      withTimestamps(entry, { create: true })
    );
    return { id: docRef.id, ...entry };
  }

  async function getMaintenanceEntries(vin) {
    const { dataUserId, legacyUserId } = getUserIds();
    if (!dataUserId) return [];
    const collRef = collection(
      db,
      `users/${dataUserId}/vehicles/${vin}/maintenance`
    );
    const snap = await readDocs(collRef);
    const primaryEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!legacyUserId || legacyUserId === dataUserId) {
      return primaryEntries;
    }

    const legacyCollRef = collection(
      db,
      `users/${legacyUserId}/vehicles/${vin}/maintenance`
    );
    const legacySnap = await readDocs(legacyCollRef);
    if (!legacySnap.docs.length) return primaryEntries;

    const mergedById = new Map();
    for (const entry of legacySnap.docs.map(d => ({ id: d.id, ...d.data() }))) {
      mergedById.set(entry.id, entry);
    }
    for (const entry of primaryEntries) {
      mergedById.set(entry.id, entry);
    }

    return Array.from(mergedById.values());
  }

  async function getMaintenanceEntry(vin, entryId) {
    const { dataUserId, legacyUserId } = getUserIds();
    if (!dataUserId) return null;
    const ref = doc(
      db,
      `users/${dataUserId}/vehicles/${vin}/maintenance/${entryId}`
    );
    const snap = await readDoc(ref);
    if (snap && typeof snap.exists === 'function') {
      if (snap.exists()) return { id: snap.id, ...snap.data() };
      if (legacyUserId && legacyUserId !== dataUserId) {
        const legacyRef = doc(
          db,
          `users/${legacyUserId}/vehicles/${vin}/maintenance/${entryId}`
        );
        const legacySnap = await readDoc(legacyRef);
        if (legacySnap && typeof legacySnap.exists === 'function') {
          return legacySnap.exists()
            ? { id: legacySnap.id, ...legacySnap.data() }
            : null;
        }
      }
      return null;
    }
    return snap || null;
  }

  async function updateMaintenanceEntry(vin, entryId, updates) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${dataUserId}/vehicles/${vin}/maintenance/${entryId}`
    );
    await updateDoc(ref, withTimestamps(updates));
  }

  async function deleteMaintenanceEntry(vin, entryId) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${dataUserId}/vehicles/${vin}/maintenance/${entryId}`
    );
    await deleteDoc(ref);
  }

  async function updateVehicle(vin, updates) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${dataUserId}/vehicles/${vin}`);
    await updateDoc(ref, withTimestamps(updates));
  }

  // Reminder persistence path: `users/${userId}/vehicles/${vin}/reminders/*`
  async function addReminder(vin, reminder) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const collRef = collection(
      db,
      `users/${dataUserId}/vehicles/${vin}/reminders`
    );
    const docRef = await addDoc(
      collRef,
      withTimestamps(reminder, { create: true })
    );
    return { id: docRef.id, ...reminder };
  }

  async function getReminders(vin) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) return [];
    const collRef = collection(
      db,
      `users/${dataUserId}/vehicles/${vin}/reminders`
    );
    const snap = await readDocs(collRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function completeReminder(vin, reminderId) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${dataUserId}/vehicles/${vin}/reminders/${reminderId}`
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
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${dataUserId}/vehicles/${vin}/reminders/${reminderId}`
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
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${dataUserId}/vehicles/${vin}/reminders/${reminderId}`
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
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(
      db,
      `users/${dataUserId}/vehicles/${vin}/reminders/${reminderId}`
    );
    await updateDoc(
      ref,
      withTimestamps({
        status: 'active',
      })
    );
  }

  async function deleteVehicle(vin) {
    const { dataUserId } = getUserIds();
    if (!dataUserId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${dataUserId}/vehicles/${vin}`);
    await deleteDoc(ref);
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
    // reminder methods
    addReminder,
    getReminders,
    completeReminder,
    snoozeReminder,
    dismissReminder,
    reopenReminder,
  };
}
