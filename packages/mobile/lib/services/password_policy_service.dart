import 'package:firebase_auth/firebase_auth.dart';

/// A snapshot of the password policy Firebase enforces for this project
/// (minimum length and which character classes are required), as returned
/// by [PasswordPolicyService.loadPolicy].
class PasswordPolicyState {
  const PasswordPolicyState({
    required this.minLength,
    required this.requiresUpper,
    required this.requiresLower,
    required this.requiresDigit,
    required this.requiresSymbol,
  });

  final int minLength;
  final bool requiresUpper;
  final bool requiresLower;
  final bool requiresDigit;
  final bool requiresSymbol;
}

// Fetches and applies the live Firebase Auth password policy (minimum
// length, required character classes) for any screen that collects a new
// password (sign-up, change-password). Centralizes the fetch/hint/validate
// logic that used to be copy-pasted per screen -- see signup_screen.dart's
// history for the original inline version this was extracted from.
class PasswordPolicyService {
  PasswordPolicyService([FirebaseAuth? auth]) : _authOverride = auth;

  final FirebaseAuth? _authOverride;

  // Resolved lazily (rather than in the constructor initializer list) so
  // that hint()/quickCheck()/describeFailure() -- which never touch this
  // field -- can be exercised in tests without a live Firebase app.
  // FirebaseAuth.instance throws if Firebase.initializeApp() hasn't run.
  FirebaseAuth get _auth => _authOverride ?? FirebaseAuth.instance;

  // Matches today's enforced policy so a caller still has a usable fallback
  // if loadPolicy()'s fetch fails (e.g. offline); the authoritative
  // checkPassword() call re-verifies against the real policy regardless of
  // whether the fetch succeeded.
  static const PasswordPolicyState defaultPolicy = PasswordPolicyState(
    minLength: 8,
    requiresUpper: true,
    requiresLower: true,
    requiresDigit: true,
    requiresSymbol: true,
  );

  // Fetches the password policy actually enforced by Firebase for this
  // project. Falls back to [defaultPolicy] if the fetch fails (e.g.
  // offline) -- callers should still authoritatively re-check the real
  // password against the live policy via [checkPassword] before submitting.
  Future<PasswordPolicyState> loadPolicy() async {
    try {
      // A throwaway non-empty candidate -- only .passwordPolicy is used
      // here, not whether this specific placeholder is valid.
      final status = await _auth.validatePassword(_auth, ' ');
      final policy = status.passwordPolicy;
      return PasswordPolicyState(
        minLength: policy.minPasswordLength,
        // A null field means Firebase doesn't enforce that character class
        // for this policy -- default to not-required, or the client would
        // reject passwords the server actually accepts.
        requiresUpper: policy.containsUppercaseCharacter ?? false,
        requiresLower: policy.containsLowercaseCharacter ?? false,
        requiresDigit: policy.containsNumericCharacter ?? false,
        requiresSymbol: policy.containsNonAlphanumericCharacter ?? false,
      );
    } catch (_) {
      return defaultPolicy;
    }
  }

  // A short human-readable description of [policy]'s requirements, for use
  // as helper/hint text under a new-password field.
  String hint(PasswordPolicyState policy) {
    final requirements = <String>[
      if (policy.requiresUpper) 'upper',
      if (policy.requiresLower) 'lower',
      if (policy.requiresDigit) 'number',
      if (policy.requiresSymbol) 'symbol',
    ];
    if (requirements.isEmpty) {
      return '${policy.minLength}+ characters';
    }
    return '${policy.minLength}+ characters with ${requirements.join(', ')}';
  }

  // A client-side pass against the cached [policy] so users get immediate
  // feedback while typing. This never needs to be the last word on whether
  // a password is accepted -- callers should still authoritatively
  // re-validate via [checkPassword] before submitting.
  String? quickCheck(String password, PasswordPolicyState policy) {
    if (password.isEmpty) {
      return 'Please enter a password';
    }
    if (password.length < policy.minLength) {
      return 'Password must be at least ${policy.minLength} characters';
    }
    if (policy.requiresUpper && !password.contains(RegExp(r'[A-Z]'))) {
      return 'Password must include an uppercase letter';
    }
    if (policy.requiresLower && !password.contains(RegExp(r'[a-z]'))) {
      return 'Password must include a lowercase letter';
    }
    if (policy.requiresDigit && !password.contains(RegExp(r'[0-9]'))) {
      return 'Password must include a number';
    }
    if (policy.requiresSymbol &&
        !password.contains(RegExp(r'[^A-Za-z0-9]'))) {
      return 'Password must include a symbol (e.g. ! @ # ?)';
    }
    return null;
  }

  // Authoritative check against the live Firebase policy -- catches drift
  // between a cached [PasswordPolicyState] and the real policy (e.g. it
  // changed after the form loaded, or the initial fetch failed).
  Future<PasswordValidationStatus> checkPassword(String password) =>
      _auth.validatePassword(_auth, password);

  // Describes why [status] failed validation against [policy], for display
  // after an authoritative [checkPassword] call comes back invalid.
  String describeFailure(
    PasswordValidationStatus status,
    PasswordPolicyState policy,
  ) {
    final missing = <String>[
      if (!status.meetsMinPasswordLength)
        'be at least ${policy.minLength} characters',
      if (!status.meetsUppercaseRequirement) 'include an uppercase letter',
      if (!status.meetsLowercaseRequirement) 'include a lowercase letter',
      if (!status.meetsDigitsRequirement) 'include a number',
      if (!status.meetsSymbolsRequirement) 'include a symbol',
    ];
    if (missing.isEmpty) {
      return 'Password does not meet the requirements for this account.';
    }
    return 'Password must ${missing.join(', ')}.';
  }
}
