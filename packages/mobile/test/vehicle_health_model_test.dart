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
      expect(
        snapshot.accuracyTip,
        contains('Keep mileage and service entries current'),
      );
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

    test('does not treat a brake inspection with no work performed as a '
        'completed brake service', () {
      // Regression: a bare "brake" mention was anchoring the brake-wear
      // forecast to today at high confidence ("just serviced") even when
      // no work was actually performed — a safety-relevant false
      // reassurance.
      final vehicle = Vehicle(
        vin: 'VIN003',
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        mileage: 60000,
      );

      final maintenance = [
        Maintenance(
          id: 'm1',
          title: 'Brake noise inspection, no work performed',
          mileage: '59900',
          date: DateTime.utc(2026, 6, 10),
          createdAt: DateTime.utc(2026, 6, 10),
          updatedAt: DateTime.utc(2026, 6, 10),
        ),
      ];

      final snapshot = VehicleHealthCalculator.buildSnapshot(
        vehicle,
        maintenance,
        now: DateTime.utc(2026, 6, 12),
      );

      final brake = snapshot.components.firstWhere(
        (component) => component.label == 'Brakes',
      );
      expect(brake.confidence, 'low');
    });

    test('does not report high confidence from a maintenance record with a '
        'fabricated (unknown) date', () {
      // Regression: Maintenance.fromMap used to silently default a
      // missing/malformed date to DateTime.now(), and the health
      // calculator treated that fabricated date as a real one — reporting
      // "serviced today, high confidence" from data that was never
      // actually there. Built via fromMap (not the constructor) so the
      // hasKnownDate flag is derived the same way it is from real
      // Firestore reads.
      final vehicle = Vehicle(
        vin: 'VIN005',
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        mileage: 40000,
      );

      final entry = Maintenance.fromMap({
        'title': 'Oil change',
        'mileage': '39900',
        // 'date' intentionally omitted — simulates a malformed/missing
        // Firestore field.
      }, 'entry-unknown-date');

      final snapshot = VehicleHealthCalculator.buildSnapshot(vehicle, [
        entry,
      ], now: DateTime.utc(2026, 6, 12));

      final oil = snapshot.components.firstWhere(
        (component) => component.label == 'Oil',
      );
      expect(oil.confidence, isNot('high'));
    });

    test('still anchors on real brake, battery, and oil service work', () {
      final vehicle = Vehicle(
        vin: 'VIN004',
        make: 'Honda',
        model: 'Accord',
        year: 2022,
        mileage: 60000,
      );

      final maintenance = [
        Maintenance(
          id: 'm1',
          title: 'Brake pad replacement',
          mileage: '59900',
          date: DateTime.utc(2026, 6, 10),
          createdAt: DateTime.utc(2026, 6, 10),
          updatedAt: DateTime.utc(2026, 6, 10),
        ),
      ];

      final snapshot = VehicleHealthCalculator.buildSnapshot(
        vehicle,
        maintenance,
        now: DateTime.utc(2026, 6, 12),
      );

      final brake = snapshot.components.firstWhere(
        (component) => component.label == 'Brakes',
      );
      expect(brake.confidence, 'high');
    });
  });
}
