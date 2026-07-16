import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/services/garage_scope.dart';

void main() {
  group('Garage scope helpers', () {
    test('uses user-scoped vehicle paths by default', () {
      const context = GarageContext(userId: 'user-123');

      expect(
        buildVehicleCollectionPath(context),
        'users/user-123/vehicles',
      );
      expect(
        buildVehicleDocumentPath(context, 'VIN001'),
        'users/user-123/vehicles/VIN001',
      );
    });

    test('uses org-scoped vehicle paths when household mode is enabled', () {
      const context = GarageContext(
        userId: 'user-123',
        orgId: 'org-456',
        orgType: 'household',
        garageStorageMode: 'org_scoped',
      );

      expect(
        buildVehicleCollectionPath(context),
        'orgs/org-456/vehicles',
      );
      expect(
        buildVehicleChildCollectionPath(context, 'VIN001', 'maintenance'),
        'orgs/org-456/vehicles/VIN001/maintenance',
      );
    });

    test('keeps preferences on user-scoped paths even in household mode', () {
      const context = GarageContext(
        userId: 'user-123',
        orgId: 'org-456',
        orgType: 'household',
        garageStorageMode: 'org_scoped',
      );

      expect(
        buildVehicleDocumentPath(context, 'preferences'),
        'users/user-123/vehicles/preferences',
      );
    });

    test('treats dual_write as org-scoped for primary path selection', () {
      const context = GarageContext(
        userId: 'user-123',
        orgId: 'org-456',
        garageStorageMode: 'dual_write',
      );

      expect(
        buildVehicleStorageBasePath(context, 'VIN001'),
        'orgs/org-456/vehicles/VIN001',
      );
    });
  });
}
