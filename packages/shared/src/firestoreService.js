import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
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
  if (!userId) return [];
  const { pageSize = 50, startAfter: startAfterDoc } = options;
  
  let q = vehiclesCollectionRef(userId);
  
  if (pageSize) {
    q = query(q, orderBy('updatedAt', 'desc'), limit(pageSize));
  }
  
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }
  
  const snap = await getDocs(q);
  return {
    data: snap.docs.map((d) => d.data()),
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === pageSize,
  };
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
  if (!userId) return [];
  const { pageSize = 50, startAfter: startAfterDoc } = options;
  
  let collRef = collection(db, `users/${userId}/vehicles/${vin}/maintenance`);
  
  if (pageSize) {
    collRef = query(collRef, orderBy('date', 'desc'), limit(pageSize));
  }
  
  if (startAfterDoc) {
    collRef = query(collRef, startAfter(startAfterDoc));
  }
  
  const snap = await getDocs(collRef);
  return {
    data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === pageSize,
  };
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
