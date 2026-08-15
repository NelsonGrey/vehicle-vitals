import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AccountSecurity from '../src/pages/AccountSecurity';

const MOCK_USER = {
  uid: 'user-1',
  email: 'test@example.com',
  providerData: [{ providerId: 'password' }],
};

const mockSignOut = vi.fn(async () => {});
const mockLinkWithGoogle = vi.fn();
const mockLinkWithApple = vi.fn();
const mockReauthenticateWithGoogle = vi.fn();
const mockReauthenticateWithApple = vi.fn();

// Permissive-but-real-shaped policy: strict enough that a genuinely weak
// password (e.g. "weak") still fails the client-side quickCheck, matching
// the live Firebase policy this app enforces elsewhere.
const STRICT_POLICY_RESPONSE = {
  isValid: true,
  passwordPolicy: {
    customStrengthOptions: {
      minPasswordLength: 8,
      containsUppercaseLetter: true,
      containsLowercaseLetter: true,
      containsNumericCharacter: true,
      containsNonAlphanumericCharacter: true,
    },
  },
};

// Response returned for the authoritative (non-mount, non-' ') call; tests
// override this to simulate the live check rejecting a password that
// passed the client-side quickCheck.
let mockAuthoritativeResponse: Record<string, unknown> = {
  isValid: true,
  passwordPolicy: STRICT_POLICY_RESPONSE.passwordPolicy,
};

const mockCheckPasswordPolicy = vi.fn(async (password: string) => {
  if (password === ' ') {
    return STRICT_POLICY_RESPONSE;
  }
  return mockAuthoritativeResponse;
});

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    signOut: mockSignOut,
    linkWithGoogle: mockLinkWithGoogle,
    linkWithApple: mockLinkWithApple,
    reauthenticateWithGoogle: mockReauthenticateWithGoogle,
    reauthenticateWithApple: mockReauthenticateWithApple,
    checkPasswordPolicy: mockCheckPasswordPolicy,
  }),
}));

const mockReauthenticateWithCredential = vi.fn(async () => {});
const mockUpdatePassword = vi.fn(async () => {});

vi.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: vi.fn(() => ({})) },
  reauthenticateWithCredential: (...args: unknown[]) =>
    mockReauthenticateWithCredential(...args),
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountSecurity />
    </MemoryRouter>
  );
}

describe('AccountSecurity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthoritativeResponse = {
      isValid: true,
      passwordPolicy: STRICT_POLICY_RESPONSE.passwordPolicy,
    };
    mockCheckPasswordPolicy.mockImplementation(async (password: string) => {
      if (password === ' ') {
        return STRICT_POLICY_RESPONSE;
      }
      return mockAuthoritativeResponse;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the password requirements hint under the new password field', async () => {
    renderPage();

    await waitFor(() => expect(mockCheckPasswordPolicy).toHaveBeenCalledWith(' '));
    await waitFor(() => {
      expect(
        screen.getByText(/at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('blocks submission on a weak new password before reauth or updatePassword are called', async () => {
    renderPage();

    await waitFor(() => expect(mockCheckPasswordPolicy).toHaveBeenCalledWith(' '));

    await userEvent.type(
      screen.getByLabelText(/current password/i),
      'CurrentPass1!'
    );
    await userEvent.type(screen.getByLabelText(/^new password/i), 'weak');
    await userEvent.type(
      screen.getByLabelText(/confirm new password/i),
      'weak'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /update password/i })
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/password must/i);
    expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it('blocks updatePassword specifically when the authoritative check fails, after reauth already ran', async () => {
    renderPage();

    await waitFor(() => expect(mockCheckPasswordPolicy).toHaveBeenCalledWith(' '));

    mockAuthoritativeResponse = {
      isValid: false,
      meetsMinPasswordLength: true,
      containsUppercaseLetter: false,
      containsLowercaseLetter: true,
      containsNumericCharacter: true,
      containsNonAlphanumericCharacter: true,
    };

    await userEvent.type(
      screen.getByLabelText(/current password/i),
      'CurrentPass1!'
    );
    await userEvent.type(
      screen.getByLabelText(/^new password/i),
      'Password1!'
    );
    await userEvent.type(
      screen.getByLabelText(/confirm new password/i),
      'Password1!'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /update password/i })
    );

    await waitFor(() => {
      expect(mockReauthenticateWithCredential).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/uppercase/i);
    });
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it('happy path calls reauth, then the authoritative check, then updatePassword, in order', async () => {
    renderPage();

    await waitFor(() => expect(mockCheckPasswordPolicy).toHaveBeenCalledWith(' '));

    await userEvent.type(
      screen.getByLabelText(/current password/i),
      'CurrentPass1!'
    );
    await userEvent.type(
      screen.getByLabelText(/^new password/i),
      'Password1!'
    );
    await userEvent.type(
      screen.getByLabelText(/confirm new password/i),
      'Password1!'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /update password/i })
    );

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledTimes(1);
    });
    expect(mockReauthenticateWithCredential).toHaveBeenCalledTimes(1);

    const reauthOrder =
      mockReauthenticateWithCredential.mock.invocationCallOrder[0];
    const authoritativeCheckOrder = mockCheckPasswordPolicy.mock
      .invocationCallOrder[mockCheckPasswordPolicy.mock.calls.length - 1];
    const updatePasswordOrder = mockUpdatePassword.mock.invocationCallOrder[0];

    expect(reauthOrder).toBeLessThan(authoritativeCheckOrder);
    expect(authoritativeCheckOrder).toBeLessThan(updatePasswordOrder);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /password updated successfully/i
      );
    });
  });
});
