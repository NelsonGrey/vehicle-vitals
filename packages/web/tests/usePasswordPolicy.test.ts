import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_POLICY,
  usePasswordPolicy,
} from '../src/shared/usePasswordPolicy';

function policyStatus(customStrengthOptions: Record<string, unknown>) {
  return {
    isValid: true,
    passwordPolicy: { customStrengthOptions },
  };
}

describe('usePasswordPolicy', () => {
  it('fetches the live policy on mount using a throwaway password', async () => {
    const checkPasswordPolicy = vi.fn().mockResolvedValue(
      policyStatus({
        minPasswordLength: 10,
        containsUppercaseLetter: true,
        containsLowercaseLetter: false,
        containsNumericCharacter: true,
        containsNonAlphanumericCharacter: false,
      })
    );

    const { result } = renderHook(() => usePasswordPolicy(checkPasswordPolicy));

    expect(checkPasswordPolicy).toHaveBeenCalledWith(' ');

    await waitFor(() => {
      expect(result.current.policy).toEqual({
        minLength: 10,
        requiresUpper: true,
        requiresLower: false,
        requiresDigit: true,
        requiresSymbol: false,
      });
    });

    expect(result.current.hint).toMatch(/at least 10 characters/i);
  });

  it('falls back to DEFAULT_POLICY when the fetch rejects', async () => {
    const checkPasswordPolicy = vi.fn().mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => usePasswordPolicy(checkPasswordPolicy));

    // Starts on DEFAULT_POLICY immediately.
    expect(result.current.policy).toEqual(DEFAULT_POLICY);

    // Let the rejected promise settle; policy should remain the default.
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.policy).toEqual(DEFAULT_POLICY);
  });

  it('quickCheck flags a password shorter than the cached policy minLength', async () => {
    const checkPasswordPolicy = vi.fn().mockResolvedValue(
      policyStatus({
        minPasswordLength: 8,
        containsUppercaseLetter: false,
        containsLowercaseLetter: false,
        containsNumericCharacter: false,
        containsNonAlphanumericCharacter: false,
      })
    );

    const { result } = renderHook(() => usePasswordPolicy(checkPasswordPolicy));

    // Asserting only policy.minLength === 8 here is ambiguous: it's also
    // DEFAULT_POLICY's minLength, so that check alone can pass against the
    // pre-fetch default state (requiresUpper: true) before the mocked fetch
    // has actually resolved -- letting the assertions below race against a
    // stale policy. Wait for the full object so this can only be satisfied
    // once the real fetch result has landed.
    await waitFor(() =>
      expect(result.current.policy).toEqual({
        minLength: 8,
        requiresUpper: false,
        requiresLower: false,
        requiresDigit: false,
        requiresSymbol: false,
      })
    );

    expect(result.current.quickCheck('short')).toMatch(/at least 8 characters/i);
    expect(result.current.quickCheck('longenough')).toBeNull();
  });

  it('quickCheck flags missing character classes required by the cached policy', async () => {
    const checkPasswordPolicy = vi.fn().mockResolvedValue(
      policyStatus({
        minPasswordLength: 4,
        containsUppercaseLetter: true,
        containsLowercaseLetter: true,
        containsNumericCharacter: true,
        containsNonAlphanumericCharacter: true,
      })
    );

    const { result } = renderHook(() => usePasswordPolicy(checkPasswordPolicy));

    await waitFor(() => expect(result.current.policy.minLength).toBe(4));

    expect(result.current.quickCheck('alllower1!')).toMatch(/uppercase/i);
    expect(result.current.quickCheck('ALLUPPER1!')).toMatch(/lowercase/i);
    expect(result.current.quickCheck('NoDigitsHere!')).toMatch(/number/i);
    expect(result.current.quickCheck('NoSymbols1')).toMatch(/symbol/i);
    expect(result.current.quickCheck('Valid1Pass!')).toBeNull();
  });

  it('checkPolicy re-invokes the injected checkPasswordPolicy authoritatively', async () => {
    const checkPasswordPolicy = vi.fn().mockResolvedValue(policyStatus({}));

    const { result } = renderHook(() => usePasswordPolicy(checkPasswordPolicy));

    await waitFor(() => expect(checkPasswordPolicy).toHaveBeenCalledWith(' '));

    const invalidStatus = {
      isValid: false,
      meetsMinPasswordLength: false,
      passwordPolicy: { customStrengthOptions: {} },
    };
    checkPasswordPolicy.mockResolvedValueOnce(invalidStatus);

    const status = await result.current.checkPolicy('weak');
    expect(checkPasswordPolicy).toHaveBeenLastCalledWith('weak');
    expect(status).toBe(invalidStatus);
  });

  it('describeFailure maps PasswordValidationStatus failures to a human message', async () => {
    const checkPasswordPolicy = vi.fn().mockResolvedValue(
      policyStatus({ minPasswordLength: 8 })
    );

    const { result } = renderHook(() => usePasswordPolicy(checkPasswordPolicy));

    await waitFor(() => expect(result.current.policy.minLength).toBe(8));

    const message = result.current.describeFailure({
      isValid: false,
      meetsMinPasswordLength: false,
      containsUppercaseLetter: false,
      containsLowercaseLetter: true,
      containsNumericCharacter: true,
      containsNonAlphanumericCharacter: true,
    } as never);

    expect(message).toMatch(/at least 8 characters/i);
    expect(message).toMatch(/uppercase/i);
    expect(message).not.toMatch(/lowercase/i);
  });

  it('describeFailure falls back to a generic message when no specific requirement is flagged', async () => {
    const checkPasswordPolicy = vi.fn().mockResolvedValue(policyStatus({}));

    const { result } = renderHook(() => usePasswordPolicy(checkPasswordPolicy));

    await waitFor(() => expect(checkPasswordPolicy).toHaveBeenCalled());

    const message = result.current.describeFailure({
      isValid: false,
    } as never);

    expect(message).toMatch(/does not meet the requirements/i);
  });
});
