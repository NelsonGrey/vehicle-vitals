import { db, auth } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

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

export async function getVehicles() {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];
  const ref = vehiclesCollectionRef(userId);
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data());
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

export async function getMaintenanceEntries(vin) {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];
  const collRef = collection(db, `users/${userId}/vehicles/${vin}/maintenance`);
  const snap = await getDocs(collRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
