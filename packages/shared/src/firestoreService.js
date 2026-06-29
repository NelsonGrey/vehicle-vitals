import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Helper to build base path for user's vehicles
function vehiclesCollectionRef(userId) {
  return collection(db, `users/${userId}/vehicles`);
}

export async function addOrUpdateVehicle(vehicle) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  const ref = doc(db, `users/${userId}/vehicles/${vehicle.vin}`);
  await setDoc(ref, { ...vehicle, updatedAt: serverTimestamp() });
  return vehicle;
}

export async function getVehicles(options = {}) {
  const userId = auth.currentUser?.uid;
  const isPaginated =
    options.paginate === true || options.pageSize != null;
  if (!userId) {
    return isPaginated
      ? { data: [], lastDoc: null, hasMore: false }
      : [];
  }

  const ref = vehiclesCollectionRef(userId);
  let q = ref;

  if (isPaginated) {
    const { pageSize = 50, startAfter: startAfterDoc } = options;
    const constraints = [orderBy('updatedAt', 'desc'), limit(pageSize)];
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    q = query(ref, ...constraints);
  }

  const snap = await getDocs(q);
  const data = snap.docs.map((d) => {
    const docData = d.data();
    return { ...docData, vin: docData.vin || d.id };
  });

  if (isPaginated) {
    const pageSize = options.pageSize ?? 50;
    return {
      data,
      lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === pageSize,
    };
  }

  return data;
}

export async function getVehicle(vin) {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;
  const ref = doc(db, `users/${userId}/vehicles/${vin}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function addMaintenanceEntry(vin, entry) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  const collRef = collection(db, `users/${userId}/vehicles/${vin}/maintenance`);
  const docRef = await addDoc(collRef, { ...entry, createdAt: serverTimestamp() });
  return { id: docRef.id, ...entry };
}

export async function getMaintenanceEntries(vin, options = {}) {
  const userId = auth.currentUser?.uid;
  const isPaginated =
    options.paginate === true || options.pageSize != null;
  if (!userId) {
    return isPaginated
      ? { data: [], lastDoc: null, hasMore: false }
      : [];
  }

  const collRef = collection(db, `users/${userId}/vehicles/${vin}/maintenance`);
  let q = collRef;

  if (isPaginated) {
    const { pageSize = 50, startAfter: startAfterDoc } = options;
    const constraints = [orderBy('date', 'desc'), limit(pageSize)];
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    q = query(collRef, ...constraints);
  }

  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (isPaginated) {
    const pageSize = options.pageSize ?? 50;
    return {
      data,
      lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === pageSize,
    };
  }

  return data;
}

export async function getMaintenanceEntry(vin, entryId) {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;
  const ref = doc(db, `users/${userId}/vehicles/${vin}/maintenance/${entryId}`);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateMaintenanceEntry(vin, entryId, updates) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  const ref = doc(db, `users/${userId}/vehicles/${vin}/maintenance/${entryId}`);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteMaintenanceEntry(vin, entryId) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  const ref = doc(db, `users/${userId}/vehicles/${vin}/maintenance/${entryId}`);
  await deleteDoc(ref);
}

export async function updateVehicle(vin, updates) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  const ref = doc(db, `users/${userId}/vehicles/${vin}`);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteVehicle(vin) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  const ref = doc(db, `users/${userId}/vehicles/${vin}`);
  await deleteDoc(ref);
}
