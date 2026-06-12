import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/models/maintenance.dart';
import 'package:vehicle_vitals_flutter/models/vehicle.dart';
import 'package:vehicle_vitals_flutter/models/vehicle_health.dart';

void main() {
  group('VehicleHealthCalculator', () {
    test('builds a forecast from maintenance history and mileage', () {
      final vehicle = Vehicle(
        vin: 'VIN001',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        mileage: 55100,
        purchaseDate: '2024-01-10',
      );

      final maintenance = [
        Maintenance(
          id: 'm1',
          title: 'Oil change',
          date: DateTime.utc(2026, 1, 10),
          createdAt: DateTime.utc(2026, 1, 10),
          updatedAt: DateTime.utc(2026, 1, 10),
        ),
        Maintenance(
          id: 'm2',
          title: 'Tire rotation',
          date: DateTime.utc(2026, 2, 12),
          createdAt: DateTime.utc(2026, 2, 12),
          updatedAt: DateTime.utc(2026, 2, 12),
        ),
      ];

      final snapshot = VehicleHealthCalculator.buildSnapshot(
        vehicle,
        maintenance,
        now: DateTime.utc(2026, 6, 12),
      );

      expect(snapshot.vehicleLabel, '2022 Toyota Camry');
      expect(snapshot.overallHealthScore, greaterThan(0));
      expect(snapshot.accuracyTip, contains('Keep mileage and service entries current'));
      expect(
        snapshot.components
            .firstWhere((component) => component.label == 'Oil')
            .status,
        anyOf('service soon', 'watch', 'good', 'overdue'),
      );
      expect(
        snapshot.components
            .firstWhere((component) => component.label == 'Oil')
            .confidence,
        anyOf('high', 'medium'),
      );
    });

    test('falls back to low-confidence estimates without history', () {
      final vehicle = Vehicle(
        vin: 'VIN002',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        mileage: 30100,
        purchaseDate: '2025-01-10',
      );

      final snapshot = VehicleHealthCalculator.buildSnapshot(
        vehicle,
        const [],
        now: DateTime.utc(2026, 6, 12),
      );

      expect(snapshot.accuracyTip, contains('Add your recent service entries'));
      expect(
        snapshot.components.every((component) => component.confidence == 'low'),
        isTrue,
      );
    });
  });
}
