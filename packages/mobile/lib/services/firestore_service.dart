// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:firebase_auth/firebase_auth.dart';
import '../models/maintenance.dart';
import '../models/vehicle.dart';

class FirestoreService {
  // final FirebaseFirestore _db = FirebaseFirestore.instance;
  // final FirebaseAuth _auth = FirebaseAuth.instance;

  // Mock data for TestFlight
  final List<Vehicle> _mockVehicles = [
    Vehicle(
      vin: '1HGCM82633A123456',
      make: 'Honda',
      model: 'Accord',
      year: 2020,
      mileage: 45000,
      purchaseDate: '2020-06-15',
    ),
    Vehicle(
      vin: '2T1BURHE0FC123456',
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      mileage: 78000,
      purchaseDate: '2018-03-20',
    ),
  ];

  final Map<String, List<Maintenance>> _mockMaintenance = {
    '1HGCM82633A123456': [
      Maintenance(
        id: '1',
        title: 'Oil Change',
        date: DateTime(2024, 6, 1),
        cost: 85.50,
        notes: 'Full synthetic oil change',
        createdAt: DateTime(2024, 6, 1),
        updatedAt: DateTime(2024, 6, 1),
      ),
      Maintenance(
        id: '2',
        title: 'Tire Rotation',
        date: DateTime(2024, 4, 15),
        cost: 25.00,
        notes: 'Standard tire rotation',
        createdAt: DateTime(2024, 4, 15),
        updatedAt: DateTime(2024, 4, 15),
      ),
      Maintenance(
        id: '3',
        title: 'Brake Inspection',
        date: DateTime(2024, 2, 10),
        cost: 0.0,
        notes: 'Brake pads at 70%',
        createdAt: DateTime(2024, 2, 10),
        updatedAt: DateTime(2024, 2, 10),
      ),
    ],
    '2T1BURHE0FC123456': [
      Maintenance(
        id: '4',
        title: 'Oil Change',
        date: DateTime(2024, 5, 20),
        cost: 75.00,
        notes: 'Regular oil change',
        createdAt: DateTime(2024, 5, 20),
        updatedAt: DateTime(2024, 5, 20),
      ),
    ],
  };

  // Get current user ID or throw error
  // String get _userId {
  //   final user = _auth.currentUser;
  //   if (user == null) throw Exception('Not authenticated');
  //   return user.uid;
  // }

  // Get vehicles collection reference
  // CollectionReference get _vehiclesCollection =>
  //     _db.collection('users').doc(_userId).collection('vehicles');

  // Get all vehicles for current user
  Future<List<Vehicle>> getVehicles() async {
    // Mock delay
    await Future.delayed(const Duration(milliseconds: 500));
    return _mockVehicles;
  }

  // Add or update a vehicle
  Future<void> addOrUpdateVehicle(Vehicle vehicle) async {
    // Mock operation - do nothing
    await Future.delayed(const Duration(milliseconds: 200));
  }

  // Delete a vehicle
  Future<void> deleteVehicle(String vin) async {
    // Mock operation - do nothing
    await Future.delayed(const Duration(milliseconds: 200));
  }

  // Get a specific vehicle by VIN
  Future<Vehicle?> getVehicle(String vin) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _mockVehicles.firstWhere(
      (vehicle) => vehicle.vin == vin,
      orElse: () => Vehicle(
        vin: vin,
        make: 'Unknown',
        model: 'Unknown',
        year: DateTime.now().year,
        mileage: 0,
      ),
    );
  }

  // Stream vehicles for real-time updates
  Stream<List<Vehicle>> getVehiclesStream() {
    return Stream.value(_mockVehicles);
  }

  // Get maintenance entries for a vehicle
  Future<List<Maintenance>> getMaintenanceEntries(String vin) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _mockMaintenance[vin] ?? [];
  }

  // Add maintenance entry
  Future<void> addMaintenanceEntry(String vin, Maintenance entry) async {
    await Future.delayed(const Duration(milliseconds: 200));
  }

  // Get a specific maintenance entry
  Future<Maintenance?> getMaintenanceEntry(String vin, String entryId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final entries = _mockMaintenance[vin] ?? [];
    return entries.firstWhere(
      (entry) => entry.id == entryId,
      orElse: () => Maintenance(
        id: entryId,
        title: 'Unknown',
        date: DateTime.now(),
        cost: 0.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    );
  }

  // Update maintenance entry
  Future<void> updateMaintenanceEntry(
    String vin,
    String entryId,
    Maintenance entry,
  ) async {
    await Future.delayed(const Duration(milliseconds: 200));
  }

  // Delete maintenance entry
  Future<void> deleteMaintenanceEntry(String vin, String entryId) async {
    await Future.delayed(const Duration(milliseconds: 200));
  }
}
