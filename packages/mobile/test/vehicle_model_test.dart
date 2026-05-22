import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/models/vehicle.dart';

void main() {
  test('Vehicle defaults status to active when missing', () {
    final vehicle = Vehicle.fromMap({
      'vin': 'VIN001',
      'make': 'Toyota',
      'model': 'Camry',
      'year': 2022,
      'mileage': 32000,
    });

    expect(vehicle.vehicleStatus, 'active');
  });

  test('Vehicle preserves status in toMap and copyWith', () {
    final vehicle = Vehicle(
      vin: 'VIN002',
      make: 'Ford',
      model: 'Bronco',
      year: 2021,
      mileage: 15000,
      vehicleStatus: 'stored',
    );

    expect(vehicle.toMap()['vehicleStatus'], 'stored');

    final updated = vehicle.copyWith(vehicleStatus: 'active');
    expect(updated.vehicleStatus, 'active');
  });
}
