import 'package:firebase_auth_platform_interface/firebase_auth_platform_interface.dart'
    show PasswordPolicy, PasswordValidationStatus;
import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/services/password_policy_service.dart';

// PasswordPolicyService.loadPolicy() and checkPassword() call into
// FirebaseAuth.validatePassword, which requires a live Firebase app (no
// mocking infrastructure exists in this project -- see
// onboarding_screen_test.dart). hint(), quickCheck(), and describeFailure()
// are pure functions of plain data (PasswordPolicyState /
// PasswordValidationStatus), so they're exercised directly here without
// touching Firebase. PasswordValidationStatus's constructor and boolean
// fields are public (see firebase_auth_platform_interface's
// password_validation_status.dart), so real instances are built directly
// below rather than mocked.

// A validation status where every requirement starts out satisfied, so a
// test only needs to flip the specific field(s) it wants to fail.
PasswordValidationStatus _passingStatus() =>
    PasswordValidationStatus(true, PasswordPolicy(const {}));

void main() {
  group('PasswordPolicyService.hint', () {
    final service = PasswordPolicyService();

    test('lists every required character class plus the minimum length', () {
      const policy = PasswordPolicyState(
        minLength: 8,
        requiresUpper: true,
        requiresLower: true,
        requiresDigit: true,
        requiresSymbol: true,
      );
      expect(
        service.hint(policy),
        '8+ characters with upper, lower, number, symbol',
      );
    });

    test('omits requirements the policy does not enforce', () {
      const policy = PasswordPolicyState(
        minLength: 6,
        requiresUpper: false,
        requiresLower: true,
        requiresDigit: false,
        requiresSymbol: false,
      );
      expect(service.hint(policy), '6+ characters with lower');
    });

    test('falls back to just the length when no character class is required', () {
      const policy = PasswordPolicyState(
        minLength: 10,
        requiresUpper: false,
        requiresLower: false,
        requiresDigit: false,
        requiresSymbol: false,
      );
      expect(service.hint(policy), '10+ characters');
    });
  });

  group('PasswordPolicyService.quickCheck', () {
    final service = PasswordPolicyService();
    const policy = PasswordPolicyService.defaultPolicy;

    test('rejects an empty password', () {
      expect(service.quickCheck('', policy), 'Please enter a password');
    });

    test('rejects a password shorter than the minimum length', () {
      expect(
        service.quickCheck('Ab1!', policy),
        'Password must be at least 8 characters',
      );
    });

    test('rejects a password missing an uppercase letter', () {
      expect(
        service.quickCheck('abcdefg1!', policy),
        'Password must include an uppercase letter',
      );
    });

    test('rejects a password missing a lowercase letter', () {
      expect(
        service.quickCheck('ABCDEFG1!', policy),
        'Password must include a lowercase letter',
      );
    });

    test('rejects a password missing a digit', () {
      expect(
        service.quickCheck('Abcdefgh!', policy),
        'Password must include a number',
      );
    });

    test('rejects a password missing a symbol', () {
      expect(
        service.quickCheck('Abcdefg1', policy),
        'Password must include a symbol (e.g. ! @ # ?)',
      );
    });

    test('accepts a password that meets every requirement', () {
      expect(service.quickCheck('Abcdefg1!', policy), isNull);
    });

    test('only checks requirements the policy actually enforces', () {
      const relaxedPolicy = PasswordPolicyState(
        minLength: 4,
        requiresUpper: false,
        requiresLower: false,
        requiresDigit: false,
        requiresSymbol: false,
      );
      expect(service.quickCheck('abcd', relaxedPolicy), isNull);
    });
  });

  group('PasswordPolicyService.defaultPolicy', () {
    test(
      'matches the previously hardcoded signup_screen.dart fallback '
      '(min 8, all four character classes required)',
      () {
        const policy = PasswordPolicyService.defaultPolicy;
        expect(policy.minLength, 8);
        expect(policy.requiresUpper, isTrue);
        expect(policy.requiresLower, isTrue);
        expect(policy.requiresDigit, isTrue);
        expect(policy.requiresSymbol, isTrue);
      },
    );
  });

  group('PasswordPolicyService.describeFailure', () {
    final service = PasswordPolicyService();
    const policy = PasswordPolicyService.defaultPolicy;

    test('lists every unmet requirement', () {
      final status = _passingStatus()
        ..isValid = false
        ..meetsMinPasswordLength = false
        ..meetsUppercaseRequirement = false;
      expect(
        service.describeFailure(status, policy),
        'Password must be at least 8 characters, include an uppercase letter.',
      );
    });

    test(
      'falls back to a generic message when nothing specific is reported '
      'unmet',
      () {
        final status = _passingStatus()..isValid = false;
        expect(
          service.describeFailure(status, policy),
          'Password does not meet the requirements for this account.',
        );
      },
    );
  });
}
