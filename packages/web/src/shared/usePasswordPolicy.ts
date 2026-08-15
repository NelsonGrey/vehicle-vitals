import { useCallback, useEffect, useState } from 'react';
import type { PasswordValidationStatus } from 'firebase/auth';

// Defaults match today's enforced Firebase password policy so forms relying
// on this hook are still usable if the live policy fetch fails (e.g.
// offline); the authoritative checkPolicy()/checkPasswordPolicy() call
// re-verifies against the real policy regardless of whether this fetch
// succeeded.
export interface PasswordPolicyState {
  minLength: number;
  requiresUpper: boolean;
  requiresLower: boolean;
  requiresDigit: boolean;
  requiresSymbol: boolean;
}

export const DEFAULT_POLICY: PasswordPolicyState = {
  minLength: 8,
  requiresUpper: true,
  requiresLower: true,
  requiresDigit: true,
  requiresSymbol: true,
};

export function passwordRequirementsHint(policy: PasswordPolicyState): string {
  const requirements = [
    policy.requiresUpper && 'an uppercase letter',
    policy.requiresLower && 'a lowercase letter',
    policy.requiresDigit && 'a number',
    policy.requiresSymbol && 'a symbol',
  ].filter(Boolean) as string[];
  if (requirements.length === 0) {
    return `Must be at least ${policy.minLength} characters long`;
  }
  return `Must be at least ${policy.minLength} characters, including ${requirements.join(', ')}`;
}

// Quick pass using the cached live policy, for immediate feedback without a
// network round-trip. The authoritative checkPolicy() call re-validates
// against Firebase itself before the caller commits the change, so this
// never needs to be the last word on whether a password is accepted.
export function quickPasswordCheck(
  password: string,
  policy: PasswordPolicyState
): string | null {
  if (password.length < policy.minLength) {
    return `Password must be at least ${policy.minLength} characters long.`;
  }
  if (policy.requiresUpper && !/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter.';
  }
  if (policy.requiresLower && !/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter.';
  }
  if (policy.requiresDigit && !/[0-9]/.test(password)) {
    return 'Password must include a number.';
  }
  if (policy.requiresSymbol && !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include a symbol (e.g. ! @ # ?).';
  }
  return null;
}

export function describePasswordPolicyFailure(
  status: PasswordValidationStatus,
  policy: PasswordPolicyState
): string {
  const missing = [
    status.meetsMinPasswordLength === false && `be at least ${policy.minLength} characters`,
    status.containsUppercaseLetter === false && 'include an uppercase letter',
    status.containsLowercaseLetter === false && 'include a lowercase letter',
    status.containsNumericCharacter === false && 'include a number',
    status.containsNonAlphanumericCharacter === false && 'include a symbol',
  ].filter(Boolean) as string[];
  if (missing.length === 0) {
    return 'Password does not meet the requirements for this account.';
  }
  return `Password must ${missing.join(', ')}.`;
}

/**
 * Fetches and caches the live Firebase password policy, and exposes
 * quick client-side checking plus an authoritative re-check. Takes a bound
 * `checkPasswordPolicy` (as exposed by AuthContext, wrapping the modular
 * `validatePassword(auth, password)`) rather than a raw `Auth` instance so
 * it stays decoupled from Firebase initialization.
 */
export function usePasswordPolicy(
  checkPasswordPolicy: (password: string) => Promise<PasswordValidationStatus>
) {
  const [policy, setPolicy] = useState<PasswordPolicyState>(DEFAULT_POLICY);

  useEffect(() => {
    let cancelled = false;
    // A throwaway non-empty candidate -- only .passwordPolicy is used here,
    // not whether this specific placeholder is valid.
    checkPasswordPolicy(' ')
      .then(status => {
        if (cancelled) return;
        const options = status.passwordPolicy.customStrengthOptions;
        setPolicy({
          minLength: options.minPasswordLength ?? DEFAULT_POLICY.minLength,
          requiresUpper: options.containsUppercaseLetter ?? false,
          requiresLower: options.containsLowercaseLetter ?? false,
          requiresDigit: options.containsNumericCharacter ?? false,
          requiresSymbol: options.containsNonAlphanumericCharacter ?? false,
        });
      })
      .catch(() => {
        // Keep DEFAULT_POLICY -- callers still authoritatively re-check the
        // real password against the live policy at submit time.
      });
    return () => {
      cancelled = true;
    };
  }, [checkPasswordPolicy]);

  const quickCheck = useCallback(
    (password: string) => quickPasswordCheck(password, policy),
    [policy]
  );

  const checkPolicy = useCallback(
    (password: string) => checkPasswordPolicy(password),
    [checkPasswordPolicy]
  );

  const describeFailure = useCallback(
    (status: PasswordValidationStatus) =>
      describePasswordPolicyFailure(status, policy),
    [policy]
  );

  return {
    policy,
    hint: passwordRequirementsHint(policy),
    quickCheck,
    checkPolicy,
    describeFailure,
  };
}
