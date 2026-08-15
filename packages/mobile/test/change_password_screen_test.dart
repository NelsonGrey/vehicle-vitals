import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// ChangePasswordScreen depends on live AuthService/PasswordPolicyService
// instances backed by FirebaseAuth, with no mocking infrastructure in this
// project (see onboarding_screen_test.dart for the same constraint), so
// this is a source-based regression test: it asserts on the screen's
// source, the wired-up route in main.dart, and the entry point in
// account_screen.dart, mirroring the pattern in onboarding_screen_test.dart
// and shops_services_entry_points_test.dart.

String readFile(String relativePath) => File(relativePath).readAsStringSync();

void main() {
  group('ChangePasswordScreen', () {
    late String source;

    setUpAll(() {
      source = readFile('lib/screens/change_password_screen.dart');
    });

    test('uses PasswordPolicyService for the live policy/hint/quickCheck', () {
      expect(source, contains("import '../services/password_policy_service.dart';"));
      expect(source, contains('PasswordPolicyService()'));
      expect(source, contains('PasswordPolicyService.defaultPolicy'));
      expect(source, contains('_passwordPolicyService.hint(_policy)'));
      expect(source, contains('_passwordPolicyService'));
      expect(source, contains(".quickCheck(value ?? '', _policy)"));
    });

    test('has current-password, new-password, and confirm fields', () {
      expect(source, contains("labelText: 'Current password'"));
      expect(source, contains("labelText: 'New password'"));
      expect(source, contains("labelText: 'Confirm new password'"));
    });

    test(
      'submits in order: reauthenticate, then authoritative policy check, '
      'then updatePassword',
      () {
        final reauthIndex = source.indexOf('reauthenticateWithPassword(');
        final checkIndex = source.indexOf(
          '_passwordPolicyService.checkPassword(',
        );
        final updateIndex = source.indexOf('authService.updatePassword(');

        expect(reauthIndex, greaterThan(-1));
        expect(checkIndex, greaterThan(-1));
        expect(updateIndex, greaterThan(-1));
        expect(
          reauthIndex < checkIndex,
          isTrue,
          reason: 'reauthentication must happen before the policy check',
        );
        expect(
          checkIndex < updateIndex,
          isTrue,
          reason: 'the authoritative policy check must happen before updating',
        );
      },
    );

    test('blocks the update and shows describeFailure on an invalid password', () {
      expect(source, contains('if (!status.isValid)'));
      expect(
        source,
        contains('_passwordPolicyService.describeFailure(status, _policy)'),
      );
      // The invalid branch must return before reaching updatePassword.
      final invalidBranch = source.substring(
        source.indexOf('if (!status.isValid)'),
        source.indexOf('authService.updatePassword('),
      );
      expect(invalidBranch, contains('return;'));
    });
  });

  group('Change-password navigation wiring', () {
    test('main.dart routes /app/change-password to ChangePasswordScreen', () {
      final source = readFile('lib/main.dart');
      expect(
        source,
        contains("import 'screens/change_password_screen.dart';"),
      );
      expect(source, contains("path: '/app/change-password'"));
      expect(source, contains('const ChangePasswordScreen()'));
    });

    test('AccountScreen exposes a Change Password entry point in Manage', () {
      final source = readFile('lib/screens/account_screen.dart');
      expect(source, contains('Change Password'));
      expect(source, contains("context.push('/app/change-password')"));
    });
  });
}
