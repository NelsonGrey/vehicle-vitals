import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/models/maintenance_schedule.dart';

void main() {
  group('MaintenanceSchedule.calculateNextDue', () {
    test(
      'returns the next unvisited interval multiple above current mileage',
      () {
        // Regression for a bug where an extra interval was added on top of the
        // rounded-up multiple, telling users they had a full interval more
        // headroom than they actually did.
        expect(MaintenanceSchedule.calculateNextDue(25000, 10000), 30000);
        expect(MaintenanceSchedule.calculateNextDue(0, 5000), 5000);
        expect(MaintenanceSchedule.calculateNextDue(4999, 5000), 5000);
      },
    );

    test(
      'advances a full interval when currentMileage lands exactly on a multiple',
      () {
        expect(MaintenanceSchedule.calculateNextDue(10000, 10000), 20000);
      },
    );
  });

  group('MaintenanceSchedule.getUpcomingMaintenance', () {
    test('reports correct miles-until-due for a known vehicle', () {
      final items = MaintenanceSchedule.getUpcomingMaintenance(
        'Toyota',
        'Camry',
        25000,
        50000,
      );
      final brake = items.firstWhere((item) => item['id'] == 'brakeInspection');
      expect(brake['nextDueMileage'], 30000);
      expect(brake['milesUntilDue'], 5000);
    });

    test('returns an empty list for an uncovered make/model', () {
      expect(
        MaintenanceSchedule.getMaintenanceSchedule('Tesla', 'Model 3'),
        isNull,
      );
      expect(
        MaintenanceSchedule.getUpcomingMaintenance('Tesla', 'Model 3', 25000),
        isEmpty,
      );
    });
  });
}
