import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/models/maintenance.dart';

void main() {
  test(
    'Maintenance preserves performedBy and coverage in toMap and copyWith',
    () {
      final maintenance = Maintenance(
        id: 'entry-1',
        title: 'Brake pads',
        notes: 'Parts only receipt',
        cost: 184.55,
        performedBy: 'self',
        coverage: 'parts_only',
        date: DateTime.utc(2024, 4, 10),
        createdAt: DateTime.utc(2024, 4, 10),
        updatedAt: DateTime.utc(2024, 4, 10),
      );

      expect(maintenance.toMap()['performedBy'], 'self');
      expect(maintenance.toMap()['coverage'], 'parts_only');

      final updated = maintenance.copyWith(performedBy: 'business');
      expect(updated.performedBy, 'business');
      expect(updated.coverage, 'parts_only');
    },
  );

  test('Maintenance defaults performedBy and coverage when missing', () {
    final maintenance = Maintenance.fromMap({
      'title': 'Oil change',
      'notes': '',
      'cost': 42,
      'date': DateTime.utc(2024, 5, 1),
      'createdAt': DateTime.utc(2024, 5, 1),
      'updatedAt': DateTime.utc(2024, 5, 1),
    }, 'entry-2');

    expect(maintenance.performedBy, 'mechanic');
    expect(maintenance.coverage, 'parts_and_labor');
  });
}
