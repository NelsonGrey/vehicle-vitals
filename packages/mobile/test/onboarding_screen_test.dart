import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// OnboardingScreen depends on live FirestoreService/PremiumService/
// OnboardingService instances (no mocking infrastructure exists in this
// project yet — see packages/mobile/test/shops_services_entry_points_test.dart
// for the same constraint), so this is a source-based regression test for
// the Getting Started journey content this phase adds, rather than a full
// widget render.

void main() {
  group('Getting Started journey (static/contextual milestones)', () {
    late String source;

    setUpAll(() {
      source = File('lib/screens/onboarding_screen.dart').readAsStringSync();
    });

    test('AppBar is retitled to the Getting Started capability label', () {
      expect(source, contains("AppBar(title: const Text('Getting Started')"));
    });

    test('adds a Service History milestone linked to /app/timeline', () {
      expect(source, contains('Review your Service History'));
      expect(source, contains("context.push('/app/timeline')"));
    });

    test('adds a Shops & Services secondary tile', () {
      expect(source, contains('Find shops & services'));
      expect(source, contains("context.push('/app/service-providers')"));
    });

    test('Maintenance Plan milestone uses current capability vocabulary', () {
      expect(source, contains('Review your Maintenance Plan'));
      expect(source, contains('View Maintenance Plan'));
    });

    test(
      'existing Reminder Preferences and Subscription tiles are unchanged',
      () {
        expect(source, contains('Set reminder preferences'));
        expect(source, contains("context.push('/app/reminder-preferences')"));
        expect(source, contains('Review subscription options'));
        expect(source, contains("context.push('/app/premium')"));
      },
    );

    test(
      'no new persisted per-milestone completion state is introduced '
      '(single onboarding_completed flag stays the source of truth)',
      () {
        expect(source, contains('markCompleted()'));
        expect(source, isNot(contains('SharedPreferences')));
      },
    );
  });
}
