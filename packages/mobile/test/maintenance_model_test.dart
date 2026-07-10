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

  test('Maintenance parses string-typed date fields from Firestore', () {
    final maintenance = Maintenance.fromMap({
      'title': 'Oil change',
      'date': '2025-12-19',
      'createdAt': '2025-12-19',
      'updatedAt': '2025-12-19',
    }, 'entry-3');

    expect(maintenance.date, DateTime.parse('2025-12-19'));
    expect(maintenance.createdAt, DateTime.parse('2025-12-19'));
    expect(maintenance.updatedAt, DateTime.parse('2025-12-19'));
  });

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
