import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// HomeScreen, MaintenanceListScreen, and MaintenanceDetailScreen are wired
// through Provider + live FirestoreService streams with no mocking
// infrastructure in this project (no mockito/mocktail/fake_cloud_firestore
// dependency), so a full widget-rendering test would require building that
// infrastructure from scratch. Instead, this asserts directly against each
// screen's source for the three Shops & Services entry points this phase
// adds/preserves, mirroring the source-regression pattern already used for
// packages/web/tests/App.routes.test.jsx in this same refactor.

String readScreen(String relativePath) {
  return File(relativePath).readAsStringSync();
}

void main() {
  group('Shops & Services discoverability (4 entry points)', () {
    test('Garage screen exposes an AppBar action to Shops & Services', () {
      final source = readScreen('lib/screens/home_screen.dart');
      expect(source, contains("Shops & Services"));
      expect(source, contains("context.push('/app/service-providers')"));
      expect(source, contains('actions: ['));
      expect(source, contains('Icons.storefront_outlined'));
    });

    test(
      'Settings screen no longer duplicates the Shops & Services entry point',
      () {
        // Removed 2026-07-16: the Garage entry point (added 2026-07-13, one
        // day before the prior decision to keep this one) already made this
        // a pure duplicate, same reasoning as the earlier Service History
        // removal from Settings (a73ac2b).
        final source = readScreen('lib/screens/settings_screen.dart');
        expect(source, isNot(contains('Shops & Services')));
      },
    );

    test(
      'Maintenance add-entry flow offers a contextual Shops & Services link',
      () {
        final source = readScreen('lib/screens/maintenance_list_screen.dart');
        expect(source, contains('Find shops & services'));
        expect(source, contains("context.push('/app/service-providers')"));
      },
    );

    test(
      'Maintenance edit-entry flow offers a contextual Shops & Services link',
      () {
        final source = readScreen(
          'lib/screens/maintenance_detail_screen.dart',
        );
        expect(source, contains('Find shops & services'));
        expect(source, contains("context.push('/app/service-providers')"));
      },
    );

    test('Plan screen exposes an AppBar action to Shops & Services', () {
      final source = readScreen('lib/screens/upcoming_tasks_screen.dart');
      expect(source, contains("Shops & Services"));
      expect(source, contains("context.push('/app/service-providers')"));
      expect(source, contains('Icons.storefront_outlined'));
    });

    test('History screen exposes an AppBar action to Shops & Services', () {
      final source = readScreen('lib/screens/timeline_dashboard_screen.dart');
      expect(source, contains("Shops & Services"));
      expect(source, contains("context.push('/app/service-providers')"));
      expect(source, contains('Icons.storefront_outlined'));
    });

    test(
      'All Shops & Services entry points use the same storefront icon',
      () {
        for (final path in [
          'lib/screens/home_screen.dart',
          'lib/screens/upcoming_tasks_screen.dart',
          'lib/screens/timeline_dashboard_screen.dart',
          'lib/screens/maintenance_list_screen.dart',
          'lib/screens/maintenance_detail_screen.dart',
        ]) {
          final source = readScreen(path);
          expect(
            source,
            contains('Icons.storefront_outlined'),
            reason: '$path should use Icons.storefront_outlined',
          );
        }
      },
    );

    test('Bottom nav stays at exactly 4 items (no 5th Shops & Services slot)', () {
      final source = readScreen('lib/components/app_bottom_nav.dart');
      final itemMatches = RegExp(
        r'BottomNavigationBarItem\(',
      ).allMatches(source).length;
      expect(itemMatches, 4);
      expect(source, isNot(contains('Shops & Services')));
    });
  });
}
