// shared/firestoreServiceFactory.js
// Factory that creates service functions given platform-specific db/auth and firestore helpers.
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

  function vehiclesCollectionRef(userId) {
    return collection(db, `users/${userId}/vehicles`);
  }

  async function addOrUpdateVehicle(vehicle) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${userId}/vehicles/${vehicle.vin}`);
    await setDoc(ref, withTimestamps({ ...vehicle }));
    return vehicle;
  }

  async function getVehicles() {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];
    const ref = vehiclesCollectionRef(userId);
    const snap = await readDocs(ref);
    return snap.docs.map(d => d.data());
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

  async function getMaintenanceEntries(vin) {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];
    const collRef = collection(
      db,
      `users/${userId}/vehicles/${vin}/maintenance`
    );
    const snap = await readDocs(collRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

  // --- Reminder stubs (no-op implementations for now) ---
  // Suggested path when implemented: `users/${userId}/vehicles/${vin}/reminders/*`
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

  async function deleteVehicle(vin) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');
    const ref = doc(db, `users/${userId}/vehicles/${vin}`);
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
    // reminder stubs
    addReminder,
    getReminders,
    completeReminder,
    snoozeReminder,
  };
}
