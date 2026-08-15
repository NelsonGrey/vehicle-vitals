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

      final updated = maintenance.copyWith(performedBy: 'dealership');
      expect(updated.performedBy, 'dealership');
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

  test('Maintenance flags a missing date as unknown instead of silently '
      'fabricating "now"', () {
    // Regression: a missing/malformed date silently defaulted to
    // DateTime.now() with no way for callers (notably
    // VehicleHealthCalculator) to tell the difference from a genuinely
    // recent service — producing a fabricated "serviced today, high
    // confidence" forecast from data that was never actually there.
    final missing = Maintenance.fromMap({'title': 'Oil change'}, 'entry-4');
    expect(missing.hasKnownDate, isFalse);

    final malformed = Maintenance.fromMap({
      'title': 'Oil change',
      'date': 'not-a-date',
    }, 'entry-5');
    expect(malformed.hasKnownDate, isFalse);

    final known = Maintenance.fromMap({
      'title': 'Oil change',
      'date': '2025-12-19',
    }, 'entry-6');
    expect(known.hasKnownDate, isTrue);
  });

  test(
    'Maintenance.copyWith marks the date known when a new date is supplied',
    () {
      final entry = Maintenance.fromMap({'title': 'Oil change'}, 'entry-7');
      expect(entry.hasKnownDate, isFalse);

      final updated = entry.copyWith(date: DateTime.utc(2026, 1, 1));
      expect(updated.hasKnownDate, isTrue);
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

    expect(maintenance.performedBy, 'repair_shop');
    expect(maintenance.coverage, 'parts_and_labor');
  });

  test(
    'Maintenance round-trips retired performedBy values from records saved '
    'before the repair_shop/dealership/body_shop/car_wash/detailer taxonomy '
    'shipped (no backfill migration — old records keep their stored value)',
    () {
      final legacyMechanic = Maintenance.fromMap({
        'title': 'Oil change',
        'performedBy': 'mechanic',
        'date': DateTime.utc(2024, 1, 1),
        'createdAt': DateTime.utc(2024, 1, 1),
        'updatedAt': DateTime.utc(2024, 1, 1),
      }, 'entry-legacy-1');
      expect(legacyMechanic.performedBy, 'mechanic');

      final legacyBusiness = Maintenance.fromMap({
        'title': 'Fleet service',
        'performedBy': 'business',
        'date': DateTime.utc(2024, 1, 1),
        'createdAt': DateTime.utc(2024, 1, 1),
        'updatedAt': DateTime.utc(2024, 1, 1),
      }, 'entry-legacy-2');
      expect(legacyBusiness.performedBy, 'business');
    },
  );

  test('Maintenance round-trips an attached photo through toMap/fromMap', () {
    final withPhoto = Maintenance(
      id: 'entry-8',
      title: 'Oil change',
      date: DateTime.utc(2026, 1, 1),
      createdAt: DateTime.utc(2026, 1, 1),
      updatedAt: DateTime.utc(2026, 1, 1),
      photoUrl: 'https://example.com/photo.jpg',
      photoPath: 'users/uid/vehicles/VIN/records/entry-8/123.jpg',
    );

    final map = withPhoto.toMap();
    expect(map['photoUrl'], 'https://example.com/photo.jpg');
    expect(map['photoPath'], 'users/uid/vehicles/VIN/records/entry-8/123.jpg');

    final restored = Maintenance.fromMap(map, 'entry-8');
    expect(restored.photoUrl, withPhoto.photoUrl);
    expect(restored.photoPath, withPhoto.photoPath);
  });

  test('Maintenance defaults to no photo when absent from Firestore', () {
    final entry = Maintenance.fromMap({'title': 'Oil change'}, 'entry-9');
    expect(entry.photoUrl, isNull);
    expect(entry.photoPath, isNull);
  });

  test(
    'Maintenance.copyWith leaves photo fields untouched by default but '
    'clears them when explicitly passed null',
    () {
      final entry = Maintenance(
        id: 'entry-10',
        title: 'Oil change',
        date: DateTime.utc(2026, 1, 1),
        createdAt: DateTime.utc(2026, 1, 1),
        updatedAt: DateTime.utc(2026, 1, 1),
        photoUrl: 'https://example.com/photo.jpg',
        photoPath: 'path/to/photo.jpg',
      );

      final unrelatedUpdate = entry.copyWith(title: 'Oil and filter change');
      expect(unrelatedUpdate.photoUrl, entry.photoUrl);
      expect(unrelatedUpdate.photoPath, entry.photoPath);

      final cleared = entry.copyWith(photoUrl: null, photoPath: null);
      expect(cleared.photoUrl, isNull);
      expect(cleared.photoPath, isNull);
    },
  );
}
