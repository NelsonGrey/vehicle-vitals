/// Marks an exception whose message is already end-user-friendly (e.g. one
/// built by AuthService from a specific FirebaseAuthException code), so
/// [userFacingError] displays it verbatim instead of re-translating it and
/// losing the detail a generic code-based match can't express.
class FriendlyException implements Exception {
  final String message;
  const FriendlyException(this.message);

  @override
  String toString() => message;
}

String userFacingError(
  Object error, {
  String fallback = 'Something went wrong. Please try again.',
}) {
  if (error is FriendlyException) return error.message;

  final message = error.toString().toLowerCase();

  if (message.contains('network') || message.contains('unavailable')) {
    return 'We could not reach Vehicle-Vitals. Check your connection and try again.';
  }
  if (message.contains('invalid-credential') ||
      message.contains('wrong-password') ||
      message.contains('user-not-found')) {
    return 'The email or password was not recognized. Try again or reset your password.';
  }
  if (message.contains('email-already-in-use')) {
    return 'An account already uses this email. Sign in or reset your password.';
  }
  if (message.contains('weak-password')) {
    return 'Choose a stronger password with at least eight characters.';
  }
  if (message.contains('too-many-requests')) {
    return 'Too many attempts were made. Wait a few minutes and try again.';
  }

  return fallback;
}
