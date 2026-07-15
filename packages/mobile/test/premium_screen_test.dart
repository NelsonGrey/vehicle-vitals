import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// PremiumScreen depends on a live PremiumService instance (constructor
// triggers real Firebase Functions/IAP calls, no mocking infrastructure
// exists in this project yet — see onboarding_screen_test.dart for the
// same constraint), so this is a source-based regression test for the
// multi-tier IAP gating fixes this phase adds, rather than a full widget
// render.

void main() {
  late String source;

  setUpAll(() {
    source = File('lib/screens/premium_screen.dart').readAsStringSync();
  });

  test(
    'active view is gated on subscriptionTier, not the legacy premium-only '
    'isPremium boolean (a Pro IAP subscriber must see the active view too)',
    () {
      expect(
        source,
        contains(
          'premiumService.subscriptionTier != FeatureFlagsService.freeTier',
        ),
      );
      expect(source, isNot(contains('if (premiumService.isPremium)')));
    },
  );

  test('active-view banner copy is tier-generic, not hardcoded to Premium', () {
    expect(source, contains("'\$tierLabel Active'"));
    expect(source, isNot(contains("'Premium Active'")));
  });

  test('a monthly/annual billing period toggle exists', () {
    expect(source, contains('_billingPeriod'));
    expect(source, contains("periodButton('monthly', 'Monthly')"));
    expect(source, contains("periodButton('annual', 'Annual')"));
  });

  test('Pro tier is purchasable, not permanently marked Included', () {
    expect(source, contains('onChoosePro'));
    expect(source, contains("buttonLabel = 'Choose Pro'"));
  });

  test('purchase flow is generic across tier and billing period', () {
    expect(
      source,
      contains('Future<void> _purchase(PremiumService premiumService, String tier)'),
    );
    expect(source, contains('premiumService.purchase(tier, _billingPeriod)'));
  });

  test('in-app-purchase disclosure mentions both Pro and Premium', () {
    expect(
      source,
      contains('Payment is processed through in-app purchase for Pro and Premium'),
    );
  });
}
