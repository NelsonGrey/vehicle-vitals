export function userFacingError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const message = String((error as Error)?.message || '').toLowerCase();

  if (message.includes('network') || message.includes('unavailable')) {
    return 'We could not reach Vehicle-Vitals. Check your connection and try again.';
  }
  if (
    message.includes('invalid-credential') ||
    message.includes('wrong-password') ||
    message.includes('user-not-found')
  ) {
    return 'The email or password was not recognized. Try again or reset your password.';
  }
  if (message.includes('email-already-in-use')) {
    return 'An account already uses this email. Sign in or reset your password.';
  }
  if (message.includes('weak-password')) {
    return 'Choose a stronger password with at least eight characters.';
  }
  if (message.includes('too-many-requests')) {
    return 'Too many attempts were made. Wait a few minutes and try again.';
  }

  return fallback;
}
