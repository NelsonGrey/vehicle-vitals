import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../models/maintenance.dart';
import '../models/vehicle.dart';

Map<String, dynamic> _portfolioItem({
  required String id,
  required String title,
  required String description,
  required bool required,
}) {
  return {
    'id': id,
    'title': title,
    'description': description,
    'required': required,
    'status': 'missing',
    'files': <Map<String, dynamic>>[],
    'notes': '',
    'updatedAt': null,
  };
}

Map<String, dynamic> _createStandardVehiclePortfolio() {
  return {
    'schemaVersion': 1,
    'generatedAt': DateTime.now().toUtc().toIso8601String(),
    'categories': [
      {
        'key': 'ownership',
        'title': 'Ownership and Legal',
        'items': [
          _portfolioItem(
            id: 'title',
            title: 'Vehicle Title',
            description: 'Proof of legal ownership and lien status.',
            required: true,
          ),
          _portfolioItem(
            id: 'registration',
            title: 'Registration Card',
            description: 'Current state/provincial registration document.',
            required: true,
          ),
          _portfolioItem(
            id: 'insurance',
            title: 'Insurance Card and Policy Summary',
            description: 'Current proof of insurance and policy details.',
            required: true,
          ),
          _portfolioItem(
            id: 'bill_of_sale',
            title: 'Bill of Sale / Purchase Agreement',
            description: 'Purchase agreement from dealership or private party.',
            required: true,
          ),
        ],
      },
      {
        'key': 'finance',
        'title': 'Finance and Tax',
        'items': [
          _portfolioItem(
            id: 'loan_or_lease',
            title: 'Loan / Lease Contract',
            description: 'Original financing or lease paperwork.',
            required: false,
          ),
          _portfolioItem(
            id: 'payment_history',
            title: 'Payment History Statements',
            description: 'Monthly statements for financing records.',
            required: false,
          ),
          _portfolioItem(
            id: 'tax_receipts',
            title: 'Tax and Fee Receipts',
            description: 'Sales tax, registration fees, and related receipts.',
            required: false,
          ),
        ],
      },
      {
        'key': 'maintenance',
        'title': 'Maintenance and Repair',
        'items': [
          _portfolioItem(
            id: 'service_history',
            title: 'Service Invoices',
            description:
                'Oil changes, inspections, and routine maintenance receipts.',
            required: true,
          ),
          _portfolioItem(
            id: 'repair_invoices',
            title: 'Repair Invoices',
            description: 'Parts and labor records for all repairs.',
            required: true,
          ),
          _portfolioItem(
            id: 'warranty_records',
            title: 'Warranty and Recall Records',
            description:
                'Warranty claims, recall completion receipts, and campaign docs.',
            required: true,
          ),
          _portfolioItem(
            id: 'inspection_reports',
            title: 'Inspection and Emissions Reports',
            description: 'State inspection, emissions, and safety checks.',
            required: false,
          ),
        ],
      },
      {
        'key': 'reference',
        'title': 'Reference and Evidence',
        'items': [
          _portfolioItem(
            id: 'owners_manual',
            title: 'Owner Manual and Quick Guides',
            description:
                'Digital owner manual, quick start, and feature guides.',
            required: false,
          ),
          _portfolioItem(
            id: 'accident_reports',
            title: 'Accident / Incident Reports',
            description: 'Police reports, claim packets, and repair estimates.',
            required: false,
          ),
          _portfolioItem(
            id: 'photo_log',
            title: 'Photo Log',
            description:
                'Condition photos for resale, claims, and maintenance evidence.',
            required: false,
          ),
          _portfolioItem(
            id: 'modifications',
            title: 'Modification and Accessory Receipts',
            description: 'Aftermarket installation records and warranties.',
            required: false,
          ),
        ],
      },
    ],
  };
}

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

  CollectionReference<Map<String, dynamic>> _remindersCollection(String vin) =>
      _vehiclesCollection.doc(vin).collection('reminders');

  // Get all vehicles for current user
  Future<List<Vehicle>> getVehicles() async {
    final snapshot = await _vehiclesCollection.get();
    return snapshot.docs.map((doc) => Vehicle.fromMap(doc.data())).toList();
  }

  // Add or update a vehicle
  Future<void> addOrUpdateVehicle(Vehicle vehicle) async {
    final docRef = _vehiclesCollection.doc(vehicle.vin);
    final now = FieldValue.serverTimestamp();
    final currentDoc = await docRef.get();
    final existingData = currentDoc.data();
    final existingPortfolio = existingData?['documentPortfolio'];

    await docRef.set({
      ...vehicle.toMap(),
      'vin': vehicle.vin,
      'documentPortfolio':
          existingPortfolio ?? _createStandardVehiclePortfolio(),
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

  // Add reminder entry
  Future<Map<String, dynamic>> addReminder(
    String vin,
    Map<String, dynamic> reminder,
  ) async {
    final now = FieldValue.serverTimestamp();
    final docRef = _remindersCollection(vin).doc();
    await docRef.set({
      ...reminder,
      'createdAt': now,
      'updatedAt': now,
    }, SetOptions(merge: true));

    return {'id': docRef.id, ...reminder};
  }

  // Get reminders for a vehicle
  Future<List<Map<String, dynamic>>> getReminders(String vin) async {
    final snapshot = await _remindersCollection(vin).get();
    return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
  }

  Future<void> completeReminder(String vin, String reminderId) async {
    await _remindersCollection(vin).doc(reminderId).set({
      'status': 'completed',
      'completedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> snoozeReminder(
    String vin,
    String reminderId,
    String untilDateISO,
  ) async {
    await _remindersCollection(vin).doc(reminderId).set({
      'status': 'snoozed',
      'snoozedUntil': untilDateISO,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> dismissReminder(String vin, String reminderId) async {
    await _remindersCollection(vin).doc(reminderId).set({
      'status': 'dismissed',
      'dismissedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> reopenReminder(String vin, String reminderId) async {
    await _remindersCollection(vin).doc(reminderId).set({
      'status': 'active',
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
