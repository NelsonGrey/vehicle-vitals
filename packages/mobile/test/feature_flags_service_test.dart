import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/services/feature_flags_service.dart';

void main() {
  group('FeatureFlagsService', () {
    test('normalizes unknown tiers to free', () {
      expect(
        FeatureFlagsService.normalizeTier('unknown-tier'),
        FeatureFlagsService.freeTier,
      );
    });

    test('returns expected vehicle limits for all four tiers', () {
      expect(FeatureFlagsService.getVehicleLimit('free'), 2);
      expect(FeatureFlagsService.getVehicleLimit('pro'), 10);
      expect(FeatureFlagsService.getVehicleLimit('premium'), 25);
      expect(FeatureFlagsService.getVehicleLimit('enterprise'), 250);
    });

    test('enables enterprise api access and ad free entitlements', () {
      expect(
        FeatureFlagsService.isFeatureEnabled('api_access', 'enterprise'),
        isTrue,
      );
      expect(
        FeatureFlagsService.isFeatureEnabled('ad_free', 'enterprise'),
        isTrue,
      );
    });

    test('keeps ad free disabled for pro tier', () {
      expect(FeatureFlagsService.isFeatureEnabled('ad_free', 'pro'), isFalse);
    });
  });
}
