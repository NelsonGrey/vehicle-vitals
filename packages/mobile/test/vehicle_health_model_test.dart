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
      // This fixture only logs oil + tire rotation history, so the other
      // four components (brakes, battery, tire replacement, wipers) anchor
      // from a 2+ year old purchase date with no service record — most of
      // them are genuinely overdue by real interval math, and the score
      // can now legitimately reach the true floor of 0 (previously
      // artificially floored at 12 regardless of actual severity).
      expect(snapshot.overallHealthScore, greaterThanOrEqualTo(0));
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

    test(
      'scores a severely overdue vehicle lower than a moderately overdue '
      'one, instead of the same floor',
      () {
        // Regression: overdue components were penalized twice — once by
        // zeroing their contribution to the score average, and again by a
        // flat per-item subtraction — which bottomed every
        // heavily-neglected vehicle out at the same floor score regardless
        // of how overdue it actually was.
        final now = DateTime.utc(2026, 6, 12);
        DateTime daysAgo(int days) => now.subtract(Duration(days: days));

        final vehicle = Vehicle(
          vin: 'VIN010',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          mileage: 0,
          purchaseDate: '2020-01-01',
        );

        List<Maintenance> buildMaintenance(int oilDaysAgo) => [
          Maintenance(
            id: 'g1',
            title: 'Tire rotation',
            date: daysAgo(5),
            createdAt: daysAgo(5),
            updatedAt: daysAgo(5),
          ),
          Maintenance(
            id: 'g2',
            title: 'Tires replaced',
            date: daysAgo(5),
            createdAt: daysAgo(5),
            updatedAt: daysAgo(5),
          ),
          Maintenance(
            id: 'g3',
            title: 'Brake pad replacement',
            date: daysAgo(5),
            createdAt: daysAgo(5),
            updatedAt: daysAgo(5),
          ),
          Maintenance(
            id: 'g4',
            title: 'Battery replacement',
            date: daysAgo(5),
            createdAt: daysAgo(5),
            updatedAt: daysAgo(5),
          ),
          Maintenance(
            id: 'g5',
            title: 'Wiper blade replacement',
            date: daysAgo(5),
            createdAt: daysAgo(5),
            updatedAt: daysAgo(5),
          ),
          Maintenance(
            id: 'oil',
            title: 'Oil change',
            date: daysAgo(oilDaysAgo),
            createdAt: daysAgo(oilDaysAgo),
            updatedAt: daysAgo(oilDaysAgo),
          ),
        ];

        final moderatelyOverdue = VehicleHealthCalculator.buildSnapshot(
          vehicle,
          buildMaintenance(200),
          now: now,
        );
        final severelyOverdue = VehicleHealthCalculator.buildSnapshot(
          vehicle,
          buildMaintenance(2000),
          now: now,
        );

        final moderateOil = moderatelyOverdue.components.firstWhere(
          (c) => c.label == 'Oil',
        );
        final severeOil = severelyOverdue.components.firstWhere(
          (c) => c.label == 'Oil',
        );
        expect(moderateOil.status, 'overdue');
        expect(severeOil.status, 'overdue');

        expect(
          severelyOverdue.overallHealthScore,
          lessThan(moderatelyOverdue.overallHealthScore),
        );
      },
    );

    test(
      'countOccurrencesInWindow counts multiple recurrences of oil '
      '(180-day interval) within a 36-month window',
      () {
        // Regression: 12/36-month spend forecasts previously counted a
        // recurring item's cost only once per window, undercounting oil
        // (which recurs roughly every 6 months) by ~6x over 36 months.
        final occurrences = VehicleHealthCalculator.countOccurrencesInWindow(
          remainingDays: 10,
          intervalDays: 180,
          remainingMiles: null,
          intervalMiles: null,
          horizonDays: 1080,
          horizonMiles: 32400,
        );
        expect(occurrences, 6);
      },
    );

    test(
      'countOccurrencesInWindow returns zero when nothing is due within '
      'the window',
      () {
        final occurrences = VehicleHealthCalculator.countOccurrencesInWindow(
          remainingDays: 2000,
          intervalDays: 1460,
          remainingMiles: 60000,
          intervalMiles: 50000,
          horizonDays: 1080,
          horizonMiles: 32400,
        );
        expect(occurrences, 0);
      },
    );

    test(
      'countOccurrencesInWindow takes the larger of the days-based and '
      'miles-based occurrence counts',
      () {
        final occurrences = VehicleHealthCalculator.countOccurrencesInWindow(
          remainingDays: 900,
          intervalDays: 1460,
          remainingMiles: 100,
          intervalMiles: 1000,
          horizonDays: 1080,
          horizonMiles: 6000,
        );
        expect(occurrences, 6);
      },
    );

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

  group('VehicleHealthCalculator.resolveSnapshot', () {
    test('uses the server snapshot when it matches the current version', () {
      final vehicle = Vehicle(
        vin: 'VIN005',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        mileage: 40000,
        vehicleHealthSnapshot: {
          'vin': 'VIN005',
          'computedFromVersion': '40000:0',
          'overallHealthScore': 7, // implausible-by-local-math sentinel
          'accuracyTip': 'from server',
          'components': <Map<String, dynamic>>[],
          'estimatedMilesPerMonth': 900,
          'estimatedSpend90dLow': 0,
          'estimatedSpend90dHigh': 0,
          'estimatedSpend12mLow': 0,
          'estimatedSpend12mHigh': 0,
          'estimatedSpend36mLow': 0,
          'estimatedSpend36mHigh': 0,
          'missingServiceHistory': true,
          'lowConfidenceCount': 0,
          'overallConfidenceScore': 0.35,
        },
      );

      final snapshot = VehicleHealthCalculator.resolveSnapshot(vehicle, []);

      expect(snapshot.overallHealthScore, 7);
      expect(snapshot.accuracyTip, 'from server');
    });

    test('normalizes underscore status strings from the server to match local spelling', () {
      final vehicle = Vehicle(
        vin: 'VIN006',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        mileage: 40000,
        vehicleHealthSnapshot: {
          'computedFromVersion': '40000:0',
          'overallHealthScore': 30,
          'accuracyTip': '',
          'components': [
            {
              'label': 'Oil',
              'status': 'service_soon',
              'confidenceScore': 0.5,
              'estimatedCostLow': 70,
              'estimatedCostHigh': 140,
            },
          ],
          'estimatedMilesPerMonth': 900,
          'overallConfidenceScore': 0.5,
        },
      );

      final snapshot = VehicleHealthCalculator.resolveSnapshot(vehicle, []);
      expect(snapshot.components.first.status, 'service soon');
    });

    test('falls back to local computation when there is no server snapshot', () {
      final vehicle = Vehicle(
        vin: 'VIN007',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        mileage: 5000,
      );

      final snapshot = VehicleHealthCalculator.resolveSnapshot(
        vehicle,
        [],
        now: DateTime.utc(2026, 6, 12),
      );

      final localSnapshot = VehicleHealthCalculator.buildSnapshot(
        vehicle,
        [],
        now: DateTime.utc(2026, 6, 12),
      );
      expect(snapshot.overallHealthScore, localSnapshot.overallHealthScore);
    });

    test('falls back to local computation when the server snapshot is stale', () {
      final vehicle = Vehicle(
        vin: 'VIN008',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        mileage: 90000, // current mileage differs from the stale snapshot's version
        vehicleHealthSnapshot: {
          'computedFromVersion': '5000:0', // stale — computed at a much lower mileage
          'overallHealthScore': 999, // implausible sentinel to prove it was NOT used
          'components': <Map<String, dynamic>>[],
        },
      );

      final snapshot = VehicleHealthCalculator.resolveSnapshot(
        vehicle,
        [],
        now: DateTime.utc(2026, 6, 12),
      );
      expect(snapshot.overallHealthScore, isNot(999));
    });

    test('falls back to local computation when the server snapshot is malformed', () {
      final vehicle = Vehicle(
        vin: 'VIN009',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        mileage: 12000,
        vehicleHealthSnapshot: {
          'computedFromVersion': '12000:0',
          // no 'components' key at all
        },
      );

      final snapshot = VehicleHealthCalculator.resolveSnapshot(
        vehicle,
        [],
        now: DateTime.utc(2026, 6, 12),
      );
      expect(snapshot.components, isNotEmpty);
    });
  });
}
