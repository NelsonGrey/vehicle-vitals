import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPassword from '../src/pages/ForgotPassword';

const mockResetPassword = vi.fn();

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
  }),
}));

function renderForgotPassword() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ForgotPassword />
    </MemoryRouter>
  );
}

describe('ForgotPassword page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders heading, email field, and submit button', () => {
    renderForgotPassword();
    expect(
      screen.getByRole('heading', { name: /forgot password/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    ).toBeInTheDocument();
  });

  it('renders a link back to sign in', () => {
    renderForgotPassword();
    expect(
      screen.getByRole('link', { name: /back.*sign in|sign in/i })
    ).toBeInTheDocument();
  });

  it('calls resetPassword with the entered email on submit', async () => {
    mockResetPassword.mockResolvedValue(undefined);
    renderForgotPassword();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'user@example.com'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    );

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('user@example.com');
    });
  });

  it('shows success message after reset email is sent', async () => {
    mockResetPassword.mockResolvedValue(undefined);
    renderForgotPassword();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'user@example.com'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    );

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /password reset email sent|check your inbox/i
      );
    });
  });

  it('shows an error message when reset fails', async () => {
    mockResetPassword.mockRejectedValue(new Error('User not found'));
    renderForgotPassword();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'nobody@example.com'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/user not found/i);
    });
  });

  it('disables the submit button while busy', async () => {
    let resolve;
    mockResetPassword.mockReturnValue(
      new Promise(r => {
        resolve = r;
      })
    );

    renderForgotPassword();
    await userEvent.type(screen.getByLabelText(/email address/i), 'x@x.com');
    await userEvent.click(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    );

    expect(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    ).toBeDisabled();

    resolve();
  });

  it('clears previous error/success messages on new submission', async () => {
    // First attempt fails
    mockResetPassword.mockRejectedValueOnce(new Error('Oops'));
    renderForgotPassword();

    await userEvent.type(screen.getByLabelText(/email address/i), 'x@x.com');
    await userEvent.click(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    );
    await waitFor(() => screen.getByRole('alert'));

    // Second attempt succeeds
    mockResetPassword.mockResolvedValueOnce(undefined);
    await userEvent.click(
      screen.getByRole('button', { name: /send.*reset|reset.*link/i })
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
