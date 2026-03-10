import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../models/maintenance.dart';
import '../models/vehicle.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String get _userId {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Not authenticated');
    return user.uid;
  }

  CollectionReference<Map<String, dynamic>> get _vehiclesCollection =>
      _db.collection('users').doc(_userId).collection('vehicles');

  CollectionReference<Map<String, dynamic>> _maintenanceCollection(
    String vin,
  ) => _vehiclesCollection.doc(vin).collection('maintenance');

  // Get all vehicles for current user
  Future<List<Vehicle>> getVehicles() async {
    final snapshot = await _vehiclesCollection.get();
    return snapshot.docs.map((doc) => Vehicle.fromMap(doc.data())).toList();
  }

  // Add or update a vehicle
  Future<void> addOrUpdateVehicle(Vehicle vehicle) async {
    final docRef = _vehiclesCollection.doc(vehicle.vin);
    final now = FieldValue.serverTimestamp();
    await docRef.set({
      ...vehicle.toMap(),
      'vin': vehicle.vin,
      'updatedAt': now,
      'createdAt': now,
    }, SetOptions(merge: true));
  }

  // Delete a vehicle
  Future<void> deleteVehicle(String vin) async {
    await _vehiclesCollection.doc(vin).delete();
  }

  // Get a specific vehicle by VIN
  Future<Vehicle?> getVehicle(String vin) async {
    final snapshot = await _vehiclesCollection.doc(vin).get();
    if (!snapshot.exists || snapshot.data() == null) return null;
    return Vehicle.fromMap(snapshot.data()!);
  }

  // Stream vehicles for real-time updates
  Stream<List<Vehicle>> getVehiclesStream() {
    return _vehiclesCollection.snapshots().map(
      (snapshot) =>
          snapshot.docs.map((doc) => Vehicle.fromMap(doc.data())).toList(),
    );
  }

  // Get maintenance entries for a vehicle
  Future<List<Maintenance>> getMaintenanceEntries(String vin) async {
    final snapshot = await _maintenanceCollection(
      vin,
    ).orderBy('date', descending: true).get();
    return snapshot.docs
        .map((doc) => Maintenance.fromMap(doc.data(), doc.id))
        .toList();
  }

  // Add maintenance entry
  Future<void> addMaintenanceEntry(String vin, Maintenance entry) async {
    final docRef = _maintenanceCollection(vin).doc();
    final now = FieldValue.serverTimestamp();
    await docRef.set({
      ...entry.toMap(),
      'createdAt': now,
      'updatedAt': now,
      'date': Timestamp.fromDate(entry.date),
    }, SetOptions(merge: true));
  }

  // Get a specific maintenance entry
  Future<Maintenance?> getMaintenanceEntry(String vin, String entryId) async {
    final snapshot = await _maintenanceCollection(vin).doc(entryId).get();
    if (!snapshot.exists || snapshot.data() == null) return null;
    return Maintenance.fromMap(snapshot.data()!, snapshot.id);
  }

  // Update maintenance entry
  Future<void> updateMaintenanceEntry(
    String vin,
    String entryId,
    Maintenance entry,
  ) async {
    await _maintenanceCollection(vin).doc(entryId).set({
      ...entry.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
      'date': Timestamp.fromDate(entry.date),
    }, SetOptions(merge: true));
  }

  // Delete maintenance entry
  Future<void> deleteMaintenanceEntry(String vin, String entryId) async {
    await _maintenanceCollection(vin).doc(entryId).delete();
  }
}
