import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'garage_scope.dart';
import '../models/maintenance.dart';
import '../models/vehicle.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

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

Map<String, dynamic> _readyPortfolioItem({
  required String id,
  required String title,
  required String description,
  required bool required,
  required String fileName,
}) {
  return {
    'id': id,
    'title': title,
    'description': description,
    'required': required,
    'status': 'ready',
    'files': [
      {
        'name': fileName,
        'path': 'screenshots/demo/$fileName',
        'url': 'https://vehicle-vitals.com',
        'contentType': 'application/pdf',
        'size': 214820,
      },
    ],
    'notes': 'Verified for resale, warranty, and service reference.',
    'updatedAt': DateTime.now().toUtc().toIso8601String(),
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

Map<String, dynamic> _createDemoVehiclePortfolio() {
  return {
    'schemaVersion': 1,
    'generatedAt': DateTime.now().toUtc().toIso8601String(),
    'categories': [
      {
        'key': 'ownership',
        'title': 'Ownership and Legal',
        'items': [
          _readyPortfolioItem(
            id: 'title',
            title: 'Vehicle Title',
            description: 'Proof of legal ownership and lien status.',
            required: true,
            fileName: 'vehicle-title.pdf',
          ),
          _readyPortfolioItem(
            id: 'registration',
            title: 'Registration Card',
            description: 'Current state/provincial registration document.',
            required: true,
            fileName: 'registration-card.pdf',
          ),
          _readyPortfolioItem(
            id: 'insurance',
            title: 'Insurance Card and Policy Summary',
            description: 'Current proof of insurance and policy details.',
            required: true,
            fileName: 'insurance-summary.pdf',
          ),
        ],
      },
      {
        'key': 'maintenance',
        'title': 'Maintenance and Repair',
        'items': [
          _readyPortfolioItem(
            id: 'service_history',
            title: 'Service Invoices',
            description:
                'Oil changes, inspections, and routine maintenance receipts.',
            required: true,
            fileName: 'oil-change-invoice.pdf',
          ),
          _readyPortfolioItem(
            id: 'repair_invoices',
            title: 'Repair Invoices',
            description: 'Parts and labor records for all repairs.',
            required: true,
            fileName: 'brake-service-invoice.pdf',
          ),
          _portfolioItem(
            id: 'warranty_records',
            title: 'Warranty and Recall Records',
            description:
                'Warranty claims, recall completion receipts, and campaign docs.',
            required: true,
          ),
        ],
      },
      {
        'key': 'reference',
        'title': 'Reference and Evidence',
        'items': [
          _readyPortfolioItem(
            id: 'photo_log',
            title: 'Photo Log',
            description:
                'Condition photos for resale, claims, and maintenance evidence.',
            required: false,
            fileName: 'condition-photo-log.pdf',
          ),
          _portfolioItem(
            id: 'owners_manual',
            title: 'Owner Manual and Quick Guides',
            description:
                'Digital owner manual, quick start, and feature guides.',
            required: false,
          ),
        ],
      },
    ],
  };
}

DateTime _demoDate(int daysAgo) =>
    DateTime.now().subtract(Duration(days: daysAgo));

final List<Vehicle> _demoVehicles = [
  Vehicle(
    vin: '1FTEW1EP8NFA23457',
    make: 'Ford',
    model: 'F-150',
    year: 2022,
    mileage: 44520,
    trim: 'Lariat',
    vehicleType: 'Commercial Vehicle',
    engineType: '3.5L EcoBoost',
    fuelType: 'Gasoline',
    driveType: '4WD',
    recallsCount: 1,
    nextDueTask: 'Oil and filter service',
    nextDueDate: DateTime.now().add(const Duration(days: 18)).toIso8601String(),
    documentPortfolio: _createDemoVehiclePortfolio(),
    createdAt: _demoDate(420),
    updatedAt: _demoDate(2),
  ),
  Vehicle(
    vin: '5YJ3E1EA7PF123456',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    mileage: 18240,
    trim: 'Long Range',
    vehicleType: 'Sedan',
    fuelType: 'Electric',
    recallsCount: 0,
    nextDueTask: 'Tire rotation',
    nextDueDate: DateTime.now().add(const Duration(days: 34)).toIso8601String(),
    documentPortfolio: _createDemoVehiclePortfolio(),
    createdAt: _demoDate(210),
    updatedAt: _demoDate(4),
  ),
  Vehicle(
    vin: '2HGFE2F53PH654321',
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    mileage: 12610,
    trim: 'EX',
    vehicleType: 'Sedan',
    fuelType: 'Gasoline',
    recallsCount: 0,
    vehicleStatus: 'stored',
    nextDueTask: 'Cabin air filter',
    nextDueDate: DateTime.now().add(const Duration(days: 72)).toIso8601String(),
    documentPortfolio: _createDemoVehiclePortfolio(),
    createdAt: _demoDate(180),
    updatedAt: _demoDate(7),
  ),
];

List<Maintenance> _demoMaintenance(String vin) {
  final now = DateTime.now();
  return [
    Maintenance(
      id: 'oil-service',
      title: 'Oil and filter service',
      mileage: vin.startsWith('1F') ? '43210' : '17680',
      cost: 86.42,
      performedBy: 'repair_shop',
      coverage: 'parts_and_labor',
      notes: 'Full synthetic oil, filter, multi-point inspection.',
      date: now.subtract(const Duration(days: 28)),
      createdAt: now.subtract(const Duration(days: 28)),
      updatedAt: now.subtract(const Duration(days: 28)),
    ),
    Maintenance(
      id: 'tires',
      title: 'Tire rotation and pressure check',
      mileage: vin.startsWith('1F') ? '40550' : '15020',
      cost: 29.99,
      performedBy: 'self',
      coverage: 'labor_only',
      notes: 'Rotated tires and corrected pressure before road trip.',
      date: now.subtract(const Duration(days: 84)),
      createdAt: now.subtract(const Duration(days: 84)),
      updatedAt: now.subtract(const Duration(days: 84)),
    ),
    Maintenance(
      id: 'brakes',
      title: 'Brake inspection',
      mileage: vin.startsWith('1F') ? '38900' : '13200',
      cost: 164.75,
      performedBy: 'dealership',
      coverage: 'parts_and_labor',
      notes: 'Pads inspected, fluid topped off, service invoice attached.',
      date: now.subtract(const Duration(days: 132)),
      createdAt: now.subtract(const Duration(days: 132)),
      updatedAt: now.subtract(const Duration(days: 132)),
    ),
  ];
}

List<Map<String, dynamic>> _demoReminders(String vin) {
  return [
    {
      'id': 'oil-filter-reminder',
      'serviceType': 'oil-filter',
      'title': 'Oil and filter service',
      'description': 'Due soon based on current mileage and service interval.',
      'status': 'active',
      'dueDate': DateTime.now().add(const Duration(days: 18)).toIso8601String(),
      'milesUntilDue': 820,
      'vin': vin,
    },
    {
      'id': 'tire-rotation-reminder',
      'serviceType': 'tire-rotation',
      'title': 'Tire rotation',
      'description': 'Plan tire rotation and pressure check.',
      'status': 'snoozed',
      'dueDate': DateTime.now().add(const Duration(days: 34)).toIso8601String(),
      'milesUntilDue': 2450,
      'vin': vin,
    },
  ];
}

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String get _userId {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Not authenticated');
    return user.uid;
  }

  Future<GarageContext> _resolveGarageContext() async {
    final memberships = await _db
        .collection('users')
        .doc(_userId)
        .collection('orgMemberships')
        .where('status', isEqualTo: 'active')
        .limit(1)
        .get();

    if (memberships.docs.isEmpty) {
      return GarageContext(userId: _userId);
    }

    final orgId = memberships.docs.first.id;
    final orgSnapshot = await _db.collection('orgs').doc(orgId).get();
    final orgData = orgSnapshot.data() ?? <String, dynamic>{};

    return GarageContext(
      userId: _userId,
      orgId: orgId,
      orgType: orgData['type']?.toString(),
      garageStorageMode:
          orgData['garageStorageMode']?.toString() ?? 'user_scoped',
    );
  }

  Future<CollectionReference<Map<String, dynamic>>> _vehiclesCollection({
    String? vin,
  }) async {
    final context = await _resolveGarageContext();
    return _db.collection(buildVehicleCollectionPath(context, vin: vin));
  }

  Future<DocumentReference<Map<String, dynamic>>> _vehicleDocument(
    String vin,
  ) async {
    final context = await _resolveGarageContext();
    return _db.doc(buildVehicleDocumentPath(context, vin));
  }

  Future<CollectionReference<Map<String, dynamic>>> _maintenanceCollection(
    String vin,
  ) async {
    final context = await _resolveGarageContext();
    return _db.collection(
      buildVehicleChildCollectionPath(context, vin, 'maintenance'),
    );
  }

  Future<CollectionReference<Map<String, dynamic>>> _remindersCollection(
    String vin,
  ) async {
    final context = await _resolveGarageContext();
    return _db.collection(
      buildVehicleChildCollectionPath(context, vin, 'reminders'),
    );
  }

  Future<DocumentReference<Map<String, dynamic>>>
  get _preferencesDocument async {
    final context = await _resolveGarageContext();
    return _db.doc(buildVehicleDocumentPath(context, 'preferences'));
  }

  // Get all vehicles for current user
  Future<List<Vehicle>> getVehicles() async {
    if (_screenshotMode) return _demoVehicles;

    final vehiclesCollection = await _vehiclesCollection();
    final snapshot = await vehiclesCollection.get();
    return snapshot.docs.map((doc) => Vehicle.fromMap(doc.data())).toList();
  }

  Future<PaginatedVehicles> getVehiclesPaginated({
    int pageSize = 50,
    DocumentSnapshot<Map<String, dynamic>>? startAfter,
  }) async {
    if (_screenshotMode) {
      return const PaginatedVehicles(data: [], lastDoc: null, hasMore: false);
    }

    final vehiclesCollection = await _vehiclesCollection();
    Query<Map<String, dynamic>> query = vehiclesCollection
        .orderBy('updatedAt', descending: true)
        .limit(pageSize);

    if (startAfter != null) {
      query = query.startAfterDocument(startAfter);
    }

    final snapshot = await query.get();
    return PaginatedVehicles(
      data: snapshot.docs.map((doc) => Vehicle.fromMap(doc.data())).toList(),
      lastDoc: snapshot.docs.isNotEmpty ? snapshot.docs.last : null,
      hasMore: snapshot.docs.length == pageSize,
    );
  }

  // Add or update a vehicle
  Future<void> addOrUpdateVehicle(Vehicle vehicle) async {
    if (_screenshotMode) return;

    final docRef = await _vehicleDocument(vehicle.vin);
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
    if (_screenshotMode) return;

    final vehicleDoc = await _vehicleDocument(vin);
    await vehicleDoc.delete();
  }

  // Get a specific vehicle by VIN
  Future<Vehicle?> getVehicle(String vin) async {
    if (_screenshotMode) {
      return _demoVehicles.firstWhere(
        (vehicle) => vehicle.vin == vin,
        orElse: () => _demoVehicles.first,
      );
    }

    final snapshot = await (await _vehicleDocument(vin)).get();
    if (!snapshot.exists || snapshot.data() == null) return null;
    return Vehicle.fromMap(snapshot.data()!);
  }

  // Get stored attachment-analysis metadata for a set of storage paths,
  // keyed by storage path. Mirrors web's getAttachmentAnalyses, which reads
  // attachmentAnalyses/{encodeURIComponent(storagePath)} under the vehicle.
  Future<Map<String, Map<String, dynamic>>> getAttachmentAnalyses(
    String vin,
    List<String> storagePaths,
  ) async {
    if (storagePaths.isEmpty) return {};
    if (_screenshotMode) {
      return {
        for (final path in storagePaths)
          path: {
            'status': 'complete',
            'summary':
                'Detected service date, odometer, vendor, and total from this document.',
            'confidence': 0.94,
            'fields': {
              'serviceDate': DateTime.now()
                  .subtract(const Duration(days: 28))
                  .toIso8601String(),
              'odometer': 43210,
              'total': 86.42,
            },
          },
      };
    }

    final context = await _resolveGarageContext();
    final collection = _db.collection(
      buildVehicleChildCollectionPath(context, vin, 'attachmentAnalyses'),
    );

    final entries = await Future.wait(
      storagePaths.map((path) async {
        final doc = await collection.doc(Uri.encodeComponent(path)).get();
        return MapEntry(path, doc.data());
      }),
    );

    return {
      for (final entry in entries)
        if (entry.value != null) entry.key: entry.value!,
    };
  }

  // Stream vehicles for real-time updates
  Stream<List<Vehicle>> getVehiclesStream() async* {
    if (_screenshotMode) {
      yield _demoVehicles;
      return;
    }

    final vehiclesCollection = await _vehiclesCollection();
    yield* vehiclesCollection.snapshots().map(
      (snapshot) =>
          snapshot.docs.map((doc) => Vehicle.fromMap(doc.data())).toList(),
    );
  }

  // Get maintenance entries for a vehicle
  Future<List<Maintenance>> getMaintenanceEntries(String vin) async {
    if (_screenshotMode) return _demoMaintenance(vin);

    final maintenanceCollection = await _maintenanceCollection(vin);
    final snapshot = await maintenanceCollection
        .orderBy('date', descending: true)
        .get();
    return snapshot.docs
        .map((doc) => Maintenance.fromMap(doc.data(), doc.id))
        .toList();
  }

  Future<PaginatedMaintenance> getMaintenanceEntriesPaginated(
    String vin, {
    int pageSize = 50,
    DocumentSnapshot<Map<String, dynamic>>? startAfter,
  }) async {
    if (_screenshotMode) {
      return PaginatedMaintenance(
        data: _demoMaintenance(vin),
        lastDoc: null,
        hasMore: false,
      );
    }

    final maintenanceCollection = await _maintenanceCollection(vin);
    Query<Map<String, dynamic>> query = maintenanceCollection
        .orderBy('date', descending: true)
        .limit(pageSize);

    if (startAfter != null) {
      query = query.startAfterDocument(startAfter);
    }

    final snapshot = await query.get();
    return PaginatedMaintenance(
      data: snapshot.docs
          .map((doc) => Maintenance.fromMap(doc.data(), doc.id))
          .toList(),
      lastDoc: snapshot.docs.isNotEmpty ? snapshot.docs.last : null,
      hasMore: snapshot.docs.length == pageSize,
    );
  }

  // Add maintenance entry
  Future<void> addMaintenanceEntry(String vin, Maintenance entry) async {
    if (_screenshotMode) return;

    final docRef = (await _maintenanceCollection(vin)).doc();
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
    if (_screenshotMode) {
      final entries = _demoMaintenance(vin);
      return entries.firstWhere(
        (entry) => entry.id == entryId,
        orElse: () => entries.first,
      );
    }

    final snapshot = await (await _maintenanceCollection(
      vin,
    )).doc(entryId).get();
    if (!snapshot.exists || snapshot.data() == null) return null;
    return Maintenance.fromMap(snapshot.data()!, snapshot.id);
  }

  // Update maintenance entry
  Future<void> updateMaintenanceEntry(
    String vin,
    String entryId,
    Maintenance entry,
  ) async {
    if (_screenshotMode) return;

    await (await _maintenanceCollection(vin)).doc(entryId).set({
      ...entry.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
      'date': Timestamp.fromDate(entry.date),
    }, SetOptions(merge: true));
  }

  // Delete maintenance entry
  Future<void> deleteMaintenanceEntry(String vin, String entryId) async {
    if (_screenshotMode) return;

    await (await _maintenanceCollection(vin)).doc(entryId).delete();
  }

  // Add reminder entry
  Future<Map<String, dynamic>> addReminder(
    String vin,
    Map<String, dynamic> reminder,
  ) async {
    if (_screenshotMode) {
      return {'id': 'screenshot-reminder', ...reminder};
    }

    final now = FieldValue.serverTimestamp();
    final docRef = (await _remindersCollection(vin)).doc();
    await docRef.set({
      ...reminder,
      'createdAt': now,
      'updatedAt': now,
    }, SetOptions(merge: true));

    return {'id': docRef.id, ...reminder};
  }

  // Get reminders for a vehicle
  Future<List<Map<String, dynamic>>> getReminders(String vin) async {
    if (_screenshotMode) return _demoReminders(vin);

    final snapshot = await (await _remindersCollection(vin)).get();
    return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
  }

  Future<void> completeReminder(String vin, String reminderId) async {
    if (_screenshotMode) return;

    await (await _remindersCollection(vin)).doc(reminderId).set({
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
    if (_screenshotMode) return;

    await (await _remindersCollection(vin)).doc(reminderId).set({
      'status': 'snoozed',
      'snoozedUntil': untilDateISO,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> dismissReminder(String vin, String reminderId) async {
    if (_screenshotMode) return;

    await (await _remindersCollection(vin)).doc(reminderId).set({
      'status': 'dismissed',
      'dismissedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> reopenReminder(String vin, String reminderId) async {
    if (_screenshotMode) return;

    await (await _remindersCollection(vin)).doc(reminderId).set({
      'status': 'active',
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<Map<String, dynamic>> getPreferences() async {
    if (_screenshotMode) {
      return {
        'homeAddress': {
          'street1': '100 Service Drive',
          'city': 'Austin',
          'stateProvince': 'TX',
          'postalCode': '78701',
          'country': 'US',
        },
        'preferredProviderRadiusMiles': 25,
        'preferredProviderType': 'all',
        'emailRemindersEnabled': true,
        'reminderLeadDays': 14,
      };
    }

    final snapshot = await (await _preferencesDocument).get();
    return snapshot.data() ?? <String, dynamic>{};
  }

  Future<void> updatePreferences(Map<String, dynamic> preferences) async {
    if (_screenshotMode) return;

    await (await _preferencesDocument).set({
      ...preferences,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}

class PaginatedVehicles {
  final List<Vehicle> data;
  final DocumentSnapshot<Map<String, dynamic>>? lastDoc;
  final bool hasMore;

  const PaginatedVehicles({
    required this.data,
    required this.lastDoc,
    required this.hasMore,
  });
}

class PaginatedMaintenance {
  final List<Maintenance> data;
  final DocumentSnapshot<Map<String, dynamic>>? lastDoc;
  final bool hasMore;

  const PaginatedMaintenance({
    required this.data,
    required this.lastDoc,
    required this.hasMore,
  });
}
